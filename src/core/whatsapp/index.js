const path = require("path");
const { useMultiFileAuthState, DisconnectReason, default: makeWASocket } = require("baileys");
const { Boom } = require("@hapi/boom");
const globalState = require("@app/global");
const { usePinoLogger } = require("@app/core/logger");
const { ErrorWhatsappService, ErrorWhatsappConn } = require("./exceptions");
const { setWaService, ...WhatsappAction } = require("./action");

const WaSocket = {
    conn: null,
    status: "close",
    authDir: path.resolve(__dirname, "../../../auth-info-baileys"),
    config: {
        printQRInTerminal: true,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        keepAliveIntervalMs: 20000,
        connectTimeoutMs: 60000,
    },
    on: {
        restart: null,
        resolve: null,
        error: null,
    },
    waServiceLogger: () => {
        return globalState.findOrInit("logger.whatsappService", () => usePinoLogger({ disableConsole: true }));
    },
    baileysLogger: () => {
        return globalState.findOrInit("logger.whatsappBaileys", () => usePinoLogger({ disableConsole: true }));
    },
};

module.exports.config = WaSocket.config;
module.exports.isWaServiceConnected = () => {
    return (WaSocket.conn ? true : false) && WaSocket.status == "open";
};

module.exports.getWaService = () => {
    if(!this.isWaServiceConnected()) {
        if(!WaSocket.conn)
            throw new ErrorWhatsappService("whatsapp service not initialized yet");
        throw new ErrorWhatsappService(`whatsapp service is down, status: ${ WaSocket.status }`);
    }
    return WaSocket.conn;
};

module.exports.initWaService = ({ maxRetry, timeoutMs, serviceLogger, socketLogger }) => {
    if(maxRetry !== undefined && typeof maxRetry != "number")
        throw new Error("maxRetry is not number");
    else maxRetry = null;

    if(timeoutMs !== undefined && typeof timeoutMs != "number")
        throw new Error("timeoutMs is not number");
    else timeoutMs = null;

    const timeout = timeoutMs ? Date.now() + timeoutMs : null;
    if(serviceLogger)
        globalState.set("logger.whatsappService", serviceLogger);
    if(socketLogger)
        globalState.set("logger.whatsappBaileys", socketLogger);

    return new Promise((resolve, reject) => {

        if(this.isWaServiceConnected()) {
            WaSocket.waServiceLogger().info({
                msg: "whatsapp is connected",
                status: WaSocket.status
            });
            setWaService(WaSocket.conn);
            resolve();
            return;
        }

        const connect = async () => {

            const { state, saveCreds } = await useMultiFileAuthState( WaSocket.authDir );
            WaSocket.conn = makeWASocket({
                auth: state,
                logger: WaSocket.baileysLogger(),
                ...WaSocket.config
            });
            setWaService(WaSocket.conn);

            WaSocket.conn.ev.on("creds.update", saveCreds);
            WaSocket.conn.ev.on("connection.update", update => {
                try {
    
                    const { lastDisconnect, connection } = update;
                    WaSocket.status = connection || "close";
                    if(connection === "close") {
    
                        let reason = undefined;
                        if(lastDisconnect && lastDisconnect.error) {
                            const boom = new Boom(lastDisconnect.error);
                            if(boom && boom.output && boom.output.statusCode)
                                reason = boom.output.statusCode;
                        }
    
                        if(reason === DisconnectReason.badSession) {
                            throw new ErrorWhatsappConn("bad session, please delete /auth and scan again");
                        } else if(reason === DisconnectReason.connectionClosed) {
                            throw new ErrorWhatsappConn("connection closed", true);
                        } else if(reason === DisconnectReason.connectionLost) {
                            throw new ErrorWhatsappConn("connection lost from server", true);
                        } else if(reason === DisconnectReason.connectionReplaced) {
                            throw new ErrorWhatsappConn("connection replaced, another new session opened, please close current session first");
                        } else if(reason === DisconnectReason.loggedOut) {
                            throw new ErrorWhatsappConn("device logged out, please delete /auth and scan again");
                        } else if(reason === DisconnectReason.restartRequired) {
                            if(WaSocket.on.restart)
                                WaSocket.on.restart();
                            else
                                throw new ErrorWhatsappConn("connection need to restarted", true);
                        } else if(reason === DisconnectReason.timedOut) {
                            throw new ErrorWhatsappConn("connection timedout", true);
                        } else {
                            throw new ErrorWhatsappConn(`unknown DisconnectReason: ${ reason }: ${ connection }`, true);
                        }
                    } else if(connection === "open") {
                        if(WaSocket.on.resolve)
                            WaSocket.on.resolve();
                    }
    
                } catch(err) {

                    if(WaSocket.on.error)
                        WaSocket.on.error(err);
                    else
                        throw err;

                }
            });

        };

        WaSocket.on.restart = connect;
        WaSocket.on.resolve = () => {
            WaSocket.waServiceLogger().info({
                msg: "whatsapp is connected",
                status: WaSocket.status
            });
            resolve();
        };

        let retryCount = 0;
        WaSocket.on.error = err => {

            WaSocket.waServiceLogger.error(err);

            const isRetryAllowed = !maxRetry || retryCount < maxRetry;
            const isInTime = !timeout || Date.now() < timeout;
            const isRestartable = err instanceof ErrorWhatsappConn && err.isRestartable;

            if(isRetryAllowed && isInTime && isRestartable)
                connect();
            else
                reject(err);
        };

        connect();
    });
};

// module.exports.handleWebhook = async (handler, options = {}) => {
//     if(typeof handler != "function")
//         throw new Error("handler is not function");
//     if(options.messageFilter && typeof options.messageFilter != "function")
//         throw new Error("messageFilter is not function");

//     const messageFilter = options.messageFilter || null;
//     const connMaxRetry = (options.connection && options.connection.maxRetry) || 100;
//     const connTryTimeoutMs = (options.connection && options.connection.tryTimeoutMs) || 10000;

//     const whatsapp = await this.useConnection(connMaxRetry, connTryTimeoutMs);
//     whatsapp.ev.on("messages.upsert", ({ messages }) => {

//         if(messageFilter)
//             messages = messageFilter(messages);

//         if(!Array.isArray(messages))
//             throw new Error("messages is not Array");

//         for(let i=0; i<messages.length; i++) {
//             handler( messages[i] );
//         }

//     });
// };

module.exports.ErrorWhatsappService = ErrorWhatsappService;
module.exports.ErrorWhatsappConn = ErrorWhatsappConn;
module.exports.RemoteJid = require("./remote-jid");
module.exports.MessageSerializer = require("./message-serializer");
module.exports.WhatsappAction = WhatsappAction;