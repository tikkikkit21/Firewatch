const Eris = require("eris");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

class Firewatch extends Eris.Client {
    constructor(token) {
        super(token, { restMode: true });
        this.commands = new Eris.Collection();
        this.errorCase = 0;
    }

    /**
     * Fires up the bot
     */
    async init() {
        try {
            console.info("Connecting to API...");
            await this.connect();
        } catch (error) {
            console.error(error);
            process.exit();
        }

        this.once("ready", async () => {
            try {
                await this.loadCommands();
                await this.loadEvents();

                this.editStatus("online", { name: "/report", type: 3 });
                console.info("Bot launch successful");
                console.info("=========================");
            } catch (error) {
                console.error(error);
                process.exit();
            }
        });
    }

    /**
     * Load event files and start up listeners
     */
    async loadEvents() {
        console.info("Loading events...")
        this.removeAllListeners();
        const eventFiles = fs.readdirSync(`./events`).filter(file => file.endsWith(".js"));
        eventFiles.forEach(async (file) => {
            const resolve = require.resolve(`./events/${file}`);
            delete require.cache[resolve];
            const event = require(`./events/${file}`);
            this.on(file.split(".")[0], await event.bind(null, this));
        });
    }

    /**
     * Loads command files into the bot's collection
     */
    async loadCommands() {
        console.info("Loading files...");

        const appCommands = [];
        const commands = fs
            .readdirSync("./commands")
            .filter(file => file.endsWith(".js"));

        commands.forEach(commandFile => {
            try {
                const filePath = `./commands/${commandFile}`;
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                this["commands"].set(command.name, command);

                appCommands.push(this.createApplicationCommand(command));
            } catch (error) {
                console.error(error);
                process.exit();
            }
        });

        await Promise.all(appCommands);
    }

    /**
     * Creates a slash command from provided config
     * @param {any} commandConfig command config to load in (determined by each
     * property in module.exports)
     * @param {boolean} isDev whether or not to create command only in dev server
     */
    async createApplicationCommand(commandConfig) {
        await this.createCommand({
            name: commandConfig.name,
            description: commandConfig.description,
            options: commandConfig.options || []
        }, 1);

        console.info(` - Updated command [${commandConfig.name}]`);
    }

    /**
     * Sends a message
     * @param {Eris.Interaction} interaction interaction storing necessary info
     * like guild and channel IDs
     * @param {Eris.MessageContent} content content of message to send
     * @param {Eris.FileContent} file (optional) files to attach to message
     * @returns Eris awaitable action or error
     */
    async send(interaction, content, file) {
        if (!interaction || (!content && !file)) {
            return this.error(new TypeError("Message and/or content isn't provided"));
        }

        try {
            return await this.createMessage(interaction.channel.id, content, file);
        } catch (error) {
            if (["Missing Permissions", "Missing Access"].includes(error.message)) {
                return interaction.channel.guild
                    && this.missingPermissions(
                        (interaction.author || interaction.member.user).id,
                        interaction.channel.id,
                        interaction.channel.guild.id
                    );
            }

            if (["Unknown User", "Unknown Channel"].includes(error.message)) {
                return;
            }

            return this.error(error);
        }
    }

    /**
     * DM's a user letting them know a particular channel is missing permissions
     * @param {string} authorID Discord ID of user to DM
     * @param {string} channelID channel where permissions are missing
     * @param {string} guildID guild where permissions are missing
     */
    async missingPermissions(authorID, channelID, guildID) {
        try {
            if (this.guilds.has(guildID)) {
                const DMChannel = await this.getDMChannel(authorID);
                const message =
                    "Hello, I don't have sufficient permissions in"
                    + `<#${channelID}>. Please make sure I have the following`
                    + " permissions:\n\n"
                    + ":eyes: Read Messages\n"
                    + ":writing_hand: Send Messages\n"
                    + ":globe_with_meridians: Embed Links\n"
                    + ":file_folder: Attach Files\n"
                    + ":fire: Use External Emojis\n"
                    + ":ballot_box_with_check: Add Reactions\n"
                    + ":scroll: Read Message History"
                await this.createMessage(DMChannel.id, message);
            }
        } catch (error) { }
    }

    /**
     * Handles errors in the bot and logs it in a webhook channel
     * @param {string} source string to indicate file source of error
     * @param {Error} error error to handle
     * @param {Eris.Message} trigger Idle Miner message that triggered the error
     */
    async error(error) {
        try {
            this.errorCase++;

            fs.appendFileSync(
                "./errors.log",
                `Case ${this.errorCase}: ${new Date()}\n${error.stack}\n\n`
            );
        } catch (e) {
            console.error(e);
        }
    }
}

module.exports = Firewatch;
