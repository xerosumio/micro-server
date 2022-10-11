const path = require("path");
const MicroModule = require("../lib/module");

describe("module", function () {
  test("Calling with the wrong format should throw an error", async () => {
    const rootDir = path.join(__dirname, "module");
    const servicesDir = "./standard";
    const microModule = new MicroModule();
    microModule.load(rootDir, servicesDir);

    const callList = [
      ["_auth", "user", "list"],
      ["auth", "_user", "list"],
      ["auth", "user", "_list"],
    ];

    for (const callPath of callList) {
      await expect(microModule.call(...callPath)).rejects.toThrow();
    }
  });

  test("Calling the correct path executes successfully", async () => {
    const rootDir = path.join(__dirname, "module");
    const servicesDir = "./standard";
    const microModule = new MicroModule();
    microModule.load(rootDir, servicesDir);

    await expect(
      microModule.call("auth", "user", "list", {
        data: { from: "test" },
      })
    ).resolves.toStrictEqual({
      from: "test",
      data: [
        {
          name: "jason",
        },
      ],
    });
  });
});
