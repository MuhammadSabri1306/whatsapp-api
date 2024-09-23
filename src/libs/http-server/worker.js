require("module-alias/register");
const { parentPort, workerData } = require("worker_threads");
const globalState = require("@app/global");
const { env } = require("@app/libs/env");
const { usePinoLogger } = require("@app/libs/logger");
const { deserializeHttpReq } = require("./request");
const { ErrorHttp } = require("./exceptions");

console.log(workerData);

(async () => {

    globalState.set("isProdMode", env("APP_MODE") == "production");
    globalState.set("isDevMode", env("APP_MODE") == "development");

    let parentLogger;
    if(workerData.useLogger) {
        parentLogger = usePinoLogger({
            disableConsole: globalState.isProdMode,
            fileBaseName: "http-server"
        });
    } else {
        parentLogger = usePinoLogger({ disableConsole: true });
    }

    globalState.set("logger", {
        httpServer: workerData.queueId ? parentLogger.child({ queueId: workerData.queueId }) : parentLogger
    });
    parentLogger = null;

    try {

        if(typeof workerData.queueId != "string")
            throw new Error("workerData.queueId is not string");
        if(typeof workerData.handlerPath != "string")
            throw new Error("workerData.handlerPath is not string");
        if(typeof workerData.isApiResource != "boolean")
            throw new Error("workerData.isApiResource is not boolean");
        if(!workerData.request)
            throw new Error("workerData.request is empty");

        globalState.logger.httpServer.info({
            msg: "http request handler is started",
            path: workerData.request.path
        });

        const handler = require(workerData.handlerPath);
        const data = await handler({
            isApiResource: workerData.isApiResource,
            request: deserializeHttpReq(workerData.request),
        });

        parentPort.postMessage({ httpCode: 200, data });

    } catch(err) {

        globalState.logger.httpServer.error({ msg: "error thrown in http request handler", err });

        let errHttpCode = 500;
        let errMessage = "internal server error";
        if(err instanceof ErrorHttp) {
            errHttpCode = err.httpCode;
            errMessage = err.message;
        }

        const isApiResource = workerData.isApiResource || false;
        if(isApiResource) {
            parentPort.postMessage({
                httpCode: errHttpCode,
                data: { error: true, code: errHttpCode, message: errMessage }
            });
        } else {
            parentPort.postMessage({ httpCode: errHttpCode, data: errMessage });
        }

    }
})();