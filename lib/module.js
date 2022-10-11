const log = require("debug")("micro-server:module:log");
const error = require("debug")("micro-server:module:error");

const fs = require("fs");
const _ = require("lodash");
const path = require("path");

class MicroModule {
  constructor() {
    this.cache = {};
  }

  #validNameFormat(name) {
    return /^[a-zA-Z0-9]\w{0,49}$/.test(name);
  }

  load(rootDir, servicesDir) {
    const servicesPath = path.join(rootDir, servicesDir);
    const services = fs.readdirSync(servicesPath);

    for (const service of services) {
      if (this.#validNameFormat(service)) {
        const servicePath = path.join(servicesPath, service);
        const logicList = fs.readdirSync(servicePath);
        for (const logic of logicList) {
          const logicName = path.basename(logic, path.extname(logic));
          if (this.#validNameFormat(logicName)) {
            const logicPath = path.join(servicePath, logic);
            _.set(this.cache, [service, logicName], require(logicPath));
          }
        }
      }
    }
  }

  async call(service, logic, func, data) {
    if (![service, logic, func].every(this.#validNameFormat)) {
      throw new Error("invalid call");
    }

    log(`Call ${service}/${logic}/${func}`, data);
    try {
      return _.get(this.cache, [service, logic, func])(data);
    } catch (e) {
      error(e.message);
      throw e;
    }
  }
}

module.exports = MicroModule;
