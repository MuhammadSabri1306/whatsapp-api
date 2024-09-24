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

program.command("test")
    .description("Testing CLI")
    .argument("<string>", "name of the test case")
    .action( require("@app/clis/test") );

program.command("make-wa-creds")
    .description("Login to Whatsapp and initialize service credentials")
    .action( require("@app/clis/make-wa-creds") );

program.command("serve-http")
    .description("Turn on Web Server")
    .action( require("@app/clis/serve-http") );

module.exports = program;