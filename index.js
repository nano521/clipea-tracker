const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

let db;

async function initDatabase() {
  db = await open({
    filename: './reels.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      username TEXT,
      link TEXT UNIQUE,
      views INTEGER,
      plays INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Base de datos lista");
}

client.once('ready', () => {
  console.log("🚀 BOT CONECTADO COMO:", client.user.tag);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'submit') {
    const link = interaction.options.getString('link');

    try {
      await interaction.deferReply({ ephemeral: true });

      const existing = await db.get(
        `SELECT id FROM submissions WHERE link = ?`,
        link
      );

      if (existing) {
        return await interaction.editReply({
          content: "❌ Este reel ya fue enviado anteriormente."
        });
      }

      const response = await axios.get(
        'https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data.php',
        {
          params: {
            reel_post_code_or_url: link,
            type: "reel"
          },
          headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': RAPID_API_HOST
          }
        }
      );

      const data = response.data;
      const views = data.video_view_count || 0;
      const plays = data.video_play_count || 0;
      const timestamp = data.taken_at_timestamp;

      if (!timestamp) {
        return await interaction.editReply({
          content: "❌ No se pudo validar el reel."
        });
      }

      const now = Math.floor(Date.now() / 1000);
      const hoursPassed = (now - timestamp) / 3600;

      if (hoursPassed > 24) {
        return await interaction.editReply({
          content: "❌ El reel debe tener menos de 24 horas."
        });
      }

      await db.run(
        `INSERT INTO submissions (user_id, username, link, views, plays)
         VALUES (?, ?, ?, ?, ?)`,
        interaction.user.id,
        interaction.user.username,
        link,
        views,
        plays
      );

      console.log("📦 Guardado:", link);

      return await interaction.editReply({
        content: "✅ Reel registrado para revisión."
      });

    } catch (error) {
      console.error("❌ ERROR:", error);
      await interaction.editReply({
        content: "❌ Error procesando el reel."
      });
    }
  }
});

(async () => {
  try {
    await initDatabase();
    await client.login(DISCORD_TOKEN);
  } catch (err) {
    console.error("❌ ERROR AL INICIAR:", err);
  }
})();