const { CommandInteraction } = require("eris");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const fs = require("fs");

const auth = new GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const service = google.sheets({ version: "v4", auth });

// if 2 records are within this time, it's considered 1 report
// currently at 5 minutes
const MIN_TIME_DIFF = 5 * 60 * 1000;

// cooldown tracking
const COOLDOWN = 24 * 60 * 60 * 1000;

/**
 * Reports a fire and logs it in the Google sheets
 * @param {CommandInteraction} interaction slash command object
 * @returns message for replying to the interaction
 */
module.exports.execute = async function (interaction) {
    if (!interaction.data.options) return ":question: Strange...no arguments received";

    const timestamp = new Date();
    const cooldowns = JSON.parse(fs.readFileSync("./user_reports.json"));

    // check cooldown
    if (!cooldowns[interaction.member.user.id]) cooldowns[interaction.member.user.id] = [];
    const numReports = cooldowns[interaction.member.user.id]
        .slice()
        .reverse()
        .filter(t => Math.abs(new Date(t) - timestamp) < COOLDOWN)
        .length;
    if (numReports >= 5) {
        // add user to blacklist
        const blacklist = JSON.parse(fs.readFileSync("./blacklist.json"));
        blacklist.push(interaction.member.user.id);
        fs.writeFileSync("./blacklist.json", JSON.stringify(blacklist, null, 4));

        // ping admin role
        const credentials = JSON.parse(fs.readFileSync("./credentials.json"));
        const roleID = credentials.role;
        return `<@&${roleID}> You've made 5 reports in the last 24h, take a chill pill :pill:\n`;
    }

    // extract arguments
    const hallArg = interaction.data.options.find(o => o.name === "hall")?.value;
    const timeArg = interaction.data.options.find(o => o.name === "time")?.value;
    const dateArg = interaction.data.options.find(o => o.name === "date")?.value;
    const commentsArg = interaction.data.options.find(o => o.name === "comments")?.value;

    // parse arguments
    const time = timeArg
        ? validateTime(timeArg, timestamp)
        : timestamp;
    const date = dateArg
        ? validateDate(dateArg, timestamp)
        : timestamp;

    // verify provided time/date strings are valid
    if (!time) return ":no_entry_sign: Invalid time format, needs to be 24-hour format (ex: `21:03`)";
    if (!date) return ":no_entry_sign: Invalid date format, needs to be mm/dd/yyyy (ex: `3/15/2020`)";

    // if date in future, turn back by 1 day (handles midnight cases)
    const isFuture = timestamp > new Date();
    if (isFuture) {
        timestamp.setDate(timestamp.getDate() - 1);
    }

    try {
        // get current rows in the sheet that corresponds to the hall
        const result = await service.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: hallArg
        });

        const rowLength = result.data.values?.length;

        if (!rowLength) return ":x: Failed to update spreadsheet";

        const recentTimestamp = new Date(result.data.values[rowLength - 1][0]);
        if (Math.abs(recentTimestamp - timestamp) <= MIN_TIME_DIFF) {
            return `:alarm_clock: Already received a report for \`${hallArg}\` at \`${formatTimestamp(recentTimestamp)}\``;
        }

        // add a new row with user reported data
        service.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `${hallArg}!A${rowLength + 1}:F${rowLength + 1}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [[formatTimestamp(timestamp), "y", commentsArg, "", "n", "Reported via Discord bot"]]
            },
        });

        // log report
        cooldowns[interaction.member.user.id].push(timestamp);
        fs.writeFileSync("./user_reports.json", JSON.stringify(cooldowns, null, 4));

        console.info(`${(new Date()).toISOString()} [${interaction.member.user.id}] reported [${hallArg}]`);
        return `:white_check_mark: Fire alarm reported at: \`${hallArg}\` on \`${formatTimestamp(timestamp)}\`. Thank you!`
            + (isFuture ? "\n*Note: date was set to yesterday since the time you provided is in the future*" : "");
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
    const date = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (date.test(dateString)) {
        const [month, day, year] = dateString.split("/").map(Number);
        time.setMonth(month - 1);
        time.setDate(day);
        time.setFullYear(year);

        return time;
    }

    return null;
}

/**
 * Converts a Date object into a nicely formatted string with date and time
 * @param {Date} timestamp date object to format
 * @returns string in the format "mm/dd/yyyy hh:mm"
 */
function formatTimestamp(timestamp) {
    const month = String(timestamp.getMonth() + 1).padStart(2, "0");
    const day = String(timestamp.getDate()).padStart(2, "0");
    const year = timestamp.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;

    const hour = String(timestamp.getHours()).padStart(2, "0");
    const minute = String(timestamp.getMinutes()).padStart(2, "0");
    const formattedTime = `${hour}:${minute}`;

    return `${formattedDate} ${formattedTime}`;
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
