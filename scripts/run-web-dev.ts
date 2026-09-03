import { spawn, spawnSync } from 'node:child_process';

function run(
  label: string,
  command: string,
  args: string[],
  extraEnv: Record<string, string> = {}
): ReturnType<typeof spawn> {
  const child = spawn(command, args, {
    stdio: 'pipe',
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      ...extraEnv,
    },
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

console.log('Starting web app at http://localhost:5173\n');

const apiPort = process.env.API_PORT ?? '3001';
const server = run('api', 'bun', ['run', 'src/web/server.ts'], {
  PORT: apiPort,
});
const ui = run('ui', 'bun', ['run', 'vite', '--', '--config', 'vite.config.ts'], {
  API_PORT: apiPort,
});

function stop(): void {
  for (const child of [server, ui]) {
    if (!child.pid) continue;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
