const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const multer = require("@koa/multer");
const serve = require("koa-static");
const SocketIO = require("socket.io");
const _ = require("lodash");
const Joi = require("joi");
const sse = require("koa-sse-stream");

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
        ws: {
          cors: {
            origin: "*",
          },
        },
      },
      sse: {
        enabled: false,
        filePath: "./sse",
      },
      restriction: {
        token: null,
      },
    };

    this.helper = {};

    this.app = null;
  }

  #loadConfig(config) {
    const projectDir = config.projectDir ?? this.defaultConfig.projectDir;
    require("dotenv").config({
      path: projectDir,
    });
    const configDir = config.configDir ?? this.defaultConfig.configDir;
    const loadedConfig = this.microConfig.load(projectDir, configDir, {
      env: config.env ?? process.env.SERVER_ENV,
      projectDir,
      configDir,
    });

    this.config = _.merge({}, this.defaultConfig, loadedConfig);
  }

  #loadModules() {
    this.microModule.load(
      path.join(this.config.projectDir, this.config.servicesDir)
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
      // ...(_.isPlainObject(ctx.request.body) ? ctx.request.body:{}),
      ...(_.isPlainObject(ctx.request.body.data) ? ctx.request.body.data : {}),
      ...(ctx.request.files ? { _files: ctx.request.files } : null),
    };

    if (ctx.request.files) {
      reqData._files = ctx.request.files;
    }

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
    console.log("loaded config", this.config);
    this.#loadModules(config);
    this.#startHttpServer();
    if (this.config.sio.enabled) {
      this.#startSocketIO();
    }
  }

  async #verifyCallRequest(service, logic, func) {
    if (
      ![service, logic, func].every((name) =>
        /^[a-zA-Z0-9]\w{0,49}$/.test(name)
      )
    ) {
      throw new Error("Invalid request");
    }
  }

  async #callFunc(service, logic, func, reqBody) {
    // console.log(`service: ${service}, logic: ${logic}, func: ${func}, reqBody: ${JSON.stringify(reqBody)}`);
    const funcInfo = await this.microModule.getFunc(service, logic, func, {
      ...reqBody,
      from: "api",
    });

    // console.log('funcInfo: ', funcInfo);

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

    return result;
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
        serve(path.join(this.config.projectDir, this.config.static.dirName),this.config.static?.opts??{})
      );
    }

    app.use(cors());
    app.use(bodyParser({ ...this.config.upload.bodyParser }));

    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (e) {
        console.error(e.message, e.stack);
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
        await this.#verifyCallRequest(service, logic, func);
        const reqBody = this.#getReqBody(ctx);

        const result = await this.#callFunc(service, logic, func, {
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

    if (this.config.sse.enabled) {
      // append config to sse middleware
      app.use(sse({ ...this.config.sse.config }));
      // direct inject the sse middleware to use the function handler directly
      app.use(
        require(path.join(this.config.projectDir, this.config.sse.filePath))
      );
    }

    httpServer.listen(this.config.port);

    console.log(`listening server on port: ${this.config.port}`);

    this.#httpServer = httpServer;
  }

  #startSocketIO() {
    const io = SocketIO(this.#httpServer, { ...this.config.sio.ws });

    try {
      require(path.join(this.config.projectDir, this.config.sio.filePath))(io);
    } catch (e) {
      console.log('cannot load socket.io');
    }

    io.on("connection", (socket) => {
      socket.on("call", async (data, callback) => {
        try {
          const reqBody = {
            token: data?.token ?? null,
            accessKey: data?.accessKey ?? null,
            signature: data?.signature ?? null,
            data: data?.data ?? {},
          };

          const [service, logic, func] = data.path.split("/");

          await this.#verifyCallRequest(service, logic, func);

          const result = await this.#callFunc(service, logic, func, {
            ...reqBody,
            from: "socketio",
          });

          if (typeof result === "function") {
            return result(socket);
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
