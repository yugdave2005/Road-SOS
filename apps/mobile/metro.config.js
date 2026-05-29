// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow importing .geojson files via require() for bundled POI data
config.resolver.sourceExts.push('geojson');

module.exports = config;
