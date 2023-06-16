#!/usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import clear from "clear";
import CLI from "clui";
import puppeteer from "puppeteer";
import fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(fs.readFileSync(`${__dirname}/.config.json`));

let locationId = "";

switch (config.location) {
  case "vancouver":
    locationId = "95";
    break;
  case "calgary":
    locationId = "89";
    break;
  case "ottawa":
    locationId = "92";
    break;
  case "toronto":
    locationId = "94";
  case "montreal":
    locationId = "91";
  case "santiago":
    locationId = "111";
}

clear();

console.log(chalk.yellow(figlet.textSync("VISA Appointment")));

const interval = 10 * 60 * 1000; // 10 minutes

const alertBefore = new Date(config.alert_for_appointment_before);

let gSpinner = new CLI.Spinner("Waiting for the next run...");

let checkAvailability = () => {
  (async () => {
    gSpinner.stop();
    console.log(chalk.gray("Opening Chrome headless..."));
    let browser = await puppeteer.launch();
    let page = await browser.newPage();

    let spinner = new CLI.Spinner("Signing in...");
    spinner.start();

    await page.goto("https://ais.usvisa-info.com/es-cl/niv/users/sign_in");
    await page.type("#user_email", config.username);
    await page.type("#user_password", config.password);
    await page.$eval("#policy_confirmed", (check) => (check.checked = true));
    await page.waitForTimeout(3000);
    await Promise.all([
      page.waitForNavigation(),
      page.click("input[type=submit]"),
    ]).catch(() => {
      console.error("Error Occurred.");
    });
    spinner.stop();
    console.log(chalk.green("Signed in!"));
    console.log(chalk.yellow(`Checking at: ${Date().toLocaleString()}`));

    let response = await page.goto(
      `https://ais.usvisa-info.com/es-cl/niv/schedule/${config.schedule_id}/appointment/days/${locationId}.json?appointments`
    );
    let json = await response.json();
    console.log(json.slice(0, 5));
    if (json.length == 0) {
      console.log(chalk.red("No appointments!"));
    } else if (Date.parse(json[0].date) < alertBefore) {
      const text = `Hora disponible el: ${json[0].date}`;
      console.log(chalk.green(text));
      sendMessage(text);
    } else {
      console.log(chalk.red("No early appointments!"));
    }
    console.log(chalk.gray("Closing Chrome headless..."));
    await browser.close();

    let next = new Date();
    next.setTime(next.getTime() + interval);
    console.log(chalk.gray(`Next checking at: ${next.toLocaleString()}`));
    gSpinner.start();
    setTimeout(checkAvailability, interval);
  })();
};

checkAvailability();

const sendMessage = (text) =>
  Promise.all(
    config.chat_ids.map((chatId) =>
      fetch(
        `https://api.telegram.org/bot${config.bot_token}/sendMessage?chat_id=${chatId}&text=${text}`
      )
    )
  );
