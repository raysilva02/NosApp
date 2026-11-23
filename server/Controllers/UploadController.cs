using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Nos.Controllers
{
    [ApiController]
    [Route("api/upload")]
    [Authorize]
    public class UploadController : ControllerBase
    {
        // Tamanho máximo do áudio (5 MB) e formatos aceitos.
        private const long MaxBytes = 5 * 1024 * 1024;
        private static readonly string[] Formatos = { ".webm", ".m4a", ".mp3", ".wav", ".aac", ".ogg" };

        [HttpPost("audio")]
        [RequestSizeLimit(MaxBytes + 1024 * 1024)]
        public async Task<IActionResult> Audio([FromForm] IFormFile arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { erro = "Nenhum áudio enviado." });

            var ext = Path.GetExtension(arquivo.FileName).ToLowerInvariant();
            if (!Formatos.Contains(ext))
                return BadRequest(new { erro = "Formato de áudio não suportado." });

            if (arquivo.Length > MaxBytes)
                return BadRequest(new { erro = "Áudio muito grande (máximo 5 MB)." });

            var nome = $"{Guid.NewGuid():N}{ext}";
            var dir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(dir);
            var caminho = Path.Combine(dir, nome);

            await using (var stream = new FileStream(caminho, FileMode.Create))
            {
                await arquivo.CopyToAsync(stream);
            }

            return Ok(new { url = $"/uploads/{nome}" });
        }
    }
}
