const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1477872580999250011";
const GUILD_ID = "1035352042320961566";

if (!token) {
  console.error("❌ DISCORD_TOKEN no está definido.");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('submit')
    .setDescription('Enviar contenido a campaña')
    .addStringOption(option =>
      option
        .setName('campana')
        .setDescription('Selecciona la campaña')
        .setRequired(true)
        .addChoices(
          { name: 'clipea-reel', value: 'clipea-reel' }
        )
    )
    .addStringOption(option =>
      option
        .setName('link')
        .setDescription('Link del Reel')
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log("🚀 Registrando comandos...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Comandos actualizados correctamente.");
  } catch (error) {
    console.error(error);
  }
})();