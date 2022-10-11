const path = require("path");
const log = require("debug")("micro-server:config:log");
const error = require("debug")("micro-server:config:error");
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
      log(`loaded ${fileName}`);
    } catch (e) {
      error(`Failed to load ${fileName}`, e.message);
    }
  }

  load(rootDir, configDir, env) {
    env = env ?? "local";
    const runtimeConfig = {
      env,
    };

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
      error(e.message);
    }

    this.#loadEnvFile(rootDir, configDir, "config.default.js");
    this.#loadEnvFile(rootDir, configDir, `config.${env}.js`);

    return this.config;
  }
}

module.exports = MicroConfigLoader;
