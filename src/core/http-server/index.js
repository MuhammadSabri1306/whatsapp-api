const path = require("path");
const { Worker, isMainThread } = require("worker_threads");
const express = require("express");
const globalState = require("@app/global");
const { usePinoLogger } = require("@app/libs/logger");
const { WhatsappAction } = require("@app/libs/whatsapp");
const { serializeHttpReq } = require("./request");
const { ErrorHttp, ErrorRequestTimeout, ErrorWorkerExit } = require("./exceptions");

module.exports.config = {
    baseUrl: "/",
    defaultPort: 3000,
};

const httpServiceLogger = () => {
    return globalState.findOrInit("logger.httpService", () => usePinoLogger({ disableConsole: true }));
};

const workerWrapperPath = path.resolve(__dirname, "./worker.js");
const handlerDir = path.resolve(__dirname, "../../http/");
const WorkerManager = {

    maxWorkers: 10,
    currWorker: 0,
    taskQueue: [],
    timeoutMs: 10000,
    useLogger: false,

    createQueueId() {
        const queueCount = this.taskQueue.length;
        const dateTime = Date.now();
        return `q${ queueCount }.${ dateTime }`;
    },

    addTask(handlerPath, req) {
        const queueId = this.createQueueId();
        const useLogger = this.useLogger;
        const workerData = {
            queueId,
            useLogger,
            isApiResource: req.isApiRoute,
            handlerPath: path.join(handlerDir, handlerPath),
            request: serializeHttpReq(req),
        };

        return new Promise((resolve, reject) => {
            this.taskQueue.push({ workerData, resolve, reject });
            this.runNext();
        });
    },

    runNext() {
        if(this.currWorker >= this.maxWorkers || this.taskQueue.length < 1)
            return;
        const { workerData, resolve, reject } = this.taskQueue.shift();
        const { isApiResource } = workerData;
        this.currWorker++;

        const timeoutPromise = new Promise((_, rejectTimeout) => {
            return setTimeout(
                () => rejectTimeout(new ErrorRequestTimeout("request timeout")),
                this.timeoutMs
            );
        });

        const worker = new Worker(workerWrapperPath, { workerData });
        const workerPromise = new Promise((resolveWorker, rejectWorker) => {

            worker.on("message", async (data) => {
                try {
                    if(appHooks.onBeforeRouteHandled)
                        data = await appHooks.onBeforeRouteHandled(data);
                    resolveWorker(data);
                } catch(err) {
                    rejectWorker(err);
                }
            });

            worker.on("error", err => rejectWorker(err));
            worker.on("exit", exitCode => {
                if(exitCode !== 0)
                    rejectWorker(new ErrorWorkerExit(`worker stopped with exit code ${ exitCode }`));
            });

        });

        Promise.race([ workerPromise, timeoutPromise ])
            .then(data => {
                resolve({ httpCode: 200, data });
                this.currWorker--;
                this.runNext();
            })
            .catch(err => {
                worker.terminate();
                if(err instanceof ErrorHttp) {

                    if(isApiResource)
                        resolve( err.toHttpApiResponse() );
                    else
                        resolve( err.toHttpResponse() );

                } else if(err instanceof ErrorWorkerExit) {
                    throw err;
                } else {

                    httpServiceLogger().error({ msg: "error thrown in http request handler", err });
                    const errServer = new ErrorHttp(500, "internal server error");
                    if(isApiResource)
                        resolve( errServer.toHttpApiResponse() );
                    else
                        resolve( errServer.toHttpResponse() );

                }
                this.currWorker--;
                this.runNext();
            });
    },

};

let app = null;
const appHooks = {};
module.exports.defineApp = (setup, { logger }) => {
    if(typeof setup != "function")
        throw new Error("setup is not function(app)");

    if(logger) {
        globalState.set("logger.httpService", logger);
        WorkerManager.useLogger = true;
    }

    app = express();
    const waApiRouter = express.Router();
    waApiRouter.use((req, res, next) => {
        req.routerType = "waApiRouter";
        req.isApiRoute = true;
        req.isWaApiRoute = true;
        next();
    });

    const apiRouter = express.Router();
    apiRouter.use((req, res, next) => {
        req.routerType = "apiRouter";
        req.isApiRoute = true;
        req.isWaApiRoute = false;
        next();
    });

    const webRouter = express.Router();
    webRouter.use((req, res, next) => {
        req.routerType = "webRouter";
        req.isApiRoute = false;
        req.isWaApiRoute = false;
        next();
    });

    setup({
        web: webRouter,
        api: apiRouter,
        waApi: waApiRouter,
    });

    const waBotToken = globalState.find("waBotToken", "");
    apiRouter.use(`/wabot${ waBotToken }`, waApiRouter);
    apiRouter.use((req, res) => {
        res.status(404).json({
            error: true,
            code: 404,
            message: "API resource not found",
        });
    });

    webRouter.use("/api", apiRouter);
    app.use(this.config.baseUrl, webRouter);
    app.use((req, res) => {
        res.status(404).send("404 Not Found");
    });
};

module.exports.handleRequest = (handlerPath) => {
    if(!app) throw new Error("app is not initialized yet");
    if(typeof handlerPath != "string")
        throw new Error("handlerPath is not string");
    return (req, res, next) => {
        WorkerManager.addTask(handlerPath, req)
            .then(async (response) => {
                const { isApiResource, httpCode, data } = response;
                if(isApiResource)
                    res.status(httpCode).json(data);
                else
                    res.status(httpCode).send(data);
                if(appHooks.onRouteHandled) {
                    appHooks.onRouteHandled(response)
                        .then(() => null)
                        .catch(err => httpServiceLogger().error(err));
                }
            })
            .catch(err => {
                httpServiceLogger().error(err);
                next(err);
            });
    };
};

module.exports.serveApp = ({ port, hooks, logger } = {}) => {
    if(!app) throw new Error("app is not initialized yet");
    if(port && typeof port != "number")
        throw new Error("config.port is not number");
    if(!hooks)
        hooks = {};

    if(hooks.onBeforeRouteHandled) {
        if(typeof hooks.onBeforeRouteHandled != "function")
            throw new Error("config.hooks.onBeforeRouteHandled is not function");
        appHooks.onBeforeRouteHandled = hooks.onBeforeRouteHandled;
    }

    if(hooks.onRouteHandled) {
        if(typeof hooks.onRouteHandled != "function")
            throw new Error("config.hooks.onRouteHandled is not function");
        appHooks.onRouteHandled = hooks.onRouteHandled;
    }

    if(!port)
        port = this.config.defaultPort;
    app.listen(port, () => {
        httpServiceLogger().info({
            msg: "web server is running",
            url: `http://localhost:${ port }/`
        });
    });
};