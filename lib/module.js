const fs = require("fs");
const _ = require("lodash");
const path = require("path");

class MicroModule {
  constructor(microServer) {
    this.microServer = microServer;
    this.cache = {};
  }

  parseInfo(text) {
    const results = /^(_|\$)?([a-zA-Z0-9]\w{0,49})$/.exec(text);
    let info = {};
    if (results?.length === 2) {
      info.name = results[1];
    } else if (results?.length === 3) {
      info.modifier = results[1];
      info.name = results[2];
    } else {
      info = null;
    }
    return info;
  }

  load(rootDir, servicesDir) {
    const servicesPath = path.join(rootDir, servicesDir);
    const services = fs.readdirSync(servicesPath);
    let cache = {};
    for (const serviceDirName of services) {
      const serviceInfo = this.parseInfo(serviceDirName);
      if (serviceInfo && serviceInfo.modifier !== "_") {
        const servicePath = path.join(servicesPath, serviceDirName);
        const logicList = fs.readdirSync(servicePath);
        for (const logicFileName of logicList) {
          const logicName = path.basename(
            logicFileName,
            path.extname(logicFileName)
          );
          const logicInfo = this.parseInfo(logicName);
          if (logicInfo && logicInfo.modifier !== "_") {
            const logicPath = path.join(servicePath, logicFileName);
            try {
              const moduleExports = require(logicPath);
              for (const funcName in moduleExports) {
                const funcInfo = this.parseInfo(funcName);
                const fn = moduleExports[funcName];

                if (funcInfo && funcInfo.modifier !== "_") {
                  console.log(
                    `Loaded ${serviceInfo.name}/${logicInfo.name}/${funcInfo.name}`
                  );
                  _.set(
                    cache,
                    [serviceInfo.name, logicInfo.name, funcInfo.name],
                    {
                      fn,
                      ...funcInfo,
                      service: serviceInfo,
                      logic: logicInfo,
                    }
                  );
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    }

    this.cache = cache;
    return cache;
  }

  async getFunc(service, logic, func) {
    return _.get(this.cache, [service, logic, func]) ?? null;
  }
}

module.exports = MicroModule;
