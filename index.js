import 'expo-dev-client';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { NativeModules, Platform } from 'react-native';

// 🔍 DIAGNOSTIC LOGS
console.log("====================================");
console.log("🚀 PRAMAN AI BOOTSEQUENCE STARTED");
console.log("📱 Platform:", Platform.OS);
console.log("🛠️ Dev Client Loaded:", !!NativeModules.ExpoDevLauncher);
console.log("📂 FileSystem Available:", !!NativeModules.ExponentFileSystem);
console.log("====================================");

export function App() {
  console.log("📂 Loading App Context...");
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);