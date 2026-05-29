using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Nos.Models;
namespace Nos.Data {
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser> {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) {}
        public DbSet<Idoso> Idosos { get; set; }
        public DbSet<Cuidador> Cuidadores { get; set; }
        public DbSet<RelacionamentoCuidadorIdoso> Relacionamentos { get; set; }
        public DbSet<Remedio> Remedios { get; set; }
        public DbSet<Mensagem> Mensagens { get; set; }
        protected override void OnModelCreating(ModelBuilder b) {
            base.OnModelCreating(b);
            b.Entity<RelacionamentoCuidadorIdoso>().HasOne(r=>r.Cuidador).WithMany(c=>c.Relacionamentos).HasForeignKey(r=>r.CuidadorId).OnDelete(DeleteBehavior.Restrict);
            b.Entity<RelacionamentoCuidadorIdoso>().HasOne(r=>r.Idoso).WithMany(i=>i.Relacionamentos).HasForeignKey(r=>r.IdosoId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}