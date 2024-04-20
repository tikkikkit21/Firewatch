module.exports.execute = async function () {
    const message = "Are you sure you want to kill the bot? If so, confirm in the next 15s";
    return {
        content: message,
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 4,
                        custom_id: `kill-confirm`,
                        label: "Yes, kill the bot",
                        emoji: {
                            name: "⚠️",
                            id: null,
                        }
                    },
                    {
                        type: 2,
                        style: 2,
                        custom_id: `kill-cancel`,
                        label: "Cancel"
                    },
                ]
            }
        ]
    }
}

module.exports.name = "kill";
module.exports.description = "Kills the bot if it goes rogue";
module.exports.syntax = "`/kill`";
