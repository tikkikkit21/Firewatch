const Firewatch = require("../Firewatch");

/**
 * @param {Firewatch} bot base class of Firewatch
 * @param {Error} error error that was emitted
 */
module.exports = async (bot, error, _) => {
    console.error(error);
    bot.error(error);
}

// Apparently there's been a long-running issue in Eris where single-shard bots
// sometimes can't reconnect, even if the error event is being handled. The devs
// have no idea why it's happening, so it's unlikely a fix will be out anytime
// soon. In the meantime, we'll just leave this code here just in case it works
