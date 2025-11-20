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

        if(event.sendAcknowledgements == true) {
          for (const member of event.members) {
            await createNotification({
              recipientId: member._id,
              senderId: owner._id,
              notificationType: "EVENT_THANK_YOU",
              message: `${owner.firstName || owner.username} поблагодарил вас за  ${event.name}`,
              description: event.acknowledgementMessage || "",
              entityId: event._id,
              entityModel: "Event"
            });
          }
        }
      }

      // === 3. После завершения (24 ч. )===
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const eventsEnded24HoursAgo = await Event.find({
        endDate: {
          $gte: new Date(twentyFourHoursAgo.getTime() - 60 * 1000),
          $lte: new Date(twentyFourHoursAgo.getTime() + 60 * 1000),
        },
        isAnonymous: true,               // проверяем анонимность
        giftersRevealedAt: null          // не отправляли раньше (если используете boolean — giftersRevealed: false)
      });

      for (const event of eventsEnded24HoursAgo) {
        const owner = await User.findOne({ telegramId: event.owner });
        if (!owner) continue;

        // (опционально) можно проверить, есть ли подарки
        if (!event.gifts || event.gifts.length === 0) {
          console.log(`ℹ️ Событие "${event.name}" не имеет подарков — пропускаем раскрытие.`);
          // если хотите — всё равно можно отправить уведомление
          continue;
        }

        await createNotification({
          recipientId: owner._id,
          senderId: owner._id,
          notificationType: "EVENT_GIFTERS_REVEALED",
          message: `Дарители раскрыты!`,
          entityId: event._id,
          entityModel: "Event",
        });

        // помечаем событие, чтобы не отправлять повторно
        event.giftersRevealedAt = new Date();
        await event.save();

        console.log(`🔔 Уведомление: EVENT_GIFTERS_REVEALED отправлено владельцу ${owner.username || owner.telegramId} для события "${event.name}"`);
      }
    } catch (err) {
      console.error("❌ Ошибка при проверке событий:", err);
    }
  });

  console.log("🕓 Планировщик уведомлений событий запущен.");
};
