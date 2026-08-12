import { spawn } from 'node:child_process';

function run(label: string, command: string, args: string[]): ReturnType<typeof spawn> {
  const child = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  child.stdout?.on('data', (data: Buffer) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      console.log(`[${label}] ${line}`);
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      console.error(`[${label}] ${line}`);
    }
  });

  return child;
}

console.log('Starting web app...\n');

const server = run('api', 'bun', ['run', 'src/web/server.ts']);
const ui = run('ui', 'bunx', ['vite', '--config', 'vite.config.ts']);

process.on('SIGINT', () => {
  server.kill();
  ui.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  ui.kill();
  process.exit();
});
