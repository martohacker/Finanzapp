const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    titleBarStyle: 'default',
    backgroundColor: '#f9fafb',
  });

  // Cargar la aplicación
  if (isDev) {
    // En desarrollo, cargar desde Vite dev server
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // En producción, cargar desde los archivos build
    // Determinar la ruta correcta según si está empaquetado o no
    let indexPath;
    if (app.isPackaged) {
      // Empaquetado: archivos en resources/app.asar/dist/
      indexPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');
    } else {
      // No empaquetado: archivos en ../dist/
      indexPath = path.join(__dirname, '../dist/index.html');
    }
    
    win.loadFile(indexPath).catch(err => {
      console.error('Error al cargar la app:', err);
      console.error('Ruta intentada:', indexPath);
      win.webContents.openDevTools();
    });
  }

  // Manejar errores de carga
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Error de carga:', errorCode, errorDescription);
    win.webContents.openDevTools();
  });

  // Manejar enlaces externos
  win.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

