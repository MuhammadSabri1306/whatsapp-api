class ErrorHttp extends Error {
    constructor(httpCode, message) {
        super(message);
        this.httpCode = httpCode;
    }

    toHttpResponse() {
        const message = this.message;
        const httpCode = this.httpCode;
        return { httpCode, data: message };
    }

    toHttpApiResponse() {
        const message = this.message;
        const httpCode = this.httpCode;
        return {
            httpCode,
            data: { error: true, code: httpCode, message }
        };
    }
}

module.exports.ErrorHttp = ErrorHttp;

class ErrorRequestTimeout extends ErrorHttp {
    constructor(message) {
        super(408, message);
    }
}

module.exports.ErrorRequestTimeout = ErrorRequestTimeout;

class ErrorWorkerExit extends Error {}
module.exports.ErrorWorkerExit = ErrorWorkerExit;