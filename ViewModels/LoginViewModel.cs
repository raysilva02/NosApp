using System.ComponentModel.DataAnnotations;
namespace Nos.ViewModels {
    public class LoginViewModel {
        [Required][Display(Name="Numero de Telefone")] public string Telefone { get; set; } = string.Empty;
        [Required][DataType(DataType.Password)][Display(Name="Senha")] public string Senha { get; set; } = string.Empty;
        public bool LembrarMe { get; set; } = true;
    }
}