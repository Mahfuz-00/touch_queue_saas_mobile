module.exports = {
  presets: [['module:@react-native/babel-preset', { jsxImportSource: 'nativewind' }]],
  plugins: [
    'nativewind/babel',
    ['module-resolver', { root: ['./'], alias: { '@': './src' } }],
  ],
};
