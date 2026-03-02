const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ NO HAY DISCORD_TOKEN EN RENDER");
  process.exit(1);
}

console.log("Intentando conectar a Discord...");

client.once('clientReady', () => {
  console.log("🚀 BOT CONECTADO COMO:", client.user.tag);
});

client.login(TOKEN)
  .then(() => console.log("Login exitoso"))
  .catch(err => {
    console.error("❌ ERROR EN LOGIN:");
    console.error(err);
  });