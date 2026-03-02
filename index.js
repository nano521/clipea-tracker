console.log("🚀 CLIPEA TRACKER 24/7 INICIANDO");

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

/*
🔐 KEYS FALSOS (REEMPLAZA EN RENDER COMO VARIABLES DE ENTORNO)
NO DEJES LOS REALES EN EL CÓDIGO EN PRODUCCIÓN
*/

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 📦 BASE DE DATOS
const db = new sqlite3.Database('./reels.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      username TEXT,
      link TEXT UNIQUE,
      views INTEGER,
      plays INTEGER,
      status TEXT,
      payment INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// 🔥 Promisify db.get
function dbGet(query, params) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// 🔥 Promisify db.run
function dbRun(query, params) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

client.once('clientReady', () => {
  console.log(`🤖 Bot listo como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {

  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'submit') return;

  try {

    // 🔒 Respuesta privada
    await interaction.deferReply({ flags: 64 });

    const link = interaction.options.getString('link');

    // 🔍 Verificar duplicado
    const existing = await dbGet(
      "SELECT link FROM submissions WHERE link = ?",
      [link]
    );

    if (existing) {
      return interaction.editReply("❌ Este reel ya fue enviado anteriormente.");
    }

    // 🔥 Obtener datos del reel
    const response = await axios.get(
      "https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data.php",
      {
        params: {
          reel_post_code_or_url: link,
          type: "reel"
        },
        headers: {
          "x-rapidapi-key": RAPID_API_KEY,
          "x-rapidapi-host": RAPID_API_HOST
        }
      }
    );

    const media = response.data || {};

    const views = media.video_view_count || 0;
    const plays = media.video_play_count || 0;

    // ⏳ Validar que tenga menos de 24 horas
    const postedTimestamp = media.taken_at_timestamp;

    if (!postedTimestamp) {
      return interaction.editReply("❌ No se pudo verificar la fecha del reel.");
    }

    const now = Math.floor(Date.now() / 1000);
    const hoursPassed = (now - postedTimestamp) / 3600;

    if (hoursPassed > 24) {
      return interaction.editReply("❌ Este reel tiene más de 24 horas y no es válido.");
    }

    // 💰 Calificación interna (NO visible al usuario)
    let status = "DENEGADO";
    let payment = 0;

    if (views >= 1000000) {
      status = "CALIFICADO";
      payment = 15;
    }

    // 💾 Guardar en base de datos
    await dbRun(
      `INSERT INTO submissions 
      (user_id, username, link, views, plays, status, payment)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        interaction.user.id,
        interaction.user.username,
        link,
        views,
        plays,
        status,
        payment
      ]
    );

    // ✅ Mensaje limpio
    await interaction.editReply(
      "✅ Contenido registrado correctamente.\nTu reel ha sido enviado para revisión."
    );

  } catch (error) {

    console.log("❌ ERROR:", error.response?.data || error.message);

    if (!interaction.replied) {
      await interaction.editReply("❌ Error procesando el reel.");
    }
  }

});

client.login(DISCORD_TOKEN);