const path = require("path");
const fs = require("fs");
const _ = require("lodash");

class MicroConfigLoader {
  constructor(config) {
    this.config = {};
  }

  #loadEnvFile(rootDir, configDir, fileName) {
    try {
      const getConfig = require(path.join(rootDir, configDir, fileName));
      _.merge(this.config, getConfig(this.config));
      console.log(`loaded ${fileName}`);
    } catch (e) {
      console.error(`Failed to load ${fileName}`, e.message);
    }
  }

  load(rootDir, configDir, runtimeConfig = {}) {
    _.merge(this.config, {
      ...runtimeConfig,
    });

    try {
      const configStat = fs.statSync(path.join(rootDir, `${configDir}.js`));
      if (configStat.isFile()) {
        this.#loadEnvFile(rootDir, "", `${configDir}.js`);
        return this.config;
      }
    } catch (e) {
      console.error(e.message);
    }

    this.#loadEnvFile(rootDir, configDir, "config.default.js");
    if (this.config.env) {
      this.#loadEnvFile(rootDir, configDir, `config.${env}.js`);
    }

    return this.config;
  }
}

module.exports = MicroConfigLoader;
