using System.ComponentModel.DataAnnotations;
namespace Nos.ViewModels {
    public class RemedioCreateViewModel {
        public int IdosoId { get; set; }
        public string IdosoNome { get; set; } = string.Empty;
        [Required][StringLength(100)][Display(Name="Nome do Remedio")] public string Nome { get; set; } = string.Empty;
        [Required][Display(Name="Horario")] public string Horario { get; set; } = string.Empty;
        [Required][StringLength(100)][Display(Name="Dose")] public string Dose { get; set; } = string.Empty;
        [StringLength(500)][Display(Name="Descricao")] public string? Descricao { get; set; }
    }
}