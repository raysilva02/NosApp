using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Nos.Models {
    public class Mensagem {
        [Key] public int Id { get; set; }
        [Required] public string Conteudo { get; set; } = string.Empty;
        public DateTime DataHora { get; set; } = DateTime.Now;
        [Required] public string RemetenteId { get; set; } = string.Empty;
        public int RelacionamentoId { get; set; }
        [ForeignKey("RelacionamentoId")] public RelacionamentoCuidadorIdoso? Relacionamento { get; set; }
    }
}