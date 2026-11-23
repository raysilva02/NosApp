import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { AuthResponse, TipoUsuario } from '../api/types';
import { colors } from '../theme/colors';
import { BigButton, ErrorBox, Field } from '../components/ui';

export default function Register() {
  const router = useRouter();
  const { me, login } = useAuth();
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const tipoUsuario: TipoUsuario = tipo === 'cuidador' ? 'Cuidador' : 'Idoso';
  const isIdoso = tipoUsuario === 'Idoso';

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  if (me) return <Redirect href="/" />;

  const submit = async () => {
    setErro('');
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const r = await api<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: { nomeCompleto: nome, telefone, senha, tipoUsuario },
      });
      await login(r.token, r.me);
      router.replace('/');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>💛</Text>
      <Text style={styles.title}>{isIdoso ? 'Cadastro de Idoso' : 'Cadastro de Cuidador'}</Text>
      <Text style={styles.subtitle}>{isIdoso ? 'Crie sua conta de idoso' : 'Crie sua conta de cuidador'}</Text>

      <ErrorBox msg={erro} />

      <Field label="Nome completo" autoCapitalize="words" placeholder="Seu nome" value={nome} onChangeText={setNome} />
      <Field
        label="Telefone"
        keyboardType="phone-pad"
        placeholder="(11) 99999-9999"
        value={telefone}
        onChangeText={setTelefone}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Field label="Senha" secureTextEntry placeholder="Mínimo 6 caracteres" value={senha} onChangeText={setSenha} />
      <Field label="Confirmar senha" secureTextEntry placeholder="Repita a senha" value={confirmar} onChangeText={setConfirmar} />

      <BigButton title="Cadastrar" onPress={submit} loading={loading} />

      <View style={styles.footer}>
        <BigButton title="Já tenho conta — entrar" variant="light" onPress={() => router.replace('/login')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingTop: 40 },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 17, color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  footer: { marginTop: 16 },
});
