const path = require("path");
const { useMultiFileAuthState, DisconnectReason, default: makeWASocket } = require("baileys");
const { Boom } = require("@hapi/boom");
const globalState = require("@app/global");
const { usePinoLogger } = require("@app/libs/logger");

const WhatsappSocket = {
    conn: null,
    status: "close",
    authDir: path.resolve(__dirname, "../../auth-info-baileys"),
    config: {
        printQRInTerminal: true,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        keepAliveIntervalMs: 20000,
        connectTimeoutMs: 60000,
    },
};

module.exports.config = WhatsappSocket.config;
module.exports.isConnected = () => {
    return (WhatsappSocket.conn ? true : false) && WhatsappSocket.status == "open";
};

class ErrorWhatsappSocketNeedRestart extends Error {}
module.exports.initConnection = () => {
    return new Promise((resolve, reject) => {

        const connect = async () => {
            const { state, saveCreds } = await useMultiFileAuthState( WhatsappSocket.authDir );
            WhatsappSocket.conn = makeWASocket({
                auth: state,
                logger: globalState.find("logger.whatsappService") || usePinoLogger({ disableConsole: true }),
                ...WhatsappSocket.config
            });
    
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
    const logger = globalState.find("logger.program") || usePinoLogger({ disableConsole: true });
    logger.info("getting whatsapp connection");

    if(this.isConnected()) {
        logger.info("whatsapp is already connected");
        return WhatsappSocket.conn;
    }

    if(maxRetry !== false && typeof maxRetry != "number")
        throw new Error("maxRetry is not number");
    if(timeoutMs && typeof timeoutMs != "number")
        throw new Error("timeoutMs is not number");
    const timeout = Date.now() + (timeoutMs || 10000);
    
    let retryCount = 0;
    logger.info("setting up whatsapp connection");
    while(true) {
        try {
            await this.initConnection();
            logger.info("whatsapp connection was initialized");
            // if(this.isConnected())
            //     break;
            break;
        } catch(err) {

            if(!(err instanceof ErrorWhatsappSocketNeedRestart))
                throw err;
            if(Date.now() >= timeout)
                throw err;

            retryCount++;
            if(maxRetry !== false && retryCount > maxRetry)
                throw err;

            logger.error(err);
            logger.info({ msg: "reconnecting whatsapp connection", timeoutMs, maxRetry, retryCount });

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
    if(phoneNumber.includes("+", 0))
        phoneNumber = phoneNumber.slice(1);
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

module.exports.RemoteJid = require("./remote-jid");
module.exports.MessageSerializer = require("./message-serializer");