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
    [Route("api/pacientes")]
    [Authorize]
    public class PacienteController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly ApplicationDbContext _ctx;

        public PacienteController(UserManager<ApplicationUser> um, ApplicationDbContext ctx)
        {
            _um = um;
            _ctx = ctx;
        }

        private static string NormalizarTelefone(string t) =>
            t.Trim().Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");

        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var user = await _um.GetUserAsync(User);
            if (user == null || user.TipoUsuario != "Cuidador") return Forbid();

            var cuidador = await _ctx.Cuidadores
                .Include(c => c.Relacionamentos).ThenInclude(r => r.Idoso).ThenInclude(i => i!.ApplicationUser)
                .Include(c => c.Relacionamentos).ThenInclude(r => r.Idoso).ThenInclude(i => i!.Remedios)
                .FirstOrDefaultAsync(c => c.ApplicationUserId == user.Id);
            if (cuidador == null) return NotFound();

            var pacientes = cuidador.Relacionamentos
                .Select(r => new PacienteDto(
                    r.Id,
                    r.Idoso!.Id,
                    r.Idoso.ApplicationUser!.NomeCompleto,
                    r.Idoso.ApplicationUser.PhoneNumber ?? "",
                    r.Idoso.Remedios.Select(x => new RemedioDto(x.Id, x.Nome, x.Horario, x.Dose, x.Descricao)).ToList()))
                .ToList();

            return Ok(pacientes);
        }

        [HttpPost]
        public async Task<IActionResult> Adicionar([FromBody] AdicionarPacienteDto dto)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null || user.TipoUsuario != "Cuidador") return Forbid();

            var tel = NormalizarTelefone(dto.TelefonePaciente);
            var pacienteUser = await _um.FindByNameAsync(tel);
            if (pacienteUser == null)
                return BadRequest(new { erro = "Não existe nenhuma conta com este telefone." });

            if (pacienteUser.TipoUsuario != "Idoso")
                return BadRequest(new { erro = "Este telefone pertence a um cuidador, não a um idoso." });

            var cuidador = await _ctx.Cuidadores.FirstOrDefaultAsync(c => c.ApplicationUserId == user.Id);
            var idoso = await _ctx.Idosos.FirstOrDefaultAsync(i => i.ApplicationUserId == pacienteUser.Id);
            if (cuidador == null || idoso == null)
                return BadRequest(new { erro = "Erro ao encontrar os perfis. Tente novamente." });

            if (await _ctx.Relacionamentos.AnyAsync(r => r.CuidadorId == cuidador.Id && r.IdosoId == idoso.Id))
                return BadRequest(new { erro = "Este idoso já está vinculado a você." });

            var rel = new RelacionamentoCuidadorIdoso
            {
                CuidadorId = cuidador.Id,
                IdosoId = idoso.Id,
                DataInicio = DateTime.Now
            };
            _ctx.Relacionamentos.Add(rel);
            await _ctx.SaveChangesAsync();

            return Ok(new PacienteDto(rel.Id, idoso.Id, pacienteUser.NomeCompleto, pacienteUser.PhoneNumber ?? "", new List<RemedioDto>()));
        }
    }
}
