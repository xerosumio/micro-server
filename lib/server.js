const path = require("path");
const Koa = require("koa");
const log = require("debug")("micro-server:log");
const error = require("debug")("micro-server:error");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const multer = require("@koa/multer");
const serve = require("koa-static");
const SocketIO = require("socket.io");
const _ = require("lodash");
const Joi = require("joi");

const MicroModule = require("./module");
const MicroConfigLoader = require("./config");
const MicroHelper = require("./helper");

class MicroServer {
  #httpServer = null;
  constructor() {
    this.microModule = new MicroModule(this);
    this.microConfig = new MicroConfigLoader();

    this.defaultConfig = {
      port: 8080,
      projectDir: process.cwd(),
      configDir: "./config",
      servicesDir: "./services",
      allowHeaders: ["token", "accessKey", "signature"],
      upload: {
        enabled: true,
      },
      static: {
        enabled: true,
        dirName: "client",
      },
      sio: {
        enabled: true,
        filePath: "./socket.io",
      },
      restriction: {
        token: null,
      },
    };

    this.helper = {};

    this.app = null;
  }

  #loadConfig(config) {
    const loadedConfig = this.microConfig.load(
      config.projectDir ?? this.defaultConfig.projectDir,
      config.configDir ?? this.defaultConfig.configDir,
      config.env
    );
    require("dotenv").config({
      path: loadedConfig.projectDir,
    });
    this.config = _.merge({}, this.defaultConfig, loadedConfig);
  }

  #loadModules(config) {
    this.microModule.load(
      config.projectDir ?? this.defaultConfig.projectDir,
      config.servicesDir ?? this.defaultConfig.servicesDir
    );
  }

  #loadHelper() {
    this.helper = MicroHelper(this);
  }

  #getReqBody(ctx) {
    let reqHeader = _.pick(ctx.query, this.config.allowHeaders);
    let reqData = _.omit(ctx.query, this.config.allowHeaders);

    reqData = {
      ...reqData,
      ...(_.isPlainObject(ctx.request.body.data) ? ctx.request.body.data : {}),
    };

    reqHeader = {
      ...reqHeader,
      ..._.pick(ctx.request.body, this.config.allowHeaders),
    };
    return {
      ...reqHeader,
      data: reqData,
    };
  }

  start(config = {}) {
    this.#loadConfig(config);
    this.#loadHelper();
    log("loaded config", this.config);
    this.#loadModules(config);
    this.#startHttpServer();
    if (this.config.sio.enabled) {
      this.#startSocketIO();
    }
  }

  #startHttpServer() {
    let multerMiddleware;
    const app = (this.app = new Koa());
    const httpServer = require("http").createServer(app.callback());
    const router = new Router();

    if (this.config.upload.enabled) {
      multerMiddleware = multer({
        ...this.config.upload.multer,
      });
    }

    if (this.config.static.enabled) {
      app.use(
        serve(path.join(this.config.projectDir, this.config.static.dirName))
      );
    }

    app.use(cors());
    app.use(bodyParser());

    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (e) {
        error(e.message, e.stack);
        if (e instanceof Joi.ValidationError) {
          ctx.body = {
            success: false,
            data: {
              code: 400,
              message: "Bad request",
              details: e.details,
            },
          };
        }
        ctx.body = {
          success: false,
          data: {
            code: e.code ?? 500,
            message: e.message,
            ...(e.details ? { details: e.details } : {}),
          },
        };
      }
    });

    router.all(
      "/:service/:logic/:func",
      async (ctx, next) => {
        if (this.config.upload.enabled) {
          return multerMiddleware.array("files")(ctx, next);
        }
        return next();
      },
      async (ctx) => {
        const { service, logic, func } = ctx.params;
        if (
          ![service, logic, func].every((name) =>
            /^[a-zA-Z]\w{0,49}$/.test(name)
          )
        ) {
          throw new Error("Invalid request");
        }
        const reqBody = this.#getReqBody(ctx);

        const funcInfo = await this.microModule.getFunc(service, logic, func, {
          ...reqBody,
          from: "api",
        });

        if (!funcInfo) {
          throw new Error("Cannot found this function");
        }

        if (
          this.config.restriction.token != null &&
          [
            funcInfo.modifier,
            funcInfo.service.modifier,
            funcInfo.logic.modifier,
          ].some((d) => d === "$")
        ) {
          if (this.config.restriction.token !== reqBody.token) {
            throw new Error("Invalid token");
          }
        }

        const result = await funcInfo.fn({
          ...reqBody,
          from: "api",
        });

        if (typeof result === "function") {
          return await result(ctx);
        }

        ctx.body = {
          success: true,
          data: result ?? {},
        };
      }
    );

    app.use(router.routes()).use(router.allowedMethods());

    httpServer.listen(this.config.port);

    log(`listening server on port: ${this.config.port}`);

    this.#httpServer = httpServer;
  }

  #startSocketIO() {
    const io = SocketIO(this.#httpServer);

    try {
      require(path.join(this.config.projectDir, this.config.sio.filePath))(io);
    } catch (e) {}

    io.on("connection", (socket) => {
      socket.on("call", async (data, callback) => {
        try {
          const reqBody = {
            token: data?.token ?? null,
            accessKey: data?.accessKey ?? null,
            signature: data?.signature ?? null,
            data: data?.data ?? {},
          };
          const result = await this.microModule.call(
            ...data.path.split("/"),
            reqBody
          );
          if (typeof result === "function") {
            return await result(socket);
          }
          // eslint-disable-next-line node/no-callback-literal
          callback?.({
            success: true,
            data: {
              ...result,
            },
          });
        } catch (e) {
          // eslint-disable-next-line node/no-callback-literal
          callback?.({
            success: false,
            data: {
              message: e.message,
            },
          });
        }
      });
    });
  }
}

module.exports = MicroServer;
