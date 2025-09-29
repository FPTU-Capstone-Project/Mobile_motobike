const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .jsx files
config.resolver.sourceExts.push('jsx');

module.exports = config;
