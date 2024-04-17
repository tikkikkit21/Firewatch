module.exports.name = "ping"
module.exports.description = "Test command to see if bot is working"
module.exports.syntax = "`/ping`"

module.exports.execute = async function () {
    return ":ping_pong: pong!";
}
