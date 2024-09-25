/*
Example message structure

***********************************************************************************
Message (in `messages.upsert` event, it passed as messages array item in callback) : {
  key: {
    remoteJid: 'phone_number@s.whatsapp.net', // The sender or group ID
    fromMe: false,                            // Indicates if the message was sent by you
    id: 'message_id',                         // Unique message ID
    participant: 'phoneNumber@s.whatsapp.net' // Sender ID in group chats
  },
  message: { ... },                           // Message content (varies by type)
  messageTimestamp: 1634168820,               // UNIX timestamp of the message
  pushName: 'John Doe',                       // Sender's name
  status: 'PENDING',                          // Message status (e.g., PENDING, SERVER_ACK, etc.)
  messageStubType: null,                      // Type of message stub (if any)
  messageStubParameters: [],                  // Additional parameters for the message stub
  participant: 'phone_number@s.whatsapp.net'  // Participant ID in group chats
  ?messageContextInfo: { ... }                // Context information for special message types, such as forwarded messages or quoted replies. Probably undefined or empty object
}

******************************
MessageContent possiblilities

- type TextMessage : {
  // This is the simplest form of a text message. It is used when there is plain text with no additional formatting or features
  conversation: 'Hello, how are you?'
}

- type ExtendedTextMessage : {
  // This message type includes additional features and metadata, such as mentions, links, or formatting (e.g., bold, italic)
  extendedTextMessage: {
    text: 'Check this out!',
    matchedText: '',
    canonicalUrl: '',
    description: '',
    title: '',
    previewType: 'NONE',
    ?jpegThumbnail: Buffer.from('...'), // Thumbnail in base64 format
  }
}

- type ImageMessage : {
  imageMessage: {
    mimetype: 'image/jpeg',
    ?caption: 'Look at this!',
    ?jpegThumbnail: Buffer.from('...'), // Thumbnail in base64 format
    ?url: 'https://mmg.whatsapp.net/...',
    mediaKey: Buffer.from('...'),
    fileSha256: Buffer.from('...'),
    fileLength: '12345',
    mediaKeyTimestamp: '1622543690'
  }
}

- type VideoMessage : {
  videoMessage: {
    mimetype: 'video/mp4',
    ?caption: 'Check this video!',
    ?jpegThumbnail: Buffer.from('...'), // Thumbnail in base64 format
    url: 'https://mmg.whatsapp.net/...',
    mediaKey: Buffer.from('...'),
    fileSha256: Buffer.from('...'),
    fileLength: '12345',
    mediaKeyTimestamp: '1622543690',
    seconds: 10,                         // Duration in seconds
    gifPlayback: false                   // Indicates if the video is a GIF
  }
}

- type AudioMessage : {
  audioMessage: {
    mimetype: 'audio/ogg; codecs=opus',
    url: 'https://mmg.whatsapp.net/...',
    mediaKey: Buffer.from('...'),
    fileSha256: Buffer.from('...'),
    fileLength: '12345',
    mediaKeyTimestamp: '1622543690',
    seconds: 15,                          // Duration in seconds
    ptt: true                             // Indicates if the audio is a voice note
  }
}

- type DocumentMessage :  {
  documentMessage: {
    mimetype: 'application/pdf',
    title: 'My Document.pdf',
    url: 'https://mmg.whatsapp.net/...',
    mediaKey: Buffer.from('...'),
    fileSha256: Buffer.from('...'),
    fileLength: '12345',
    pageCount: 10
  }
}

- type LocationMessage : {
  locationMessage: {
    degreesLatitude: 37.7749,
    degreesLongitude: -122.4194,
    name: 'San Francisco',
    address: 'San Francisco, CA, USA',
    url: '',
    ?jpegThumbnail: Buffer.from('...') // Thumbnail in base64 format
  }
}

- type ContactMessage : {
  contactMessage: {
    displayName: 'John Doe',
    vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD'
  }
}

- type ContactsArrayMessage : {
  contactsArrayMessage: {
    contacts: [
      {
        displayName: 'John Doe',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD'
      },
      {
        displayName: 'Jane Doe',
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Jane Doe\nTEL:+0987654321\nEND:VCARD'
      }
    ]
  }
}

- type ButtonsMessage : {
  buttonsMessage: {
    headerType: 1,
    contentText: 'Choose an option',
    footerText: 'Footer text',
    buttons: [
      { buttonId: 'id1', buttonText: { displayText: 'Button 1' }, type: 1 },
      { buttonId: 'id2', buttonText: { displayText: 'Button 2' }, type: 1 }
    ]
  }
}

- type TemplateMessage : {
  templateMessage: {
    hydratedTemplate: {
      hydratedContentText: 'Template message content',
      hydratedButtons: [
        { quickReplyButton: { displayText: 'Reply 1', id: 'reply1' } },
        { quickReplyButton: { displayText: 'Reply 2', id: 'reply2' } },
        { callButton: { displayText: 'Call Me', phoneNumber: '+1234567890' } }
      ]
    }
  }
}

- type ReactionMessage : {
  reactionMessage: {
    text: '👍',
    key: {
      remoteJid: 'phone_number@s.whatsapp.net',
      fromMe: false,
      id: 'message_id'
    }
  }
}

*******************
MessageContextInfo : messageContextInfo: {
  stanzaId: 'ABCD1234...',         // Unique ID of the original message
  participant: '1234567890@s.whatsapp.net', // Sender of the original message
  ?quotedMessage: {
    conversation: 'Original message text', // The content of the original message
  },
  forwardingScore: 1,              // Number of times the message has been forwarded
  isForwarded: true                // Indicates if the message is forwarded
}

messageContextInfo.quotedMessage: { // available for replied message only: {
  conversation: 'This is the message being replied to', // Text of the original message
    imageMessage: {
      mimetype: 'image/jpeg',
      jpegThumbnail: Buffer.from('...'), // Thumbnail of the image being replied to
      caption: 'An image caption'
    }
  }
}


*************
example code: https://github.com/adinyahya/whatsrice/blob/main/lib/myfunc.js#L7

 */

module.exports.isMessage = (data) => {
    if(!data) return false;
    if(!data.key) return false;
    if(!data.message) return false;
    if(!data.messageTimestamp) return false;
    return true;
};

module.exports.getMessageDate = (data) => {
	const messageTimestamp = this.isMessage(data) ? data.messageTimestamp : null;
	  if(!messageTimestamp)
		  return null;
	  return new Date(messageTimestamp * 1000);
  };

module.exports.getMessageKey = (data) => {
	const messageKey = this.isMessage(data) ? data.key : ({});
	if(!messageKey.remoteJid) return null;
	if(!messageKey.fromMe) return null;
	if(!messageKey.id) return null;
	return messageKey;
};

module.exports.messageContentTypes = {
    conversation: "conversation",
    extendedTextMessage: "extendedTextMessage",
    imageMessage: "imageMessage",
    videoMessage: "videoMessage",
    audioMessage: "audioMessage",
    documentMessage: "documentMessage",
    locationMessage: "locationMessage",
    contactMessage: "contactMessage",
    contactsArrayMessage: "contactsArrayMessage",
    buttonsMessage: "buttonsMessage",
    templateMessage: "templateMessage",
    reactionMessage: "reactionMessage",
};

module.exports.getMessageContentTypes = (data) => {
    const messageContent = this.isMessage(data) ? data.message : data;
    if(!messageContent)
        return null;
    for(let key in this.messageContentTypes) {
        if(key in messageContent)
            return this.messageContentTypes[key];
    }
    return null;
};

module.exports.isMessageContent = (data) => {
    return this.getMessageContentTypes(data) ? true : false;
};

module.exports.isTextMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.conversation;
};

module.exports.isExtTextMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.extendedTextMessage;
};


module.exports.isImageMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.imageMessage;
};

module.exports.isVideoMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.videoMessage;
};

module.exports.isAudioMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.audioMessage;
};

module.exports.isDocumentMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.documentMessage;
};

module.exports.isLocationMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.locationMessage;
};

module.exports.isContactMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.contactMessage;
};

module.exports.isContactsArrayMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.contactsArrayMessage;
};

module.exports.isButtonsMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.buttonsMessage;
};

module.exports.isTemplateMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.templateMessage;
};

module.exports.isReactionMessageContent = (data) => {
    return this.getMessageContentTypes(data) == this.messageContentTypes.reactionMessage;
};

module.exports.getMessageContent = (data) => {
    const type = this.getMessageContentTypes(data);
    if(!type) return null;
    return (this.isMessage() ? data.message : data)[type];
};