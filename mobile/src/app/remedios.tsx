import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { Remedio } from '../api/types';
import { getCached } from '../offline/data';
import { useVoice } from '../voice/voiceContext';
import { colors } from '../theme/colors';
import { Card, EmptyState, ErrorBox, Screen, VoiceButton } from '../components/ui';

export default function Remedios() {
  const [remedios, setRemedios] = useState<Remedio[] | null>(null);
  const [erro, setErro] = useState('');
  const { registrar } = useVoice();

  useEffect(() => {
    getCached<Remedio[]>('/api/remedios', 'remedios')
      .then((r) => setRemedios(r.data))
      .catch((e) => setErro((e as Error).message));
  }, []);

  useEffect(() => {
    if (!remedios) return;
    registrar({
      descricaoTela: remedios.length
        ? `Tela de remédios. Você tem ${remedios.length} remédio cadastrado.`
        : 'Tela de remédios. Nenhum remédio cadastrado.',
      remediosHoje: remedios.length
        ? `Seus remédios: ${remedios.map((r) => `${r.nome}, dose ${r.dose}, às ${r.horario}`).join('. ')}.`
        : '',
    });
  }, [remedios, registrar]);

  return (
    <Screen>
      <Text style={styles.title}>💊 Meus remédios</Text>
      <ErrorBox msg={erro} />

      {remedios?.map((r) => (
        <Card key={r.id} style={styles.remedioCard}>
          <Text style={styles.horario}>🕐 {r.horario}</Text>
          <Text style={styles.nome}>{r.nome}</Text>
          <Text style={styles.dose}>{r.dose}</Text>
          {r.descricao ? <Text style={styles.desc}>{r.descricao}</Text> : null}
          <VoiceButton texto={`${r.nome}, dose ${r.dose}, às ${r.horario}`} />
        </Card>
      ))}

      {remedios && remedios.length === 0 && <EmptyState emoji="💊" text="Nenhum remédio cadastrado." />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.primaryDark, marginBottom: 16 },
  remedioCard: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  horario: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 8,
  },
  nome: { fontSize: 20, fontWeight: '700', color: colors.text },
  dose: { fontSize: 16, color: colors.text, marginTop: 2 },
  desc: { fontSize: 15, color: colors.textMuted, marginTop: 6 },
});
