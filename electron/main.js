const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

let store = null;
let backendProcess = null;
let mainWindow = null;

async function initStore() {
  const { default: Store } = await import('electron-store');
  store = new Store({ name: 'xatlas-secure', encryptionKey: 'xatlas-secure' });
}

function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend', 'xatlas-backend');
  }
  return path.join(__dirname, '..', '..', 'atlas-backend', 'dist', 'xatlas-backend');
}

function loadEnvFile() {
  // Load .env from atlas-backend dir (dev) or resources (packaged)
  const envPaths = app.isPackaged
    ? [path.join(process.resourcesPath, '.env')]
    : [
        path.join(__dirname, '..', '..', 'atlas-backend', '.env'),
        path.join(__dirname, '..', '.env.local'),
      ];
  const extra = {};
  for (const p of envPaths) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        extra[key] = val;
      }
      console.log('[Electron] Loaded env from:', p);
    } catch {}
  }
  return extra;
}

let cachedEnvVars = null;

function startBackend() {
  const binPath = getBackendPath();
  cachedEnvVars = cachedEnvVars || loadEnvFile();
  console.log('[Electron] Starting backend:', binPath);
  console.log('[Electron] Backend env keys:', Object.keys(cachedEnvVars).filter(k => k.includes('KEY') || k.includes('SECRET')).map(k => k + '=***'));

  backendProcess = spawn(binPath, [], {
    stdio: 'pipe',
    env: { ...process.env, ...cachedEnvVars },
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('[Backend]', data.toString().trim());
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[Backend]', data.toString().trim());
  });

  backendProcess.on('error', (err) => {
    console.error('[Backend] Failed to start:', err.message);
  });

  backendProcess.on('exit', (code) => {
    console.log('[Backend] Exited with code:', code);
    backendProcess = null;
  });
}

function waitForBackend() {
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get('http://localhost:8080/docs', (res) => {
        if (res.statusCode === 200) {
          console.log('[Electron] Backend is ready');
          resolve();
        } else {
          setTimeout(check, 500);
        }
      });
      req.on('error', () => {
        setTimeout(check, 500);
      });
      req.setTimeout(2000, () => {
        req.destroy();
        setTimeout(check, 500);
      });
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'XAtlas',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for encrypted key storage
ipcMain.handle('get-key', async (_event, provider) => {
  return store.get(`keys.${provider}`, '');
});

ipcMain.handle('set-key', async (_event, provider, key) => {
  store.set(`keys.${provider}`, key);
});

ipcMain.handle('delete-key', async (_event, provider) => {
  store.delete(`keys.${provider}`);
});

// Generic data storage (portfolio, watchlist, settings)
ipcMain.handle('get-data', async (_event, key) => {
  return store.get(`data.${key}`, null);
});

ipcMain.handle('set-data', async (_event, key, value) => {
  store.set(`data.${key}`, value);
});

function seedKeysFromEnv(envVars) {
  // Map .env key names to provider IDs used by the AI Council
  const keyMap = {
    ANTHROPIC_API_KEY: 'anthropic',
    CHATGPT_API_KEY: 'openai',
    GROK_API_KEY: 'xai',
    GOOGLE_API_KEY: 'google',
    MISTRAL_API_KEY: 'mistral',
  };
  for (const [envName, provider] of Object.entries(keyMap)) {
    const val = envVars[envName] || process.env[envName];
    if (val && !store.get(`keys.${provider}`)) {
      store.set(`keys.${provider}`, val);
      console.log(`[Electron] Seeded key for ${provider} from ${envName}`);
    }
  }
}

app.whenReady().then(async () => {
  await initStore();
  cachedEnvVars = loadEnvFile();
  seedKeysFromEnv(cachedEnvVars);
  startBackend();
  await waitForBackend();
  createWindow();
});

app.on('before-quit', () => {
  if (backendProcess) {
    console.log('[Electron] Killing backend process');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
