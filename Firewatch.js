// Discord
const Eris = require("eris");

// JS libraries
const fs = require("fs")
const path = require("path");

// Config
const dotenv = require("dotenv");
dotenv.config()

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
                this.loadAllFiles();
                await this.loadApplicationCommands();
                await this.loadEvents();

                this.editStatus("online", { name: "/help", type: 3 });
                console.info("Bot launch succesful");
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
     * Load command, timer, and scanner files
     */
    loadAllFiles() {
        console.info("Loading files...");

        // load commands
        const commands = fs.readdirSync("./commands");
        commands
            .filter(f => !f.includes("."))
            .forEach(subFolder => {
                this.loadFolder("commands", `./commands/${subFolder}`)
            });
    }

    /**
     * Loads a folder of files into a bot collection
     * @param {*} collectionName bot collection name
     * @param {*} folderPath relative directory path
     */
    loadFolder(collectionName, folderPath) {
        const folder = fs
            .readdirSync(path.resolve(__dirname, folderPath))
            .filter(file => file.endsWith(".js"));

        folder.forEach(fileName => {
            try {
                const filePath = `${folderPath}/${fileName}`;
                delete require.cache[require.resolve(filePath)];
                const scanner = require(filePath);
                this[collectionName].set(scanner.name, scanner);
            } catch (error) {
                console.error(error);
                process.exit();
            }
        });
    }

    /**
     * Loads slash commands when applicable. Slash commands only need to be
     * created if they're new or their command structure (command.options) has
     * changed. Otherwise, it's a waste of API calls to create slash commands
     * that haven't changed. Therefore we use a config file to indicate which
     * slash commands have changed and need to be reloaded in the API.
     */
    async loadApplicationCommands() {
        console.info("Loading application commands...");
        const updatedCommands = require("./updatedCommands.json");

        await Promise.all(updatedCommands.map(async (commandPath) => {
            // // specific command file
            // if (commandPath.includes("/")) {
            //     const command = require(`./commands/${commandPath}.js`);
            //     await this.createApplicationCommand(command);
            // }

            // // whole subdirectory
            // else {
            //     const subfolder = fs.readdirSync(`./commands/${commandPath}`);
            //     subfolder.forEach(async (file) => {
            //         const command = require(`./commands/${commandPath}/${file}`);

            //         await this.createApplicationCommand(command);
            //     });
            // }

            const subfolder = fs.readdirSync(`./commands/`);
            await Promise.all(subfolder.map(async (file) => {
                const command = require(`./commands/${file}`);

                await this.createApplicationCommand(command);
            }));
        }));
        console.info("Loading application commands done");
    }

    /**
     * 
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
                "./logs/errors.log",
                `Case ${this.errorCase}: ${new Date()}\n${error.stack}\n\n`
            );
        } catch (e) {
            console.error(e);
        }
    }
}

module.exports = Firewatch;
