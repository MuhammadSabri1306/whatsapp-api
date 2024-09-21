const globalState = require("./global");
const { env } = require("./libs/env");
const { usePinoLogger } = require("./libs/logger");

globalState.set("modes", {
    isProduction: env("APP_MODE") == "production",
    isDevelopment: env("APP_MODE") == "development",
});

// const logger = usePinoLogger({
//     disableConsole: globalState.get().isProduction,
//     fileName: "test"
// });

const logger = usePinoLogger({
    disableConsole: false,
    fileBaseName: "test"
});

logger.info({
    msg: "test logging",
    result: { a: 1, b: 2 }
});
logger.error({ err: new Error("test error"), result: { a: 1, b: 2 } });