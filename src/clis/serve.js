const globalState = require("@app/global");
const { env } = require("@app/core/env");
const { usePinoLogger } = require("@app/core/logger");
const { defineApp, handleRequest, serveApp } = require("@app/core/http-server");
const { initWaService, getWaService, WhatsappAction } = require("@app/core/whatsapp");

module.exports = async () => {

    const waBotToken = env("BOT_API_TOKEN", "");
    globalState.set("waBotToken", waBotToken);

    const logger = usePinoLogger({
        disableConsole: globalState.isProdMode,
        fileBaseName: "http-service"
    });

    try {

        defineApp((router) => {

            router.web.get("/", handleRequest("web/index.js"));
            router.waApi.get("/sendMessage", handleRequest("api/whatsapp/send-message.js"));

        }, { logger });

        await initWaService({
            serviceLogger: usePinoLogger({
                disableConsole: globalState.isProdMode,
                fileBaseName: "whatsapp-service"
            }),
            socketLogger: usePinoLogger({
                disableConsole: true,
                fileBaseName: "whatsapp-socket"
            }),
        });

        serveApp({
            hooks: {

                onBeforeRouteHandled: async (data) => {
                    if(WhatsappAction.isActionData(data)) {
                        const waResponse = await WhatsappAction.handleAction(data);
                        return waResponse;
                    }

                    return data;
                },

            }
        });

    } catch(err) {
        logger.error(err);
    }
};