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
