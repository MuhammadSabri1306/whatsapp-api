const globalState = require("@app/global");
const { usePinoLogger } = require("@app/libs/logger");
const { isConnected, useConnection, toRemoteJidByPhoneNumber } = require("@app/libs/whatsapp");

const sendWaMessage = async () => {
    const logger = usePinoLogger({
        disableConsole: globalState.isProdMode,
        fileBaseName: "wa-test"
    });

    try {

        globalState.set("logger", {
            program: logger,
            whatsappService: usePinoLogger({
                disableConsole: globalState.isProdMode,
                fileBaseName: "wa-test.whatsapp-service"
            }),
        });

        const waService = await useConnection(10, 20000);
        const remoteJid = toRemoteJidByPhoneNumber("6285824426052");
        const params = { text: "Test" };

        logger.info({ msg: "sending whatsapp message", remoteJid, params });
        const waResponse = await waService.sendMessage(remoteJid, params);
        logger.info({ msg: "whatsapp message was sent", waResponse });

    } catch(err) {
        logger.error(err);
    }
};

module.exports = async (caseName) => {

    const cases = {
        sendWaMessage
    };

    if(!(caseName in cases))
        throw new Error("no test case to run");
    await cases[caseName]();

};