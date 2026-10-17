import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { ScrollViewProps, TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * The app's small UI kit.
 *
 * Deliberately tiny: NativeWind supplies the styling, so these components only
 * add the handful of shapes the guest journey repeats (a screen frame, a card,
 * a button with variants, a labelled input and a spinner).
 */

export function Screen({
  children,
  className = '',
  ...rest
}: ScrollViewProps & { children: ReactNode; className?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10"
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>{children}</View>;
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
};

export function Button({ title, onPress, loading, disabled, variant = 'primary', className = '' }: ButtonProps) {
  const base = 'flex-row items-center justify-center rounded-xl px-4 py-3';
  const style =
    variant === 'primary'
      ? 'bg-primary'
      : variant === 'outline'
        ? 'border border-primary bg-surface'
        : 'bg-transparent';
  const text = variant === 'primary' ? 'text-white' : 'text-primary';
  const off = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={off ? undefined : onPress}
      className={`${base} ${style} ${off ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : '#6153a3'} /> : null}
      <Text className={`font-semibold ${text}`}>{title}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string | null };

export function Field({ label, error, className = '', ...rest }: FieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-muted">{label}</Text>
      <TextInput
        className={`rounded-xl border bg-surface px-3 py-3 text-base text-black ${
          error ? 'border-destructive' : 'border-border'
        } ${className}`}
        placeholderTextColor="#9ca3af"
        {...rest}
      />
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

export function Badge({ text, tone = 'primary' }: { text: string; tone?: 'primary' | 'success' | 'muted' }) {
  const tones = {
    primary: 'bg-primary-soft text-primary',
    success: 'bg-green-100 text-success',
    muted: 'bg-gray-100 text-muted',
  };

  return (
    <View className={`self-start rounded-full px-3 py-1 ${tones[tone].split(' ')[0]}`}>
      <Text className={`text-xs font-semibold ${tones[tone].split(' ')[1]}`}>{text}</Text>
    </View>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex-1">
      <Text className="text-xs uppercase text-muted">{label}</Text>
      <Text className="mt-1 text-xl font-semibold text-black">{value}</Text>
    </Card>
  );
}

export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' }) {
  return (
    <View className={`rounded-xl p-3 ${tone === 'error' ? 'bg-red-50' : 'bg-primary-soft'}`}>
      <Text className={`text-sm ${tone === 'error' ? 'text-destructive' : 'text-primary'}`}>{text}</Text>
    </View>
  );
}
