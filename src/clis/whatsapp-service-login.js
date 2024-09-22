const globalState = require("@app/global");
const { usePinoLogger } = require("@app/libs/logger");
const { isConnected, useConnection } = require("@app/libs/whatsapp");

module.exports = async () => {
    
    const logger = usePinoLogger({
        disableConsole: globalState.isProdMode,
        fileBaseName: "wa-login"
    });

    globalState.set("logger", {
        program: logger,
        whatsappService: usePinoLogger({
            disableConsole: globalState.isProdMode,
            fileBaseName: "wa-login.whatsapp-service"
        }),
    });

    try {

        if(isConnected())
            logger.info("whatsapp-service is already connected");
        else
            await useConnection(false, 20000);

    } catch(err) {
        logger.error(err);
    }

};