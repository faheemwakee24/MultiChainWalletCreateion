const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    extraNodeModules: {
      stream: require.resolve('stream-browserify'), 
      buffer: require.resolve('buffer'),          
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);