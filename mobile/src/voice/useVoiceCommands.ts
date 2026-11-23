import { useCallback } from 'react';
import { Linking } from 'react-native';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { useVoice } from './voiceContext';

const dizer = (texto: string) => Speech.speak(texto, { language: 'pt-BR', rate: 0.95 });

/**
 * Processa um comando de voz (texto já transcrito) e executa a ação.
 * Comandos suportados:
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

      // 2. Ler a tela
      if (/l[eê][^ ]* (pra|para)? ?mim|ler (a )?tela|leia/.test(t)) {
        if (descricaoTela) {
          dizer(descricaoTela);
        } else {
          dizer('Não consegui identificar esta tela.');
        }
        return;
      }

      // 3. Ligar para o cuidador (só idoso com telefone conhecido)
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
