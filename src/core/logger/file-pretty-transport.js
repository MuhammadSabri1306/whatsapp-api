"use strict"

const fs = require("fs");
const path = require("path");
const { once } = require("events");
const { prettyFactory } = require("pino-pretty");
const build = require("pino-abstract-transport");

module.exports = async (options) => {
    const { baseDir, fileBaseName, prettyOpts } = options;
    const fileExt = options.fileExt || ".log";

    if(!fs.existsSync(baseDir))
        fs.mkdirSync(baseDir, { recursive: true });

    function createHourlyWriteStream() {
        const currHour = (new Date()).toISOString().slice(0, 13);
        const fileName = `${ fileBaseName }.${ currHour }${ fileExt }`;
        const filePath = path.join(baseDir, fileName);
        return fs.createWriteStream(filePath, { flags: "a" });
    }

    const prettifier = prettyFactory({ ...prettyOpts, colorize: false });
    let latestHours = (new Date()).getHours();
    
    let writeStream = createHourlyWriteStream();
    await once(writeStream, "ready");

    return build(async function (source) {
        for await (let obj of source) {

            const currHours = (new Date()).getHours();
            if(currHours !== latestHours) {
                writeStream.end();
                await once(writeStream, "close");

                writeStream = createHourlyWriteStream();
                latestHours = currHours;
                await once(writeStream, "ready");
            }

            const toDrain = !writeStream.write( prettifier(obj) );
            if(toDrain)
                await once(writeStream, "drain");
        }
      }, {
        async close (err) {
            writeStream.end();
            await once(writeStream, "close");
        }
    });
};