
const state = {};

const set = (key, value) => {
    if(typeof key != "string")
        throw new Error("key is not string");

    const keys = key.split(".").filter(k => k.length > 0);
    let result = state;
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

const find = (key, defaultValue = null) => {
    if(typeof key != "string")
        throw new Error("key is not string");

    const keys = key.split(".").filter(k => k.length > 0);
    let result = state;
    for(const currKey of keys) {
        if(result[currKey] === undefined)
            return typeof defaultValue == "function" ? defaultValue() : defaultValue;
        result = result[currKey];
    }
    return result;
};

const exportedMethods = { set, find };
const proxyHandler = {
    set() {
        throw new Error("use set method to write global state");
    },
    get(target, prop) {
        if(prop in target)
            return target[prop];
        return state[prop];
    },
};

module.exports = new Proxy(exportedMethods, proxyHandler);