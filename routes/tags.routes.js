import express from "express";
import Tag from "../models/tag.model.js";
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Название тега.
 *           example: День рождения
 *         color:
 *           type: string
 *           description: Цвет тега в формате HEX.
 *           example: '#FFC107'
 *         background:
 *           type: string
 *           description: Цвет фона в формате HEX.
 *           example: '#BC25F8'
 *         owner:
 *           type: number
 *           description: Telegram ID владельца тега.
 *           example: 123456789
 */


// --- GET ALL (Просмотр всех своих тегов) ---

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Получить список всех тегов текущего пользователя
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный ответ со списком тегов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;

        const tags = await Tag.find({ owner: currentUserTelegramId }).sort({ updatedAt: -1 });

        res.status(200).json(tags);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- CREATE (Добавление нового тега) ---

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Создать новый тег
 *     tags: [Tags]
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
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название тега (например, "День рождения")
 *               color:
 *                 type: string
 *                 description: Цвет тега в формате HEX (например, "#FFC107")
 *               background:
 *                 type: string
 *                 description: Цвет фона в формате HEX (например, "#FFC107")
 *     responses:
 *       201:
 *         description: Тег успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Ошибка валидации или тег с таким именем уже существует
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name, color, background } = req.body;
        const owner = req.user.telegramId;

        // Проверка наличия обязательных полей
        if (!name || !color) {
            return res.status(400).json({ message: 'Name and color are required' });
        }

        const newTag = new Tag({
            name,
            color,
            background,
            owner
        });

        const savedTag = await newTag.save();
        res.status(201).json(savedTag);

    } catch (error) {
        // Код 11000 - ошибка дублирования из-за уникального индекса
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A tag with this name already exists for this user.' });
        }
        res.status(500).json({ message: error.message });
    }
});


// --- UPDATE (Изменение существующего тега) ---

/**
 * @swagger
 * /tags/{tagId}:
 *   patch:
 *     summary: Изменить существующий тег
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID тега, который нужно изменить
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Новое название тега
 *               color:
 *                 type: string
 *                 description: Новый цвет тега в формате HEX
 *               background:
 *                 type: string
 *                 description: Новый цвет фона в формате HEX
 * 
 *     responses:
 *       200:
 *         description: Тег успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Тег не найден или не принадлежит пользователю
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.patch("/:tagId", authMiddleware, async (req, res) => {
    try {
        const { name, color, background } = req.body;
        const currentUserTelegramId = req.user.telegramId;
        
        // Находим тег по его _id И по ID владельца.
        // Это гарантирует, что пользователь не сможет изменить чужой тег.
        const updatedTag = await Tag.findOneAndUpdate(
            { _id: req.params.tagId, owner: currentUserTelegramId },
            { $set: { name, background, color } },
            { new: true, runValidators: true } // new:true возвращает обновленный документ
        );

        if (!updatedTag) {
            return res.status(404).json({ message: 'Tag not found or you do not have permission to edit it.' });
        }

        res.status(200).json(updatedTag);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// --- DELETE (Удаление тега) ---

/**
 * @swagger
 * /tags/{tagId}:
 *   delete:
 *     summary: Удалить тег
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tagId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID тега, который нужно удалить
 *     responses:
 *       200:
 *         description: Тег успешно удален
 *       404:
 *         description: Тег не найден или не принадлежит пользователю
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.delete("/:tagId", authMiddleware, async (req, res) => {
    try {
        const currentUserTelegramId = req.user.telegramId;
        
        // Находим и удаляем тег по его _id И по ID владельца.
        const deletedTag = await Tag.findOneAndDelete({
            _id: req.params.tagId,
            owner: currentUserTelegramId
        });

        if (!deletedTag) {
            return res.status(404).json({ message: 'Tag not found or you do not have permission to delete it.' });
        }

        res.status(200).json({ message: 'Tag deleted successfully.' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


export default router;