using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nos.Data; using Nos.Models; using Nos.ViewModels;
namespace Nos.Controllers {
    [Authorize] public class RemedioController : Controller {
        private readonly UserManager<ApplicationUser> _um; private readonly ApplicationDbContext _ctx;
        public RemedioController(UserManager<ApplicationUser> um, ApplicationDbContext ctx) { _um=um; _ctx=ctx; }
        public async Task<IActionResult> Index() 
        {
            var user = await _um.GetUserAsync(User);
            if(user==null) return RedirectToAction("Login","Account");
            if(user.TipoUsuario=="Idoso") { var i = await _ctx.Idosos.Include(x=>x.Remedios).FirstOrDefaultAsync(x=>x.ApplicationUserId==user.Id); ViewBag.NomeUsuario=user.NomeCompleto; return View("IndexIdoso",i?.Remedios.ToList()??new List<Remedio>()); }
            return RedirectToAction("Index","Home"); 
        }
        
        [HttpGet] 
        public async Task<IActionResult> Create(int idosoId) 
        {
            var user = await _um.GetUserAsync(User);
            if(user==null||user.TipoUsuario!="Cuidador") return Forbid();
            var c = await _ctx.Cuidadores.Include(x=>x.Relacionamentos).ThenInclude(r=>r.Idoso).ThenInclude(i=>i!.ApplicationUser).FirstOrDefaultAsync(x=>x.ApplicationUserId==user.Id);
            var rel = c?.Relacionamentos.FirstOrDefault(r=>r.IdosoId==idosoId);
            if(rel==null) return NotFound();
            return View(new RemedioCreateViewModel{IdosoId=idosoId,IdosoNome=rel.Idoso!.ApplicationUser!.NomeCompleto}); 
        }

        [HttpPost,ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(RemedioCreateViewModel m) 
        {
            var user = await _um.GetUserAsync(User);
            if(user==null||user.TipoUsuario!="Cuidador") return Forbid();
            if(!ModelState.IsValid) return View(m);
            _ctx.Remedios.Add(new Remedio{Nome=m.Nome,Horario=m.Horario,Dose=m.Dose,Descricao=m.Descricao,IdosoId=m.IdosoId});
            await _ctx.SaveChangesAsync(); TempData["Sucesso"]="Remedio cadastrado!"; return RedirectToAction("Index","Paciente"); 
        }
        
        [HttpPost,ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id) 
        {
            var user = await _um.GetUserAsync(User);
            if(user==null||user.TipoUsuario!="Cuidador") return Forbid();
            var r = await _ctx.Remedios.FindAsync(id);
            if(r!=null){_ctx.Remedios.Remove(r);await _ctx.SaveChangesAsync();}
            TempData["Sucesso"]="Remedio removido."; return RedirectToAction("Index","Paciente"); 
        }
    }
}