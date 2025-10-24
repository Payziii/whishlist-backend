import cron from "node-cron";
import Event from "./models/event.model.js";
import User from "./models/user.model.js";
import { createNotification } from "./services/notification.service.js";

/**
 * Планировщик уведомлений по событиям
 * - За сутки до начала: "EVENT_STARTING_SOON"
 * - После окончания: "EVENT_COMPLETED"
 */
export const initEventScheduler = () => {
  // Проверяем каждую минуту
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // За сутки до начала события
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Ищем события, которые начнутся через сутки (±1 мин)
      const eventsStartingSoon = await Event.find({
        startDate: {
          $gte: new Date(oneDayFromNow.getTime() - 60 * 1000),
          $lte: new Date(oneDayFromNow.getTime() + 0 * 1000),
        },
      });

      // Ищем события, которые только что закончились (±1 мин)
      const eventsJustEnded = await Event.find({
        endDate: {
          $gte: new Date(now.getTime() - 60 * 1000),
          $lte: new Date(now.getTime() + 60 * 1000),
        },
      });

      // === 1. За сутки до начала ===
      for (const event of eventsStartingSoon) {
        const owner = await User.findOne({ telegramId: event.owner });
        if (!owner) continue;

        await createNotification({
          recipientId: owner._id,
          senderId: owner._id, // сам себе
          notificationType: "EVENT_STARTING_SOON",
          message: `${event.name} запланировано на ${new Date(event.startDate).toLocaleString("ru-RU")}`,
          entityId: event._id,
          entityModel: "Event",
        });

        console.log(`📅 Уведомление: "${event.name}" начинается через сутки (отправлено ${owner.username || owner.telegramId})`);
      }

      // === 2. После завершения ===
      for (const event of eventsJustEnded) {
        const owner = await User.findOne({ telegramId: event.owner });
        if (!owner) continue;

        await createNotification({
          recipientId: owner._id,
          senderId: owner._id,
          notificationType: "EVENT_COMPLETED",
          message: `Время писать благодарности`,
          entityId: event._id,
          entityModel: "Event",
        });

        console.log(`✅ Уведомление: "${event.name}" завершилось (отправлено ${owner.username || owner.telegramId})`);
      }
    } catch (err) {
      console.error("❌ Ошибка при проверке событий:", err);
    }
  });

  console.log("🕓 Планировщик уведомлений событий запущен.");
};
