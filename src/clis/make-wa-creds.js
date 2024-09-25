const globalState = require("@app/global");
const { usePinoLogger } = require("@app/core/logger");
const { initWaService } = require("@app/core/whatsapp");

module.exports = async () => {
    const logger = usePinoLogger({
        disableConsole: globalState.isProdMode,
        fileBaseName: "whatsapp-service"
    });

    try {

        logger.info("initializing connection");
        await initWaService({
            serviceLogger: logger,
            socketLogger: usePinoLogger({
                disableConsole: true,
                fileBaseName: "whatsapp-socket"
            }),
        });
        logger.info("whatsapp is connected");

    } catch(err) {
        globalState.logger.whatsappService.error(err);
    }
};