const { Command } = require("commander");
const globalState = require("@app/global");
const { env } = require("@app/libs/env");

const program = new Command();
program.name("whatsapp-bot-api")
    .version("1.0.0")
    .hook("preAction", () => {
        globalState.set("isProdMode", env("APP_MODE") == "production");
        globalState.set("isDevMode", env("APP_MODE") == "development");
    });

program.command("wa-login")
    .description("Login to Whatsapp and initialize service credentials")
    .action( require("@app/clis/whatsapp-service-login") );

module.exports = program;