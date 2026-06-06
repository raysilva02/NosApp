using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Nos.Data;
using Nos.Models;
using WebPush;

namespace Nos.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _ctx;
        private readonly UserManager<ApplicationUser> _um;
        private readonly IConfiguration _config;

        public ChatHub(ApplicationDbContext ctx, UserManager<ApplicationUser> um, IConfiguration config)
        {
            _ctx = ctx;
            _um = um;
            _config = config;
        }

        public async Task JoinRoom(string rid) =>
            await Groups.AddToGroupAsync(Context.ConnectionId, $"chat_{rid}");

        public async Task SendMessage(int relId, string conteudo)
        {
            if (string.IsNullOrWhiteSpace(conteudo)) return;

            var user = await _um.FindByIdAsync(Context.UserIdentifier!);
            if (user == null) return;

            var msg = new Mensagem
            {
                Conteudo = conteudo.Trim(),
                DataHora = DateTime.Now,
                RemetenteId = user.Id,
                RelacionamentoId = relId
            };

            _ctx.Mensagens.Add(msg);
            await _ctx.SaveChangesAsync();

            await Clients.Group($"chat_{relId}").SendAsync("ReceiveMessage", new
            {
                id = msg.Id,
                conteudo = msg.Conteudo,
                dataHora = msg.DataHora.ToString("HH:mm"),
                remetenteId = msg.RemetenteId,
                remetenteNome = user.NomeCompleto
            });

            await EnviarPush(user.Id, user.NomeCompleto, msg.Conteudo, relId);
        }

        private async Task EnviarPush(string remetenteId, string remetenteNome, string conteudo, int relId)
        {
            try
            {
                var rel = await _ctx.Relacionamentos 
                    .Include(r => r.Cuidador).ThenInclude(c => c!.ApplicationUser)
                    .Include(r => r.Idoso).ThenInclude(i => i!.ApplicationUser)
                    .FirstOrDefaultAsync(r => r.Id == relId);

                if (rel == null) return;

                var destinatarioId = rel.Cuidador?.ApplicationUser?.Id == remetenteId
                    ? rel.Idoso?.ApplicationUser?.Id
                    : rel.Cuidador?.ApplicationUser?.Id;

                if (destinatarioId == null) return;

                var subscriptions = await _ctx.PushSubscricoes
                    .Where(s => s.UserId == destinatarioId)
                    .ToListAsync();

                if (!subscriptions.Any()) return;

                var vapidDetails = new VapidDetails(
                    _config["Vapid:Subject"]!,
                    _config["Vapid:PublicKey"]!,
                    _config["Vapid:PrivateKey"]!
                );

                var payload = System.Text.Json.JsonSerializer.Serialize(new
                {
                    title = remetenteNome,
                    body = conteudo,
                    url = "/Home/Index"
                });

                var client = new WebPushClient();
                foreach (var sub in subscriptions)
                {
                    try
                    {
                        await client.SendNotificationAsync(
                            new WebPush.PushSubscription(sub.Endpoint, sub.P256DH, sub.Auth),
                            payload,
                            vapidDetails
                        );
                    }
                    catch { }
                }
            }
            catch { }
        }
    }
}
