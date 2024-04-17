const Firewatch = require("./Firewatch");
require("dotenv").config();

// create Firewatch bot and start it up
const bot = new Firewatch(process.env.TOKEN);
global.bot = bot;
bot.init();
