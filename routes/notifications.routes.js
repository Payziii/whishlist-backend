import express from "express";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

const MEMBER_SELECTION = '_id username telegramId name photo_url firstName lastName';

const buildEventResponse = async (eventDoc) => {
    const eventObject = eventDoc.toObject ? eventDoc.toObject() : { ...eventDoc };

    const ownerInfo = await User.findOne({
        telegramId: eventObject.owner
    }).select('telegramId username firstName lastName photo_url').lean();

    const reservedBySet = new Set();
    const giftOwnersSet = new Set();

    if (Array.isArray(eventObject.gifts)) {
        eventObject.gifts.forEach((gift) => {
            if (gift?.isReserved && gift?.reservedBy) {
                reservedBySet.add(gift.reservedBy);
            }
            if (gift?.owner) {
                giftOwnersSet.add(gift.owner);
            }
        });
    }

    const reservedUsersPromise = reservedBySet.size
        ? User.find({ telegramId: { $in: Array.from(reservedBySet) } })
            .select('telegramId username firstName lastName photo_url')
            .lean()
        : Promise.resolve([]);

    const giftOwnersPromise = giftOwnersSet.size
        ? User.find({ telegramId: { $in: Array.from(giftOwnersSet) } })
            .select('telegramId username firstName lastName photo_url')
            .lean()
        : Promise.resolve([]);

    const [reservedUsers, giftOwners] = await Promise.all([reservedUsersPromise, giftOwnersPromise]);

    const reservedUsersMap = reservedUsers.reduce((map, user) => {
        map[user.telegramId] = user;
        return map;
    }, {});

    const giftOwnersMap = giftOwners.reduce((map, user) => {
        map[user.telegramId] = user;
        return map;
    }, {});

    eventObject.ownerInfo = ownerInfo || null;

    eventObject.gifts = (eventObject.gifts || []).map((gift) => {
        const currentGift = gift.toObject ? gift.toObject() : { ...gift };
        return {
            ...currentGift,
            ownerInfo: currentGift.owner
                ? giftOwnersMap[currentGift.owner] || {
                    telegramId: currentGift.owner,
                    username: "",
                    firstName: "",
                    lastName: "",
                    photo_url: ""
                }
                : null,
            reservedUserInfo: currentGift.isReserved && currentGift.reservedBy
                ? reservedUsersMap[currentGift.reservedBy] || {}
                : {}
        };
    });

    return eventObject;
};

const enrichNotificationsWithLastEvent = async (notifications) => {
    const relevantNotifications = notifications.filter((notification) =>
        notification &&
        notification.type === 'GIFT_THANK_YOU_NOTE' &&
        notification.entityModel === 'Gift' &&
        notification.entityId
    );

    if (!relevantNotifications.length) {
        return notifications;
    }

    const giftIds = Array.from(new Set(relevantNotifications.map((notification) => {
        const entityId = notification.entityId;
        if (!entityId) {
            return null;
        }
        return typeof entityId === 'string' ? entityId : entityId.toString();
    }).filter(Boolean)));

    if (!giftIds.length) {
        return notifications;
    }

    const now = new Date();

    const events = await Event.find({
        gifts: { $in: giftIds },
        endDate: { $ne: null, $lte: now }
    })
        .populate({
            path: 'gifts',
            populate: { path: 'tags' }
        })
        .populate('members', MEMBER_SELECTION)
        .sort({ endDate: -1 });

    if (!events.length) {
        return notifications;
    }

    const giftIdsSet = new Set(giftIds);
    const lastEventByGift = new Map();

    for (const event of events) {
        const giftsInEvent = (event.gifts || []).map((gift) => {
            if (!gift) {
                return null;
            }
            if (gift._id) {
                return gift._id.toString();
            }
            return gift.toString ? gift.toString() : null;
        }).filter(Boolean);

        for (const giftId of giftsInEvent) {
            if (!giftIdsSet.has(giftId) || lastEventByGift.has(giftId)) {
                continue;
            }
            lastEventByGift.set(giftId, event);
        }

        if (lastEventByGift.size === giftIdsSet.size) {
            break;
        }
    }

    if (!lastEventByGift.size) {
        return notifications;
    }

    const eventCache = new Map();

    for (const notification of notifications) {
        if (notification.type !== 'GIFT_THANK_YOU_NOTE' || notification.entityModel !== 'Gift' || !notification.entityId) {
            continue;
        }

        const rawEntityId = notification.entityId;
        const giftId = typeof rawEntityId === 'string' ? rawEntityId : rawEntityId.toString();
        const matchedEvent = lastEventByGift.get(giftId);

        if (!matchedEvent) {
            continue;
        }

        const eventId = matchedEvent._id.toString();
        if (!eventCache.has(eventId)) {
            eventCache.set(eventId, await buildEventResponse(matchedEvent));
        }

        notification.lastCompletedEvent = eventCache.get(eventId);
    }

    return notifications;
};

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Управление уведомлениями пользователей
 *
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор уведомления.
 *           example: 60d0fe4f5311236168a109cb
 *         recipient:
 *           type: string
 *           description: ID пользователя-получателя уведомления.
 *           example: 60d0fe4f5311236168a109ca
 *         sender:
 *           type: string
 *           description: ID пользователя-инициатора уведомления (отправителя).
 *           example: 60d0fe4f5311236168a109cc
 *         type:
 *           type: string
 *           description: Тип уведомления.
 *           enum:
 *             - FRIEND_REQUEST
 *             - FRIEND_REQUEST_ACCEPTED
 *             - FRIEND_REQUEST_DECLINED
 *             - EVENT_INVITATION
 *             - EVENT_PARTICIPANT_JOINED
 *             - EVENT_PARTICIPANT_LEFT
 *             - EVENT_STARTING_SOON
 *             - EVENT_THANK_YOU
 *             - EVENT_COMPLETED
 *             - EVENT_GIFTERS_REVEALED
 *             - GIFT_RESERVED
 *             - GIFT_GIVEN
 *             - GIFT_THANK_YOU_NOTE
 *             - GIFT_FUNDRAISING_OPENED
 *             - GIFT_FUNDRAISING_CLOSED
 *           example: FRIEND_REQUEST
 *         message:
 *           type: string
 *           description: Текст уведомления, который видит пользователь.
 *           example: "Иван Иванов хочет с вами дружить"
 *         entityId:
 *           type: string
 *           description: ID связанной сущности (события, подарка, пользователя).
 *           example: 60d0fe4f5311236168a109cd
 *         isRead:
 *           type: boolean
 *           description: Статус прочтения уведомления.
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания уведомления.
 *           example: "2024-08-25T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления уведомления.
 *           example: "2024-08-25T10:00:00Z"
 */

// --- GET ALL (Получить все уведомления пользователя) ---

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Получить список всех уведомлений текущего пользователя
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Успешный ответ со списком уведомлений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        
        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });

        const userLang = currentUser.language || 'ru';

        const notifications = await Notification.find({ recipient: currentUser._id })
            .populate('sender', 'telegramId firstName lastName username photo_url') 
            .sort({ createdAt: -1 })
            .lean();

        const localizedNotifications = notifications.map(notif => {
            return {
                ...notif,
                // Магия тут: выбираем нужное поле и кладем в стандартное 'message'
                message: userLang === 'en' ? notif.message_en : notif.message,
                
                // Удаляем лишние технические поля, чтобы не слать мусор (опционально)
                message_en: undefined
            };
        });

        const enrichedNotifications = await enrichNotificationsWithLastEvent(localizedNotifications);

        res.status(200).json(enrichedNotifications);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- GET UNREAD (Получить непрочитанные уведомления) ---

/**
 * @swagger
 * /notifications/unread:
 *   get:
 *     summary: Получить список непрочитанных уведомлений
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Список непрочитанных уведомлений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/unread", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });

        const userLang = currentUser.language || 'ru';

        const unreadNotifications = await Notification.find({
            recipient: currentUser._id,
            isRead: false
        })
        .populate('sender', 'telegramId firstName lastName username photo_url') 
        .sort({ createdAt: -1 })
        .lean();

        const localizedNotifications = unreadNotifications.map(notif => {
            return {
                ...notif,
                // Магия тут: выбираем нужное поле и кладем в стандартное 'message'
                message: userLang === 'en' ? notif.message_en : notif.message,
                
                // Удаляем лишние технические поля, чтобы не слать мусор (опционально)
                message_en: undefined
            };
        });

        const enrichedNotifications = await enrichNotificationsWithLastEvent(localizedNotifications);

        res.status(200).json(enrichedNotifications);

    } catch (error)
        {
        res.status(500).json({ message: error.message });
    }
});

// --- MARK AS READ (Отметить конкретное уведомление как прочитанное) ---

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Отметить конкретное уведомление как прочитанное
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID уведомления для отметки
 *     responses:
 *       200:
 *         description: Уведомление успешно отмечено как прочитанное
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Уведомление не найдено или не принадлежит пользователю
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.patch("/:notificationId/read", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        const { notificationId } = req.params;

        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });
        
        const updatedNotification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: currentUser._id },
            { $set: { isRead: true } },
            { new: true } 
        ).populate('sender', 'telegramId firstName lastName username photo_url');

        if (!updatedNotification) {
            return res.status(404).json({ message: 'Notification not found or you do not have permission to edit it.' });
        }

        res.status(200).json(updatedNotification);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- MARK ALL AS READ (Отметить все уведомления как прочитанные) ---

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     summary: Отметить все уведомления как прочитанные
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Все уведомления успешно отмечены как прочитанные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully marked 5 notifications as read."
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/read-all", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        const currentUser = await User.findOne({ telegramId: currentUserTelegramId });
        
        const result = await Notification.updateMany(
            { recipient: currentUser._id, isRead: false },
            { $set: { isRead: true } }
        ).populate('sender', 'telegramId firstName lastName username photo_url');

        res.status(200).json({ 
            message: `Successfully marked ${result.modifiedCount} notifications as read.`,
            count: result.modifiedCount
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
