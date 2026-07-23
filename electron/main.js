const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

let mainWindow = null;
let setupWindow = null;

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function testServerUrl(serverUrl) {
  return new Promise((resolve) => {
    const req = http.get(`http://${serverUrl}/api/health`, { timeout: 4000 }, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 480,
    height: 380,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  setupWindow.loadFile(path.join(__dirname, 'server-setup.html'));
  setupWindow.on('closed', () => { setupWindow = null; });
}

function createMainWindow(serverUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadURL(`http://${serverUrl}/pos-terminal`);

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://${serverUrl}`)) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function reopenSetup() {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (!setupWindow) {
    createSetupWindow();
  } else {
    setupWindow.focus();
  }
}

ipcMain.handle('test-server', async (event, serverUrl) => testServerUrl(serverUrl));

ipcMain.handle('save-server-config', async (event, serverUrl) => {
  writeConfig({ serverUrl });
  if (setupWindow) {
    setupWindow.close();
  }
  createMainWindow(serverUrl);
  return true;
});

ipcMain.handle('get-server-config', async () => readConfig());

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else if (setupWindow) {
      setupWindow.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // F2 re-opens server setup - terminals occasionally need to be repointed at a different server
    globalShortcut.register('F2', reopenSetup);

    const config = readConfig();
    if (config && config.serverUrl) {
      createMainWindow(config.serverUrl);
    } else {
      createSetupWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
