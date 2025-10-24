import { load } from 'cheerio';

async function getMetaTagsBuiltinFetch(url) {
  try {
   const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      // Можете добавить другие заголовки, если нужно
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/'
    };

    const response = await fetch(url, { headers }); // Передаем объект с заголовками
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    // Здесь вам все еще понадобится cheerio для парсинга HTML
    const $ = load(html);

    const metaTags = {};

    $('meta').each((index, element) => {
      const tag = $(element);
      const name = tag.attr('name');
      const property = tag.attr('property');
      const content = tag.attr('content');
      const charset = tag.attr('charset');

      if (name) {
        metaTags[name] = content;
      } else if (property) {
        metaTags[property] = content;
      } else if (charset) {
        metaTags['charset'] = charset;
      }
    });

    const title = $('title').text();
    if (title) {
      metaTags['title'] = title;
    }

    return metaTags;

  } catch (error) {
    console.error('Ошибка при получении мета-тегов:', error);
    return null;
  }
}

// Пример использования:
const link = 'https://market.yandex.ru/card/videokarta-msi-rtx-5060-8g-gaming-trio-oc-8gb-ret/4495412403';

getMetaTagsBuiltinFetch(link)
  .then(tags => {
    if (tags) {
      console.log(`Мета-теги (встроенный fetch) для ${link}:`);
      console.log(tags);
    }
  });