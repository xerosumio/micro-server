const path = require("path");
const MicroConfigLoader = require("../lib/config");
describe("config", function () {
  test("empty", () => {
    const microConfigLoader = new MicroConfigLoader();
    const rootDir = path.join(__dirname, "config");
    const configDir = "./empty";
    const config = microConfigLoader.load(rootDir, configDir);
    expect(config.env).toBe("local");
  });

  test("config.js", () => {
    const microConfigLoader = new MicroConfigLoader();
    const rootDir = path.join(__dirname, "config");
    const configDir = "./config";
    const config = microConfigLoader.load(rootDir, configDir, "prod");

    expect(config.env).toBe("prod");
    expect(config.config).toBeTruthy();
    expect(config.local).toBeFalsy();
    expect(config.default).toBeFalsy();
  });

  test("default config", () => {
    const microConfigLoader = new MicroConfigLoader();
    const rootDir = path.join(__dirname, "config");
    const configDir = "./default";
    const config = microConfigLoader.load(rootDir, configDir);

    expect(config.env).toBe("local");
    expect(config.default).toBeTruthy();
    expect(config.local).toBeFalsy();
  });

  test("local config", () => {
    const microConfigLoader = new MicroConfigLoader();
    const rootDir = path.join(__dirname, "config");
    const configDir = "./local";
    const config = microConfigLoader.load(rootDir, configDir);

    expect(config.env).toBe("local");
    expect(config.default).toBeTruthy();
    expect(config.local).toBeTruthy();
    expect(config.mongo).toBe("local");
  });
});
