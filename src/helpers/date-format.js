const formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    const years = String( date.getFullYear() );
    const months = String( date.getMonth() + 1 ).padStart(2, "0");
    const days = String( date.getDate() ).padStart(2, "0");
    const hours = String( date.getHours() ).padStart(2, "0");
    const minutes = String( date.getMinutes() ).padStart(2, "0");
    const seconds = String( date.getSeconds() ).padStart(2, "0");
    return `${ years }-${ months }-${ days } ${ hours }:${ minutes }:${ seconds }`;
};

module.exports.toDate = (dateInput) => {
    let date = dateInput;
    if(!(date instanceof Date))
        date = new Date(date);
    if(isNaN(date))
        throw new Error(`cannot parse ${ dateInput } to Date`);
    return date;
};

module.exports.extractDateNumbers = (date, asString = false) => {
    date = this.toDate(date);
    const years = date.getFullYear();
    const months = date.getMonth() + 1;
    const days = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliSeconds = date.getMilliseconds();
    const timezoneOffset = date.getTimezoneOffset();

    if(!asString)
        return { years, months, days, hours, minutes, seconds, milliSeconds };
    return {
        years: String(years),
        months: String(months).padStart(2, "0"),
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        milliSeconds: String(milliSeconds),
        timezoneOffset: String(timezoneOffset)
    };
};

module.exports.formatDate = (date, format = "%y-%m-%d %h:%i:%s") => {
    date = this.extractDateNumbers(date);
    format = format.toLowerCase();
    return format.replace("%y", date.years)
        .replace("%m", date.months)
        .replace("%d", date.days)
        .replace("%h", date.hours)
        .replace("%i", date.minutes)
        .replace("%s", date.seconds)
        .replace("%z", date.timezoneOffset);
};