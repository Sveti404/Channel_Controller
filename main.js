// Importing modules
const discord = require('discord.js');
const client = new discord.Client();
const mysql = require('mysql2');
const config = require('./config.json');

// Mysql connection (connection info hidden on github)
var con = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database
});

// Setting presence
client.on('ready', () => {
  console.log("Logged in as " + client.user.tag);
  client.user.setPresence({ activity: { name: 'Controlling channels' }, status: 'online' }).catch(console.error);
});

// Connecting to the database
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

client.on('message', msg => {
  // group commands
  if (msg.content.startsWith("/group ")) {
    var code = getRandomText(6);
    var msg_loppu = msg.content.substr("/group ".length);
    const args = msg_loppu.trim().split(" ");
    // Creating groups
    if (args[0].toLowerCase() == "create") {
      msg.guild.channels.create(args[1], { type: 'voice', permissionOverwrites: [
        {
          id: msg.author.id,
          allow: ['CONNECT', 'VIEW_CHANNEL'],

        },
        {
          id: msg.guild.id,
          deny: ['CONNECT', 'VIEW_CHANNEL'],
        },
      ]}).then((channel) => {
        ChannelID = channel.id
        // Mysql
        var sql = `INSERT INTO \`Channels\` (\`Name\`, \`Id\`, \`User_id\`, \`Code\`, \`Guild_id\`) VALUES ('${args[1]}', '${ChannelID}', '${msg.author.id}', '${code}', '${msg.guild.id}')`;

        con.query(sql, (err, result) => {
          if (err) throw err;
        });

        msg.author.send("Your channel has been created with the code: " + code);
      })
    }
    // Joining groups
    if (args[0].toLowerCase() == "join") {
      var sql = `SELECT (\`Id\`) FROM \`Channels\` WHERE (\`Code\`) = '${args[1]}'`;
      con.query(sql, (err, result) => {
        if (err) throw err;
        var channel = msg.guild.channels.cache.get(result[0].Id);
        if (channel != null) {
          channel.overwritePermissions([
            {
              id: msg.author.id,
              allow: ['VIEW_CHANNEL', 'CONNECT'],
            },
            {
              id: msg.guild.id,
              deny: ['CONNECT', 'VIEW_CHANNEL'],
            },
          ])
        } else {
          msg.channel.send('A group with that code wasn\'t found please check that you typed the code correctly, if you are sure it\'s a bug please report it to me (sveti404#3122)')
        }
      });
    }
  }

  // Help command
  if (msg.content.startsWith("/help")) {
    var msg_loppu = msg.content.substr("/help".length);
    const args = msg_loppu.trim().split(" ");
    const Embed = new discord.MessageEmbed()
      .setColor('#fffff')
      .setTitle('help')
      .addFields(
        { name: '/group (create) (name)', value: 'Creates a group with the name you specified and sends a code in your dm' },
        { name: '/group (join) (code)', value: 'Join a group with the code you specified (if one exists)' },
        { name: '/help', value: 'Sends this embed' },
      )
      .setFooter('Created by sveti404#3122');
    msg.channel.send('A help command has been sent into your dm');
    msg.author.send(Embed);


  }



});


// Creating code function
function getRandomText(length) {
  var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".match(/./g);
  var text = "";
  for (var i = 0; i < length; i++) text += charset[Math.floor(Math.random() * charset.length)];
  return text;
}




// Logging into the bot
client.login(config.token);