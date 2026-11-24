using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Nos.Models {
    public class Remedio {
        [Key] public int Id { get; set; }
        [Required][StringLength(100)][Display(Name="Nome do Remedio")] public string Nome { get; set; } = string.Empty;
        [Required][Display(Name="Horario")] public string Horario { get; set; } = string.Empty;
        [Required][StringLength(100)][Display(Name="Dose")] public string Dose { get; set; } = string.Empty;
        [StringLength(500)][Display(Name="Descricao")] public string? Descricao { get; set; }
        public int IdosoId { get; set; }
        [ForeignKey("IdosoId")] public Idoso? Idoso { get; set; }
    }
}