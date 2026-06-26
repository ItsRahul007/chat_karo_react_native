const { withDangerousMod, withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Keeps a fixed debug keystore + signing credentials across `expo prebuild`.
 *
 * The native `android/` folder is gitignored and regenerated on every prebuild,
 * which would otherwise hand us a fresh, random debug keystore. We need THIS
 * keystore specifically because its SHA-1 is registered in google-services.json
 * for Google Sign-In / Firebase — a new key would break auth.
 *
 * The keystore lives in `keystores/debug.keystore` (committed) and is the source
 * of truth. This plugin copies it into the generated project and rewrites the
 * `signingConfigs.debug` block to use it.
 */

const KEYSTORE_SOURCE = 'keystores/debug.keystore';
const KEYSTORE_NAME = 'debug.keystore';

// Read from the (gitignored) .env.local. Expo CLI loads .env files into
// process.env before running prebuild, so these are available here.
const STORE_PASSWORD = process.env.ANDROID_KEYSTORE_PASSWORD;
const KEY_ALIAS = process.env.ANDROID_KEY_ALIAS;
const KEY_PASSWORD = process.env.ANDROID_KEY_PASSWORD;

// Copy keystores/debug.keystore -> android/app/debug.keystore during prebuild.
const withKeystoreFile = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, KEYSTORE_SOURCE);
      const dest = path.join(cfg.modRequest.platformProjectRoot, 'app', KEYSTORE_NAME);
      if (!fs.existsSync(src)) {
        throw new Error(`[withDebugKeystore] Missing keystore at ${KEYSTORE_SOURCE}`);
      }
      fs.copyFileSync(src, dest);
      return cfg;
    },
  ]);

// Rewrite the signingConfigs.debug block in app/build.gradle.
const withSigningCredentials = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (!STORE_PASSWORD || !KEY_ALIAS || !KEY_PASSWORD) {
      throw new Error(
        '[withDebugKeystore] Missing keystore credentials. Set ' +
          'ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, and ' +
          'ANDROID_KEY_PASSWORD in .env.local (see example.env).'
      );
    }
    const debugBlock = `debug {
            storeFile file('${KEYSTORE_NAME}')
            storePassword '${STORE_PASSWORD}'
            keyAlias '${KEY_ALIAS}'
            keyPassword '${KEY_PASSWORD}'
        }`;
    // Match the `debug { ... storeFile ... }` signing block (no nested braces),
    // so we don't touch the `buildTypes { debug { ... } }` block.
    const pattern = /debug\s*\{[^}]*storeFile[^}]*\}/;
    if (!pattern.test(cfg.modResults.contents)) {
      throw new Error('[withDebugKeystore] Could not find signingConfigs.debug block to patch');
    }
    cfg.modResults.contents = cfg.modResults.contents.replace(pattern, debugBlock);
    return cfg;
  });

module.exports = (config) => withSigningCredentials(withKeystoreFile(config));
