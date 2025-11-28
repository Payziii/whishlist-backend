import express from "express";
import mongoose from 'mongoose';
import Event from "../models/event.model.js";
import Gift from "../models/gift.model.js";
import User from "../models/user.model.js";
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createNotification } from '../services/notification.service.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор события.
 *           example: "64e32c3b4f1b2c001f8e4c7a"
 *         owner:
 *           type: number
 *           description: Telegram ID владельца события.
 *           example: 123456789
 *         name:
 *           type: string
 *           description: Название события.
 *           example: "День Рождения"
 *         description:
 *           type: string
 *           description: Детальное описание события.
 *           example: "Празднуем в загородном доме, будет шашлык и торт!"
 *         image:
 *           type: string
 *           description: URL-адрес изображения события.
 *           example: "https://whishlist.hubforad.com/images/some_image_id"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Дата и время начала события.
 *           example: "2025-06-15T15:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Дата и время окончания события.
 *           example: "2025-06-15T15:00:00.000Z"
 *         gifts:
 *           type: array
 *           items:
 *             type: string
 *           description: Массив ID подарков, привязанных к событию.
 *           example: ["60c72b2f9b1d8c001f8e4c6d", "60c72b3a9b1d8c001f8e4c6e"]
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: Массив ID пользователей-участников события.
 *           example: ["507f1f77bcf86cd799439011"]
*         viewers:
 *           type: array
 *           items:
 *             type: string
 *           description: Массив ID пользователей, которые имеют доступ к просмотру приватного события. Если массив пуст или поле отсутствует, событие считается публичным.
 *           example: ["507f1f77bcf86cd799439012"]
 *         isAnonymous:
 *           type: boolean
 *           description: Если true, дарители будут скрыты до окончания события.
 *           default: false
 *         sendInvitations:
 *           type: boolean
 *           description: Отправлять ли приглашения (логика на бэкенде).
 *           default: false
 *         sendAcknowledgements:
 *           type: boolean
 *           description: Отправлять ли благодарности после события.
 *           default: false
 *         acknowledgementMessage:
 *           type: string
 *           description: Шаблон сообщения с благодарностью.
 *           example: "Большое спасибо {имя} за участие в событии {Событие}!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания записи.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления записи.
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: API для управления событиями
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Создать новое событие
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название события.
 *                 example: "Мой День Рождения"
 *               description:
 *                 type: string
 *                 description: Описание деталей события.
 *                 example: "Встречаемся в 18:00 в кафе 'Уют'. Дресс-код: праздничный."
 *               image:
 *                 type: string
 *                 description: Изображение в формате Base64.
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Дата и время начала события.
 *                 example: "2025-06-15T15:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Дата и время окончания события.
 *                 example: "2025-06-15T15:00:00.000Z"
 *               gifts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID подарков из вишлиста пользователя для добавления в событие.
 *                 example: ["60c72b2f9b1d8c001f8e4c6d", "60c72b3a9b1d8c001f8e4c6e"]
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID или Telegram username пользователей для добавления в событие в качестве участников.
 *                 example: ["64e32c3b4f1b2c001f8e4c7a", "user_telegram_name"]
 *               viewers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID или Telegram username пользователей, которым будет разрешен просмотр приватного события. Если не указан или пуст, событие будет публичным.
 *                 example: ["64e32c3b4f1b2c001f8e4c7b", "another_user_telegram"]
 *               isAnonymous:
 *                 type: boolean
 *                 description: Сделать дарителей анонимными до конца события.
 *                 example: true
 *               sendInvitations:
 *                 type: boolean
 *                 description: Отправить приглашения друзьям.
 *                 example: true
 *               sendAcknowledgements:
 *                 type: boolean
 *                 description: Отправить благодарности после окончания события.
 *                 example: true
 *               acknowledgementMessage:
 *                 type: string
 *                 description: Персонализированное сообщение для благодарности.
 *                 example: "Спасибо за то, что разделили этот день со мной!"
 *     responses:
 *       201:
 *         description: Событие успешно создано.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad Request - Некорректные данные (например, указаны несуществующие пользователи или подарки).
 *       401:
 *         description: Unauthorized - Требуется авторизация.
 *       500:
 *         description: Internal Server Error - Ошибка на сервере (например, при загрузке изображения).
 */

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Редактировать существующее событие
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный идентификатор события.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               gifts:
 *                 type: array
 *                 items:
 *                   type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
*               viewers:
 *                 type: array
 *                 items:
 *                   type: string
 *               isAnonymous:
 *                 type: boolean
 *               sendInvitations:
 *                 type: boolean
 *               sendAcknowledgements:
 *                 type: boolean
 *               acknowledgementMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Событие успешно обновлено.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad Request - Некорректные данные.
 *       401:
 *         description: Unauthorized - Требуется авторизация.
 *       403:
 *         description: Forbidden - Нет прав на редактирование этого события.
 *       404:
 *         description: Not Found - Событие не найдено.
 *       500:
 *         description: Internal Server Error.
 */

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Удалить событие по ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный идентификатор события.
 *     responses:
 *       200:
 *         description: Событие успешно удалено.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event successfully deleted."
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden - Нет прав на удаление этого события.
 *       404:
 *         description: Not Found - Событие не найдено.
 *       500:
 *         description: Internal Server Error.
 */
 
 /**
 * @swagger
 * /events/list/{telegramId}:
 *   get:
 *     summary: Получить список событий, где пользователь является владельцем или участником
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         schema:
 *           type: string
 *         required: true
 *         description: Telegram ID пользователя для поиска его событий.
 *     responses:
 *       200:
 *         description: Список событий пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal Server Error.
 */

 /**
 * @swagger
 * /events/list:
 *   get:
 *     summary: Получить список событий в зависимости от параметра author
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *           enum: [me, friends]
 *         description: Фильтр событий по автору. 'me' - события текущего пользователя, 'friends' - события друзей текущего пользователя.
 *     responses:
 *       200:
 *         description: Список событий.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal Server Error.
 */

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Получить детальную информацию о событии по ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный идентификатор события.
 *     responses:
 *       200:
 *         description: Детальная информация о событии.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "64e32c3b4f1b2c001f8e4c7a"
 *                 owner:
 *                   type: number
 *                   example: 123456789
 *                 name:
 *                   type: string
 *                   example: "День Рождения"
 *                 gifts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Gift'
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       telegramId:
 *                         type: number
 *                       name:
 *                         type: string
 *       404:
 *         description: Event not found - Событие не найдено или неверный формат ID.
 *       500:
 *         description: Internal Server Error.
 */

// Create a new event
router.post("/", authMiddleware, async (req, res) => {
    const {
        name,
        description,
        image,
        startDate,
        endDate,
        gifts,
        members,
        viewers,
        isAnonymous,
        sendInvitations,
        sendAcknowledgements,
        acknowledgementMessage
    } = req.body;

    const ownerId = req.user.telegramId;

    try {
        // Validate gifts: check if they exist and belong to the user
        if (gifts && Array.isArray(gifts) && gifts.length > 0) {
            const foundGifts = await Gift.find({
                '_id': { $in: gifts },
                'owner': ownerId
            }).select('_id'); // Select only IDs for efficiency
            if (foundGifts.length !== gifts.length) {
                return res.status(400).json({ message: "One or more gifts are invalid or do not belong to you." });
            }
        }

        // --- Start: Member validation logic ---
        let memberObjectIds = [];
        if (members && Array.isArray(members) && members.length > 0) {
            const potentialObjectIds = [];
            const potentialUsernames = [];

            // Separate identifiers into ObjectIds and usernames
            members.forEach(identifier => {
                if (mongoose.Types.ObjectId.isValid(identifier)) {
                    potentialObjectIds.push(identifier);
                } else {
                    potentialUsernames.push(identifier);
                }
            });

            // Find all users matching the provided identifiers
            const foundUsers = await User.find({
                $or: [
                    { '_id': { $in: potentialObjectIds } },
                    { 'username': { $in: potentialUsernames } } // Предполагается, что в схеме User есть поле 'username'
                ]
            }).select('_id');

            // If not all members were found, return an error
            if (foundUsers.length !== members.length) {
                return res.status(400).json({ message: "One or more specified users were not found." });
            }

            memberObjectIds = foundUsers.map(user => user._id);
        }
        // --- End: Member validation logic ---

        // +++ НАЧАЛО: ДОБАВЬТЕ ЛОГИКУ ВАЛИДАЦИИ ДЛЯ VIEWERS
    let viewerObjectIds = [];
    if (viewers && Array.isArray(viewers) && viewers.length > 0) {
        const potentialObjectIds = [];
        const potentialUsernames = [];

        viewers.forEach(identifier => {
            if (mongoose.Types.ObjectId.isValid(identifier)) {
                potentialObjectIds.push(identifier);
            } else {
                potentialUsernames.push(identifier);
            }
        });

        const foundUsers = await User.find({
            $or: [
                { '_id': { $in: potentialObjectIds } },
                { 'username': { $in: potentialUsernames } }
            ]
        }).select('_id');

        if (foundUsers.length !== viewers.length) {
            return res.status(400).json({ message: "One or more specified users for viewing were not found." });
        }
        viewerObjectIds = foundUsers.map(user => user._id);
    }
    // +++ КОНЕЦ: ЛОГИКА ВАЛИДАЦИИ

        // Handle image upload if a base64 string is provided
        let imageUrl = image;
        if (image && image.startsWith('data:image')) {
             const response = await fetch("https://whishlist.hubforad.com/images", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ base64: image })
            });
            const responseData = await response.json();
            if (response.ok) {
                imageUrl = `https://whishlist.hubforad.com/images/${responseData.id}`;
            } else {
                 return res.status(500).json({ message: "Failed to upload image." });
            }
        }

        const newEvent = new Event({
            owner: ownerId,
            name,
            description,
            image: imageUrl,
            startDate,
            endDate,
            gifts: gifts || [],
            members: memberObjectIds,
            viewers: viewerObjectIds,
            isAnonymous,
            sendInvitations,
            sendAcknowledgements,
            acknowledgementMessage
        });

        const savedEvent = await newEvent.save();

        if (sendInvitations) {
            const sender = await User.findOne({ telegramId: ownerId });

            if (sender) {
                let recipients = [];
                const userFriends = sender.friends || [];

                if (viewerObjectIds && viewerObjectIds.length > 0) {
                    recipients = userFriends.filter(friendId => 
                        viewerObjectIds.some(viewerId => viewerId.toString() === friendId.toString())
                    );
                } else {
                    recipients = userFriends;
                }

                for (const recipientId of recipients) {
                    if (sender._id.equals(recipientId)) continue;

                    // if (memberObjectIds.some(m => m.toString() === recipientId.toString())) continue;

                    await createNotification({
                        recipientId: recipientId,
                        senderId: sender._id,
                        notificationType: 'EVENT_INVITATION',
                        message: `${sender.firstName || sender.username} пригласил вас на событие "${savedEvent.name}"`,
                        entityId: savedEvent._id,
                        entityModel: 'Event'
                    });
                }
            }
        }

        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Edit an existing event
router.put("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.telegramId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "Event not found." });
    }

    try {
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        if (event.owner !== ownerId) {
            return res.status(403).json({ message: "You are not authorized to edit this event." });
        }
        
        // Update fields if they are provided in the request body
        event.name = req.body.name || event.name;
        event.description = req.body.description || event.description;
        event.startDate = req.body.startDate || event.startDate;
        event.endDate = req.body.endDate || event.endDate;
        event.acknowledgementMessage = req.body.acknowledgementMessage || event.acknowledgementMessage;

        // For booleans, check if they are explicitly defined to allow setting them to `false`
        if (req.body.isAnonymous !== undefined) event.isAnonymous = req.body.isAnonymous;
        if (req.body.sendInvitations !== undefined) event.sendInvitations = req.body.sendInvitations;
        if (req.body.sendAcknowledgements !== undefined) event.sendAcknowledgements = req.body.sendAcknowledgements;

        if (req.body.viewers !== undefined) {
        if (Array.isArray(req.body.viewers) && req.body.viewers.length > 0) {
           const foundUsers = await User.find({ '_id': { $in: req.body.viewers }}).select('_id');
           if (foundUsers.length !== req.body.viewers.length) {
               return res.status(400).json({ message: "One or more users for viewing were not found." });
           }
       }
       event.viewers = req.body.viewers;
   }

        // Update image
        if (req.body.image) {
             if (req.body.image.startsWith('data:image')) { // Check for new base64 image
                const response = await fetch("https://whishlist.hubforad.com/images", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ base64: req.body.image })
                });
                const responseData = await response.json();
                if (response.ok) {
                    event.image = `https://whishlist.hubforad.com/images/${responseData.id}`;
                } else {
                    return res.status(500).json({ message: "Failed to upload new image." });
                }
            } else { // Assume it's a URL or unchanged
                 event.image = req.body.image;
            }
        }
        
        // Update gifts list
        if (req.body.gifts !== undefined) {
            if (Array.isArray(req.body.gifts) && req.body.gifts.length > 0) {
                 const foundGifts = await Gift.find({ '_id': { $in: req.body.gifts }, 'owner': ownerId }).select('_id');
                 if (foundGifts.length !== req.body.gifts.length) {
                     return res.status(400).json({ message: "One or more gifts are invalid or do not belong to you." });
                 }
            }
            event.gifts = req.body.gifts;
        }
        
        // Update members list
        if (req.body.members !== undefined) {
             if (Array.isArray(req.body.members) && req.body.members.length > 0) {
                const foundUsers = await User.find({ '_id': { $in: req.body.members }}).select('_id');
                if (foundUsers.length !== req.body.members.length) {
                    return res.status(400).json({ message: "One or more users were not found." });
                }
            }
            event.members = req.body.members;
        }

        const updatedEvent = await event.save();
        res.json(updatedEvent);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Delete an event
router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.telegramId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "Event not found." });
    }

    try {
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        if (event.owner !== ownerId) {
            return res.status(403).json({ message: "You are not authorized to delete this event." });
        }

        await event.deleteOne();

        res.json({ message: "Event successfully deleted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const { author } = req.query;
    const userId = req.user.telegramId;

    const user = await User.findOne({ telegramId: userId }).populate('friends');
    const currentUserObjectId = user._id;

    const isVisibleCondition = {
      $or: [
        { viewers: { $exists: false } },
        { viewers: { $size: 0 } },
        { viewers: currentUserObjectId },
        { members: currentUserObjectId }
      ]
    };

    let query = {};

    if (author === 'me') {
      query.owner = userId; 
    } else if (author === 'friends') {
      const friendIds = user.friends.map(friend => friend.telegramId);
      
      query = {
        owner: { $in: friendIds },
        ...isVisibleCondition 
      };

    } else {
      const friendIds = user.friends.map(friend => friend.telegramId);

      query = {
        $or: [
          { owner: userId },
          
          { members: currentUserObjectId },

          {
            owner: { $in: friendIds },
            $or: [
                 { viewers: { $exists: false } },
                 { viewers: { $size: 0 } },
                 { viewers: currentUserObjectId }
            ]
          }
        ]
      };
    }

    const events = await Event.find(query)
      .populate('members', '_id username telegramId name photo_url firstName lastName')
      .lean();
    
    const eventsWithOwner = await Promise.all(
      events.map(async event => {
        const ownerUser = await User.findOne({ telegramId: event.owner })
          .select('telegramId username firstName lastName photo_url')
          .lean();

        return {
          ...event,
          ownerInfo: ownerUser
            ? {
                telegramId: ownerUser.telegramId,
                username: ownerUser.username,
                firstName: ownerUser.firstName,
                lastName: ownerUser.lastName,
                photo_url: ownerUser.photo_url
              }
            : null
        };
      })
    );

    res.send(eventsWithOwner);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.get("/list/:telegramId", authMiddleware, async (req, res) => {
    try {
        // ID целевого пользователя (из URL)
        const targetTelegramId = req.params.telegramId; 
        // ID текущего пользователя, который делает запрос (из токена)
        const requesterTelegramId = req.user.telegramId;

        // Находим документы обоих пользователей, чтобы получить их Mongo _id
        const targetUser = await User.findOne({ telegramId: targetTelegramId }).select('_id');
        const requesterUser = await User.findOne({ telegramId: requesterTelegramId }).select('_id');
        
        // Шаг 1: Базовый запрос, как и был - ищем события, где целевой пользователь
        // является владельцем или участником.
        const baseQuery = {
            $or: [
                { owner: targetTelegramId },
                { members: targetUser._id }
            ]
        };

        // Шаг 2: Добавляем условия видимости для того, кто запрашивает
        const privacyQuery = {
            $or: [
                // Событие публичное (viewers не существует или пустой массив)
                { viewers: { $exists: false } },
                { viewers: { $size: 0 } },
                // Запрашивающий - владелец
                { owner: requesterTelegramId },
            ]
        };
        
        // Если запрашивающий пользователь есть в базе, добавляем проверку по _id
        if (requesterUser) {
            privacyQuery.$or.push({ members: requesterUser._id });
            privacyQuery.$or.push({ viewers: requesterUser._id });
        }
        
        // Объединяем запросы: событие должно соответствовать И базовой логике, И логике приватности
        const finalQuery = { $and: [baseQuery, privacyQuery] };
        
        const events = await Event.find(finalQuery).populate('members', '_id username telegramId name photo_url firstName lastName').lean();
        
        const eventsWithOwnerInfo = await Promise.all(
            events.map(async event => {
                const ownerUser = await User.findOne({ telegramId: event.owner })
                    .select('telegramId username firstName lastName photo_url')
                    .lean();

                return {
                    ...event,
                    ownerInfo: ownerUser ? {
                        telegramId: ownerUser.telegramId,
                        username: ownerUser.username,
                        firstName: ownerUser.firstName,
                        lastName: ownerUser.lastName,
                        photo_url: ownerUser.photo_url
                    } : null
                };
            })
        );

        res.json(eventsWithOwnerInfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const requesterTelegramId = req.user.telegramId;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: "Event not found. Invalid ID format." });
        }

        // Базовый запрос события
        let eventQuery = Event.findById(id)
            .populate({
                path: 'gifts',
                populate: { path: 'tags' }
            })
            .populate('members', '_id username telegramId name photo_url firstName lastName');

        const event = await eventQuery;
        
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Проверка доступа
        const isPublic = !event.viewers || event.viewers.length === 0;
        
        if (!isPublic) {
            const requesterUser = await User.findOne({ telegramId: requesterTelegramId }).select('_id');
            const isOwner = event.owner === requesterTelegramId;
            const isMember = requesterUser ? event.members.some(member => member._id.equals(requesterUser._id)) : false;
            const isViewer = requesterUser ? event.viewers.some(viewer => viewer.equals(requesterUser._id)) : false;

            if (!isOwner && !isMember && !isViewer) {
                return res.status(404).json({ message: "Event not found." });
            }
        }

        // Получаем информацию о владельце события
        const ownerUser = await User.findOne({ 
            telegramId: event.owner 
        }).select('telegramId username firstName lastName photo_url').lean();

        // Собираем информацию о пользователях, забронировавших подарки
        const reservedBySet = new Set();
        // Собираем telegramId владельцев подарков для получения их информации
        const giftOwnersSet = new Set();
        
        event.gifts.forEach(gift => {
            if (gift.isReserved && gift.reservedBy) {
                reservedBySet.add(gift.reservedBy);
            }
            // Добавляем владельца подарка в набор
            if (gift.owner) {
                giftOwnersSet.add(gift.owner);
            }
        });

        const uniqueReservedBy = Array.from(reservedBySet);
        const uniqueGiftOwners = Array.from(giftOwnersSet);
        
        let reservedUsersMap = {};
        let giftOwnersMap = {};

        // Получаем информацию о пользователях, забронировавших подарки
        if (uniqueReservedBy.length > 0) {
            const reservedUsers = await User.find({ 
                telegramId: { $in: uniqueReservedBy } 
            }).select('telegramId username firstName lastName photo_url').lean();
            
            reservedUsersMap = reservedUsers.reduce((map, user) => {
                map[user.telegramId] = user;
                return map;
            }, {});
        }

        // Получаем информацию о владельцах подарков
        if (uniqueGiftOwners.length > 0) {
            const giftOwners = await User.find({ 
                telegramId: { $in: uniqueGiftOwners } 
            }).select('telegramId username firstName lastName photo_url').lean();
            
            giftOwnersMap = giftOwners.reduce((map, user) => {
                map[user.telegramId] = user;
                return map;
            }, {});
        }

        // Преобразуем событие в объект и добавляем дополнительную информацию
        const eventResponse = event.toObject();

        const isGiftOwner = event.owner === requesterTelegramId;
        const isSecretMode = event.isAnonymous && !event.giftersRevealedAt && isGiftOwner;
        
        eventResponse.ownerInfo = ownerUser || null;
        eventResponse.gifts = eventResponse.gifts.map(gift => {
            const isMyReservation = gift.reservedBy === requesterTelegramId;

            const showGifterInfo = !isSecretMode || isMyReservation;

            const giftOwnerInfo = gift.owner ? (giftOwnersMap[gift.owner] || {
                telegramId: gift.owner,
                username: "",
                firstName: "",
                lastName: "",
                photo_url: ""
            }) : null;

            let reservedUserInfo = {};
            
            if (gift.isReserved && gift.reservedBy) {
                if (showGifterInfo) {
                    reservedUserInfo = reservedUsersMap[gift.reservedBy] || {};
                } else {
                    reservedUserInfo = {
                        telegramId: null, 
                        username: "Аноним",
                        firstName: "Анонимный",
                        lastName: "Даритель",
                        photo_url: null, 
                        isAnonymous: true 
                    };
                }
            }

            return {
                ...gift,
                ownerInfo: giftOwnerInfo,
                reservedUserInfo: reservedUserInfo
            };
        });

        return res.json(eventResponse);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /events/{eventId}/join:
 *   post:
 *     summary: Присоединиться к событию как участник
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID события, к которому нужно присоединиться.
 *     responses:
 *       200:
 *         description: Пользователь успешно добавлен в участники события.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Некорректные данные или пользователь уже является участником события.
 *       401:
 *         description: Требуется авторизация.
 *       404:
 *         description: Событие или пользователь не найден.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.post("/:eventId/join", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const telegramId = req.user.telegramId;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (event.members.includes(user._id)) {
      return res.status(400).json({ message: "You are already a participant of this event." });
    }

    event.members.push(user._id);
    await event.save();

    // Notify the event owner
    const sender = user;
    const ownerUser = await User.findOne({ telegramId: event.owner });
    if (ownerUser && !ownerUser._id.equals(user._id)) {
      await createNotification({
        recipientId: ownerUser._id,
        senderId: sender._id,
        notificationType: "EVENT_PARTICIPANT_JOINED",
        message: `${sender.firstName || sender.username} присоединился к ${event.name}`,
        entityId: event._id,
        entityModel: "Event",
      });
    }

    res.status(200).json({ message: "You have successfully joined the event." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /events/{id}/members/{memberId}:
 *   delete:
 *     summary: Удалить участника из события
 *     description: Удаляет пользователя из списка участников события. Это действие доступно только владельцу события.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный идентификатор события (MongoDB _id).
 *       - in: path
 *         name: memberId
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный идентификатор пользователя (MongoDB _id), которого нужно удалить.
 *     responses:
 *       200:
 *         description: Участник успешно удален. Возвращает обновленный объект события.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Некорректный ID события или участника.
 *       403:
 *         description: Forbidden - Только владелец события может удалять участников.
 *       404:
 *         description: Событие не найдено.
 *       500:
 *         description: Internal Server Error.
 */
router.delete("/:id/members/:memberId", authMiddleware, async (req, res) => {
    const { id, memberId } = req.params;
    const ownerId = req.user.telegramId;

    // Проверяем валидность MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: "Invalid Event ID or Member ID format." });
    }

    try {
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // ПРОВЕРКА ПРАВ: Только владелец может удалять участников
        if (event.owner !== ownerId) {
            return res.status(403).json({ message: "You are not authorized to remove members from this event." });
        }

        // Проверяем, есть ли такой участник вообще (опционально, но полезно для UX)
        if (!event.members.includes(memberId)) {
            return res.status(404).json({ message: "Member not found in this event." });
        }

        // Удаляем участника из массива (используем метод pull от Mongoose для массивов)
        event.members.pull(memberId);

        const updatedEvent = await event.save();

        // Опционально: Можно отправить уведомление удаленному пользователю здесь
        // createNotification(...) 

        res.json(updatedEvent);
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /events/{eventId}/addGift/{giftId}:
 *   post:
 *     summary: Добавить существующий подарок в событие
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID события.
 *       - in: path
 *         name: giftId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID существующего подарка.
 *     responses:
 *       200:
 *         description: Подарок успешно добавлен в событие.
 *       400:
 *         description: Некорректные данные или подарок уже привязан к событию.
 *       401:
 *         description: Требуется авторизация.
 *       403:
 *         description: Нет прав на добавление подарка в это событие.
 *       404:
 *         description: Событие или подарок не найдены.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.post("/:eventId/addGift/:giftId", authMiddleware, async (req, res) => {
  try {
    const { eventId, giftId } = req.params;
    const telegramId = req.user.telegramId;

    if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(giftId)) {
      return res.status(400).json({ message: "Invalid event or gift ID." });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res.status(404).json({ message: "Gift not found." });
    }

    const user = await User.findOne({ telegramId }).select("_id");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const isOwner = event.owner === telegramId;
    const isMember = event.members.some(memberId => memberId.equals(user._id));

    // Проверяем, что текущий пользователь — владелец или участник события
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "You are not authorized to add gifts to this event." });
    }

    // Проверяем, не добавлен ли уже этот подарок
    if (event.gifts.includes(giftId)) {
      return res.status(400).json({ message: "This gift is already added to the event." });
    }

    event.gifts.push(giftId);
    await event.save();

    res.status(200).json({ message: "Gift successfully added to the event." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /events/{eventId}/addGifts:
 *   post:
 *     summary: Добавить один или несколько подарков в событие
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID события.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               giftIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив ID подарков для добавления
 *                 example: ["giftId1", "giftId2"]
 *     responses:
 *       200:
 *         description: Подарки успешно добавлены в событие.
 *       400:
 *         description: Некорректные данные или некоторые подарки уже привязаны к событию.
 *       401:
 *         description: Требуется авторизация.
 *       403:
 *         description: Нет прав на добавление подарков в это событие.
 *       404:
 *         description: Событие или некоторые подарки не найдены.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.post("/:eventId/addGifts", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { giftIds } = req.body; // массив ID подарков
    const telegramId = req.user.telegramId;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    if (!Array.isArray(giftIds) || giftIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "Invalid gift IDs." });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const gifts = await Gift.find({ _id: { $in: giftIds } });
    if (gifts.length !== giftIds.length) {
      return res.status(404).json({ message: "One or more gifts not found." });
    }

    const user = await User.findOne({ telegramId }).select("_id");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const isOwner = event.owner === telegramId;
    const isMember = event.members.some(memberId => memberId.equals(user._id));

    // Проверяем, что текущий пользователь — владелец или участник события
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "You are not authorized to add gifts to this event." });
    }

    // Определяем подарки, уже добавленные в событие
    const alreadyAddedIds = event.gifts.map(id => id.toString());

    // Находим подарки, которые ещё не добавлены
    const newGiftIds = giftIds.filter(id => !alreadyAddedIds.includes(id));

    // Можно вернуть сообщение, если все подарки уже были добавлены
    if (newGiftIds.length === 0) {
      return res.status(400).json({ message: "All specified gifts are already added to the event." });
    }

    // Добавляем новые подарки
    event.gifts.push(...newGiftIds);
    await event.save();

    res.status(200).json({ message: "Gifts successfully added to the event.", addedGiftIds: newGiftIds });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/**
 * @swagger
 * /events/{eventId}/my-gifts:
 *   get:
 *     summary: Получить подарки, которые пользователь подарил и которые подарили пользователю в рамках события
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID события.
 *     responses:
 *       200:
 *         description: Список подарков, подаренных и полученных пользователем.
 *       404:
 *         description: Событие не найдено.
 *       500:
 *         description: Внутренняя ошибка сервера.
 */
router.get("/:eventId/my-gifts", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const telegramId = req.user.telegramId;

    // Проверяем ID события
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Ищем событие
    const event = await Event.findById(eventId).populate('gifts');
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Фильтруем подарки
    const givenGifts = event.gifts.filter(
      (gift) => gift.reservedBy === telegramId
    );

    const receivedGifts = event.gifts.filter(
      (gift) => gift.owner === telegramId
    );

    res.status(200).json({
      givenGifts,
      receivedGifts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;