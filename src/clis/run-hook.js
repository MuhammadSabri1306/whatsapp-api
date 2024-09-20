const { handleWebhook, toPhoneNumberByRemoteJid } = require("../libs/whatsapp");

const formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    const years = String( date.getFullYear() );
    const months = String( date.getMonth() + 1 ).padStart(2, "0");
    const days = String( date.getDate() ).padStart(2, "0");
    const hours = String( date.getHours() ).padStart(2, "0");
    const minutes = String( date.getMinutes() ).padStart(2, "0");
    const seconds = String( date.getSeconds() ).padStart(2, "0");
    return `${ years }-${ months }-${ days } ${ hours }:${ minutes }:${ seconds }`;
};

module.exports = () => {
    handleWebhook(messageInfo => {
        try {
    
            const timestamp = formatTimestamp(messageInfo.messageTimestamp);
            const remoteJid = messageInfo.key.remoteJid;
            const text = messageInfo.message.text;
            console.log(`\nincoming message at ${ timestamp }`);
            console.log("from: ", toPhoneNumberByRemoteJid(remoteJid));
            console.log("text: ", text);
    
        } catch(err) {
            console.error(err);
            console.log("\nmessageInfo: ", JSON.stringify(messageInfo));
        }
    });
};