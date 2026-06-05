module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@clinical': '../lib/clinical',
          },
        },
      ],
      '@babel/plugin-transform-dynamic-import',
      'react-native-reanimated/plugin',
    ],
  };
};
