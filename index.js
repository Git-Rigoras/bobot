import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import 'dotenv/config';
import fs from 'node:fs';

const { TOKEN, GUILD_ID, BOT_ID } = process.env;
const commands = [];
const pathToCommands = './commands/';

fs.readdirSync(pathToCommands).forEach((file) => {
  const module = import(pathToCommands + file);
  commands.push(module);
});

const commandsToExecute = (await Promise.all(commands)).map(
  (command) => command.default
);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} slash commands`);
    const data = await rest.put(
      Routes.applicationGuildCommands(BOT_ID, GUILD_ID),
      { body: commandsToExecute.map((command) => command.data) }
    );
  } catch (err) {
    console.log(err);
  }
})();

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const commandToExecute = commandsToExecute.find(
    (command) => command.data.name == interaction.commandName
  );
  try {
    await commandToExecute.execute(interaction);
  } catch (error) {
    console.error(error);
  }
});

client.once(Events.ClientReady, (c) => {
  console.log('Logged in as', c.user.tag);
});

client.login(TOKEN);
