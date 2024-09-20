const path = require("path");
const { useMultiFileAuthState, DisconnectReason, default: makeWASocket } = require("baileys");
const { Boom } = require("@hapi/boom");

const WhatsappSocket = {
    conn: null,
    status: "close",
    authDir: path.resolve(__dirname, "../../auth-info-baileys"),
};

module.exports.isConnected = () => {
    return (WhatsappSocket.conn ? true : false) && WhatsappSocket.status == "open";
};

class ErrorWhatsappSocketNeedRestart extends Error {}

module.exports.initConnection = () => {
    return new Promise((resolve, reject) => {

        const connect = async () => {
            const { state, saveCreds } = await useMultiFileAuthState( WhatsappSocket.authDir );
            WhatsappSocket.conn = makeWASocket({ auth: state, printQRInTerminal: true });
    
            WhatsappSocket.conn.ev.on("creds.update", saveCreds);
            WhatsappSocket.conn.ev.on("connection.update", update => {
                try {
    
                    const { lastDisconnect, connection } = update;
                    WhatsappSocket.status = connection || "close";
                    if(connection === "close") {
    
                        let reason = undefined;
                        if(lastDisconnect && lastDisconnect.error) {
                            const boom = new Boom(lastDisconnect.error);
                            if(boom && boom.output && boom.output.statusCode)
                                reason = boom.output.statusCode;
                        }
    
                        if(reason === DisconnectReason.badSession) {
                            throw new Error("bad session, please delete /auth and scan again");
                        } else if(reason === DisconnectReason.connectionClosed) {
                            throw new ErrorWhatsappSocketNeedRestart("connection closed");
                        } else if(reason === DisconnectReason.connectionLost) {
                            throw new ErrorWhatsappSocketNeedRestart("connection lost from server");
                        } else if(reason === DisconnectReason.connectionReplaced) {
                            throw new Error("connection replaced, another new session opened, please close current session first");
                        } else if(reason === DisconnectReason.loggedOut) {
                            throw new Error("device logged out, please delete /auth and scan again");
                        } else if(reason === DisconnectReason.restartRequired) {
                            connect();
                        } else if(reason === DisconnectReason.timedOut) {
                            throw new ErrorWhatsappSocketNeedRestart("connection timedout");
                        } else {
                            throw new ErrorWhatsappSocketNeedRestart(`unknown DisconnectReason: ${ reason }: ${ connection }`);
                        }
                    } else if(connection === "open") {
                        resolve();
                    }
    
                } catch(err) {
                    reject(err);
                }
            });
        };

        connect();

    });
};

module.exports.useConnection = async (maxRetry = 0, timeoutMs = null) => {
    console.info("getting whatsapp connection");
    if(this.isConnected())
        return WhatsappSocket.conn;

    if(typeof maxRetry != "number")
        throw new Error("maxRetry is not number");
    if(timeoutMs && typeof timeoutMs != "number")
        throw new Error("timeoutMs is not number");
    const timeout = Date.now() + (timeoutMs || 10000);
    
    let retryCount = 0;
    console.info("setting up whatsapp connection");
    while(true) {
        try {
            await this.initConnection();
            console.info("whatsapp connection was initialized");
            // if(this.isConnected())
            //     break;
            break;
        } catch(err) {

            if(!(err instanceof ErrorWhatsappSocketNeedRestart))
                throw err;
            if(Date.now() >= timeout)
                throw err;

            retryCount++;
            if(retryCount > maxRetry)
                throw err;
            
            console.error(err);
            console.info("reconnecting whatsapp connection");

        }
    }

    return WhatsappSocket.conn;
};

module.exports.handleWebhook = async (handler, options = {}) => {
    if(typeof handler != "function")
        throw new Error("handler is not function");
    if(options.messageFilter && typeof options.messageFilter != "function")
        throw new Error("messageFilter is not function");

    const messageFilter = options.messageFilter || null;
    const connMaxRetry = (options.connection && options.connection.maxRetry) || 100;
    const connTryTimeoutMs = (options.connection && options.connection.tryTimeoutMs) || 10000;

    const whatsapp = await this.useConnection(connMaxRetry, connTryTimeoutMs);
    whatsapp.ev.on("messages.upsert", ({ messages }) => {

        if(messageFilter)
            messages = messageFilter(messages);

        if(!Array.isArray(messages))
            throw new Error("messages is not Array");

        for(let i=0; i<messages.length; i++) {
            handler( messages[i] );
        }

    });
};

module.exports.toRemoteJidByPhoneNumber = phoneNumber => {
    if(typeof phoneNumber != "string")
        phoneNumber = phoneNumber.toString();
    if(!phoneNumber.includes("+", 0))
        phoneNumber = "+" + phoneNumber;
    return `${ phoneNumber }@s.whatsapp.net`;
};

module.exports.toPhoneNumberByRemoteJid = remoteJid => {
    if(typeof remoteJid != "string")
        throw Error("remoteJid is not string");
    let phoneNumber = remoteJid.replace("@s.whatsapp.net", "");
    if(phoneNumber.includes("+", 0))
        phoneNumber.slice(1);
    return phoneNumber;
};