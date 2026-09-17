import { spawn } from 'child_process';

console.log('🚀 Starting Prompt Wars Full-Stack Platform (Backend + Vite Frontend)...\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['run', 'server'], { stdio: 'inherit', shell: true });
const client = spawn(npmCmd, ['run', 'dev'], { stdio: 'inherit', shell: true });

const cleanup = () => {
  console.log('\n🛑 Shutting down development servers...');
  try {
    if (isWin) {
      if (server.pid) spawn('taskkill', ['/pid', server.pid.toString(), '/f', '/t']);
      if (client.pid) spawn('taskkill', ['/pid', client.pid.toString(), '/f', '/t']);
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
