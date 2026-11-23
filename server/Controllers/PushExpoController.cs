using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nos.Data;
using Nos.Models;

namespace Nos.Controllers
{
    [ApiController]
    [Route("api/push-expo")]
    [Authorize]
    public class PushExpoController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private readonly UserManager<ApplicationUser> _um;
        private readonly ILogger<PushExpoController> _log;

        public PushExpoController(ApplicationDbContext ctx, UserManager<ApplicationUser> um, ILogger<PushExpoController> log)
        {
            _ctx = ctx;
            _um = um;
            _log = log;
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] RegistrarExpoDto dto)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest(new { erro = "Token inválido." });

            var existente = await _ctx.PushExpo
                .FirstOrDefaultAsync(t => t.UserId == user.Id && t.Token == dto.Token);

            if (existente == null)
            {
                _ctx.PushExpo.Add(new PushExpo { UserId = user.Id, Token = dto.Token });
                await _ctx.SaveChangesAsync();
                _log.LogInformation("Token Expo registrado para {User}", user.Id);
            }

            return Ok();
        }
    }

    public class RegistrarExpoDto
    {
        public string Token { get; set; } = "";
    }
}
