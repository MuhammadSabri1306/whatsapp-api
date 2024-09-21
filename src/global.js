
const globalState = {};
module.exports.get = () => globalState;

module.exports.set = (key, value) => {
    if(typeof key != "string")
        throw new Error("key is not string");

    const keys = key.split('.');
    let result = globalState;
    for(let i=0; i<keys.length; i++) {
        let currKey = keys[i];
        if(i === keys.length - 1) {
            result[currKey] = value;
        } else {
            if(result[currKey] === undefined || typeof result[currKey] !== "object")
                result[currKey] = {};
            result = result[currKey];
        }
    }
};

module.exports.find = (key, defaultValue = null) => {
    if(typeof key != "string")
        throw new Error("key is not string");

    const keys = key.split('.');
    let result = globalState;
    for(const currKey of keys) {
        if(result[currKey] === undefined)
            return defaultValue;
        result = result[currKey];
    }
    return result;
};