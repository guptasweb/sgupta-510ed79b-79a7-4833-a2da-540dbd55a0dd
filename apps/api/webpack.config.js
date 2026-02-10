const { composePlugins, withNx } = require('@nx/webpack');
const path = require('path');

module.exports = composePlugins(withNx(), (config) => {
  // Ensure output paths are absolute to handle spaces in directory names
  if (config.output && config.output.path) {
    config.output.path = path.resolve(config.output.path);
  }
  return config;
});
