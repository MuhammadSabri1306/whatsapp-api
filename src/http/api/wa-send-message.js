const globalState = require("@app/global");
const { usePinoLogger } = require("@app/libs/logger");
const { ErrorHttp } = require("@app/libs/http-server/exceptions");
const { isConnected, useConnection, toRemoteJidByPhoneNumber } = require("@app/libs/whatsapp");

module.exports = async ({ request }) => {

    const logger = globalState.logger.httpServer;
    
    const { to, ...params } = request.query;
    if(typeof to != "string")
        throw new ErrorHttp(400, "parameter 'to' is required as phone number string");
    if(typeof params.text != "string")
        throw new ErrorHttp(400, "parameter 'text' is required as string");

    const remoteJid = toRemoteJidByPhoneNumber(to);
    const waService = await useConnection(10, 20000);

    logger.info({ msg: "sending whatsapp message", remoteJid, params });
    const waResponse = await waService.sendMessage(remoteJid, params);
    return waResponse;

};

/*
Example: url `http://localhost:3000/api/wabottestDev123/sendMessage?to=6285824426052&text=test+luks`,
waResponse = {
    "messageStubParameters": [],
    "labels": [],
    "userReceipt": [],
    "reactions": [],
    "pollUpdates": [],
    "eventResponses": [],
    "key": {
        "remoteJid": "6285824426052@s.whatsapp.net",
        "fromMe": true,
        "id": "3EB0867AB03E9CA48DF435"
    },
    "message": {
        "extendedTextMessage": {
            "text": "test luks"
        }
    },
    "messageTimestamp": {
        "low": 1727088359,
        "high": 0,
        "unsigned": true
    },
    "status": 1
}
 */