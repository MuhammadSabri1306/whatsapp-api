const globalState = require("@app/global");
const { env } = require("@app/libs/env");
const { usePinoLogger } = require("@app/libs/logger");
const { defineApp, handleRequest, serveApp } = require("@app/libs/http-server");

module.exports = () => {

    const waBotToken = env("BOT_API_TOKEN", "");
    globalState.set("waBotToken", waBotToken);

    const logger = usePinoLogger({
        disableConsole: globalState.isProdMode,
        fileBaseName: "http-server"
    });
    globalState.set("logger", { httpServer: logger });

    try {

        defineApp((router) => {

            router.web.get("/", handleRequest("web/index.js"));
            router.waApi.get("/sendMessage", handleRequest("api/whatsapp/send-message.js"));

        });

        serveApp({
            onServed: ({ url }) => {
                logger.info({ msg: "web server is running", url });
            }
        });

    } catch(err) {
        logger.error(err);
    }
};