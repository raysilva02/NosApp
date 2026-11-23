import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../api/client';
import type { Paciente } from '../api/types';
import { getCached } from '../offline/data';
import { colors } from '../theme/colors';
import { BigButton, Card, EmptyState, ErrorBox, Field, Screen } from '../components/ui';

export default function Pacientes() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[] | null>(null);
  const [tel, setTel] = useState('');
  const [erro, setErro] = useState('');

  const carregar = () =>
    getCached<Paciente[]>('/api/pacientes', 'pacientes')
      .then((r) => setPacientes(r.data))
      .catch((e) => setErro((e as Error).message));

  useEffect(() => {
    carregar();
  }, []);

  const adicionar = async () => {
    setErro('');
    try {
      await api('/api/pacientes', { method: 'POST', body: { telefonePaciente: tel } });
      setTel('');
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const removerRemedio = (id: number) => {
    Alert.alert('Remover remédio?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/api/remedios/${id}`, { method: 'DELETE' });
            await carregar();
          } catch (e) {
            setErro((e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.title}>👴 Meus pacientes</Text>

      <Card>
        <Text style={styles.cardTitle}>➕ Adicionar paciente</Text>
        <ErrorBox msg={erro} />
        <Field
          label="Telefone do idoso"
          keyboardType="phone-pad"
          placeholder="(11) 99999-9999"
          value={tel}
          onChangeText={setTel}
        />
        <BigButton title="Vincular paciente" onPress={adicionar} />
      </Card>

      {pacientes?.map((p) => (
        <Card key={p.relacionamentoId}>
          <Text style={styles.name}>{p.nomeCompleto}</Text>
          <Text style={styles.role}>{p.telefone}</Text>

          <View style={styles.tags}>
            {p.remedios.map((r) => (
              <View key={r.id} style={styles.tag}>
                <Text style={styles.tagText}>{r.nome} · {r.horario}</Text>
                <Text style={styles.tagRemove} onPress={() => removerRemedio(r.id)}>
                  {' '}✕
                </Text>
              </View>
            ))}
            {p.remedios.length === 0 && <Text style={styles.role}>Sem remédios</Text>}
          </View>

          <BigButton
            title="💬 Conversar"
            onPress={() => router.push(`/chat/${p.relacionamentoId}`)}
            style={{ marginTop: 12 }}
          />

          <RemedioForm idosoId={p.idosoId} onDone={carregar} />
        </Card>
      ))}

      {pacientes && pacientes.length === 0 && <EmptyState emoji="👴" text="Nenhum paciente vinculado." />}
    </Screen>
  );
}

function RemedioForm({ idosoId, onDone }: { idosoId: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [horario, setHorario] = useState('');
  const [dose, setDose] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');

  if (!open) {
    return (
      <BigButton title="💊 Adicionar remédio" variant="accent" onPress={() => setOpen(true)} style={{ marginTop: 12 }} />
    );
  }

  const salvar = async () => {
    setErro('');
    try {
      await api('/api/remedios', {
        method: 'POST',
        body: { idosoId, nome, horario, dose, descricao: descricao || null },
      });
      setNome('');
      setHorario('');
      setDose('');
      setDescricao('');
      setOpen(false);
      onDone();
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  return (
    <View style={styles.form}>
      <ErrorBox msg={erro} />
      <Field label="Nome do remédio" value={nome} onChangeText={setNome} />
      <Field label="Horário" placeholder="Ex.: 08:00" value={horario} onChangeText={setHorario} />
      <Field label="Dose" placeholder="Ex.: 1 comprimido" value={dose} onChangeText={setDose} />
      <Field label="Descrição (opcional)" value={descricao} onChangeText={setDescricao} />
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <BigButton title="Salvar" onPress={salvar} />
        </View>
        <View style={styles.rowItem}>
          <BigButton title="Cancelar" variant="light" onPress={() => setOpen(false)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.primaryDark, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginBottom: 8 },
  name: { fontSize: 19, fontWeight: '700', color: colors.text },
  role: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { fontSize: 14, color: colors.text },
  tagRemove: { fontSize: 15, color: colors.primaryDark, fontWeight: '700' },
  form: { marginTop: 12 },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rowItem: { flex: 1 },
});
