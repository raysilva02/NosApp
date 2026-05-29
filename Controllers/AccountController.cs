using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Nos.Data;
using Nos.Models;
using Nos.ViewModels;

namespace Nos.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<ApplicationUser> _um;
        private readonly SignInManager<ApplicationUser> _sm;
        private readonly ApplicationDbContext _ctx;

        public AccountController(
            UserManager<ApplicationUser> um,
            SignInManager<ApplicationUser> sm,
            ApplicationDbContext ctx)
        {
            _um = um;
            _sm = sm;
            _ctx = ctx;
        }

        private static string CP(string t) =>
            t.Trim()
             .Replace(" ", "")
             .Replace("-", "")
             .Replace("(", "")
             .Replace(")", "");


        [HttpGet]
        public IActionResult Login()
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction("Index", "Home");

            return View();
        }

        [HttpPost, ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel m)
        {
            if (!ModelState.IsValid)
                return View(m);

            var user = await _um.FindByNameAsync(CP(m.Telefone));

            if (user == null)
            {
                ModelState.AddModelError("", "Usuario nao encontrado.");
                return View(m);
            }

            var result = await _sm.PasswordSignInAsync(user, m.Senha, m.LembrarMe, false);

            if (result.Succeeded)
                return RedirectToAction("Index", "Home");

            ModelState.AddModelError("", "Telefone ou senha incorretos.");
            return View(m);
        }


        [HttpGet]
        public IActionResult RegisterIdoso()
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction("Index", "Home");

            return View();
        }

        [HttpPost, ValidateAntiForgeryToken]
        public async Task<IActionResult> RegisterIdoso(RegisterIdosoViewModel m)
        {
            if (!ModelState.IsValid)
                return View(m);

            var tel = CP(m.Telefone);
            var user = new ApplicationUser
            {
                UserName = tel,
                PhoneNumber = tel,
                NomeCompleto = m.NomeCompleto.Trim(),
                TipoUsuario = "Idoso"
            };

            var result = await _um.CreateAsync(user, m.Senha);

            if (result.Succeeded)
            {
                _ctx.Idosos.Add(new Idoso { ApplicationUserId = user.Id });
                await _ctx.SaveChangesAsync();
                await _sm.SignInAsync(user, isPersistent: true);
                return RedirectToAction("Index", "Home");
            }

            foreach (var error in result.Errors)
                ModelState.AddModelError("", error.Description);

            return View(m);
        }


        [HttpGet]
        public IActionResult RegisterCuidador()
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction("Index", "Home");

            return View();
        }

        [HttpPost, ValidateAntiForgeryToken]
        public async Task<IActionResult> RegisterCuidador(RegisterCuidadorViewModel m)
        {
            if (!ModelState.IsValid)
                return View(m);

            var tel = CP(m.Telefone);
            var user = new ApplicationUser
            {
                UserName = tel,
                PhoneNumber = tel,
                NomeCompleto = m.NomeCompleto.Trim(),
                TipoUsuario = "Cuidador"
            };

            var result = await _um.CreateAsync(user, m.Senha);

            if (result.Succeeded)
            {
                _ctx.Cuidadores.Add(new Cuidador { ApplicationUserId = user.Id });
                await _ctx.SaveChangesAsync();
                await _sm.SignInAsync(user, isPersistent: true);
                return RedirectToAction("Index", "Home");
            }

            foreach (var error in result.Errors)
                ModelState.AddModelError("", error.Description);

            return View(m);
        }


        [HttpPost, ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await _sm.SignOutAsync();
            return RedirectToAction("Login");
        }
    }
}
