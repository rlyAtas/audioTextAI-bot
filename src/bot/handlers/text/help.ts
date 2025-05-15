import TelegramBot, { Message } from 'node-telegram-bot-api';

export function help(bot: TelegramBot, msg: Message) {
  bot.sendMessage(msg.chat.id, 'Help');
}
