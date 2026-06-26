/**
 * Unified desktop bridge — one API surface over Electron AND Tauri (and plain web).
 *
 * The web app talks to whatever shell it's running in through `window.Native`, so we
 * can ship a tiny Tauri build for most platforms and an Electron build as the
 * compatibility fallback (older Linux / pre-WebView2 Windows) without changing app code.
 *
 *   window.Native = {
 *     kind:               'electron' | 'tauri' | 'web',
 *     isDesktop:          boolean,                 // true for electron or tauri
 *     platform:           'darwin' | 'win32' | 'linux' | 'web' | ...,
 *     listBundles():      Promise<Array<{ version, path, active, builtin }>>,
 *     switchToVersion(v): Promise<boolean>,
 *     revertToBuiltin():  Promise<boolean>,
 *     restartApp():       void | Promise<void>,
 *   }
 *
 * Electron exposes window.electronAPI via preload (_dev/desktop/preload.js).
 * Tauri exposes window.__TAURI__ (tauri.conf.json → app.withGlobalTauri: true) and the
 * Rust commands: list_bundles, switch_to_version, revert_to_builtin, restart_app.
 * Both shells therefore present the SAME surface through this bridge.
 */
(function () {
  'use strict';

  // ── Electron ──────────────────────────────────────────────────────────────
  function electronAdapter(api) {
    return {
      kind: 'electron',
      isDesktop: true,
      platform: api.platform || 'unknown',
      listBundles: function () { return Promise.resolve(api.listBundles ? api.listBundles() : []); },
      switchToVersion: function (v) { return Promise.resolve(api.switchToVersion ? api.switchToVersion(v) : false); },
      revertToBuiltin: function () { return Promise.resolve(api.revertToBuiltin ? api.revertToBuiltin() : false); },
      restartApp: function () { if (api.restartApp) api.restartApp(); }
    };
  }

  // ── Tauri (v2) ────────────────────────────────────────────────────────────
  function tauriAdapter(tauri) {
    // withGlobalTauri exposes invoke at __TAURI__.core.invoke (v2) or __TAURI__.invoke (v1).
    var invoke = (tauri.core && tauri.core.invoke) || tauri.invoke;
    return {
      kind: 'tauri',
      isDesktop: true,
      platform: 'unknown', // OS detail is async in Tauri; not needed by the frontend today.
      listBundles: function () { return invoke('list_bundles'); },
      switchToVersion: function (v) { return invoke('switch_to_version', { version: Number(v) }); },
      revertToBuiltin: function () { return invoke('revert_to_builtin'); },
      restartApp: function () { return invoke('restart_app'); }
    };
  }

  // ── Plain web / installed PWA ─────────────────────────────────────────────
  function webAdapter() {
    return {
      kind: 'web',
      isDesktop: false,
      platform: 'web',
      listBundles: function () { return Promise.resolve([]); },
      switchToVersion: function () { return Promise.resolve(false); },
      revertToBuiltin: function () { return Promise.resolve(false); },
      restartApp: function () {}
    };
  }

  var Native;
  if (window.electronAPI && window.electronAPI.isElectron) {
    Native = electronAdapter(window.electronAPI);
  } else if (window.__TAURI__) {
    Native = tauriAdapter(window.__TAURI__);
  } else {
    Native = webAdapter();
  }

  window.Native = Native;
})();
