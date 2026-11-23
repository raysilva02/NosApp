import { useCallback } from 'react';
import { Linking } from 'react-native';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { useVoice } from './voiceContext';

const dizer = (texto: string) => Speech.speak(texto, { language: 'pt-BR', rate: 0.95 });

/**
 * Processa um comando de voz (texto já transcrito) e executa a ação.
 * Comandos suportados:
 *   - "socorro" / "estou passando mal" => envia SOS para todos os cuidadores
 *   - "lê pra mim" / "ler tela"      => lê a descrição da tela atual
 *   - "ligar" / "telefonar"          => abre o discador com o telefone do cuidador
 *   - "remédios de hoje" / "o que tomar" => lê os remédios cadastrados
 *   - navegação (remédio, início, sair, paciente)
 */
export function useVoiceCommands() {
  const router = useRouter();
  const { me, logout } = useAuth();
  const { descricaoTela, telefoneCuidador, remediosHoje } = useVoice();

  return useCallback(
    (texto: string) => {
      const t = texto.toLowerCase();

      // 0. Socorro: envia para todos os cuidadores do idoso.
      if (/socorro|passando mal|emerg[êe]ncia|preciso de ajuda|me ajuda/.test(t)) {
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

      // 1. Ler a tela
      if (/l[eê][^ ]* (pra|para)? ?mim|ler (a )?tela|leia/.test(t)) {
        if (descricaoTela) {
          dizer(descricaoTela);
        } else {
          dizer('Não consegui identificar esta tela.');
        }
        return;
      }

      // 2. Ligar para o cuidador (só idoso com telefone conhecido)
      if (/ligar|telefonar|chamar/.test(t)) {
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
      if (/rem[ée]dio.*hoje|hoje.*rem[ée]dio|o que (eu )?tomo|o que tomar/.test(t)) {
        if (remediosHoje) {
          dizer(remediosHoje);
        } else {
          dizer('Você não tem remédios cadastrados.');
        }
        return;
      }

      // Navegação (comandos originais)
      if (/remedio|remédio/.test(t)) {
        dizer('Abrindo remédios.');
        router.push('/remedios');
      } else if (/sair|logout|encerrar/.test(t)) {
        dizer('Saindo.');
        logout();
      } else if (/paciente/.test(t) && me?.tipoUsuario === 'Cuidador') {
        dizer('Abrindo pacientes.');
        router.push('/pacientes');
      } else if (/inicio|início|menu|home/.test(t)) {
        dizer('Voltando ao início.');
        router.replace('/');
      } else {
        dizer('Comando não reconhecido.');
      }
    },
    [router, me, logout, descricaoTela, telefoneCuidador, remediosHoje]
  );
}
