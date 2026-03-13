module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.optimization.concatenateModules = false;
      return webpackConfig;
    },
  },
};
