import { useCallback } from 'react';
import { Linking } from 'react-native';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { useVoice, type Contato } from './voiceContext';

const dizer = (texto: string) => Speech.speak(texto, { language: 'pt-BR', rate: 0.95 });

// Normaliza o texto: minúsculas, sem acentos (á->a), sem pontuação.
const normalizar = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Processa um comando de voz (texto já transcrito) e executa a ação.
 * O reconhecimento por palavra-chave tolera muitas variações de frase.
 */
export function useVoiceCommands() {
  const router = useRouter();
  const { me, logout } = useAuth();
  const { descricaoTela, telefoneCuidador, remediosHoje, contatos } = useVoice();

  return useCallback(
    (textoBruto: string) => {
      const t = normalizar(textoBruto);

      // 0. Socorro: envia para todos os cuidadores do idoso.
      if (
        /socorro|s\.o\.s|estou passando mal|passando mal|me sinto mal|estou mal|emergencia|urgente|preciso de ajuda|preciso de socorro|me ajuda|me ajude|chama alguem|nao estou bem/.test(
          t
        )
      ) {
        if (me?.tipoUsuario !== 'Idoso') {
          dizer('Este comando é para idosos.');
          return;
        }
        dizer('Enviando socorro para seus cuidadores.');
        api('/api/chat/sos', {
          method: 'POST',
          body: { conteudo: 'Socorro! Estou passando mal e preciso de ajuda.' },
        })
          .then(() => dizer('Socorro enviado.'))
          .catch(() => dizer('Não consegui enviar o socorro. Verifique sua internet.'));
        return;
      }

      // 0.1 Mandar mensagem para uma pessoa específica.
      //    Ex.: "mandar mensagem para Maria", "avisa a Maria", "manda pro João dizendo que estou com fome".
      const matchMsg = t.match(
        /(?:mandar|manda|enviar|envia|avisa|avise|diz|diga)[^\n]*(?:mensagem|recado)?[^\n]*(?:para|pro|pra|a|ao)[ ]+([a-záàâãéêíóôõúç ]+?)(?:[ ]+(?:dizendo|que|diz|assim)[ ]+(.+))?$/
      );
      if (matchMsg && contatos.length > 0) {
        const nomeFalado = matchMsg[1].trim();
        const conteudo = matchMsg[2]?.trim();

        // Casa o nome falado com um contato (ignorando acentos).
        const alvo = contatos.find((c) => normalizar(c.nome) === normalizar(nomeFalado));
        if (!alvo) {
          dizer(`Não encontrei ${nomeFalado} na sua lista.`);
          return;
        }
        const textoFinal = conteudo || 'Mensagem enviada por voz.';
        dizer(`Enviando mensagem para ${alvo.nome}.`);
        api(`/api/chat/${alvo.relId}/mensagens`, {
          method: 'POST',
          body: { conteudo: textoFinal },
        })
          .then(() => dizer('Mensagem enviada.'))
          .catch(() => dizer('Não consegui enviar a mensagem.'));
        return;
      }

      // 1. Ler a tela
      if (/le pra mim|leia pra mim|ler a tela|leia a tela|le tudo|le isso|o que tem na tela|me le|leia|ler/.test(t)) {
        if (descricaoTela) {
          dizer(descricaoTela);
        } else {
          dizer('Não consegui identificar esta tela.');
        }
        return;
      }

      // 2. Ligar para o cuidador (só idoso com telefone conhecido)
      if (/ligar|liga|telefonar|telefona|chamar|chama|discar|faz uma chamada|fazer uma chamada/.test(t)) {
        if (telefoneCuidador) {
          dizer('Abrindo o discador para ligar.');
          Linking.openURL(`tel:${telefoneCuidador}`).catch(() => {
            dizer('Não consegui abrir o discador.');
          });
        } else {
          dizer('Nenhum telefone de cuidador disponível.');
        }
        return;
      }

      // 3. Remédios de hoje
      if (/remedio.*hoje|hoje.*remedio|o que eu tomo|o que tomo|o que tomar|quais remedios|meus remedios|remedio agora|hora do remedio/.test(t)) {
        if (remediosHoje) {
          dizer(remediosHoje);
        } else {
          dizer('Você não tem remédios cadastrados.');
        }
        return;
      }

      // 4. Navegação
      if (/remedio|medicamento|comprimido/.test(t)) {
        dizer('Abrindo remédios.');
        router.push('/remedios');
      } else if (/sair|logout|encerrar|encerra|deslogar|fechar o app|sair do app/.test(t)) {
        dizer('Saindo.');
        logout();
      } else if (/paciente/.test(t) && me?.tipoUsuario === 'Cuidador') {
        dizer('Abrindo pacientes.');
        router.push('/pacientes');
      } else if (/inicio|tela inicial|menu|home|voltar|comeco|principal/.test(t)) {
        dizer('Voltando ao início.');
        router.replace('/');
      } else {
        dizer('Comando não reconhecido.');
      }
    },
    [router, me, logout, descricaoTela, telefoneCuidador, remediosHoje, contatos]
  );
}

// Re-export do tipo para conveniência (usado em telas que montam os contatos).
export type { Contato };
