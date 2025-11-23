import express from "express"
import User from "../models/user.model.js"
import Tag from '../models/tag.model.js';
import Gift from '../models/gift.model.js';
import { verifyTelegramWebAppData, authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

const DEFAULT_TAGS = [
    { name: "Новый год", color: "#655AF6", background: "#E5E9FF" }, // Фиолетовый
    { name: "Рождество", color: "#655AF6", background: "#E5E9FF" }, // Синий
    { name: "День рождения", color: "#F3B22C", background: "#FDF6DD" },  // Желтый
    { name: "Baby shower", color: "#09DE49", background: "#E0FFE9" },  // Красный
    { name: "Новоселье", color: "#EE4545", background: "#FEEBEB" }  // Зеленый
];

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Аутентификация и управление пользователями
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор пользователя в базе данных.
 *           example: 60d0fe4f5311236168a109ca
 *         telegramId:
 *           type: integer
 *           description: Уникальный идентификатор пользователя в Telegram.
 *           example: 123456789
 *         username:
 *           type: string
 *           description: Имя пользователя в Telegram.
 *           example: johndoe
 *         firstName:
 *           type: string
 *           description: Имя пользователя.
 *           example: John
 *         lastName:
 *           type: string
 *           description: Фамилия пользователя.
 *           example: Doe
 *         language:
 *           type: string
 *           description: Языковой код пользователя.
 *           example: en
 *         telegramPremium:
 *           type: boolean
 *           description: Является ли пользователь подписчиком Telegram Premium.
 *           example: true
 *         viewers:
 *           type: array
 *           items:
 *             type: string
 *           description: Массив ID пользователей, которые видят профиль пользователя. Если массив пуст или поле отсутствует, профиль видят все.
 *           example: ["507f1f77bcf86cd799439012"]
 *         giftviewers:
 *           type: array
 *           items:
 *             type: string
 *           description: Массив ID пользователей, которые видят подаренные пользователем подарки. Если массив пуст или поле отсутствует, их видят все.
 *           example: ["507f1f77bcf86cd799439012"]
 */
/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Аутентификация или создание пользователя
 *     description: Проверяет `initData` из Telegram Web App. Если пользователь существует, возвращает его данные. Если нет, создает нового пользователя и возвращает данные нового пользователя.
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: initdata
 *         required: true
 *         schema:
 *           type: string
 *         description: Строка `initData`, предоставленная Telegram Web App.
 *     responses:
 *       '200':
 *         description: Успешная аутентификация или создание пользователя.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       '401':
 *         description: Неверные `initData`.
 *       '500':
 *         description: Внутренняя ошибка сервера.
 *
 *   get:
 *     summary: Получение данных текущего пользователя
 *     description: Получение информации о пользователе
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: initdata
 *         required: true
 *         schema:
 *           type: string
 *         description: Строка `initData`, предоставленная Telegram Web App.
 *     responses:
 *       '200':
 *         description: Успешное получение данных.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '500':
 *         description: Внутренняя ошибка сервера.
 */
router.post("/", async (req, res) => {
    try {
        const initData = req.headers['initdata'];
        if (!verifyTelegramWebAppData(initData)) {
            return res.status(401).json({ message: 'Invalid init data' });
        }

        const data = new URLSearchParams(initData);
        const user_data = JSON.parse(data.get('user'));

        const options = {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        };

        const existingUser = await User.findOne({ telegramId: user_data.id });

        const user = await User.findOneAndUpdate(
            { telegramId: user_data.id },
            {
                $set: {
                    username: user_data.username,
                    firstName: user_data.first_name,
                    lastName: user_data.last_name,
                    photo_url: user_data.photo_url,
                    telegramPremium: user_data.is_premium || user_data.premium,
                },
                $setOnInsert: {
                    telegramId: user_data.id,
                    language: user_data.language_code,
                }
            },
            options
        );

        const isFirstLogin = !existingUser;

        if (isFirstLogin) {
            const tagsToCreate = DEFAULT_TAGS.map(tag => ({
                ...tag,
                owner: user_data.id
            }));
            
            // Создаем теги. Если вдруг будет ошибка дубликата (маловероятно для нового юзера),
            // ordered: false позволит продолжить вставку остальных
            await Tag.insertMany(tagsToCreate, { ordered: false }).catch(err => {
                console.error("Error creating default tags for new user:", err.message);
            });
        }

        res.json({ user, isFirstLogin }); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.user.telegramId }).lean();

        const tags = await Tag.find({ owner: user.telegramId }).lean();

        const gifts = await Gift.find({ owner: user.telegramId }).lean();

        user.tags = tags;
        user.giftsCount = gifts.length;
        
        res.json(user);
    } catch (error) {
        res.json({ message: error.message });
    }
});

export default router