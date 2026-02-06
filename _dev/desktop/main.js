const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

// Keep a global reference of the window object
let mainWindow;
let appPath;
let server;
const PORT = 45678; // Local server port

// Get the path to web app files (different in dev vs production)
function getAppPath() {
  if (app.isPackaged) {
    // Production: files are in Resources/app
    return path.join(process.resourcesPath, 'app');
  } else {
    // Development: files are in ../http/_site relative to this file
    return path.join(__dirname, '../http/_site');
  }
}

// MIME types for common file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm',
  '.csv': 'text/csv'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// Serve a file with proper MIME type
function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.message);
      return;
    }
    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(data);
  });
}

// Start local HTTP server to serve app files
function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      // Parse URL and get pathname
      let pathname = url.parse(req.url).pathname;
      pathname = decodeURIComponent(pathname);
      
      // Default to index.html for root
      if (pathname === '/') {
        pathname = '/index.html';
      }
      
      // Build full file path
      const filePath = path.join(appPath, pathname);
      
      // Security: prevent directory traversal
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(appPath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      
      // Try to serve the exact file first
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        serveFile(res, filePath);
        return;
      }
      
      // Try adding .html extension
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
        serveFile(res, htmlPath);
        return;
      }
      
      // Try index.html in directory
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        serveFile(res, indexPath);
        return;
      }
      
      // For SPA routes (no file extension), serve root index.html
      // This handles routes like /bible/kjv/Genesis/1
      const ext = path.extname(pathname);
      if (!ext) {
        const rootIndex = path.join(appPath, 'index.html');
        if (fs.existsSync(rootIndex)) {
          serveFile(res, rootIndex);
          return;
        }
      }
      
      // 404 for everything else
      res.writeHead(404);
      res.end('Not Found: ' + pathname);
    });
    
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running at http://127.0.0.1:${PORT}/`);
      resolve();
    });
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

  // Load the app from local server
  mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);

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
app.whenReady().then(async () => {
  appPath = getAppPath();
  await startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay open until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Stop the server when quitting
  if (server) {
    server.close();
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
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
