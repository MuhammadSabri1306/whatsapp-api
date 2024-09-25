"use strict"

const abstractTransport = require("pino-abstract-transport")
const { prettyFactory, default: pinoPretty } = require("pino-pretty");
const pinoRoll = require("pino-roll");
const { once } = require("events");

module.exports = async function(options) {
    const { useConsole, useFile, pretty: prettyOpts, fileRoll: fileRollOpts } = options;

    let streamConsole = null;
    if(useConsole)
        streamConsole = pinoPretty(prettyOpts);

    let streamFile = null;
    let prettifier = null;
    if(useFile) {
        streamFile = await pinoRoll(fileRollOpts);
        await once(streamFile, "ready");
        prettifier =  prettyFactory({ ...prettyOpts, colorize: false });
    }

    return abstractTransport(
        async function(source) {

            if(useConsole || useFile) {
                source.on("data", async (content) => {
                    if(useConsole)
                        streamConsole.push(content);
                    if(useFile) {
                        const toDrain = !streamFile.write( prettifier(content) );
                        if(toDrain)
                            await once(streamFile, "drain");
                    }
                });
            }

        }, {
            async close (err, cb) {

                if(useConsole) {
                    streamConsole.end();
                }

                if(useFile) {
                    streamFile.end();
                    await once(streamFile, "close");
                }

                cb.bind(null, err);

            }
        }
    );
};