using System.ComponentModel.DataAnnotations;
namespace Nos.ViewModels {
    public class AdicionarPacienteViewModel {
        [Required][Display(Name="Telefone do Paciente")] public string TelefonePaciente { get; set; } = string.Empty;
    }
}