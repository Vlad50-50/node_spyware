const TelegramBot = require('node-telegram-bot-api');
const bdataJson = require("../secret/botData.json")
const bot = new TelegramBot(bdataJson.token, {polling: true});
const userId = bdataJson.author;

module.exports = {
    sendmail: async(mail) => {
      return bot.sendMessage(userId, mail);
    }
}