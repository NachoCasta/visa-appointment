# US Visa appointment checker

The script automates the visa appointment checking.

## Status of the project
This is not a scalble/maintainable solution since it has been built in a very short time-frame. It is for personal use only!

## Environment

Linux/MacOS + NodeJS 16

If you don't have NodeJS envirement, install it through: https://nodejs.org/en/

## Config

You have to config the tool by editing the configuration file at ./.config.json

The config uses JSON format, so please follow the standard JSON format.

```json
{
    "schedule_id": "8 digits id", // You can find your schedule id by clicking the green "Continue" button localted on top right of the web page. (You will see it once you successfully logged in.)
    "alert_for_appointment_before": "2022-12-08", // Set a date of your current appointment date. The script will play beep-beep-beep-beep-beep once it finds an early appointment.
    "location": "vancouver", // The location should be one of the the following options: vancouver, calgary, ottawa, toronto.
    "username": "username", // Your usvisa-info username.
    "password": "password" // Your usvisa-info password.
}
```

## Install dependency

Run the command
```bash
npm install
```

## Run script
Once you start the script, it will check the appointment every 10 minutes (don't recommend to change since your account could be blocked if you check too often)

```bash
./check-appointment.js
```

To quit the script, press `Control+C`

## License
The MIT License (MIT)

Copyright (c) 2022 Patrick Yin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
