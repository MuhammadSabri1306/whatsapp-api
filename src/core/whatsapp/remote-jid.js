const {
    jidNormalizedUser, jidEncode, jidDecode,
    isJidUser, isLidUser, isJidGroup,
    isJidNewsletter, isJidBroadcast, isJidStatusBroadcast,
    S_WHATSAPP_NET,
} = require("baileys");

class RemoteJid {
    constructor(jid) {
        if(typeof jid != "string")
            throw new Error("jid is not string");
        this.value = jid;
    }

    isUser() { return RemoteJid.isUserJid( this.value ); }
    isLid() { return RemoteJid.isUserLid( this.value ); }
    isGroup() { return RemoteJid.isGroupJid( this.value ); }
    isNewsletter() { return RemoteJid.isNewsletterJid( this.value ); }
    isBroadcast() { return RemoteJid.isBroadcastJid( this.value ); }
    isStatusBroadcast() { return RemoteJid.isStatusBroadcastJid( this.value ); }

    static isUserLid(jid) { return isLidUser(jid); }
    static isUserJid(jid) { return isJidUser(jid); }
    static isGroupJid(jid) { return isJidGroup(jid); }
    static isNewsletterJid(jid) { return isJidNewsletter(jid); }
    static isBroadcastJid(jid) { return isJidBroadcast(jid); }
    static isStatusBroadcastJid(jid) { return isJidStatusBroadcast(jid); }

    toString() {
        return this.value;
    }

    values() {
        return jidDecode(this.value);
    }

    getPhoneNumber() {
        if(!this.isUser())
            throw new Error("RemoteJid is not User JID");
        const jidValues = this.values();
        if(!jidValues)
            return null;
        return jidValues.user || null;
    }

    static fromPhoneNumber(phoneNumber) {
        if(typeof phoneNumber != "string")
            phoneNumber = phoneNumber.toString();
        if(phoneNumber.includes("+", 0))
            phoneNumber = phoneNumber.slice(1);
        phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
        
        const jidServer = (typeof S_WHATSAPP_NET == "string" ? S_WHATSAPP_NET : "").replace("@", "");
        return new RemoteJid( jidEncode(phoneNumber, jidServer) );
    }
}

module.exports = RemoteJid;