using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Nos.Data;

namespace Nos.Services;

/// <summary>
/// Envia notificações push para o app mobile via Expo Push Service.
/// https://docs.expo.dev/push-notifications/sending-notifications/
/// </summary>
public class ExpoPushService
{
    private readonly ApplicationDbContext _ctx;
    private readonly IHttpClientFactory _http;
    private readonly ILogger<ExpoPushService> _log;

    public ExpoPushService(ApplicationDbContext ctx, IHttpClientFactory http, ILogger<ExpoPushService> log)
    {
        _ctx = ctx;
        _http = http;
        _log = log;
    }

    public async Task EnviarAsync(string destinatarioId, string titulo, string corpo)
    {
        try
        {
            var tokens = await _ctx.PushExpo
                .Where(t => t.UserId == destinatarioId)
                .Select(t => t.Token)
                .ToListAsync();

            if (tokens.Count == 0)
            {
                _log.LogInformation("ExpoPush: nenhum token registrado para o usuário {User}", destinatarioId);
                return;
            }

            var payload = new
            {
                to = tokens,
                title = titulo,
                body = corpo,
                sound = "default",
                channelId = "mensagens"
            };

            var http = _http.CreateClient("ExpoPush");
            var res = await http.PostAsJsonAsync("https://exp.host/--/api/v2/push/send", payload);
            var resposta = await res.Content.ReadAsStringAsync();

            if (res.IsSuccessStatusCode)
                _log.LogInformation("ExpoPush OK para {User}: {Resp}", destinatarioId, resposta);
            else
                _log.LogWarning("ExpoPush falhou ({Status}) para {User}: {Resp}", (int)res.StatusCode, destinatarioId, resposta);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Erro ao enviar ExpoPush para {User}", destinatarioId);
        }
    }
}
