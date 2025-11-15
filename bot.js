// bot.js
import { Bot, InlineKeyboard, InputFile } from "grammy";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const bot = new Bot(process.env.BOT_TOKEN);

async function sendWelcomeMessage(chatId) {
  const imageUrl = "https://whishlist.hubforad.com/images/default/691360aa02e8dbbef2ce3dbf";
  const captionText =
    "Добро пожаловать в WishList!\n\nСоздавайте вишлисты, планируйте события и следите за друзьями — всё в одном месте.";
  const buttonUrl = "https://t.me/testwishhhbot?startapp";

  const keyboard = new InlineKeyboard().url("Начать", buttonUrl);

  try {
    // Скачиваем картинку в память (Node 18+ имеет fetch; если нет — установите node-fetch или используйте axios)
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Имя файла указываем с подходящим расширением, если знаете — например welcome.jpg
    const inputFile = new InputFile(buffer, "welcome.jpg");

    await bot.api.sendPhoto(chatId, inputFile, {
      caption: captionText,
      reply_markup: keyboard,
    });

    console.log(`Приветственное сообщение отправлено в чат ${chatId}`);
  } catch (error) {
    console.error(`Ошибка при отправке приветственного сообщения в чат ${chatId}:`, error);
  }
}

bot.command("start", async (ctx) => {
  await sendWelcomeMessage(ctx.chat.id);
});

function runBot() {
  bot.start();
  console.log("Telegram бот запущен!");
}

export { runBot };
