const {
  withProjectBuildGradle,
  withAndroidManifest,
  AndroidConfig,
} = require('@expo/config-plugins');

/**
 * Native configuration for `@notifee/react-native` on Android.
 *
 * The native `android/` folder is gitignored and regenerated on every prebuild,
 * so both fixes below are applied as config-plugin mods rather than hand edits.
 *
 * 1. Maven repo: notifee does NOT publish `app.notifee:core` to a public repo —
 *    it ships the AAR inside the npm package. Without this repo the build fails
 *    with "Could not find any matches for app.notifee:core:+".
 *
 * 2. Foreground-service type: notifee's AAR declares its `ForegroundService`
 *    with a fixed `android:foregroundServiceType`. On Android 14+ the type
 *    requested at runtime (microphone for audio calls, + camera for video) must
 *    be a SUBSET of the manifest-declared type, otherwise startForeground
 *    throws IllegalArgumentException and the app crashes. We override the
 *    service's declared type to `microphone|camera` via `tools:replace`.
 */

const NOTIFEE_REPO =
  'maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';

const FOREGROUND_SERVICE_NAME = 'app.notifee.core.ForegroundService';
const FOREGROUND_SERVICE_TYPES = 'microphone|camera';

const withNotifeeRepo = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    const contents = cfg.modResults.contents;
    if (contents.includes('@notifee/react-native/android/libs')) {
      return cfg; // idempotent
    }
    const marker = /allprojects\s*\{\s*repositories\s*\{/;
    if (!marker.test(contents)) {
      throw new Error(
        '[withNotifee] Could not find allprojects.repositories block in android/build.gradle'
      );
    }
    cfg.modResults.contents = contents.replace(
      marker,
      (match) => `${match}\n        ${NOTIFEE_REPO}`
    );
    return cfg;
  });

const withNotifeeForegroundServiceType = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults
    );
    app.service = app.service || [];
    let service = app.service.find(
      (s) => s.$?.['android:name'] === FOREGROUND_SERVICE_NAME
    );
    if (!service) {
      service = { $: { 'android:name': FOREGROUND_SERVICE_NAME } };
      app.service.push(service);
    }
    service.$['android:foregroundServiceType'] = FOREGROUND_SERVICE_TYPES;
    // Override the type declared by notifee's library manifest at merge time.
    service.$['tools:replace'] = 'android:foregroundServiceType';
    return cfg;
  });

module.exports = (config) =>
  withNotifeeForegroundServiceType(withNotifeeRepo(config));
