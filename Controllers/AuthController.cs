using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Nos.Data;
using Nos.Dtos;
using Nos.Models;

namespace Nos.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly SignInManager<ApplicationUser> _sm;
        private readonly ApplicationDbContext _ctx;
        private readonly IAntiforgery _antiforgery;

        public AuthController(
            UserManager<ApplicationUser> um,
            SignInManager<ApplicationUser> sm,
            ApplicationDbContext ctx,
            IAntiforgery antiforgery)
        {
            _um = um;
            _sm = sm;
            _ctx = ctx;
            _antiforgery = antiforgery;
        }

        private static string NormalizarTelefone(string t) =>
            t.Trim().Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");

        [HttpGet("antiforgery")]
        public IActionResult Antiforgery()
        {
            var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
            return Ok(new { token = tokens.RequestToken });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var user = await _um.GetUserAsync(User);
            return Ok(new UserDto(user!.Id, user.NomeCompleto, user.TipoUsuario));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var tel = NormalizarTelefone(dto.Telefone);
            var user = await _um.FindByNameAsync(tel);
            if (user == null) return Unauthorized(new { erro = "Usuario nao encontrado." });

            var result = await _sm.PasswordSignInAsync(user, dto.Senha, dto.LembrarMe, false);
            if (!result.Succeeded) return Unauthorized(new { erro = "Telefone ou senha incorretos." });

            return Ok(new UserDto(user.Id, user.NomeCompleto, user.TipoUsuario));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (dto.TipoUsuario != "Idoso" && dto.TipoUsuario != "Cuidador")
                return BadRequest(new { erro = "Tipo de usuario invalido." });

            if (string.IsNullOrWhiteSpace(dto.NomeCompleto) || string.IsNullOrWhiteSpace(dto.Telefone) || string.IsNullOrWhiteSpace(dto.Senha))
                return BadRequest(new { erro = "Preencha todos os campos." });

            var tel = NormalizarTelefone(dto.Telefone);
            var user = new ApplicationUser
            {
                UserName = tel,
                PhoneNumber = tel,
                NomeCompleto = dto.NomeCompleto.Trim(),
                TipoUsuario = dto.TipoUsuario
            };

            var result = await _um.CreateAsync(user, dto.Senha);
            if (!result.Succeeded)
                return BadRequest(new { erro = string.Join(" ", result.Errors.Select(e => e.Description)) });

            if (dto.TipoUsuario == "Idoso") _ctx.Idosos.Add(new Idoso { ApplicationUserId = user.Id });
            else _ctx.Cuidadores.Add(new Cuidador { ApplicationUserId = user.Id });

            await _ctx.SaveChangesAsync();
            await _sm.SignInAsync(user, isPersistent: true);

            return Ok(new UserDto(user.Id, user.NomeCompleto, user.TipoUsuario));
        }

        [Authorize]
        [ValidateAntiForgeryToken]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _sm.SignOutAsync();
            return Ok();
        }
    }
}
