import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { AuthResponse } from '../api/types';
import { colors } from '../theme/colors';
import { BigButton, ErrorBox, Field } from '../components/ui';

export default function Login() {
  const router = useRouter();
  const { me, login } = useAuth();
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  if (me) return <Redirect href="/" />;

  const submit = async () => {
    setErro('');
    setLoading(true);
    try {
      const r = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { telefone, senha },
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
      <Text style={styles.title}>Nós</Text>
      <Text style={styles.subtitle}>Cuidado e conexão</Text>

      <ErrorBox msg={erro} />

      <Field
        label="Telefone"
        keyboardType="phone-pad"
        placeholder="(11) 99999-9999"
        value={telefone}
        onChangeText={setTelefone}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Field label="Senha" secureTextEntry placeholder="Sua senha" value={senha} onChangeText={setSenha} />

      <BigButton title="Entrar" onPress={submit} loading={loading} />

      <Text style={styles.hint}>Não tem conta?</Text>
      <View style={styles.links}>
        <BigButton
          title="Cadastrar como Idoso"
          variant="outline"
          onPress={() => router.push('/register?tipo=idoso')}
        />
        <BigButton
          title="Cadastrar como Cuidador"
          variant="outline"
          onPress={() => router.push('/register?tipo=cuidador')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingTop: 48 },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 18, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  hint: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 20, marginBottom: 8 },
  links: { gap: 10 },
});
