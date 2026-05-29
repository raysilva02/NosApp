using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Nos.Models {
    public class RelacionamentoCuidadorIdoso {
        [Key] public int Id { get; set; }
        public int CuidadorId { get; set; }
        [ForeignKey("CuidadorId")] public Cuidador? Cuidador { get; set; }
        public int IdosoId { get; set; }
        [ForeignKey("IdosoId")] public Idoso? Idoso { get; set; }
        public DateTime DataInicio { get; set; } = DateTime.Now;
        public ICollection<Mensagem> Mensagens { get; set; } = new List<Mensagem>();
    }
}