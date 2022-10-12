const path = require("path");
const MicroModule = require("../lib/module");

describe("module", function () {
  test("load ok", () => {
    const rootDir = path.join(__dirname, "module");
    const servicesDir = "./load";
    const microModule = new MicroModule();
    const cache = microModule.load(rootDir, servicesDir);

    expect(typeof cache.pp).toBe("object");
    expect(typeof cache.pp.index).toBe("object");
    expect(typeof cache.pp.index.test).toBe("object");
  });

  test("parseInfo _", () => {
    const microModule = new MicroModule();
    const info = microModule.parseInfo("_hello");
    expect(info.modifier).toBe("_");
    expect(info.name).toBe("hello");
  });

  test("parseInfo $", () => {
    const microModule = new MicroModule();
    const info = microModule.parseInfo("$hello");
    expect(info.modifier).toBe("$");
    expect(info.name).toBe("hello");
  });

  test("parseInfo error", () => {
    const microModule = new MicroModule();
    const info = microModule.parseInfo("+heeeello");
    expect(info).toBe(null);
  });

  test("getFunc ok", async () => {
    const rootDir = path.join(__dirname, "module");
    const servicesDir = "./standard";
    const microModule = new MicroModule();
    microModule.load(rootDir, servicesDir);

    const funcInfo = await microModule.getFunc("auth", "user", "list", {
      data: { from: "test" },
    });

    expect(funcInfo.name).toBe("list");
    expect(typeof funcInfo.fn).toBe("function");
    expect(funcInfo.service.name).toBe("auth");
    expect(funcInfo.logic.name).toBe("user");
  });

  test("getFunc error", async () => {
    const rootDir = path.join(__dirname, "module");
    const servicesDir = "./standard";
    const microModule = new MicroModule();
    microModule.load(rootDir, servicesDir);

    const funcInfo = await microModule.getFunc("auth1", "user", "list", {
      data: { from: "test" },
    });

    expect(funcInfo).toBeNull();
  });
});
