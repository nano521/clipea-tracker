const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "FAKE_DISCORD_TOKEN";
const RAPID_API_KEY = process.env.RAPID_API_KEY || "FAKE_RAPID_KEY";
const RAPID_API_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

let db;

// Inicializar base de datos
(async () => {
  db = await open({
    filename: './reels.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      username TEXT,
      link TEXT,
      views INTEGER,
      plays INTEGER,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

client.once('ready', () => {
  console.log(`🚀 Bot listo como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'submit') {

    const link = interaction.options.getString('link');

    try {

      // 🔥 RESPONDER INMEDIATO (clave para Render)
      await interaction.reply({
        content: "⏳ Procesando reel...",
        ephemeral: true
      });

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

      // Guardar en base
      await db.run(
        `INSERT INTO submissions (user_id, username, link, views, plays, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        interaction.user.id,
        interaction.user.username,
        link,
        views,
        plays,
        views >= 1000000 ? "calificado" : "pendiente"
      );

      await interaction.editReply({
        content: `✅ Reel registrado

👀 Views únicas: ${views}
▶️ Plays totales: ${plays}

Tu reel será revisado al cierre del mes.`
      });

    } catch (error) {
      console.error("❌ ERROR:", error.response?.data || error.message);

      await interaction.editReply({
        content: "❌ Error procesando el reel."
      });
    }
  }
});

client.login(DISCORD_TOKEN);