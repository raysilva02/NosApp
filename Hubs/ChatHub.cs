using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Nos.Data; using Nos.Models;
namespace Nos.Hubs {
    [Authorize]
    public class ChatHub : Hub {
        private readonly ApplicationDbContext _ctx;
        private readonly UserManager<ApplicationUser> _um;
        public ChatHub(ApplicationDbContext ctx, UserManager<ApplicationUser> um) { _ctx=ctx; _um=um; }
        public async Task JoinRoom(string rid) => await Groups.AddToGroupAsync(Context.ConnectionId,$"chat_{rid}");
        public async Task SendMessage(int relId, string conteudo) {
            if(string.IsNullOrWhiteSpace(conteudo)) return;
            var user = await _um.FindByIdAsync(Context.UserIdentifier!);
            if(user==null) return;
            var msg = new Mensagem { Conteudo=conteudo.Trim(), DataHora=DateTime.Now, RemetenteId=user.Id, RelacionamentoId=relId };
            _ctx.Mensagens.Add(msg); await _ctx.SaveChangesAsync();
            await Clients.Group($"chat_{relId}").SendAsync("ReceiveMessage",new{id=msg.Id,conteudo=msg.Conteudo,dataHora=msg.DataHora.ToString("HH:mm"),remetenteId=msg.RemetenteId,remetenteNome=user.NomeCompleto});
        }
    }
}