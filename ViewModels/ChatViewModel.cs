using Nos.Models;
namespace Nos.ViewModels {
    public class ChatViewModel {
        public int RelacionamentoId { get; set; }
        public string OutroUsuarioNome { get; set; } = string.Empty;
        public string OutroUsuarioId { get; set; } = string.Empty;
        public string UsuarioAtualId { get; set; } = string.Empty;
        public List<Mensagem> Mensagens { get; set; } = new();
        public bool IsIdoso { get; set; }
    }
}