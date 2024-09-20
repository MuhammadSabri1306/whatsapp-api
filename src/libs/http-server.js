const express = require("express");

const routes = [];
const middlewares = [];

module.exports.getRoutes = () => routes;
module.exports.getMiddlewares = () => middlewares;

module.exports.resetRoutes = () => {
    routes.splice(0, routes.length);
};

module.exports.defineRoute = ({ type, httpMethod, routePath }, handler) => {
    if(typeof type != "string")
        throw new Error(`type ${ type } is not string`);
    if(typeof httpMethod != "string")
        throw new Error(`httpMethod ${ httpMethod } is not string`);
    if(typeof routePath != "string")
        throw new Error(`routePath ${ routePath } is not string`);
    if(typeof handler != "function")
        throw new Error("handler is not function");

    if(["web", "api"].indexOf(type) < 0)
        type = "web";
    routes.push({ type, httpMethod, routePath, handler });
};

module.exports.setMiddlewares = (middlewareList) => {
    middlewares.splice(0, middlewares.length);
    for(let i=0; i<middlewareList.length; i++) {
        
        if(typeof middlewareList[i] != "function")
            throw new Error(`middleware on index:${ i } is not function`);
        middlewares.push(middlewareList[i]);

    }
};

class ErrorHttp extends Error {
    constructor(httpCode, message) {
        super(message);
        this.httpCode = httpCode;
    }
}
module.exports.ErrorHttp = ErrorHttp;

module.exports.serveHttp = () => {
    const app = express();
    const port = 3000;

    const toApiRoutePath = routePath => {
        if(routePath.includes("/", 0))
            routePath = routePath.slice(1);
        return `/api/${ routePath }`;
    };

    const handleError = (isFromApiRoute, err, res) => {
        if(err instanceof ErrorHttp) {
            if(isFromApiRoute) {
                res.status( err.httpCode ).json({
                    error: true,
                    code: err.httpCode,
                    message: err.message,
                });
            } else {
                res.status( err.httpCode ).send(err.message);
            }
        } else {
            if(isFromApiRoute) {
                res.status(500).json({
                    error: true,
                    code: 500,
                    message: "internal server error",
                });
            } else {
                res.status(500).send(err.message);
            }
        }
    };

    for(let i=0; i<routes.length; i++) {

        let { type, httpMethod, routePath, handler } = routes[i];
        let isTypeApi = type == "api";

        if(isTypeApi)
            routePath = toApiRoutePath(routePath);

        app[httpMethod](routePath, (req, res) => {
            try {

                const result = handler(req);
                if(isTypeApi) {
                    res.status(200).json(result);
                } else {
                    res.status(200).send(result);
                }

            } catch(err) {
                console.error(err);
                handleError(isTypeApi, err, res);
            }
        });

    }

    app.use((req, res) => {
        if(req.path.includes("/api", 0)) {
            res.status(404).json({
                error: true,
                code: 404,
                message: "resource not found",
            });
        } else {
            res.status(404).send("404 Not Found");
        }
    });

    app.listen(port, () => {
        console.log(`server running at http://localhost:${ port }/`);
    });
};