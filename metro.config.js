const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand отдаёт ESM-сборку с import.meta по условию "import"; берём CJS-вариант, как в aiStella.
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

module.exports = config;
