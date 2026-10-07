using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nos.Data;
using Nos.Dtos;
using Nos.Models;

namespace Nos.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly ApplicationDbContext _ctx;

        public ChatController(UserManager<ApplicationUser> um, ApplicationDbContext ctx)
        {
            _um = um;
            _ctx = ctx;
        }

        [HttpGet("{relacionamentoId:int}")]
        public async Task<IActionResult> Obter(int relacionamentoId)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var rel = await _ctx.Relacionamentos
                .Include(r => r.Cuidador).ThenInclude(c => c!.ApplicationUser)
                .Include(r => r.Idoso).ThenInclude(i => i!.ApplicationUser)
                .Include(r => r.Mensagens)
                .FirstOrDefaultAsync(r => r.Id == relacionamentoId);
            if (rel == null) return NotFound();

            var isIdoso = user.TipoUsuario == "Idoso";
            if (isIdoso && rel.Idoso!.ApplicationUserId != user.Id) return Forbid();
            if (!isIdoso && rel.Cuidador!.ApplicationUserId != user.Id) return Forbid();

            var cuidadorNome = rel.Cuidador!.ApplicationUser!.NomeCompleto;
            var idosoNome = rel.Idoso!.ApplicationUser!.NomeCompleto;

            var mensagens = rel.Mensagens.OrderBy(m => m.DataHora).Select(m => new MensagemDto(
                m.Id,
                m.Conteudo,
                m.DataHora.ToString("HH:mm"),
                m.RemetenteId,
                m.RemetenteId == rel.Cuidador.ApplicationUserId ? cuidadorNome : idosoNome)).ToList();

            return Ok(new ChatDto(
                rel.Id,
                isIdoso ? cuidadorNome : idosoNome,
                isIdoso ? rel.Cuidador.ApplicationUserId : rel.Idoso.ApplicationUserId,
                user.Id,
                mensagens,
                isIdoso));
        }
    }
}
