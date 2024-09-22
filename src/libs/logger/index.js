const path = require("path");
const pino = require("pino");

const logDir = path.resolve(__dirname, "../../../logs");

module.exports.usePinoLogger = ({ disableConsole, fileBaseName }) => {
    if(disableConsole && typeof disableConsole != "boolean")
        throw new Error("disableConsole is not boolean");
    if(fileBaseName && typeof fileBaseName != "string")
        throw new Error("fileBaseName is not string");

    const useConsole = disableConsole !== true;
    const useFile = fileBaseName ? true : false;
    if(!useConsole && !useFile)
        return pino({ enabled: false });

    const transportTargets = [];
    const prettyOpts = {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
        singleLine: true
    };

    if(useConsole) {
        transportTargets.push({
            target: "pino-pretty",
            options: prettyOpts
        });
    }

    if(useFile) {
        transportTargets.push({
            target: path.resolve(__dirname, "file-pretty-transport"),
            options: { prettyOpts, baseDir: logDir, fileBaseName }
        });
    }

    const transport = pino.transport({ targets: transportTargets });
    return pino(transport);
};