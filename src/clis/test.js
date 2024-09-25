const globalState = require("@app/global");
const { usePinoLogger } = require("@app/core/logger");
const whatsapp = require("@app/core/whatsapp");

const phoneNumberToJid = () => {
    const phoneNumber = "6285824426052";
    console.log({
        phoneNumber,
        // remoteJid: whatsapp.RemoteJid.fromPhoneNumber(phoneNumber).toString(),
        remoteJid: `${ whatsapp.RemoteJid.fromPhoneNumber(phoneNumber) }`
    });
};

const sendWaMessage = async () => {
    const logger = usePinoLogger({
        disableConsole: globalState.isProdMode,
        fileBaseName: "wa-test"
    });

    try {

        globalState.set("logger", {
            program: logger,
            whatsappService: usePinoLogger({
                disableConsole: globalState.isProdMode,
                fileBaseName: "wa-test.whatsapp-service"
            }),
        });

        const waService = await whatsapp.useConnection(10, 20000);
        const remoteJid = whatsapp.RemoteJid
            .fromPhoneNumber("6285824426052")
            .toString();
        const params = { text: "Test" };

        logger.info({ msg: "sending whatsapp message", remoteJid, params });
        const waResponse = await waService.sendMessage(remoteJid, params);
        logger.info({ msg: "whatsapp message was sent", waResponse });

    } catch(err) {
        logger.error(err);
    }
};

const serializeWaMessage = () => {
    const messages = [
        {
            key: {
                remoteJid: "phone_number@s.whatsapp.net",
                fromMe: false,
                id: "message_id",
                participant: "phoneNumber@s.whatsapp.net"
            },
            message: {
                conversation: "Hello, how are you?"
            },
            messageTimestamp: 1634168820,
            pushName: "John Doe",
            status: "PENDING",
            messageStubType: null,
            messageStubParameters: [],
            participant: "phone_number@s.whatsapp.net"
        },
        {
            key: {
                remoteJid: "phone_number@s.whatsapp.net",
                fromMe: false,
                id: "message_id",
                participant: "phoneNumber@s.whatsapp.net"
            },
            message: {
                extendedTextMessage: {
                    text: "Check this out!",
                    matchedText: "",
                    canonicalUrl: "",
                    description: "",
                    title: "",
                    previewType: "NONE",
                }
            },
            messageTimestamp: 1634168820,
            pushName: "John Doe",
            status: "PENDING",
            messageStubType: null,
            messageStubParameters: [],
            participant: "phone_number@s.whatsapp.net"
        },
        {
            key: {
                remoteJid: "phone_number@s.whatsapp.net",
                fromMe: false,
                id: "message_id",
                participant: "phoneNumber@s.whatsapp.net"
            },
            message: {
                contactMessage: {
                    displayName: "John Doe",
                    vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD"
                }
            },
            messageTimestamp: 1634168820,
            pushName: "John Doe",
            status: "PENDING",
            messageStubType: null,
            messageStubParameters: [],
            participant: "phone_number@s.whatsapp.net"
        },
        {
            key: {
                remoteJid: "phone_number@s.whatsapp.net",
                fromMe: false,
                id: "message_id",
                participant: "phoneNumber@s.whatsapp.net"
            },
            message: {
                reactionMessage: {
                    text: "👍",
                    key: {
                        remoteJid: "phone_number@s.whatsapp.net",
                        fromMe: false,
                        id: "message_id"
                    }
                }
            },
            messageTimestamp: 1634168820,
            pushName: "John Doe",
            status: "PENDING",
            messageStubType: null,
            messageStubParameters: [],
            participant: "phone_number@s.whatsapp.net"
        },
    ];

    const serializer = whatsapp.MessageSerializer;
    messages.forEach(msg => {
        console.log("\nMessage:", {
            isMessage: serializer.isMessage(msg),
            messageDate: serializer.getMessageDate(msg),
            messageKey: serializer.getMessageKey(msg),
            isTextMessageContent: serializer.isTextMessageContent(msg.message),
            isExtendedTextMessageContent: serializer.isExtTextMessageContent(msg.message),
            isImageMessageContent: serializer.isImageMessageContent(msg.message),
            isVideoMessageContent: serializer.isVideoMessageContent(msg.message),
            isAudioMessageContent: serializer.isAudioMessageContent(msg.message),
            isDocumentMessageContent: serializer.isDocumentMessageContent(msg.message),
            isLocationMessageContent: serializer.isLocationMessageContent(msg.message),
            isContactMessageContent: serializer.isContactMessageContent(msg.message),
            isContactsArrayMessageContent: serializer.isContactsArrayMessageContent(msg.message),
            isButtonsMessageContent: serializer.isButtonsMessageContent(msg.message),
            isTemplateMessageContent: serializer.isTemplateMessageContent(msg.message),
            isReactionMessageContent: serializer.isReactionMessageContent(msg.message),
        });
        console.log("MessageContent:", serializer.getMessageContent(msg.message));
    });
};

module.exports = async (caseName) => {

    const cases = {
        phoneNumberToJid,
        sendWaMessage,
        serializeWaMessage
    };

    if(!(caseName in cases))
        throw new Error("no test case to run");
    await cases[caseName]();

};