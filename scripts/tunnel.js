const { spawn } = require('child_process');

const PORT = 3000;

console.log('\n🌐 Vytvářím Cloudflare Tunnel pro přístup z internetu...\n');
console.log('⏳ Počkejte, až se zobrazí veřejná URL...\n');

// Spustit cloudflared tunnel
const tunnel = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], {
  stdio: 'inherit',
  shell: true
});

// Zpracování ukončení procesu
process.on('SIGINT', () => {
  console.log('\n\n🛑 Ukončuji tunel...');
  tunnel.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  tunnel.kill();
  process.exit(0);
});

tunnel.on('close', (code) => {
  console.log(`\n🔌 Tunel byl uzavřen (kód: ${code})`);
  process.exit(code);
});

tunnel.on('error', (err) => {
  console.error('❌ Chyba při spouštění tunelu:', err.message);
  console.log('\n💡 Zkuste nainstalovat cloudflared ručně:');
  console.log('   npm install -g cloudflared');
  console.log('   nebo použijte: npx cloudflared tunnel --url http://localhost:3000');
  process.exit(1);
});

