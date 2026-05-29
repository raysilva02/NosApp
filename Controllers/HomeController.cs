using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nos.Data; using Nos.Models;
namespace Nos.Controllers {
    [Authorize] public class HomeController : Controller {
        private readonly UserManager<ApplicationUser> _um; private readonly ApplicationDbContext _ctx;
        public HomeController(UserManager<ApplicationUser> um, ApplicationDbContext ctx) { _um=um; _ctx=ctx; }
        public async Task<IActionResult> Index() {
            var user = await _um.GetUserAsync(User);
            if(user==null) return RedirectToAction("Login","Account");
            ViewBag.NomeUsuario = user.NomeCompleto;
            if(user.TipoUsuario=="Idoso") {
                var idoso = await _ctx.Idosos.Include(i=>i.Relacionamentos).ThenInclude(r=>r.Cuidador).ThenInclude(c=>c!.ApplicationUser).Include(i=>i.Remedios).FirstOrDefaultAsync(i=>i.ApplicationUserId==user.Id);
                ViewBag.Idoso = idoso; return View("IndexIdoso"); }
            var cuidador = await _ctx.Cuidadores.Include(c=>c.Relacionamentos).ThenInclude(r=>r.Idoso).ThenInclude(i=>i!.ApplicationUser).FirstOrDefaultAsync(c=>c.ApplicationUserId==user.Id);
            ViewBag.Cuidador = cuidador; return View("IndexCuidador"); }
    }
}