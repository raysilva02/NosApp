import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { getCached } from '../offline/data';
import { useVoice } from '../voice/voiceContext';
import type { DashboardIdoso, DashboardCuidador } from '../api/types';
import { colors } from '../theme/colors';
import { BigButton, Card, EmptyState, ErrorBox, Screen, VoiceButton } from '../components/ui';
import { SosButton } from '../components/SosButton';

export default function Home() {
  const { me } = useAuth();
  const [data, setData] = useState<DashboardIdoso | DashboardCuidador | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    getCached<DashboardIdoso | DashboardCuidador>('/api/dashboard', 'dashboard')
      .then((r) => setData(r.data))
      .catch((e) => setErro((e as Error).message));
  }, []);

  if (erro) {
    return (
      <Screen>
        <ErrorBox msg={erro} />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return me?.tipoUsuario === 'Idoso' ? (
    <DashboardIdosoView data={data as DashboardIdoso} />
  ) : (
    <DashboardCuidadorView data={data as DashboardCuidador} />
  );
}

function DashboardIdosoView({ data }: { data: DashboardIdoso }) {
  const router = useRouter();
  const { registrar } = useVoice();

  useEffect(() => {
    registrar({
      descricaoTela: `Tela inicial. Você tem ${data.cuidadores.length} cuidador e ${data.remedios.length} remédios cadastrados.`,
      telefoneCuidador: data.cuidadores[0]?.telefone ?? null,
      remediosHoje: data.remedios.length
        ? `Seus remédios: ${data.remedios.map((r) => `${r.nome}, dose ${r.dose}, às ${r.horario}`).join('. ')}.`
        : '',
    });
  }, [data, registrar]);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Olá, {data.me.nomeCompleto} 💛</Text>
        <Text style={styles.heroText}>Aqui você vê seus cuidadores e seus remédios.</Text>
      </View>

      <SosButton />

      <Text style={styles.sectionTitle}>👩‍⚕️ Meus cuidadores</Text>
      {data.cuidadores.length === 0 && <EmptyState emoji="👩‍⚕️" text="Nenhum cuidador vinculado ainda." />}
      {data.cuidadores.map((c) => (
        <Card key={c.relacionamentoId}>
          <Text style={styles.name}>{c.nomeCompleto}</Text>
          <Text style={styles.role}>Cuidador(a)</Text>
          <BigButton
            title="💬 Conversar"
            onPress={() => router.push(`/chat/${c.relacionamentoId}`)}
            style={{ marginTop: 12 }}
          />
        </Card>
      ))}

      <Text style={styles.sectionTitle}>💊 Meus remédios</Text>
      {data.remedios.length === 0 && <EmptyState emoji="💊" text="Nenhum remédio cadastrado." />}
      {data.remedios.map((r) => (
        <Card key={r.id} style={styles.remedioCard}>
          <Text style={styles.horario}>🕐 {r.horario}</Text>
          <Text style={styles.name}>{r.nome}</Text>
          <Text style={styles.role}>{r.dose}</Text>
          {r.descricao ? <Text style={styles.desc}>{r.descricao}</Text> : null}
          <VoiceButton texto={`${r.nome}, dose ${r.dose}, às ${r.horario}`} />
        </Card>
      ))}
    </Screen>
  );
}

function DashboardCuidadorView({ data }: { data: DashboardCuidador }) {
  const router = useRouter();
  const { registrar } = useVoice();

  useEffect(() => {
    registrar({
      descricaoTela: `Tela inicial. Você cuida de ${data.pacientes.length} paciente.`,
      telefoneCuidador: null,
      remediosHoje: '',
    });
  }, [data, registrar]);

  return (
    <Screen>
      <View style={[styles.hero, styles.heroCuidador]}>
        <Text style={styles.heroTitle}>Olá, {data.me.nomeCompleto} 💛</Text>
        <Text style={styles.heroText}>Gerencie seus pacientes e seus remédios.</Text>
      </View>

      <BigButton title="➕ Adicionar paciente" onPress={() => router.push('/pacientes')} style={{ marginBottom: 16 }} />

      <Text style={styles.sectionTitle}>👴 Meus pacientes</Text>
      {data.pacientes.length === 0 && <EmptyState emoji="👴" text="Nenhum paciente. Adicione pelo telefone." />}
      {data.pacientes.map((p) => (
        <Card key={p.relacionamentoId}>
          <Text style={styles.name}>{p.nomeCompleto}</Text>
          <Text style={styles.role}>{p.telefone} · {p.remedios.length} remédio(s)</Text>
          <BigButton
            title="💬 Conversar"
            onPress={() => router.push(`/chat/${p.relacionamentoId}`)}
            style={{ marginTop: 12 }}
          />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  heroCuidador: { backgroundColor: colors.accentDark },
  heroTitle: { color: colors.white, fontSize: 24, fontWeight: '800' },
  heroText: { color: colors.white, fontSize: 16, opacity: 0.95, marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.primaryDark, marginBottom: 10, marginTop: 8 },
  name: { fontSize: 19, fontWeight: '700', color: colors.text },
  role: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
  desc: { fontSize: 15, color: colors.textMuted, marginTop: 6 },
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
  remedioCard: { backgroundColor: colors.accentLight, borderColor: colors.accent },
});
