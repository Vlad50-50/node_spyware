const TelegramBot = require('node-telegram-bot-api');
const bdataJson = require("../secret/botData.json")
const {google} = require('googleapis');
const fs = require('fs');
const bot = new TelegramBot(bdataJson.token, {polling: true});
const userId = bdataJson.author;

module.exports = {
  sendmail: async(mail) => {
    return bot.sendMessage(userId, mail);
  },
  uploadIMG: async(name, time) => {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./secret/google.json",
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({version: 'v3', auth});
    const response = drive.files.create({
        requestBody: {
            name: name + time,
            mimeType: 'image/jpg',
            parents: ['1HskEq4Ss7iKtpsuh8h9mp2zr1LqHALTw']
        },
        media: {
            mimeType: 'image/jpg',
            body: fs.createReadStream("./static/Imeges/" + name + ".jpg")
        }
    });
    return response;
  }
}
