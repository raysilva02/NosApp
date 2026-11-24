using Microsoft.EntityFrameworkCore;
using Nos.Data;
using Nos.Dtos;
using Nos.Models;

namespace Nos.Services;

/// <summary>
/// Lógica de negócio do chat: carregar a conversa de um relacionamento e
/// persistir novas mensagens.
/// </summary>
public class ChatService
{
    private readonly ApplicationDbContext _ctx;

    public ChatService(ApplicationDbContext ctx)
    {
        _ctx = ctx;
    }

    /// <summary>Retorna a conversa, ou null quando o relacionamento não existe
    /// ou o usuário não faz parte dele (não vaza informação do outro lado).</summary>
    public async Task<ChatDto?> ObterChatAsync(ApplicationUser user, int relacionamentoId)
    {
        var rel = await _ctx.Relacionamentos
            .Include(r => r.Cuidador).ThenInclude(c => c!.ApplicationUser)
            .Include(r => r.Idoso).ThenInclude(i => i!.ApplicationUser)
            .Include(r => r.Mensagens)
            .FirstOrDefaultAsync(r => r.Id == relacionamentoId);
        if (rel == null) return null;

        var isIdoso = user.TipoUsuario == "Idoso";
        if (isIdoso && rel.Idoso!.ApplicationUserId != user.Id) return null;
        if (!isIdoso && rel.Cuidador!.ApplicationUserId != user.Id) return null;

        var cuidadorNome = rel.Cuidador!.ApplicationUser!.NomeCompleto;
        var idosoNome = rel.Idoso!.ApplicationUser!.NomeCompleto;

        var mensagens = rel.Mensagens
            .OrderBy(m => m.DataHora)
            .Select(m => new MensagemDto(
                m.Id,
                m.Conteudo,
                m.AudioUrl,
                m.DataHora.ToString("HH:mm"),
                m.RemetenteId,
                m.RemetenteId == rel.Cuidador.ApplicationUserId ? cuidadorNome : idosoNome))
            .ToList();

        return new ChatDto(
            rel.Id,
            isIdoso ? cuidadorNome : idosoNome,
            isIdoso ? rel.Cuidador.ApplicationUserId : rel.Idoso.ApplicationUserId,
            user.Id,
            mensagens,
            isIdoso);
    }

    /// <summary>Persiste uma nova mensagem (texto e/ou áudio) e a retorna.</summary>
    public async Task<Mensagem?> EnviarMensagemAsync(ApplicationUser user, int relId, string conteudo, string? audioUrl = null)
    {
        var temAudio = !string.IsNullOrWhiteSpace(audioUrl);
        if (string.IsNullOrWhiteSpace(conteudo) && !temAudio) return null;

        var msg = new Mensagem
        {
            Conteudo = string.IsNullOrWhiteSpace(conteudo) ? "" : conteudo.Trim(),
            AudioUrl = audioUrl,
            DataHora = DateTime.Now,
            RemetenteId = user.Id,
            RelacionamentoId = relId
        };

        _ctx.Mensagens.Add(msg);
        await _ctx.SaveChangesAsync();
        return msg;
    }

    /// <summary>
    /// Envia uma mensagem de socorro do idoso para TODOS os seus cuidadores.
    /// Persiste uma mensagem em cada relacionamento e retorna os destinatários
    /// (para disparar push). Retorna lista vazia se não houver cuidador.
    /// </summary>
    public async Task<List<(string UserId, string Nome)>> EnviarSosAsync(ApplicationUser idoso, string conteudo)
    {
        var rels = await _ctx.Relacionamentos
            .Where(r => r.Idoso!.ApplicationUserId == idoso.Id)
            .Select(r => new
            {
                RelId = r.Id,
                CuidadorUserId = r.Cuidador!.ApplicationUserId,
                CuidadorNome = r.Cuidador!.ApplicationUser!.NomeCompleto
            })
            .ToListAsync();

        if (rels.Count == 0) return new List<(string, string)>();

        var agora = DateTime.Now;
        foreach (var rel in rels)
        {
            _ctx.Mensagens.Add(new Mensagem
            {
                Conteudo = conteudo,
                AudioUrl = null,
                DataHora = agora,
                RemetenteId = idoso.Id,
                RelacionamentoId = rel.RelId
            });
        }
        await _ctx.SaveChangesAsync();

        return rels.Select(r => (r.CuidadorUserId, r.CuidadorNome)).ToList();
    }
}
