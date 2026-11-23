import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';
import { VoiceCommandButton } from './VoiceCommandButton';

// ---------- Botão grande (alvo ≥48px, sempre com rótulo) ----------
export function BigButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'outline' | 'light';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isGhost = variant === 'outline' || variant === 'light';
  const fg = isGhost ? colors.primaryDark : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        styles[`btn_${variant}`],
        (pressed || disabled || loading) && styles.btnPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

// ---------- Campo (rótulo + input) ----------
export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

// ---------- Caixa de erro ----------
export function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return <Text style={styles.error}>{msg}</Text>;
}

// ---------- Botão "Ouvir" (TTS) ----------
export function VoiceButton({ texto }: { texto: string }) {
  return (
    <Pressable
      onPress={() => Speech.speak(texto, { language: 'pt-BR', rate: 0.95 })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.voiceBtn, pressed && styles.btnPressed]}
    >
      <Text style={styles.voiceText}>🔊 Ouvir</Text>
    </Pressable>
  );
}

// ---------- Estado vazio ----------
export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ---------- Tela padrão (cabeçalho + scroll) ----------
export function Screen({ children }: { children: ReactNode }) {
  const { me, logout } = useAuth();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.brand}>Nós</Text>
        <Text style={styles.user} numberOfLines={1}>
          {me?.nomeCompleto ?? ''}
        </Text>
        <VoiceCommandButton />
        <Pressable onPress={logout} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.logout}>Sair</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Cartão simples ----------
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brand: { color: colors.white, fontSize: 24, fontWeight: '800' },
  user: { color: colors.white, flex: 1, fontSize: 15, opacity: 0.95 },
  logout: { color: colors.white, fontSize: 16, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  btn: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_primary: { backgroundColor: colors.primary },
  btn_accent: { backgroundColor: colors.accent },
  btn_outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary },
  btn_light: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  btnPressed: { opacity: 0.7 },
  btnText: { fontSize: 18, fontWeight: '700' },

  field: { marginBottom: 14 },
  label: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginBottom: 6 },
  input: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.white,
  },

  error: {
    backgroundColor: '#FDECEA',
    borderColor: '#F5C6CB',
    borderWidth: 2,
    color: colors.primaryDark,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '600',
  },

  voiceBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceText: { color: colors.text, fontWeight: '700', fontSize: 16 },

  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: colors.textMuted, fontSize: 16, marginTop: 8, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
});
