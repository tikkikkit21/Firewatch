module.exports.name = "report"
module.exports.description = "Reports a fire alarm"
module.exports.syntax = "`/report [options]`"

module.exports.execute = async function (interaction) {
    return `Reported fire at: ${interaction.data.options?.[0]?.value}`;
}

module.exports.options = [
    {
        name: "hall",
        description: "where did the alarm occur?",
        type: 3,
        required: true,
        choices: [
            {
                name: "Ambler Johnston",
                value: "aj"
            },
            {
                name: "Campbell",
                value: "cam"
            },
            {
                name: "Cochrane",
                value: "coc"
            },
        ]
    }
]
