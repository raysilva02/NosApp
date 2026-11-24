namespace Nos.Dtos;

// Auth
public record LoginDto(string Telefone, string Senha, bool LembrarMe = true);
public record RegisterDto(string NomeCompleto, string Telefone, string Senha, string TipoUsuario);

// Usuário
public record UserDto(string Id, string NomeCompleto, string TipoUsuario);

// Domínio
public record RemedioDto(int Id, string Nome, string Horario, string Dose, string? Descricao);
public record CuidadorDto(int RelacionamentoId, int CuidadorId, string NomeCompleto, string UserId, string? Telefone);
public record PacienteDto(int RelacionamentoId, int IdosoId, string NomeCompleto, string Telefone, List<RemedioDto> Remedios);
public record MensagemDto(int Id, string Conteudo, string? AudioUrl, string DataHora, string RemetenteId, string RemetenteNome);
public record ChatDto(int RelacionamentoId, string OutroUsuarioNome, string OutroUsuarioId, string UsuarioAtualId, List<MensagemDto> Mensagens, bool IsIdoso);

// Requests
public record AdicionarPacienteDto(string TelefonePaciente);
public record RemedioCreateDto(int IdosoId, string Nome, string Horario, string Dose, string? Descricao);
public record EnviarMensagemDto(string Conteudo = "", string? AudioUrl = null);

// Dashboards
public record DashboardIdosoDto(UserDto Me, List<CuidadorDto> Cuidadores, List<RemedioDto> Remedios);
public record DashboardCuidadorDto(UserDto Me, List<PacienteDto> Pacientes);
