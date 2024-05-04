const fs = require("fs");

module.exports.execute = async function (interaction) {
    const roleID = interaction.data.options[0].value;
    const credentials = JSON.parse(fs.readFileSync("./credentials.json"));
    credentials["role"] = roleID
    fs.writeFileSync("./credentials.json", JSON.stringify(credentials, null, 4));
    return `Role set to <@&${roleID}>`;
}

module.exports.name = "setrole";
module.exports.description = "Designate a role for special actions (kill, cooldown review, confirming reports, etc.)";
module.exports.syntax = "`/setrole [role]`";
module.exports.options = [
    {
        name: "role",
        description: "role to grant special privileges",
        type: 8,
        required: true
    }
]
