const fs = require("fs");
const { Interaction, CommandInteraction, ComponentInteraction } = require("eris");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
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

        switch (command) {
            case "kill":
                if (args[1] === "confirm") {
                    console.info("Bot shut down");
                    await interaction.editMessage(interaction.message.id, { content: "Bot shut down", components: [] });
                    return process.exit();
                }
                else if (args[1] === "cancel") {
                    return interaction.editMessage(interaction.message.id, { content: "Operation cancelled", components: [] });
                }
            case "report":
                const credentials = JSON.parse(fs.readFileSync("./credentials.json"));
                const roleID = credentials?.role;
                if (roleID) {
                    if (interaction.member?.roles.includes(roleID)) {
                        await confirmReport(args[1], Number(args[2]));
                        await interaction.editMessage(
                            interaction.message.id,
                            {
                                content: interaction.message.content += "\n\n:white_check_mark: Report confirmed",
                                components: [
                                    {
                                        type: 1,
                                        components: [
                                            {
                                                type: 2,
                                                style: 3,
                                                custom_id: `disabled`,
                                                label: "Confirm report",
                                                disabled: true
                                            }
                                        ]
                                    }
                                ]
                            }
                        );
                    }
                }
        }

        return bot.error(new Error(`Unhandled ComponentInteraction: ${interaction.data.custom_id}`));
    } catch (error) {
        return bot.error(error);
    }
}

const auth = new GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const service = google.sheets({ version: "v4", auth });

/**
 * Updates a row's "Confirmed?" value to yes
 * @param {string} hall hall name
 * @param {number} index row index of hall sheet
 */
async function confirmReport(hall, index) {
    // get existing row data
    const result = await service.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: hall
    });
    const row = result.data.values[index];

    // update row's confirmation status and notes
    row[4] = "y";
    row[5] = "Reported and confirmed via Discord bot";

    // send update to google sheets
    service.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `${hall}!A${index + 1}:F${index + 1}`,
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [row]
        },
    });
}
