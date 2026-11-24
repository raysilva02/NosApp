using System.ComponentModel.DataAnnotations;

namespace Nos.Models
{
    /// <summary>Token de push do Expo (app mobile), por usuário.</summary>
    public class PushExpo
    {
        [Key] public int Id { get; set; }
        [Required] public string UserId { get; set; } = string.Empty;
        [Required] public string Token { get; set; } = string.Empty;
    }
}
