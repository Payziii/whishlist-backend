import express from "express"

const router = express.Router()

// router.get("/wb", async (req, res) => {
//     try {
//         const url = req.query.link
//         if (!url) {
//             return res.status(400).json({ error: 'Missing link parameter' });
//         }

//         const urlObj = new URL(url);
//         const pathSegments = urlObj.pathname.split('/');

//         // Ищем сегмент 'catalog' и артикул
//         const catalogIndex = pathSegments.indexOf('catalog');
//         if (catalogIndex === -1 || catalogIndex + 1 >= pathSegments.length) {
//             return res.status(400).json({ error: 'Invalid URL structure' });
//         }

//         const articleNumber = pathSegments[catalogIndex + 1]; // например, 220077885

//         // Формируем part: 'part' + первые 6 цифр артикула
//         const partNumber = 'part' + articleNumber.substring(0, 6); // 'part220077'

//         // фиксированный vol
//         const volNumber = 'vol' + articleNumber.substring(0, 4);

//         // Формируем URL для API
//         const apiUrl = `https://basket-15.wbbasket.ru/${volNumber}/${partNumber}/${articleNumber}/info/ru/card.json`;

//         // Получаем данные
//         const response = await fetch(apiUrl);
//         if (!response.ok) {
//             return res.status(500).json({ error: 'Failed to fetch data from API' });
//         }

//         const data = await response.json();

//         // Отправляем ответ
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to retrieve data' });
//     }
// });

router.get("/yandex", async (req, res) => {
    try {
        const url = req.query.link
        if (!url) {
            return res.status(400).json({ error: 'Missing link parameter' });
        }
        
        const response = await fetch(`https://opengraph.io/api/1.1/site/${encodeURIComponent(url)}?app_id=3b3e4f2b-e0b6-46af-9793-ff72fd25fd78`);
        if (!response.ok) {
            return res.status(500).json({ error: 'Failed to fetch data from URL' });
        }

        const data = await response.json();

        res.json({
            name: data.hybridGraph.products[0].name,
            image: data.hybridGraph.products[0].images[0]
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

router.get("/wb", async (req, res) => {
    try {
        const url = req.query.link
        if (!url) {
            return res.status(400).json({ error: 'Missing link parameter' });
        }

        const response = await fetch(`https://opengraph.io/api/1.1/site/${encodeURIComponent(url)}?app_id=3b3e4f2b-e0b6-46af-9793-ff72fd25fd78`);
        if (!response.ok) {
            return res.status(500).json({ error: 'Failed to fetch data from URL' });
        }

        const data = await response.json();

        res.json({
            name: data.hybridGraph.products[0].name,
            image: data.hybridGraph.products[0].images[0]
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

export default router;