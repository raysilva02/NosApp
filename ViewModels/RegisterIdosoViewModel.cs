using System.ComponentModel.DataAnnotations;
namespace Nos.ViewModels {
    public class RegisterIdosoViewModel {
        [Required][StringLength(100)][Display(Name="Nome Completo")] public string NomeCompleto { get; set; } = string.Empty;
        [Required][Display(Name="Numero de Telefone")] public string Telefone { get; set; } = string.Empty;
        [Required][StringLength(100,MinimumLength=6,ErrorMessage="Minimo 6 caracteres.")][DataType(DataType.Password)][Display(Name="Senha")] public string Senha { get; set; } = string.Empty;
        [Required][DataType(DataType.Password)][Compare("Senha",ErrorMessage="As senhas nao coincidem.")][Display(Name="Confirmar Senha")] public string ConfirmarSenha { get; set; } = string.Empty;
    }
}