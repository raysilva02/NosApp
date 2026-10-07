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
    [Route("api/remedios")]
    [Authorize]
    [AutoValidateAntiforgeryToken]
    public class RemedioController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly ApplicationDbContext _ctx;

        public RemedioController(UserManager<ApplicationUser> um, ApplicationDbContext ctx)
        {
            _um = um;
            _ctx = ctx;
        }

        [HttpGet]
        public async Task<IActionResult> Listar([FromQuery] int? idosoId)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (user.TipoUsuario == "Idoso")
            {
                var idoso = await _ctx.Idosos.Include(i => i.Remedios)
                    .FirstOrDefaultAsync(i => i.ApplicationUserId == user.Id);
                return Ok(idoso?.Remedios
                    .Select(r => new RemedioDto(r.Id, r.Nome, r.Horario, r.Dose, r.Descricao))
                    .ToList() ?? new List<RemedioDto>());
            }

            // Cuidador: precisa informar idosoId e estar vinculado a ele
            if (idosoId == null) return BadRequest(new { erro = "Informe o idoso." });

            var cuidador = await _ctx.Cuidadores.Include(c => c.Relacionamentos)
                .FirstOrDefaultAsync(c => c.ApplicationUserId == user.Id);
            if (cuidador == null) return Forbid();

            if (!cuidador.Relacionamentos.Any(r => r.IdosoId == idosoId)) return Forbid();

            var remedios = await _ctx.Remedios.Where(r => r.IdosoId == idosoId)
                .Select(r => new RemedioDto(r.Id, r.Nome, r.Horario, r.Dose, r.Descricao))
                .ToListAsync();
            return Ok(remedios);
        }

        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] RemedioCreateDto dto)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null || user.TipoUsuario != "Cuidador") return Forbid();

            var cuidador = await _ctx.Cuidadores.Include(c => c.Relacionamentos)
                .FirstOrDefaultAsync(c => c.ApplicationUserId == user.Id);
            if (cuidador == null) return Forbid();
            if (!cuidador.Relacionamentos.Any(r => r.IdosoId == dto.IdosoId)) return Forbid();

            var remedio = new Remedio
            {
                Nome = dto.Nome,
                Horario = dto.Horario,
                Dose = dto.Dose,
                Descricao = dto.Descricao,
                IdosoId = dto.IdosoId
            };
            _ctx.Remedios.Add(remedio);
            await _ctx.SaveChangesAsync();

            return Ok(new RemedioDto(remedio.Id, remedio.Nome, remedio.Horario, remedio.Dose, remedio.Descricao));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Deletar(int id)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null || user.TipoUsuario != "Cuidador") return Forbid();

            var remedio = await _ctx.Remedios.Include(r => r.Idoso).FirstOrDefaultAsync(r => r.Id == id);
            if (remedio == null) return NotFound();

            var cuidador = await _ctx.Cuidadores.Include(c => c.Relacionamentos)
                .FirstOrDefaultAsync(c => c.ApplicationUserId == user.Id);
            if (cuidador == null || !cuidador.Relacionamentos.Any(r => r.IdosoId == remedio.IdosoId))
                return Forbid();

            _ctx.Remedios.Remove(remedio);
            await _ctx.SaveChangesAsync();
            return Ok();
        }
    }
}
