// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // If you installed react-native-reanimated, keep this as the LAST plugin:
    // plugins: ['react-native-reanimated/plugin'],
  };
};
