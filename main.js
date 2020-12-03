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
  if (msg.channel.type == 'dm') {
    console.log("Dm message got")
    if (msg.content.startsWith("/group ")) {
      var msg_loppu = msg.content.substr("/group ".length);
      const args = msg_loppu.trim().split(" ");
      if (args[0] == "join") {
        let sql = `SELECT Id, Guild_id FROM Channels WHERE Code = ?`;
        let values = [args[1]];
  
        con.query(sql, values, (err, result) => {
          if (err) throw err;
          if (result[0] != undefined) {
            var channel = client.guilds.cache.get(result[0].Guild_id).channels.cache.get(result[0].Id);
            if (channel != null) {
              channel.updateOverwrite(msg.author, { VIEW_CHANNEL: true , CONNECT: true});
            }
              
        } else {
          msg.channel.send('A group with that code wasn\'t found please check that you typed the code correctly, if you are sure it\'s a bug please report it to me (sveti404#3122)');
        }
        });
      }
    }

  };
  if (msg.content.startsWith("/group ")) {
    var code = getRandomText(6);
    var msg_loppu = msg.content.substr("/group ".length);
    const args = msg_loppu.trim().split(" ");
    // Creating groups
    if (args[0] == "create") {
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
        let sql = `INSERT INTO Channels (Name, Id, User_id, Code, Guild_id) VALUES (?, ?, ?, ?, ?)`;
        let values = [args[1], ChannelID, msg.author.id, code, msg.guild.id];

        con.query(sql, values, (err, result) => {
          if (err) throw err;
        });

        msg.author.send("Your channel has been created with the code: " + code);
      })
    }
    // Joining groups
    if (args[0].toLowerCase() == "join" && msg.channel.type != 'dm') {
      let sql = `SELECT Id FROM Channels WHERE Code = ?`;
      let values = [args[1]];
      con.query(sql, values, (err, result) => {
        if (err) throw err;
        if (result[0] != undefined) {
          var channel = msg.guild.channels.cache.get(result[0].Id);
          if (channel != null) {
            channel.updateOverwrite(msg.author, { VIEW_CHANNEL: true , CONNECT: true});
          }
          msg.delete();
            
      } else {
        msg.channel.send('A group with that code wasn\'t found please check that you typed the code correctly, if you are sure it\'s a bug please report it to me (sveti404#3122)');
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

  // Database and Discord cleanup command (will be removed once development is done)
  if (msg.content.startsWith("/cleanup ")) {
    if (msg.author.id == '407975103629099008') {
      var msg_loppu = msg.content.substr("/cleanup ".length);
      const args = msg_loppu.trim().split(" ");
      if (args[0] == "discord") {
        var channels = msg.guild.channels.cache.filter(ch => ch.type === "voice");
        var size = channels.size;
        channels.forEach(element => {
          element.delete();
        });
        msg.channel.send('Channels deleted: ' + size);

      }
      if (args[0] == "database") {
        let sql = `DELETE FROM Channels`;
        con.query(sql, (err, result) => {
          if (err) throw err;
          msg.channel.send("Database Emptied")
        });
      }
    }
  }



});


// Creating code function
function getRandomText(length) {
  var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".match(/./g);
  var text = ""
  for (var i = 0; i < length; i++) text += charset[Math.floor(Math.random() * charset.length)];
  let sql = `SELECT * FROM Channels WHERE Code = ?`;
  let values = [text];
  con.query(sql, values, (err, result) => {
    if (err) throw err;
  });
  return text;
}




// Logging into the bot
client.login(config.token);