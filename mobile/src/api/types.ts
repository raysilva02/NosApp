export type TipoUsuario = 'Idoso' | 'Cuidador';

export interface Me {
  id: string;
  nomeCompleto: string;
  tipoUsuario: TipoUsuario;
}

export interface AuthResponse {
  token: string;
  me: Me;
}

export interface Remedio {
  id: number;
  nome: string;
  horario: string;
  dose: string;
  descricao: string | null;
}

export interface Cuidador {
  relacionamentoId: number;
  cuidadorId: number;
  nomeCompleto: string;
  userId: string;
}

export interface Paciente {
  relacionamentoId: number;
  idosoId: number;
  nomeCompleto: string;
  telefone: string;
  remedios: Remedio[];
}

export interface Mensagem {
  id: number;
  conteudo: string;
  audioUrl: string | null;
  dataHora: string;
  remetenteId: string;
  remetenteNome: string;
}

export interface Chat {
  relacionamentoId: number;
  outroUsuarioNome: string;
  outroUsuarioId: string;
  usuarioAtualId: string;
  mensagens: Mensagem[];
  isIdoso: boolean;
}

export interface DashboardIdoso {
  me: Me;
  cuidadores: Cuidador[];
  remedios: Remedio[];
}

export interface DashboardCuidador {
  me: Me;
  pacientes: Paciente[];
}
