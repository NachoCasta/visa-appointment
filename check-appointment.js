#!/usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import clear from "clear";
import CLI from "clui";
import puppeteer from "puppeteer";
import fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import PlaySound from "play-sound";

const player = PlaySound();

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

const interval = 90 * 60 * 1000; // 10 minutes

const alertBefore = new Date(config.alert_for_appointment_before);

let gSpinner = new CLI.Spinner("Waiting for the next run...");

let checkAvailability = () => {
  (async () => {
    gSpinner.stop();
    console.log(chalk.gray("Opening Chrome headless..."));
    let browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1300,
        height: 1080,
      },
    });
    let page = await browser.newPage();

    let spinner = new CLI.Spinner("Signing in...");
    spinner.start();
    try {
      await page.goto("https://ais.usvisa-info.com/es-cl/niv/users/sign_in");
      await page.type("#user_email", config.username);
      await page.type("#user_password", config.password);
      await page.$eval("#policy_confirmed", (check) => (check.checked = true));
      // await page.waitForTimeout(3000);
      await Promise.all([
        page.waitForNavigation(),
        page.click("input[type=submit]"),
      ]).catch(() => {
        console.error("Error Occurred.");
      });
      spinner.stop();
      console.log(chalk.green("Signed in!"));
      console.log(chalk.yellow(`Checking at: ${Date().toLocaleString()}`));

      // Click "Continuar"
      // Esto puede fallar dependiendo del idioma del computador,
      // en ese caso cambiar a 'Continue'
      await page.click("xpath=//a[contains(text(), 'Continuar')]");
      await sleep(3000);

      // Click "Reprogramar cita"
      const accordionItems = await page.$$(".accordion-item");
      accordionItems[2].click();
      await sleep(1000);
      await page.click(".accordion-item:nth-child(3) .small-only-expanded");
      await sleep(3000);

      // Click "Continuar"
      await page.click("input[type=submit]");
      await sleep(4000);

      try {
        // Click "Fecha de la cita"
        const dateInputSelector = "#appointments_consulate_appointment_date";
        await page.waitForSelector(dateInputSelector);
        const dateInput = await page.$(dateInputSelector);
        await dateInput.click();
      } catch (error) {
        throw new NotAvailableError();
      }

      // Find available dates
      let availableDates = [];
      while (availableDates.length === 0) {
        availableDates = await page.$$(
          "#ui-datepicker-div tbody td:not(.ui-datepicker-unselectable)"
        );
        if (availableDates.length === 0) {
          await page.click(".ui-datepicker-next");
        }
      }

      // Select earliest date
      await availableDates[0].click();
      await sleep(1000);

      // Check if it's earlier than current
      await page.waitForSelector(dateInputSelector);
      const dateString = await page.evaluate(
        (element) => element.value,
        dateInput
      );
      const date = new Date(dateString);
      if (date < alertBefore) {
        const text = `Hora disponible el: ${dateString}`;
        console.log(chalk.green(text));
        // player.play("alarm.wav");
        sendMessage(text);
      } else {
        console.log(
          chalk.red(
            `No hay disponibilidad antes de la fecha actual. Próxima disponibilidad: ${dateString}`
          )
        );
      }
    } catch (error) {
      let errorMessage = "Hubo un error, se intentará denuevo";
      if (error instanceof NotAvailableError) {
        errorMessage = "No hay citas disponibles, se intentará denuevo";
      }
      console.log(chalk.red(errorMessage));
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

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms));

class NotAvailableError extends Error {}
