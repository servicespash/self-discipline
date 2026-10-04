import { spawn } from 'child_process';
import path from 'path';

const binPath = path.resolve('node_modules/.bin');
const tsxPath = path.join(binPath, 'tsx');
const vitePath = path.join(binPath, 'vite');

const api = spawn(tsxPath, ['server.ts'], { stdio: 'inherit' });
const vite = spawn(vitePath, ['--port=3000', '--host=0.0.0.0'], { stdio: 'inherit' });

process.on('SIGINT', () => {
  api.kill();
  vite.kill();
  process.exit();
});
