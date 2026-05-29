using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Nos.Models {
    public class Idoso {
        [Key] public int Id { get; set; }
        [Required] public string ApplicationUserId { get; set; } = string.Empty;
        [ForeignKey("ApplicationUserId")] public ApplicationUser? ApplicationUser { get; set; }
        public ICollection<RelacionamentoCuidadorIdoso> Relacionamentos { get; set; } = new List<RelacionamentoCuidadorIdoso>();
        public ICollection<Remedio> Remedios { get; set; } = new List<Remedio>();
    }
}