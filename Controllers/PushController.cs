using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nos.Data;
using Nos.Models;

namespace Nos.Controllers
{
    [Authorize]
    public class PushController : Controller
    {
        private readonly ApplicationDbContext _ctx;
        private readonly UserManager<ApplicationUser> _um;
        private readonly IConfiguration _config;

        public PushController(ApplicationDbContext ctx, UserManager<ApplicationUser> um, IConfiguration config)
        {
            _ctx = ctx;
            _um = um;
            _config = config;
        }

        [HttpPost]
        public async Task<IActionResult> Subscribe([FromBody] PushSubscricaoDto dto)
        {
            var user = await _um.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var antiga = _ctx.PushSubscricoes
                .FirstOrDefault(s => s.UserId == user.Id && s.Endpoint == dto.Endpoint);
            if (antiga != null) _ctx.PushSubscricoes.Remove(antiga);

            _ctx.PushSubscricoes.Add(new PushSubscricao
            {
                UserId = user.Id,
                Endpoint = dto.Endpoint,
                P256DH = dto.P256DH,
                Auth = dto.Auth
            });

            await _ctx.SaveChangesAsync();
            return Ok();
        }

        [HttpGet]
        public IActionResult PublicKey()
        {
            return Ok(new { publicKey = _config["Vapid:PublicKey"] });
        }
    }

    public class PushSubscricaoDto
    {
        public string Endpoint { get; set; } = "";
        public string P256DH { get; set; } = "";
        public string Auth { get; set; } = "";
    }
}
