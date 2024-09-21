const path = require("path");
const fs = require("fs");
const pino = require("pino");

const logDir = path.resolve(__dirname, "../../../logs");

module.exports.usePinoLogger = ({ disableConsole, fileBaseName }) => {
    if(disableConsole && typeof disableConsole != "boolean")
        throw new Error("disableConsole is not boolean");
    if(fileBaseName && typeof fileBaseName != "string")
        throw new Error("fileBaseName is not string");

    const transportOpts = {
        useConsole: disableConsole !== true,
        useFile: fileBaseName ? true : false,
        pretty: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
            singleLine: true
        }
    };

    if(transportOpts.useFile) {
        // use file stream
        if(!fs.existsSync(logDir))
            fs.mkdirSync(logDir, { recursive: true });
        transportOpts.fileRoll = {
            file: path.join(logDir, fileBaseName),
            frequency: "hourly",
            mkdir: true,
            extension: ".log"
        };
    }

    const transport = pino.transport({
        target: path.resolve(__dirname, "custom-transport.js"),
        options: transportOpts
    });

    return pino(transport);
};