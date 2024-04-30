const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");

const auth = new GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const service = google.sheets({ version: "v4", auth });

module.exports.execute = async function (interaction) {
    if (!interaction.data.options) return ":question: Strange...no arguments received";

    // extract arguments
    const hallArg = interaction.data.options.find(o => o.name === "hall");
    const timeArg = interaction.data.options.find(o => o.name === "time");
    const dateArg = interaction.data.options.find(o => o.name === "date");
    const commentsArg = interaction.data.options.find(o => o.name === "comments");

    // parse arguments
    const timestamp = new Date();
    const time = timeArg
        ? validateTime(time, timestamp)
        : timestamp;
    const date = dateArg
        ? validateDate(date, timestamp)
        : timestamp;

    // verify provided time/date strings are valid
    if (!time) return ":no_entry_sign: Invalid time format, needs to be 24-hour format (ex: `21:03`)";
    if (!date) return ":no_entry_sign: Invalid date format, needs to be mm/dd/yyyy (ex: `3/15/2020`)";

    // get today's date as mm/dd/yyyy with zero-padded numbers
    const day = String(timestamp.getDate()).padStart(2, "0");
    const month = String(timestamp.getMonth() + 1).padStart(2, "0");
    const year = timestamp.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;

    try {
        // get current rows in the sheet that corresponds to the hall
        const result = await service.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: hallArg
        });

        const rowLength = result.data.values?.length;

        if (!rowLength) return ":x: Failed to update spreadsheet";

        // add a new row with user reported data
        service.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `${hallArg}!A${rowLength + 1}:F${rowLength + 1}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [[`${formattedDate} ${time}`, "y", commentsArg, "", "n", "Reported via Discord bot"]]
            },
        });

        console.info(`${timestamp.toISOString()} [${interaction.member.user.id}] reported [${hallArg}]`);
        return `:white_check_mark: Fire alarm reported at: \`${hallArg}\` on \`${formattedDate} ${time}\`. Thank you!`;
    } catch (err) {
        bot.error(err);
        return ":x: Uh-oh, something went wrong";
    }
}

/**
 * Checks if a time string is valid 24-hour syntax. If valid, it will convert
 * it into a date object with today's date
 * @param {string} timeString time in string format
 * @param {Date} time time object to update
 * @returns Date object if valid or null if invalid
 */
function validateTime(timeString, time) {
    const hhmm = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (hhmm.test(timeString)) {
        const [hours, minutes] = timeString.split(":").map(Number);

        time.setHours(hours);
        time.setMinutes(minutes);

        return time;
    }

    return null;
}

/**
 * Checks if a date format is proper mm/dd/yyyy
 * @param {string} dateString date in string format
 * @param {Date} time time object to update
 * @returns Date object if valid or null if invalid
 */
function validateDate(dateString, time) {
    const date = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;;
    if (date.test(dateString)) {
        const [month, day, year] = dateString.split("/").map(Number);

        time.setMonth(month);
        time.setDate(day);
        time.setFullYear(year);

        return time;
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
        description: "what day did the fire alarm go off? (use mm/dd/yyyy format)",
        type: 3
    },
    {
        name: "comments",
        description: "leave any additional comments you might have",
        type: 3
    }
];
