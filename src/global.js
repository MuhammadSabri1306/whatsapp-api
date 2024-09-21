
const globalState = {};
module.exports.get = () => globalState;

module.exports.set = (key, value) => {
    globalState[key] = value;
};

module.exports.find = (key, defaultValue = null) => {
    if(typeof key != "string")
        throw new Error("key is not string");

    const keys = key.split('.');
    let result = globalState;
    for(const key of keys) {
        if(result[key] === undefined)
            return defaultValue;
        result = result[key];
    }
    return result;
};