const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const token = process.env.DISCORD_TOKEN;

console.log("Intentando login...");

client.once('ready', () => {
  console.log("🚀 BOT CONECTADO:", client.user.tag);
});

client.login(token)
  .then(() => console.log("Login promise resuelta"))
  .catch(err => {
    console.error("ERROR EN LOGIN:");
    console.error(err);
  });