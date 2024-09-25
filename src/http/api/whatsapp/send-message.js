const globalState = require("@app/global");
const { ErrorHttp } = require("@app/core/http-server/exceptions");
const { RemoteJid, WhatsappAction } = require("@app/core/whatsapp");

module.exports = ({ request }) => {

    const logger = globalState.logger.program;
    
    const { to, ...params } = request.query;
    if(typeof to != "string")
        throw new ErrorHttp(400, "parameter 'to' is required as phone number string");
    if(typeof params.text != "string")
        throw new ErrorHttp(400, "parameter 'text' is required as string");

    const remoteJid = RemoteJid.fromPhoneNumber(to).toString();

    logger.info({ msg: "sending whatsapp message", remoteJid, params });
    return WhatsappAction.createActionData("sendMessage", [ remoteJid, params ]);

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