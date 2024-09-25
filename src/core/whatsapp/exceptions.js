
class ErrorWhatsappService extends Error {}
module.exports.ErrorWhatsappService = ErrorWhatsappService;

class ErrorWhatsappConn extends ErrorWhatsappService {
    constructor(message, isRestartable = false) {
        super(message);
        this.isRestartable = isRestartable === true;
    }
}

module.exports.ErrorWhatsappConn = ErrorWhatsappConn;