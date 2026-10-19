const fs = require('fs');
const path = require('path');

console.log('Applying React Native Android patches...');

/*
 * The manual :react-native-nitro-modules Gradle include that used to live here
 * is gone: MMKV was replaced with AsyncStorage, so nothing needs Nitro any more.
 *
 * Remaining patch: react-native-tts still resolves from jcenter(), which is
 * shut down, so point it at mavenCentral.
 */
const ttsBuildPath = path.join(__dirname, '../node_modules/react-native-tts/android/build.gradle');

if (fs.existsSync(ttsBuildPath)) {
  let content = fs.readFileSync(ttsBuildPath, 'utf8');

  if (content.includes('jcenter()')) {
    content = content.replace(/jcenter\(\)/g, 'mavenCentral()');
    fs.writeFileSync(ttsBuildPath, content, 'utf8');
    console.log('Patched react-native-tts build.gradle (jcenter -> mavenCentral)');
  }
}

console.log('Patches applied.');
