using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nos.Data;
using Nos.Models;
using Nos.ViewModels;

namespace Nos.Controllers
{
    [Authorize]
    public class ChatController : Controller
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly ApplicationDbContext _ctx;

        public ChatController(UserManager<ApplicationUser> um, ApplicationDbContext ctx)
        {
            _um = um;
            _ctx = ctx;
        }


        public async Task<IActionResult> IdosoChat(int relacionamentoId)
        {
            var user = await _um.GetUserAsync(User);

            if (user == null || user.TipoUsuario != "Idoso")
                return Forbid();

            var rel = await _ctx.Relacionamentos
                .Include(r => r.Cuidador)
                    .ThenInclude(c => c!.ApplicationUser)
                .Include(r => r.Idoso)
                    .ThenInclude(i => i!.ApplicationUser)
                .Include(r => r.Mensagens)
                .FirstOrDefaultAsync(r =>
                    r.Id == relacionamentoId &&
                    r.Idoso!.ApplicationUserId == user.Id);

            if (rel == null)
                return NotFound();

            var viewModel = new ChatViewModel
            {
                RelacionamentoId = rel.Id,
                OutroUsuarioNome = rel.Cuidador!.ApplicationUser!.NomeCompleto,
                OutroUsuarioId = rel.Cuidador.ApplicationUserId,
                UsuarioAtualId = user.Id,
                Mensagens = rel.Mensagens.OrderBy(m => m.DataHora).ToList(),
                IsIdoso = true
            };

            return View(viewModel);
        }


        public async Task<IActionResult> CuidadorChat(int relacionamentoId)
        {
            var user = await _um.GetUserAsync(User);

            if (user == null || user.TipoUsuario != "Cuidador")
                return Forbid();

            var rel = await _ctx.Relacionamentos
                .Include(r => r.Cuidador)
                    .ThenInclude(c => c!.ApplicationUser)
                .Include(r => r.Idoso)
                    .ThenInclude(i => i!.ApplicationUser)
                .Include(r => r.Mensagens)
                .FirstOrDefaultAsync(r =>
                    r.Id == relacionamentoId &&
                    r.Cuidador!.ApplicationUserId == user.Id);

            if (rel == null)
                return NotFound();

            var viewModel = new ChatViewModel
            {
                RelacionamentoId = rel.Id,
                OutroUsuarioNome = rel.Idoso!.ApplicationUser!.NomeCompleto,
                OutroUsuarioId = rel.Idoso.ApplicationUserId,
                UsuarioAtualId = user.Id,
                Mensagens = rel.Mensagens.OrderBy(m => m.DataHora).ToList(),
                IsIdoso = false
            };

            return View(viewModel);
        }
    }
}
