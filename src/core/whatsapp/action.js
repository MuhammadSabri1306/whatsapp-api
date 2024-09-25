const ErrorWhatsappService = require("./exceptions").ErrorWhatsappService;

let waService = null;
module.exports.setWaService = (wa) => waService = wa;

module.exports.createActionData = (action, args = []) => {
    if(typeof action != "string")
        throw new Error("action is not string");
    if(!Array.isArray(args))
        throw new Error("args is not Array");
    return {
        whatsappWorkerActionData: {
            isWhatsappAction: true,
            action, args
        }
    };
};

module.exports.isActionData = (data) => {
    if(!data.whatsappWorkerActionData)
        return false;
    if(!data.whatsappWorkerActionData.isWhatsappAction)
        return false;
    return true;
};

module.exports.handleAction = (actionData) => {
    const { action, args } = actionData.whatsappWorkerActionData;
    if(!waService)
        throw new Error("wa service not initialized");
    if(typeof waService[action] != "function")
        throw new ErrorWhatsappService(`whatsapp service '${ action }' is not exists`);
    return waService[action](...args);
};