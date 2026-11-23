using Microsoft.EntityFrameworkCore;
using Nos.Data;
using WebPush;

namespace Nos.Services;

/// <summary>
/// Envio de notificações Web Push (VAPID) para o destinatário de uma mensagem.
/// Extraído do ChatHub para separar a responsabilidade e permitir reuso.
/// </summary>
public class PushService
{
    private readonly ApplicationDbContext _ctx;
    private readonly IConfiguration _config;

    public PushService(ApplicationDbContext ctx, IConfiguration config)
    {
        _ctx = ctx;
        _config = config;
    }

    public async Task EnviarAsync(int relacionamentoId, string remetenteId, string remetenteNome, string conteudo)
    {
        try
        {
            var rel = await _ctx.Relacionamentos
                .Include(r => r.Cuidador).ThenInclude(c => c!.ApplicationUser)
                .Include(r => r.Idoso).ThenInclude(i => i!.ApplicationUser)
                .FirstOrDefaultAsync(r => r.Id == relacionamentoId);
            if (rel == null) return;

            // Descobre quem é o destinatário (o "outro lado" do relacionamento).
            var destinatarioId = rel.Cuidador?.ApplicationUser?.Id == remetenteId
                ? rel.Idoso?.ApplicationUser?.Id
                : rel.Cuidador?.ApplicationUser?.Id;
            if (destinatarioId == null) return;

            var subscriptions = await _ctx.PushSubscricoes
                .Where(s => s.UserId == destinatarioId)
                .ToListAsync();
            if (subscriptions.Count == 0) return;

            var publicKey = _config["Vapid:PublicKey"];
            var privateKey = _config["Vapid:PrivateKey"];
            if (string.IsNullOrWhiteSpace(publicKey) || string.IsNullOrWhiteSpace(privateKey)) return;

            var vapidDetails = new VapidDetails(
                _config["Vapid:Subject"]!,
                publicKey,
                privateKey);

            var payload = System.Text.Json.JsonSerializer.Serialize(new
            {
                title = remetenteNome,
                body = conteudo,
                url = "/"
            });

            var client = new WebPushClient();
            foreach (var sub in subscriptions)
            {
                try
                {
                    await client.SendNotificationAsync(
                        new PushSubscription(sub.Endpoint, sub.P256DH, sub.Auth),
                        payload,
                        vapidDetails);
                }
                catch { /* assinatura inválida/expirada: ignora */ }
            }
        }
        catch { /* push não deve derrubar o envio da mensagem */ }
    }
}
