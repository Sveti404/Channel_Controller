const discord = require('discord.js');
const client = new discord.Client();
const mysql = require('mysql2');
const config = require('./config.json');

var con = mysql.createConnection({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database
});

client.on('ready', () => {
  console.log("Logged in as " + client.user.tag);
  client.user.setPresence({ activity: { name: 'Controlling channels' }, status: 'online' }).catch(console.error);
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

client.on('message', msg => {
  if (msg.content.startsWith("/create ")) {
    var code = getRandomText(6);
    var msg_loppu = msg.content.substr("/create ".length);
    const args = msg_loppu.trim().split(" ");
    if (args[0].toLowerCase() == "create") {
      msg.guild.channels.create(args[1], { type: 'voice' }).then((channel) => {
        ChannelID = channel.id
        var sql = `INSERT INTO \`Channels\` (\`Name\`, \`Id\`, \`User_id\`, \`Code\`) VALUES ('${args[1]}', '${ChannelID}', '${msg.author.id}', '${code}')`;

        con.query(sql, (err, result) => {
          if (err) throw err;
        });

        msg.author.send("Your channel has been created with the code: " + code);
      })
    }
  }


});



function getRandomText(length) {
  var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".match(/./g);
  var text = "";
  for (var i = 0; i < length; i++) text += charset[Math.floor(Math.random() * charset.length)];
  return text;
}





// Bot token (hidden on github)
client.login(config.token);