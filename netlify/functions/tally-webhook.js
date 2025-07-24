const { Client } = require("@notionhq/client");
const Pusher = require("pusher");
require("dotenv").config();

exports.handler = async (event) => {
  // 1. Validar método HTTP
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método no permitido" };
  }

  // 2. Configurar clientes
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
  });

  try {
    // 3. Procesar datos de Tally
    const body = JSON.parse(event.body);
    const song = body.fields.find(f => f.key === "Cancion")?.value || "Sin título";
    const name = body.fields.find(f => f.key === "Nombre-del-solicitante")?.value || "Anónimo";
    const coment = body.fields.find(f => f.key === "Comentario")?.value || "Sin Comentario";

    // 4. Guardar en Notion
    const newRecord = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DB_ID },
      properties: {
        "Nombre del solicitante": { 
          title: [{ text: { content: name } }] 
        },
        "Canción": { 
          rich_text: [{ text: { content: song } }] 
        },
        "Comentario": { 
          rich_text: [{ text: { content: coment } }] 
        },
        "Estado": { 
          select: { name: "Pendiente" } 
        }
      }
    });

    // 5. Enviar a Pusher (tiempo real)
    pusher.trigger("song-requests", "new-request", {
      id: newRecord.id,
      userName: name,
      songName: song,
      comentName: coment,
      timestamp: new Date().toISOString()
    });

    return { statusCode: 200, body: "OK" };
  } catch (error) {
    return { statusCode: 500, body: "Error: " + error.message };
  }
};
