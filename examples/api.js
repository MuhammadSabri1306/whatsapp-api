const whatsapp = require("../src/whatsapp");
const { defineRoute, serveHttp, ErrorHttp } = require("../src/http-server");

const apiKey = "testDev123";

defineRoute({ type: "web", httpMethod: "get", routePath: "/" }, request => {
    return "Hello, World!";
});

defineRoute({ type: "api", httpMethod: "get", routePath: `/${ apiKey }/sendMessage` }, request => {
    const { to, ...params } = request.query;
    if(!to)
        throw new HttpError(400, "params:to <PhoneNumber<String>> is required");
    if(!params.text)
        throw new HttpError(400, "params:text <String> is required");
    // return { to, remoteJid: whatsapp.toRemoteJidByPhoneNumber(to), ...params };

    const remoteJid = whatsapp.toRemoteJidByPhoneNumber(to);
    const wa = await whatsapp.useConnection();
    const waResponse = await wa.sendMessage(remoteJid, params);
    console.log(waResponse);
    return waResponse;
});

(async () => {
    // await useWhatsappConnection(100);
    serveHttp();
})();