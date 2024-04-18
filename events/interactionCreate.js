const { Interaction, CommandInteraction, ComponentInteraction } = require("eris");
const Firewatch = require("../Firewatch");

/**
 * @param {Firewatch} bot Firewatch client object
 * @param {Interaction} interaction Interaction object
 */
module.exports = async (bot, interaction) => {
    try {
        // slash commands
        if (interaction instanceof CommandInteraction) {
            return await handleSlashCommand(bot, interaction);
        }

        // buttons
        // else if (interaction instanceof ComponentInteraction) {
        //     return await handleButton(bot, interaction);
        // }
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

            return interaction.createMessage(result, result?.file);
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
// async function handleButton(bot, interaction) {
//     try {
//         // button IDs are in the format "[user_id]-[button_id]" to make sure the
//         // user clicking the button is the intended user (prevents other users
//         // from clicking your buttons and messing you up)
//         const args = interaction.data.custom_id.split("-");
//         const userID = args[0];
//         const command = args[1];

//         if (interaction.member.user.id === userID) {
//             await interaction.acknowledge();
//             switch (command) {
//                 // handle different button ids
//             }
//         }

//         return bot.error(new Error(`Unhandled ComponentInteraction: ${interaction.data.custom_id}`));
//     } catch (error) {
//         return bot.error(error);
//     }
// }
