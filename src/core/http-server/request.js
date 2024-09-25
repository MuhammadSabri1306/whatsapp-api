
module.exports.deserializeHttpReq = (reqJson) => JSON.parse(reqJson);
module.exports.serializeHttpReq = (req) => {
    const httpRequest = {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: req.headers,
        query: req.query,
        params: req.params,
        body: req.body,
    };
    return JSON.stringify(httpRequest);
};