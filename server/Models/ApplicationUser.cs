using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
namespace Nos.Models {
    public class ApplicationUser : IdentityUser {
        [Required][StringLength(100)][Display(Name="Nome Completo")] public string NomeCompleto { get; set; } = string.Empty;
        [Required][Display(Name="Tipo de Usuario")] public string TipoUsuario { get; set; } = string.Empty;
    }
}