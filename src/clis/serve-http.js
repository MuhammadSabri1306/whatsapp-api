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

        const toWaBotApiPath = (urlPath) => {
            if(urlPath.includes("/", 0))
                urlPath = urlPath.slice(1);
            return `/api/wabot${ waBotToken }/${ urlPath }`;
        };

        defineApp((app) => {

            app.get("/", handleRequest("web/index.js"));
            app.get(toWaBotApiPath("/sendMessage"), handleRequest("api/wa-send-message.js"));

            return app;
    
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