module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // zustand/middleware использует import.meta — без плагина web-сборка падает.
    plugins: [['babel-plugin-transform-import-meta', { module: 'ES6' }]],
  };
};
