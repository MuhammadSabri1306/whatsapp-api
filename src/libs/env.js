const path = require("path");

const loadedEnv = {
    isLoaded: false,
    path: null,
};

module.exports.useEnv = (dotenvConfig = {}) => {
    require("dotenv").config(dotenvConfig);
    loadedEnv.isLoaded = true;
    loadedEnv.path = dotenvConfig.path || path.resolve(process.cwd(), ".env");
};

module.exports.env = (key, defaultValue = null) => {
    if(!loadedEnv.isLoaded)
        this.useEnv();
    if(process.env[key] === undefined)
        return defaultValue;
    return process.env[key];
};