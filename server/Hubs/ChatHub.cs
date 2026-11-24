using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Nos.Models;
using Nos.Services;

namespace Nos.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly ChatService _chat;
        private readonly PushService _push;
        private readonly ExpoPushService _expoPush;

        public ChatHub(UserManager<ApplicationUser> um, ChatService chat, PushService push, ExpoPushService expoPush)
        {
            _um = um;
            _chat = chat;
            _push = push;
            _expoPush = expoPush;
        }

        public async Task JoinRoom(string rid) =>
            await Groups.AddToGroupAsync(Context.ConnectionId, $"chat_{rid}");

        public async Task SendMessage(int relId, string conteudo)
        {
            var user = await _um.FindByIdAsync(Context.UserIdentifier!);
            if (user == null) return;

            var msg = await _chat.EnviarMensagemAsync(user, relId, conteudo);
            if (msg == null) return;

            await Clients.Group($"chat_{relId}").SendAsync("ReceiveMessage", new
            {
                id = msg.Id,
                conteudo = msg.Conteudo,
                dataHora = msg.DataHora.ToString("HH:mm"),
                remetenteId = msg.RemetenteId,
                remetenteNome = user.NomeCompleto
            });

            await _push.EnviarAsync(relId, user.Id, user.NomeCompleto, msg.Conteudo);

            var chat = await _chat.ObterChatAsync(user, relId);
            if (chat != null)
                await _expoPush.EnviarAsync(chat.OutroUsuarioId, user.NomeCompleto, msg.Conteudo);
        }
    }
}
