const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// 🔐 TUS DATOS FALSOS (cámbialos luego por los reales)
const token = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1477872580999250011";
const GUILD_ID = "1035352042320961566";

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

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {

    console.log("🧹 Limpiando comandos anteriores...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    console.log("🚀 Registrando comando nuevo...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("🔥 Comando actualizado correctamente.");

  } catch (error) {
    console.error(error);
  }
})();