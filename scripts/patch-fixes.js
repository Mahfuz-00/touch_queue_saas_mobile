const fs = require('fs');
const path = require('path');

console.log('Running automated patches for React Native Android build...');

// 1. Patch android/settings.gradle for react-native-nitro-modules
const settingsPath = path.join(__dirname, '../android/settings.gradle');
if (fs.existsSync(settingsPath)) {
    let content = fs.readFileSync(settingsPath, 'utf8');
    const nitroInclude = "include(':react-native-nitro-modules')";
    if (!content.includes(nitroInclude)) {
        content += `\ninclude(':react-native-nitro-modules')\nproject(':react-native-nitro-modules').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-nitro-modules/android')\n`;
        fs.writeFileSync(settingsPath, content, 'utf8');
        console.log('✔ Patched android/settings.gradle (Added nitro-modules)');
    }
}

// 2. Patch react-native-tts jcenter() -> mavenCentral()
const ttsBuildPath = path.join(__dirname, '../node_modules/react-native-tts/android/build.gradle');
if (fs.existsSync(ttsBuildPath)) {
    let content = fs.readFileSync(ttsBuildPath, 'utf8');
    if (content.includes('jcenter()')) {
        content = content.replace(/jcenter\(\)/g, 'mavenCentral()');
        fs.writeFileSync(ttsBuildPath, content, 'utf8');
        console.log('✔ Patched react-native-tts build.gradle (Replaced jcenter with mavenCentral)');
    }
}

console.log('All patches applied successfully!');