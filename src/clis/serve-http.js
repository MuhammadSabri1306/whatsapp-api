const globalState = require("@app/global");
const { usePinoLogger } = require("@app/libs/logger");
const { defineApp, handleRequest, serveApp } = require("@app/libs/http-server");

module.exports = () => {

    const logger = usePinoLogger({
        disableConsole: globalState.isProdMode,
        fileBaseName: "http-server"
    });

    globalState.set("logger", { httpServer: logger });
    try {

        defineApp((app) => {

            app.get("/", handleRequest("web/index.js"));

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