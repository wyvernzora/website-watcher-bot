# website-watcher-bot
A telegram bot to watch website changes for you!

Easy to config with yaml rules and support website and api change monitoring.

Feel free to add your own rule and start watching!

## Installation
```
> git clone git@github.com:r1cebank/website-watcher-bot.git
> cd website-watcher-bot
> npm i
```

## Commands

`/start` to enable the bot, must send to use, otherwise there is not way bot can communicate with you

`/status` get the current status of the watcher

## Custom keyboard

After sending `/start` bot will give you option to choose from a list of notification sources, tap on the inline button to enable them.

Once the notification is enabled, the bot will start watching them for changes defined in the `rules` folder.

## Contributing

Feel free to fork and add your own rules or add your own rules and submit a PR, I will merge them in no time.
