/**
 * Site Bundle Updater
 *
 * Checks timetested.bible for a newer APP_VERSION. If found, downloads
 * a site-bundle.tar.gz, extracts it to userData, and serves from the
 * updated bundle on next launch.
 *
 * Storage layout in app.getPath('userData'):
 *   site-bundles/
 *     current-version          (text file containing version number)
 *     v1234567890/             (extracted site bundle)
 */

const { app, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const SITE_URL = 'https://timetested.bible';
const VERSION_URL = `${SITE_URL}/version.js`;
const BUNDLE_URL = `${SITE_URL}/site-bundle.tar.gz`;
const BUNDLES_DIR = path.join(app.getPath('userData'), 'site-bundles');
const CURRENT_FILE = path.join(BUNDLES_DIR, 'current-version');

/**
 * Get the path to the latest downloaded site bundle, or null if none exists.
 */
function getUpdatedBundlePath() {
  try {
    if (!fs.existsSync(CURRENT_FILE)) return null;
    const version = fs.readFileSync(CURRENT_FILE, 'utf8').trim();
    const bundlePath = path.join(BUNDLES_DIR, `v${version}`);
    if (fs.existsSync(path.join(bundlePath, 'index.html'))) {
      return bundlePath;
    }
  } catch (e) {
    console.error('[Updater] Error reading current bundle:', e.message);
  }
  return null;
}

/**
 * Fetch the remote APP_VERSION from timetested.bible/version.js.
 * The file contains: const APP_VERSION = 1234567890;
 */
async function fetchRemoteVersion() {
  return new Promise((resolve) => {
    const request = net.request(VERSION_URL);
    let body = '';
    request.on('response', (response) => {
      if (response.statusCode !== 200) return resolve(null);
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        const match = body.match(/APP_VERSION\s*=\s*(\d+)/);
        resolve(match ? parseInt(match[1], 10) : null);
      });
    });
    request.on('error', () => resolve(null));
    request.end();
  });
}

/**
 * Get the local APP_VERSION from the currently served bundle.
 */
function getLocalVersion(appPath) {
  try {
    const versionFile = path.join(appPath, 'version.js');
    if (!fs.existsSync(versionFile)) return null;
    const content = fs.readFileSync(versionFile, 'utf8');
    const match = content.match(/APP_VERSION\s*=\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Download a file using Electron's net module.
 * @returns {Promise<Buffer>}
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    const chunks = [];
    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    request.on('error', reject);
    request.end();
  });
}

/**
 * Extract a .tar.gz buffer to a directory using the system tar command.
 * tar is available on macOS, Linux, and Windows 10+ (bsdtar).
 */
function extractTarGz(tarGzPath, destDir) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(destDir, { recursive: true });
    execFile('tar', ['xzf', tarGzPath, '-C', destDir], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Download and extract the site bundle.
 */
async function downloadBundle(version) {
  const destDir = path.join(BUNDLES_DIR, `v${version}`);
  const tempTar = path.join(BUNDLES_DIR, 'download.tar.gz');
  const tempDir = path.join(BUNDLES_DIR, 'downloading');

  try {
    fs.mkdirSync(BUNDLES_DIR, { recursive: true });

    // Clean up any previous failed attempts
    for (const p of [tempTar, tempDir]) {
      if (fs.existsSync(p)) fs.rmSync(p, { recursive: true });
    }

    console.log(`[Updater] Downloading site bundle v${version}...`);

    const buffer = await downloadFile(BUNDLE_URL);
    fs.writeFileSync(tempTar, buffer);

    console.log(`[Updater] Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB, extracting...`);

    await extractTarGz(tempTar, tempDir);

    // Verify the download
    if (!fs.existsSync(path.join(tempDir, 'index.html'))) {
      throw new Error('Downloaded bundle missing index.html');
    }

    // Atomic swap: rename temp to versioned dir
    if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
    fs.renameSync(tempDir, destDir);

    // Update the current version marker
    fs.writeFileSync(CURRENT_FILE, String(version));
    console.log(`[Updater] Installed site bundle v${version}`);

    fs.unlinkSync(tempTar);

    return true;
  } catch (e) {
    console.error('[Updater] Download failed:', e.message);
    for (const p of [tempTar, tempDir]) {
      try { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true }); } catch (_) {}
    }
    return false;
  }
}

// All downloaded bundles are kept — user can switch between them in Settings.

/**
 * Revert to the bundled version (delete current-version marker).
 * On next launch, getAppPath() falls through to the shipped bundle.
 */
function revertToBuiltin() {
  try {
    if (fs.existsSync(CURRENT_FILE)) fs.unlinkSync(CURRENT_FILE);
    console.log('[Updater] Reverted to built-in bundle');
    return true;
  } catch (e) {
    console.error('[Updater] Revert failed:', e.message);
    return false;
  }
}

/**
 * List available bundle versions (downloaded + built-in).
 * @param {string} builtinPath - path to the shipped bundle
 * @returns {{ version: number, path: string, active: boolean, builtin: boolean }[]}
 */
function listBundles(builtinPath) {
  const bundles = [];
  const activeVersion = (() => {
    try {
      if (fs.existsSync(CURRENT_FILE)) return fs.readFileSync(CURRENT_FILE, 'utf8').trim();
    } catch (e) {}
    return null;
  })();

  // Built-in bundle
  const builtinVersion = getLocalVersion(builtinPath);
  if (builtinVersion) {
    bundles.push({
      version: builtinVersion,
      path: builtinPath,
      active: !activeVersion,
      builtin: true
    });
  }

  // Downloaded bundles
  try {
    if (fs.existsSync(BUNDLES_DIR)) {
      for (const entry of fs.readdirSync(BUNDLES_DIR)) {
        if (!entry.startsWith('v')) continue;
        const fullPath = path.join(BUNDLES_DIR, entry);
        if (!fs.statSync(fullPath).isDirectory()) continue;
        const ver = getLocalVersion(fullPath);
        if (ver) {
          bundles.push({
            version: ver,
            path: fullPath,
            active: activeVersion === String(ver),
            builtin: false
          });
        }
      }
    }
  } catch (e) {}

  return bundles.sort((a, b) => b.version - a.version);
}

/**
 * Switch to a specific downloaded bundle version.
 * @param {number} version
 * @returns {boolean}
 */
function switchToVersion(version) {
  const bundlePath = path.join(BUNDLES_DIR, `v${version}`);
  if (!fs.existsSync(path.join(bundlePath, 'index.html'))) return false;
  try {
    fs.mkdirSync(BUNDLES_DIR, { recursive: true });
    fs.writeFileSync(CURRENT_FILE, String(version));
    console.log(`[Updater] Switched to bundle v${version}`);
    return true;
  } catch (e) {
    console.error('[Updater] Switch failed:', e.message);
    return false;
  }
}

/**
 * Check for updates and download if available. Non-blocking — runs in background.
 * @param {string} appPath - current site bundle path being served
 * @param {function} onUpdateReady - callback(newVersion) when download completes
 */
async function checkForUpdates(appPath, onUpdateReady) {
  try {
    const localVersion = getLocalVersion(appPath);
    if (!localVersion) {
      console.log('[Updater] Could not determine local version, skipping');
      return;
    }

    console.log(`[Updater] Local: ${localVersion}`);
    const remoteVersion = await fetchRemoteVersion();
    if (!remoteVersion) {
      console.log('[Updater] Could not fetch remote version (offline?)');
      return;
    }

    console.log(`[Updater] Remote: ${remoteVersion}`);
    if (remoteVersion <= localVersion) {
      console.log('[Updater] Up to date');
      return;
    }

    console.log(`[Updater] Update available: ${localVersion} → ${remoteVersion}`);
    const ok = await downloadBundle(remoteVersion);
    if (ok && onUpdateReady) onUpdateReady(remoteVersion);
  } catch (e) {
    console.error('[Updater] Check failed:', e.message);
  }
}

module.exports = {
  getUpdatedBundlePath, checkForUpdates, getLocalVersion,
  revertToBuiltin, listBundles, switchToVersion
};
