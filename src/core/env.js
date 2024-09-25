const { resolve: pathResolve, join: pathJoin } = require("path");
const { existsSync: fsExistsSync } = require("fs");

const loadedEnv = {
    isLoaded: false,
    path: null,
};

module.exports.useEnv = (envPath) => {
    if(!envPath) {
        const envDir = pathResolve(__dirname, "../../");
        const localEnvPath = pathJoin(envDir, ".env.local");
        const cloudEnvPath = pathJoin(envDir, ".env");
        envPath = fsExistsSync(localEnvPath) ? localEnvPath : cloudEnvPath;
    }

    require("dotenv").config({ path: envPath });
    loadedEnv.isLoaded = true;
    loadedEnv.path = envPath;
};

module.exports.env = (key, defaultValue = null) => {
    if(!loadedEnv.isLoaded)
        this.useEnv();
    if(process.env[key] === undefined)
        return defaultValue;
    return process.env[key];
};