const { Client, Intents, Collection, MessageEmbed, MessageActionRow, MessageButton, MessageCollector, WebhookClient } = require("discord.js");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_INVITES,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
  allowedMentions: { parse: ["users", "roles"], repliedUser: true },
});

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
client.commands = new Collection();
const config = require("./utils/botconfig.js");
const EmailService = require("./utils/EmailService.js")
const mailer = new EmailService();


client.formatDate = (date) => {
  if (!date) return "No date provided";
  return new Date(date).toLocaleString();
};

client.socials = [
  {
    name: "Twitter",
    url: "https://twitter.com/chiyekovt",
  },
  {
    name: "Twitch",
    url: "https://twitch.tv/chiyekotheai",
  },
  {
    name: "Discord",
    url: "https://discord.gg/RyzuKecPX8",
  },
  {
    name: "Reddit",
    url: "https://reddit.com/r/chiyekovtuber",
  }
];

client.getUser = (id) => {
  if (!id) return null;

  return client.users.cache.get(id);
};


client.github = (commits) => {
  if (!commits) return null;
  
  if (!commits.length === 0) return;
  
  const getNormalCommitMessage = (message) => {
    // Everything before the newline
    if (!message) return null;
    return message.split("\n")[0];
  }

  const shortenCommitId = (id) => {
    // Return only the first 7 characters
    if (!id) return null;
    if (id.length < 7) return id;
    return id.substring(0, 7);
  }

  const generateTitle = (commits) => {
    if (!commits) return null;
    if (commits.length === 1) return `${commits.length} new commit`;
    else return `${commits.length} new commits`;
  }

 const embed = new MessageEmbed()
    .setTitle(generateTitle(commits))
    .setAuthor(
      {
        name: client.getUser(process.env.owner).username,
        iconURL: client.getUser(process.env.owner).displayAvatarURL({ dynamic: true }),
        url: "https://github.com/zenithvt"
      }
    )

    .setColor("LUMINOUS_VIVID_PINK")
    .setDescription(
      // For each commit, add a field with the commit message and the commit id
      commits.map((commitData) => {
        return `${getNormalCommitMessage(commitData.message)} [${shortenCommitId(commitData.id)}](${commitData.url})`;
      }).join("\n")

    )

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setURL("https://github.com/zenithvt/chiyeko-discord-bot")
          .setLabel("View on GitHub")
          .setStyle("LINK")
      );

      const githubChannel = client.channels.cache.get("1091915646037667931");

      githubChannel.send({ embeds: [embed], components: [row], content: "<@&1091906621287956590>" });
}


client.staff = () => {
  const guild = client.guilds.cache.get(config.guildID);
  const staff_role = guild.roles.cache.get(process.env.staffRole);
  
  const staff = guild.members.cache.filter(member => member.roles.cache.has(staff_role.id));

  const checkForAnimatedAvatar = (member) => {
    if (member.user.avatar.startsWith("a_")) return `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.gif`;
    else return `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`;
  };

  const staffArray = staff.map((member) => {
    return {
      name: member.user.username,
      avatar: checkForAnimatedAvatar(member),
      id: member.user.id,
      tag: member.user.tag,
    };
  });

  return staffArray;
};

/*
  * Donate function
  * @param {string} id - The ID of the user [REQUIRED]
  * @param {number} amount - The amount of money donated [REQUIRED]
  * @param {string} code - The currency code (USD, EUR, etc.) [OPTIONAL]
*/
client.donate = (id, amount, code, email) => {
  if (!id) throw new Error("No ID provided");
  if (!amount) throw new Error("No amount provided");
  if (!email) throw new Error("No email provided");
  if (!code) code = "USD";

  const guild = client.guilds.cache.get(config.guildID);
  try {
    guild.members.fetch(id).then((member) => {
      if (!member) return "No member found";

      // Check if the user already has the supporter role
      if (member.roles.cache.has(process.env.supporterRole)) {
        const donateEmbed = new MessageEmbed()
          .setTitle("Thank you for supporting Chiyeko!")
          .setDescription(`Thank you for supporting Chiyeko! You are already a supporter, so you will not be given the **Supporter** role again. You can use the **supporter** command to get a list of perks for being a supporter.`)
          .setColor("RANDOM")
          .setFooter({
            text: "Thank you for supporting Chiyeko!",
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        const row = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId("supporter")
              .setLabel("Supporter")
              .setStyle("PRIMARY")
              .setEmoji("👑")
              .setDisabled(true),
            new MessageButton()
              .setLabel("Discord Server")
              .setStyle("LINK")
              .setURL("https://discord.gg/RyzuKecPX8")
              .setEmoji("🎉"),
            new MessageButton()
              .setLabel("Supporter Chat")
              .setStyle("LINK")
              .setURL("https://discord.com/channels/1091905976619249724/1091918587809243166")
              .setEmoji("💬")
          );

          return member.send({ embeds: [donateEmbed], components: [row] });
      }

      member.roles.add(process.env.supporterRole).then(() => {
        const donateEmbed = new MessageEmbed()
          .setTitle("Thank you for supporting Chiyeko!")
          .setDescription(
            `Thank you for supporting Chiyeko! You have been given the **Supporter** role in the Chiyeko Discord server. This will help pay for the server and other expenses. You can also use the **supporter** command to get a list of perks for being a supporter.`
          )
          .setColor("RANDOM")
          .setFooter(
            {
              text: "Thank you for supporting Chiyeko!",
              iconURL: client.user.displayAvatarURL({ dynamic: true }),
            }
            )
          .setTimestamp();

          const row = new MessageActionRow()
          .addComponents(
              new MessageButton()
                  .setCustomId('supporter')
                  .setLabel('Supporter')
                  .setStyle('PRIMARY')
                  .setEmoji('👑')
                  .setDisabled(true),
                new MessageButton()
                  .setLabel('Discord Server')
                  .setStyle('LINK')
                  .setURL('https://discord.gg/RyzuKecPX8')
                  .setEmoji('🎉'),
                new MessageButton()
                  .setLabel('Supporter Chat')
                  .setStyle('LINK')
                  .setURL('https://discord.com/channels/1091905976619249724/1091918587809243166')
                  .setEmoji('💬'),
          );

       

        const supporterEmbed = new MessageEmbed()
          .setTitle("New Supporter")
          .setAuthor({
            name: member.user.tag,
            iconURL: member.user.displayAvatarURL({ dynamic: true }),

          })
          .setDescription(`**<@!${member.user.id}>** has donated **${amount}** ${code.toUpperCase()} to Chiyeko!`)
          .setColor("RANDOM")
          .setFooter({
            text: "Thank you for supporting Chiyeo!",
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        const supporterChannel = client.channels.cache.get(process.env.supporterChannel);

        member.send({ embeds: [donateEmbed], components: [row] });
        supporterChannel.send({ embeds: [supporterEmbed] });
        mailer.sendDonateThankYou(member.user.tag, email);

      })
    });
  } catch (err) {
    throw new Error(err);
  }
};



const commandFolders = fs.readdirSync(path.join(__dirname, "commands"));

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(path.join(__dirname, "commands", folder)).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, "commands", folder, file));
        client.commands.set(command.data.name, command);
    }
}

const eventFiles = fs.readdirSync(path.join(__dirname, "events")).filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
    const event = require(path.join(__dirname, "events", file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}


client.formatNumbers = (number) => {
  if (!number) return "0";
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}




// client.on("messageCreate", async (message) => {
//   if (message.author.bot) return;

//   const userSchema = require("./models/user");

//   // Check if the author mentioned a user
//   if (!message.mentions.users.first()) return;

//   // Get the mentioned user
//   const mentionedUser = message.mentions.users.first();

//   // Check if the mentioned user is a bot
//   if (mentionedUser.bot) return;

//   const user = await userSchema.findOne({
//     discordId: mentionedUser.id,
//   });


//   if (!user.isAfk) return;
//   if (message.guildId != config.guildID) return;

//   message.delete();

//   message.channel.send({
//     content: `${mentionedUser.username} is currently AFK. Reason: ${user.afkReason}`,
//   }).then((msg) => {
//     setTimeout(() => msg.delete(), 5000);
//   });
// });


client.login(process.env.token);
