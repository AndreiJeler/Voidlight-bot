var express = require("express");
const bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
var port = process.env.PORT || 8080;
var guildId = process.env.GUILDID;
var generalChannelId = process.env.GENERALID;
var everyoneId = process.env.EVERYONEID;
var lobbiesId = process.env.LOBBIESID;
var token = process.env.TOKEN;
var prefix = process.env.PREFIX;

const { Client } = require("discord.js");
var Discord = require("discord.js");
const { registerCommands, registerEvents } = require("./utils/registry");
const client = new Client();

(async () => {
  client.commands = new Map();
  client.events = new Map();
  client.prefix = prefix;
  await registerCommands(client, "../commands");
  await registerEvents(client, "../events");
  await client.login(token);

  var guild = client.guilds.cache.get(guildId);
  var generalChannel = guild.channels.cache.get(generalChannelId);

  app.post("/", jsonParser, (req, res) => {
    console.log(req.body);
    res.send("salut");
  });

  app.post("/check-member", jsonParser, (req, res) => {
    if (
      guild.member(req.body.DiscordId) ||
      guild.ownerID == req.body.DiscordId
    ) {
      res.send('{"result":"ok"}');
    } else {
      try {
        var user = new Discord.User(client, { id: req.body.DiscordId });
        guild.addMember(user, { accessToken: req.body.DiscordToken });
        res.send('{"result":"new"}');
      } catch {
        res.send('{"result":"ok"}');
      }
    }
  });

  app.post("/create-channel", jsonParser, (req, res) => {
    var channelName =
      req.body.GameId.toString() +
      "_" +
      req.body.Initializer.Username.toString() +
      "_" +
      req.body.Id.toString();

    var everyoneRole = guild.roles.cache.get(everyoneId);
    var lobbiesCategory = guild.channels.cache.get(lobbiesId);

    guild.channels
      .create(channelName + "-text", { type: "text", parent: lobbiesCategory })
      .then((res) => {
        res
          .updateOverwrite(everyoneRole, { VIEW_CHANNEL: false })
          .then(() => {});
        for (var user of req.body.Users) {
          res
            .updateOverwrite(user.DiscordId, { VIEW_CHANNEL: true })
            .then()
            .catch();
          res.send(`Welcome <@${user.DiscordId}>`);
        }
      });
    guild.channels
      .create(channelName + "-voice", {
        type: "voice",
        parent: lobbiesCategory,
      })
      .then((res) => {
        res
          .updateOverwrite(everyoneRole, { VIEW_CHANNEL: false })
          .then(() => {});
        for (var user of req.body.Users) {
          res
            .updateOverwrite(user.DiscordId, { VIEW_CHANNEL: true })
            .then()
            .catch();
        }
      });

    res.send(`{"channel":"${channelName}"}`);
    //guild.channels.create();
  });

  app.listen(port);
  console.log("API started");
})();
