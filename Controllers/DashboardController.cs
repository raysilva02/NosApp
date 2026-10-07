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
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly ApplicationDbContext _ctx;

        public DashboardController(UserManager<ApplicationUser> um, ApplicationDbContext ctx)
        {
            _um = um;
            _ctx = ctx;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var user = await _um.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (user.TipoUsuario == "Idoso")
            {
                var idoso = await _ctx.Idosos
                    .Include(i => i.Relacionamentos).ThenInclude(r => r.Cuidador).ThenInclude(c => c!.ApplicationUser)
                    .Include(i => i.Remedios)
                    .FirstOrDefaultAsync(i => i.ApplicationUserId == user.Id);
                if (idoso == null) return NotFound();

                var cuidadores = idoso.Relacionamentos
                    .Select(r => new CuidadorDto(r.Id, r.Cuidador!.Id, r.Cuidador.ApplicationUser!.NomeCompleto, r.Cuidador.ApplicationUserId))
                    .ToList();
                var remedios = idoso.Remedios
                    .Select(r => new RemedioDto(r.Id, r.Nome, r.Horario, r.Dose, r.Descricao))
                    .ToList();

                return Ok(new DashboardIdosoDto(
                    new UserDto(user.Id, user.NomeCompleto, user.TipoUsuario),
                    cuidadores,
                    remedios));
            }

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

            return Ok(new DashboardCuidadorDto(
                new UserDto(user.Id, user.NomeCompleto, user.TipoUsuario),
                pacientes));
        }
    }
}
