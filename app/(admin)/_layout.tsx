import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true, 
      headerTitleStyle: { fontWeight: 'bold' },
      headerTintColor: '#1E4D48' 
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="revenue-details" options={{ title: 'Financial Overview' }} />
      <Stack.Screen name="doctors-list" options={{ title: 'Onboarded Doctors' }} />
      <Stack.Screen name="patients-list" options={{ title: 'Patient Records' }} />
    </Stack>
  );
}