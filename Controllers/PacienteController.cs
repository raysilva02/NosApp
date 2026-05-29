using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nos.Data; using Nos.Models; using Nos.ViewModels;
namespace Nos.Controllers {
    [Authorize] public class PacienteController : Controller {
        private readonly UserManager<ApplicationUser> _um; private readonly ApplicationDbContext _ctx;
        public PacienteController(UserManager<ApplicationUser> um, ApplicationDbContext ctx) { _um=um; _ctx=ctx; }
        public async Task<IActionResult> Index() {
            var user = await _um.GetUserAsync(User);
            if(user==null||user.TipoUsuario!="Cuidador") return Forbid();
            var c = await _ctx.Cuidadores.Include(x=>x.Relacionamentos).ThenInclude(r=>r.Idoso).ThenInclude(i=>i!.ApplicationUser).Include(x=>x.Relacionamentos).ThenInclude(r=>r.Idoso).ThenInclude(i=>i!.Remedios).FirstOrDefaultAsync(x=>x.ApplicationUserId==user.Id);
            ViewBag.NomeUsuario=user.NomeCompleto; return View(c); }
        
        [HttpGet] 
        public IActionResult AdicionarPaciente() => View(new AdicionarPacienteViewModel());
        
        
        [HttpPost,ValidateAntiForgeryToken]
        public async Task<IActionResult> AdicionarPaciente(AdicionarPacienteViewModel m) 
        {
            if(!ModelState.IsValid) return View(m);
            var user = await _um.GetUserAsync(User);
            if(user==null||user.TipoUsuario!="Cuidador") return Forbid();
            var tel = m.TelefonePaciente.Trim().Replace(" ","").Replace("-","").Replace("(","").Replace(")","");
            var pu = await _um.FindByNameAsync(tel);
            if(pu==null||pu.TipoUsuario!="Idoso") { ModelState.AddModelError("","Paciente nao encontrado."); return View(m); }
            var cu = await _ctx.Cuidadores.FirstOrDefaultAsync(c=>c.ApplicationUserId==user.Id);
            var iu = await _ctx.Idosos.FirstOrDefaultAsync(i=>i.ApplicationUserId==pu.Id);
            if(cu==null||iu==null) { ModelState.AddModelError("","Erro ao encontrar perfis."); return View(m); }
            if(await _ctx.Relacionamentos.AnyAsync(r=>r.CuidadorId==cu.Id&&r.IdosoId==iu.Id)) { ModelState.AddModelError("","Paciente ja vinculado."); return View(m); }
            _ctx.Relacionamentos.Add(new RelacionamentoCuidadorIdoso{CuidadorId=cu.Id,IdosoId=iu.Id,DataInicio=DateTime.Now});
            await _ctx.SaveChangesAsync(); TempData["Sucesso"]=$"{pu.NomeCompleto} adicionado!"; return RedirectToAction("Index"); 
        }
    }
}