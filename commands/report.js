const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");

const auth = new GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const service = google.sheets({ version: "v4", auth });

module.exports.execute = async function (interaction) {
    const now = new Date();
    // extract arguments
    const hall = interaction.data.options?.[0]?.value;
    const time = interaction.data.options?.[1]?.value
        || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const comments = interaction.data.options?.[2]?.value || "";

    // verify provided time string is valid
    if (!validateTime(time)) return ":no_entry_sign: Invalid time format";

    // get today"s date as mm/dd/yyyy with zero-padded numbers
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
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
                values: [[`${formattedDate} ${time}`, "y", comments, "", "n", "Reported via Discord bot"]]
            },
        });

        console.info(`${now.toISOString()} [${interaction.member.user.id}] reported [${hall}]`);
        return `:white_check_mark: Fire alarm reported at: \`${hall}\` on \`${formattedDate} ${time}\`. Thank you!`;
    } catch (err) {
        bot.error(err);
        return ":x: Uh-oh, something went wrong";
    }
}

/**
 * Checks if a time string is valid 24-hour syntax. If valid, it will convert
 * it into a date object with today's date
 * @param {string} timeString time in string format
 * @returns Date object if valid or null if invalid
 */
function validateTime(timeString) {
    const hhmm = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (hhmm.test(timeString)) {
        const [hours, minutes] = timeString.split(":").map(Number);

        const today = new Date();
        today.setHours(hours);
        today.setMinutes(minutes);

        return today;
    }

    return null;
}

module.exports.name = "report";
module.exports.description = "Reports a fire alarm";
module.exports.options = [
    {
        name: "hall",
        description: "where did the alarm occur?",
        type: 3,
        required: true,
        choices: [
            { name: "Ambler Johnston", value: "AJ" },
            { name: "Campbell", value: "Campbell" },
            { name: "Cochrane", value: "Cochrane" },
            { name: "CID", value: "CID" },
            { name: "Eggleston", value: "Eggleston" },
            { name: "GLC", value: "GLC" },
            { name: "Harper", value: "Harper" },
            { name: "Hillcrest", value: "Hillcrest" },
            { name: "Hoge", value: "Hoge" },
            { name: "Johnson", value: "Johnson" },
            { name: "Miles", value: "Miles" },
            { name: "New Residence Hall East", value: "New Hall East" },
            { name: "New Hall West", value: "New Hall West" },
            { name: "Newman", value: "Newman" },
            { name: "O'Shaughnessy", value: "O Shag" },
            { name: "Payne", value: "Payne" },
            { name: "Pearson East", value: "Pearson East" },
            { name: "Pearson West", value: "Pearson West" },
            { name: "Peddrew-Yates", value: "Peddrew-Yates" },
            { name: "Pritchard", value: "Pritchard" },
            { name: "Slusher", value: "Slusher" },
            { name: "Upper Quad North", value: "UpperQuadNorth" },
            { name: "Vawter", value: "Vawter" },
            { name: "Whitehurst", value: "Whitehurst" }
        ]
    },
    {
        name: "time",
        description: "what time did the fire alarm go off? (use 24-hour format)",
        type: 3
    },
    {
        name: "date",
        description: "what day did the fire alarm go off? (use mm/dd format)",
        type: 3
    },
    {
        name: "comments",
        description: "leave any additional comments you might have",
        type: 3
    }
];
