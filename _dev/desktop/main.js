const { app, BrowserWindow, Menu, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Keep a global reference of the window object
let mainWindow;
let appPath;

// Register custom protocol scheme BEFORE app.ready
// This must be called before the 'ready' event
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true,
    stream: true
  }
}]);

// Get the path to web app files (different in dev vs production)
function getAppPath() {
  if (app.isPackaged) {
    // Production: files are in Resources/app
    return path.join(process.resourcesPath, 'app');
  } else {
    // Development: files are in the project root (two levels up from _dev/desktop/)
    return path.join(__dirname, '../..');
  }
}

// Setup custom protocol handler to serve local files without an HTTP server
function setupProtocolHandler() {
  protocol.handle('app', (request) => {
    let url;
    try {
      url = new URL(request.url);
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    let pathname = decodeURIComponent(url.pathname);

    // Default to index.html for root
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    // Build full file path
    const filePath = path.join(appPath, pathname);

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(appPath)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Helper: serve a file via net.fetch with file:// URL
    const serveFile = (fp) => net.fetch(pathToFileURL(fp).toString());

    // Try to serve the exact file
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveFile(filePath);
    }

    // Try adding .html extension
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
      return serveFile(htmlPath);
    }

    // Try index.html in directory
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return serveFile(indexPath);
    }

    // SPA fallback: for extensionless paths, serve root index.html
    // This handles routes like /bible/kjv/Genesis/1
    const ext = path.extname(pathname);
    if (!ext) {
      const rootIndex = path.join(appPath, 'index.html');
      if (fs.existsSync(rootIndex)) {
        return serveFile(rootIndex);
      }
    }

    // 404 for everything else
    return new Response('Not Found: ' + pathname, { status: 404 });
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(appPath, 'icons/icon-512.png'),
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app via custom protocol (no HTTP server needed)
  mainWindow.loadURL('app://bundle/index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [
          { role: 'close' }
        ])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle events
app.whenReady().then(() => {
  appPath = getAppPath();
  setupProtocolHandler();
  createWindow();
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay open until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Security: Prevent new windows from being opened
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    // Allow opening external links in the system browser
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});
