import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function RootLayout() {
  // 只在移动端使用 Stack，避免 Web 兼容性问题
  if (Platform.OS === 'web') {
    return null; // Web 端使用 Next.js
  }
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
