require("module-alias/register");
const { parentPort, workerData, threadId } = require("worker_threads");
const globalState = require("@app/global");
const { env } = require("@app/core/env");
const { usePinoLogger } = require("@app/core/logger");
const { deserializeHttpReq } = require("./request");
const { ErrorHttp } = require("./exceptions");

(async () => {

    globalState.set("isProdMode", env("APP_MODE") == "production");
    globalState.set("isDevMode", env("APP_MODE") == "development");
    globalState.set("worker.useLogger", workerData.useLogger || false);

    const useWorkerLogger = (fileBaseName) => {
        const useLogger = () => {
            if(!workerData.useLogger)
                parentLogger = usePinoLogger({ disableConsole: true });
            return usePinoLogger({ disableConsole: globalState.isProdMode, fileBaseName });
        };
        if(workerData.queueId)
            return useLogger().child({ queueId: workerData.queueId });
        if(threadId)
            return useLogger().child({ threadId });
        return useLogger();
    };

    globalState.set("logger.program", useWorkerLogger("server"));
    globalState.set("logger.httpService", useWorkerLogger("http-service"));

    try {

        if(typeof workerData.queueId != "string")
            throw new Error("workerData.queueId is not string");
        if(typeof workerData.handlerPath != "string")
            throw new Error("workerData.handlerPath is not string");
        if(typeof workerData.isApiResource != "boolean")
            throw new Error("workerData.isApiResource is not boolean");
        if(!workerData.request)
            throw new Error("workerData.request is empty");

        globalState.logger.httpService.info({
            msg: "http request handler is started",
            path: workerData.request.path
        });

        const handler = require(workerData.handlerPath);
        const data = await handler({
            isApiResource: workerData.isApiResource,
            request: deserializeHttpReq(workerData.request),
        });

        parentPort.postMessage(data);

    } catch(err) {
        globalState.logger.httpService.error({ msg: "error thrown in http request handler", err });
        throw err;
    }
})();