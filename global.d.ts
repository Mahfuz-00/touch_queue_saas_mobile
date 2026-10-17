/**
 * Ambient declarations the Expo/React Native types do not ship themselves.
 *
 * Metro turns `import './global.css'` into a stylesheet registry entry at build
 * time; TypeScript still needs to know the module exists.
 */
declare module '*.css';
