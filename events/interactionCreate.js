const fs = require("fs");
const { Interaction, CommandInteraction, ComponentInteraction } = require("eris");
const Firewatch = require("../Firewatch");

/**
 * @param {Firewatch} bot Firewatch client object
 * @param {Interaction} interaction Interaction object
 */
module.exports = async (bot, interaction) => {
    try {
        // ignore users on blacklist
        const blacklist = JSON.parse(fs.readFileSync("./blacklist.json"));
        if (blacklist.includes(interaction.member.user.id)) return;

        // slash commands
        if (interaction instanceof CommandInteraction) {
            return await handleSlashCommand(bot, interaction);
        }

        // buttons
        else if (interaction instanceof ComponentInteraction) {
            return await handleButton(bot, interaction);
        }
    } catch (error) {
        bot.error(error);
    }
}

/**
 * Handles slash commands
 * @param {Firewatch} bot Firewatch client object
 * @param {CommandInteraction} interaction Interaction object for slash command
 * @returns awaitable interaction response
 */
async function handleSlashCommand(bot, interaction) {
    try {
        // no commands in DM's
        if (!interaction.guildID) {
            return interaction.createMessage("Sorry, my commands aren't available in DM's");
        }

        // handle commands
        const command = bot.commands.get(interaction.data.name);
        if (command) {
            const result = await bot.commands.get(interaction.data.name).execute(interaction);

            if (result) {
                // handle kill command
                if (command.name === "kill") {
                    setTimeout(() => {
                        interaction.editOriginalMessage({ content: "Time's up, operation was cancelled", components: [] })
                    }, 15000);
                }

                return interaction.createMessage(result, result?.file);
            }
        }

        // unhandled interaction at this point
        return bot.error(new TypeError(`Invalid command: ${interaction.data.name}`));
    } catch (error) {
        return bot.error(error);
    }
}

/**
 * Handles buttons
 * @param {RebirthRusher} bot base class of RbR
 * @param {ComponentInteraction} interaction Interaction object for button
 * @returns awaitable RbR response
 */
async function handleButton(bot, interaction) {
    try {
        await interaction.acknowledge();
        const args = interaction.data.custom_id.split("-");
        const command = args[0];
        const arg = args[1];

        switch (command) {
            case "kill":
                if (arg === "confirm") {
                    console.info("Bot shut down");
                    await interaction.editMessage(interaction.message.id, { content: "Bot shut down", components: [] });
                    return process.exit();
                }
                else if (arg === "cancel") {
                    return interaction.editMessage(interaction.message.id, { content: "Operation cancelled", components: [] });
                }
        }

        return bot.error(new Error(`Unhandled ComponentInteraction: ${interaction.data.custom_id}`));
    } catch (error) {
        return bot.error(error);
    }
}
