const fs = require("fs");

module.exports.execute = async function (interaction) {
    const userID = interaction.data.options[0].value;
    const blacklist = JSON.parse(fs.readFileSync("./blacklist.json"));
    blacklist.push(userID);
    fs.writeFileSync("./blacklist.json", JSON.stringify(blacklist, null, 4));
    return `User \`${userID}\` blacklisted`;
}

module.exports.name = "blacklist";
module.exports.description = "Manually add user to blacklist";
module.exports.syntax = "`/blacklist [user]`";
module.exports.options = [
    {
        name: "user",
        description: "user to blacklist",
        type: 6,
        required: true
    }
]
