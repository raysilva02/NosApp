using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Nos.Data;
using Nos.Dtos;
using Nos.Models;
using Nos.Services;

namespace Nos.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly ApplicationDbContext _ctx;
        private readonly TokenService _tokens;

        public AuthController(UserManager<ApplicationUser> um, ApplicationDbContext ctx, TokenService tokens)
        {
            _um = um;
            _ctx = ctx;
            _tokens = tokens;
        }

        private static string NormalizarTelefone(string t) =>
            t.Trim().Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var user = await _um.GetUserAsync(User);
            if (user == null) return Unauthorized();
            return Ok(new UserDto(user.Id, user.NomeCompleto, user.TipoUsuario));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var tel = NormalizarTelefone(dto.Telefone);
            var user = await _um.FindByNameAsync(tel);
            if (user == null)
                return Unauthorized(new { erro = "Nenhuma conta encontrada com este telefone." });

            if (!(await _um.CheckPasswordAsync(user, dto.Senha)))
                return Unauthorized(new { erro = "Senha incorreta. Tente novamente." });

            return Ok(AuthResponse(user));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (dto.TipoUsuario != "Idoso" && dto.TipoUsuario != "Cuidador")
                return BadRequest(new { erro = "Tipo de usuário inválido." });

            if (string.IsNullOrWhiteSpace(dto.NomeCompleto) || string.IsNullOrWhiteSpace(dto.Telefone) || string.IsNullOrWhiteSpace(dto.Senha))
                return BadRequest(new { erro = "Preencha todos os campos." });

            var tel = NormalizarTelefone(dto.Telefone);

            if (await _um.FindByNameAsync(tel) != null)
                return BadRequest(new { erro = "Este telefone já está em uso por outro usuário." });

            var user = new ApplicationUser
            {
                UserName = tel,
                PhoneNumber = tel,
                NomeCompleto = dto.NomeCompleto.Trim(),
                TipoUsuario = dto.TipoUsuario
            };

            var result = await _um.CreateAsync(user, dto.Senha);
            if (!result.Succeeded)
                return BadRequest(new { erro = string.Join(" ", result.Errors.Select(e => TraduzirErroIdentity(e.Code)).Distinct()) });

            if (dto.TipoUsuario == "Idoso") _ctx.Idosos.Add(new Idoso { ApplicationUserId = user.Id });
            else _ctx.Cuidadores.Add(new Cuidador { ApplicationUserId = user.Id });

            await _ctx.SaveChangesAsync();

            return Ok(AuthResponse(user));
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout() => Ok(); // JWT é stateless: o cliente descarta o token

        private static string TraduzirErroIdentity(string code) => code switch
        {
            "PasswordTooShort" => "A senha é muito curta (mínimo 6 caracteres).",
            "PasswordRequiresNonAlphanumeric" => "A senha precisa ter um caractere especial.",
            "PasswordRequiresDigit" => "A senha precisa ter um número.",
            "PasswordRequiresUpper" => "A senha precisa ter uma letra maiúscula.",
            "PasswordRequiresLower" => "A senha precisa ter uma letra minúscula.",
            "DuplicateUserName" => "Este telefone já está em uso.",
            _ => "Não foi possível criar a conta. Tente novamente."
        };

        private object AuthResponse(ApplicationUser user) => new
        {
            token = _tokens.Criar(user),
            me = new UserDto(user.Id, user.NomeCompleto, user.TipoUsuario)
        };
    }
}
