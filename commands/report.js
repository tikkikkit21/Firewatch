const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

const auth = new GoogleAuth({
    keyFile: "credentials.json",
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const service = google.sheets({ version: 'v4', auth });

module.exports.execute = async function (interaction) {
    // extract arguments
    const hall = interaction.data.options?.[0]?.value;
    const time = interaction.data.options?.[1]?.value;
    const comments = interaction.data.options?.[2]?.value || '';

    // get today's date as mm/dd/yyyy with zero-padded numbers
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;

    try {
        // get current rows in the sheet that corresponds to the hall
        const result = await service.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: hall
        });

        const rowLength = result.data.values?.length;

        if (!rowLength) return ":x: Failed to update spreadsheet";

        // add a new row with user reported data
        service.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `${hall}!A${rowLength + 1}:F${rowLength + 1}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [[`${formattedDate} ${time}`, 'y', comments, '', 'n', '']]
            },
        });

        return `Reported fire at: ${hall}`;
    } catch (err) {
        bot.error(err);
        return ":x: Uh-oh, something went wrong";
    }
}

module.exports.name = "report";
module.exports.description = "Reports a fire alarm";
module.exports.syntax = "`/report [options]`";
module.exports.options = [
    {
        name: "hall",
        description: "where did the alarm occur?",
        type: 3,
        required: true,
        choices: [
            {
                name: "Ambler Johnston",
                value: "AJ"
            },
            {
                name: "Campbell",
                value: "Campbell"
            },
            {
                name: "Cochrane",
                value: "Cochrane"
            },
            // TODO: add remaining halls
        ]
    },
    {
        name: "time",
        description: "when did the fire alarm go off? (24-hour format please, ex: 16:00)",
        type: 3,
        required: true
    },
    {
        name: "comments",
        description: "leave any additional comments you might have",
        type: 3
    }
]
