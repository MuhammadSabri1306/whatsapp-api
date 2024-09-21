const globalState = require("../global");
const { env } = require("../libs/env");
const whatsapp = require("../libs/whatsapp");
const { defineRoute, serveHttp, ErrorHttp } = require("../libs/http-server");
const { usePinoLogger } = require("../libs/logger");

module.exports = async () => {
    const apiKey = env("BOT_API_KEY", "bot");
    globalState.set("modes", {
        isProduction: env("APP_MODE") == "production",
        isDevelopment: env("APP_MODE") == "development",
    });

    const logger = usePinoLogger({
        disableConsole: globalState.get().isProduction,
        fileName: "http"
    });

    globalState.set("logger", {
        server: usePinoLogger({
            disableConsole: globalState.get().isProduction,
            fileName: "server"
        }),
        whatsappService: usePinoLogger({
            disableConsole: globalState.get().isProduction,
            fileName: "http.whatsapp-service"
        }),
    });
    
    defineRoute({ type: "web", httpMethod: "get", routePath: "/" }, request => {
        return "Hello, World!";
    });
    
    defineRoute({ type: "api", httpMethod: "get", routePath: `/${ apiKey }/sendMessage` }, request => {
        const { to, ...params } = request.query;
        if(!to)
            throw new HttpError(400, "params:to <PhoneNumber<String>> is required");
        if(!params.text)
            throw new HttpError(400, "params:text <String> is required");
        // return { to, remoteJid: whatsapp.toRemoteJidByPhoneNumber(to), ...params };
    
        const remoteJid = whatsapp.toRemoteJidByPhoneNumber(to);
        const wa = await whatsapp.useConnection();
        const waResponse = await wa.sendMessage(remoteJid, params);
        logger.debug(waResponse);
        return waResponse;
    });
    
    await useWhatsappConnection(100);
    serveHttp();
};