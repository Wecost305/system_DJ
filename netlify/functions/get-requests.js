// Archivo: netlify/functions/get-requests.js

const { Client } = require("@notionhq/client");
require("dotenv").config();

exports.handler = async () => {
  // 1. Validar que la petición sea GET
  // (Netlify lo maneja, pero es buena práctica)

  // 2. Configurar cliente de Notion
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const databaseId = process.env.NOTION_DB_ID;

  try {
    // 3. Consultar la base de datos de Notion
    const response = await notion.databases.query({
      database_id: databaseId,
      // Filtramos para traer solo las que están "Pendiente"
      filter: {
        property: "Estado",
        select: {
          equals: "Pendiente",
        },
      },
      // Ordenamos para que las más nuevas aparezcan primero
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    });

    // 4. Formatear los resultados para que el frontend los entienda
    const requests = response.results.map(page => {
      // Extraemos los datos de cada propiedad de la página
      const properties = page.properties;
      const name = properties["Nombre del solicitante"]?.title[0]?.text?.content || "Anónimo";
      const song = properties["Canción"]?.rich_text[0]?.text?.content || "Sin título";
      
      return {
        id: page.id,
        userName: name,
        songName: song,
        timestamp: page.created_time, // Usamos la fecha de creación de Notion
      };
    });

    // 5. Devolver los datos en formato JSON
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requests),
    };

  } catch (error) {
    console.error("Error al obtener datos de Notion:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al conectar con Notion" }),
    };
  }
};
