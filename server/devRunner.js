import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting Prompt Wars Full-Stack Platform (Backend + Vite Frontend)...\n');

const isWin = process.platform === 'win32';

// Automatically free port if occupied by a stale zombie process
function freePort(port) {
  try {
    if (isWin) {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== process.pid.toString()) {
          pids.add(pid);
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
          console.log(`🧹 Auto-freed port ${port} from stale PID ${pid}`);
        } catch (_) {}
      }
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    }
  } catch (_) {
    // Port is already free
  }
}

// Ensure ports are clear before starting
freePort(3001);

const serverScript = path.join(__dirname, 'server.js');
const viteScript = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

// Spawn server & client directly with node binary for 100% cross-platform stability
const server = spawn(process.execPath, [serverScript], { 
  cwd: rootDir,
  stdio: 'inherit' 
});

const client = spawn(process.execPath, [viteScript], { 
  cwd: rootDir,
  stdio: 'inherit' 
});

const cleanup = () => {
  console.log('\n🛑 Shutting down development servers...');
  try {
    if (isWin) {
      if (server.pid) spawn('taskkill', ['/pid', server.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
      if (client.pid) spawn('taskkill', ['/pid', client.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
    } else {
      server.kill('SIGINT');
      client.kill('SIGINT');
    }
  } catch (e) {
    // Ignore error on exit
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
