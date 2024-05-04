const fs = require("fs");

module.exports.execute = async function (interaction) {
    const userID = interaction.data.options[0].value;
    const blacklist = JSON.parse(fs.readFileSync("./blacklist.json"));
    const index = blacklist.indexOf(userID);
    if (index === -1) return "User is not in blacklist";
    blacklist.splice(index, 1);
    fs.writeFileSync("./blacklist.json", JSON.stringify(blacklist, null, 4));
    return `User \`${userID}\` removed from blacklist`;
}

module.exports.name = "whitelist";
module.exports.description = "Manually remove user from blacklist";
module.exports.syntax = "`/whitelist [user]`";
module.exports.options = [
    {
        name: "user",
        description: "user to whitelist",
        type: 6,
        required: true
    }
]
