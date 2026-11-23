using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Nos.Dtos;
using Nos.Models;
using Nos.Services;

namespace Nos.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly ChatService _chat;
        private readonly PushService _push;
        private readonly ExpoPushService _expoPush;

        public ChatController(UserManager<ApplicationUser> um, ChatService chat, PushService push, ExpoPushService expoPush)
        {
            _um = um;
            _chat = chat;
            _push = push;
            _expoPush = expoPush;
        }

        [HttpGet("{relacionamentoId:int}")]
        public async Task<IActionResult> Obter(int relacionamentoId)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var chat = await _chat.ObterChatAsync(user, relacionamentoId);
            if (chat == null) return NotFound();
            return Ok(chat);
        }

        /// <summary>Envio de mensagem via REST (usado pelo app mobile, que não usa SignalR).</summary>
        [HttpPost("{relacionamentoId:int}/mensagens")]
        public async Task<IActionResult> Enviar(int relacionamentoId, [FromBody] EnviarMensagemDto dto)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null) return Unauthorized();

            // ObterChatAsync também valida que o usuário pertence ao relacionamento.
            var chat = await _chat.ObterChatAsync(user, relacionamentoId);
            if (chat == null) return NotFound();

            var msg = await _chat.EnviarMensagemAsync(user, relacionamentoId, dto.Conteudo, dto.AudioUrl);
            if (msg == null) return BadRequest(new { erro = "Envie uma mensagem ou um áudio." });

            var corpoPush = string.IsNullOrWhiteSpace(msg.Conteudo) ? "🎤 Mensagem de voz" : msg.Conteudo;
            await _push.EnviarAsync(relacionamentoId, user.Id, user.NomeCompleto, corpoPush);
            await _expoPush.EnviarAsync(chat.OutroUsuarioId, user.NomeCompleto, corpoPush);

            return Ok(new MensagemDto(msg.Id, msg.Conteudo, msg.AudioUrl, msg.DataHora.ToString("HH:mm"), msg.RemetenteId, user.NomeCompleto));
        }
    }
}
