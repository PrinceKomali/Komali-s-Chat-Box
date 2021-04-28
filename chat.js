const fetch = require("node-fetch")
const twitchemotes = require("./twitchemotes.json") //simple emote name => <img> tag
var express = require('express')
const fs = require('fs')
let f = require('sync-fetch')
var badgeURLs = f("https://badges.twitch.tv/v1/badges/global/display").json()

const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 3001;
const Discord = require('discord.js')
const client = new Discord.Client({ ws: { intents: Discord.Intents.ALL } })
const auth = require('../komalibot/.bot_tokens.json'); // :)
const apikey = auth.apikey;
const tmi = require('tmi.js');
function getMembers() {
    return client.users.cache.map(x => x.username.toLowerCase().replace(/[^a-zA-Z]/g, ""))
}


const clientid = auth.clid
const channelid = "UCoKZGYMKo_KTIXiWUYxVPKA"
const opts = {
    options: {
        clientId: auth.kbclid,
        debug: true
    },
    identity: {
        username: 'komalibot',
        password: auth.kbidentity
    },
    channels: [
        'komali09'
    ]
};

client.on('ready', () => {
    console.log("\x1b[35m\x1b[47m\x1b[4m%s\x1b[0m", "Connected to Discord")
    fetch('https://api.frankerfacez.com/v1/set/838690').then(res=>res.json())
    .then(res=>{
        var eObj = {}
        for(i = 0; i< res.set.emoticons.length;i++){
            var thisE = res.set.emoticons[i]
            eObj[thisE.name] = "<img height=25 src='" + thisE.urls["1"] + "'>"
        }
        fetch('https://api.betterttv.net/3/cached/users/twitch/184268998').then(res=>res.json())
        .then(res=>{

            for(i = 0; i< res.sharedEmotes.length;i++) {
                eObj[res.sharedEmotes[i].code] = "<img height=25 src='https://cdn.betterttv.net/emote/" + res.sharedEmotes[i].id + "/3x'>"
            }
            fs.writeFileSync("./customemotes.json", JSON.stringify(eObj, null, 2))
            console.log("\x1b[32m\x1b[47m\x1b[4m%s\x1b[0m", "Emotes Loaded")
        })
    })
    setInterval(function (){
        io.emit("kcount", fs.readFileSync("./kappacounter.txt", "utf8"))
    }, 50)
    
})

function updateKappa(n) {
    if(!n) n = 1
    var was = fs.readFileSync("./kappacounter.txt", "utf8") //gets the current number
    fs.writeFileSync("./kappacounter.txt", (parseInt(was) + parseInt(n)).toString()) //Adds 1 to it (rewrites the file)
}
function getLatestFollow() {

    fetch('https://id.twitch.tv/oauth2/token?client_id=' + clientid + '&client_secret=' + auth.secret + '&grant_type=client_credentials', {
        method: 'POST',
    })
        .then(res => res.json())
        .then(res => {
            var token = res.access_token
            fetch('https://api.twitch.tv/helix/users/follows?to_id=184268998', {
                method: 'GET',
                headers: {
                    'Client-ID': clientid,
                    'Authorization': 'Bearer ' + token,

                }
            })
                .then(res => res.json())
                .then(res => {

                    var latestFollow = fs.readFileSync("./latestfollow.txt", "utf8")
                    if (res.data[0].from_name != latestFollow) {
                        io.emit("userFollow", res.data[0].from_name)
                        fs.writeFileSync("./latestfollow.txt", res.data[0].from_name)
                        var latestFollow = fs.readFileSync("./latestfollow.txt", "utf8")
                    }
                })
        })
}
getLatestFollow()
setInterval(() => {
    getLatestFollow()
}, 10000)

function discordify(string) {
    string = string.replace(/[a-z]:[^:\s]+:|:[^:\s]+:/g, "<img class='emote' height = '25' src= 'http://cdn.discordapp.com/emojis/")
    string = string.split(/>/g)
    for (i = 0; i < string.length; i++) {
        if (string[i].includes("cdn.discordapp.com/emojis/")) {
            string[i] = string[i] + "'>"
        } else if (string[i].includes("<")) {
            string[i] += ">"
        }


    }
    string = string.join("")
    string = string.split(/[<>]/g)
    for (i = 0; i < string.length; i++) {
        if (string[i].startsWith("#")) {

            string[i] = "<span style='color:#7286d5;' class='purple'>#" + client.channels.cache.get(string[i].replace("#", "")).name + "</span>"
        }
        if (string[i].startsWith("@")) {
            string[i] = string[i].replace("!", "")
            string[i] = "<span style='color:#7286d5;' class='purple'>@" + client.users.cache.get(string[i].replace("@", "")).username + "</span>"
        }
        if (string[i].startsWith("img class='emote' height = '25'")) {
            string[i] = "<" + string[i] + ">"
        }
    }
    string = string.join("")
    return string
}
function follows() {
    fs.writeFileSync("./public/tempscript.js", "var initName = '" + fs.readFileSync("./latestfollow.txt", "utf8") + "'")
    fetch('https://id.twitch.tv/oauth2/token?client_id=' + clientid + '&client_secret=' + auth.secret + '&grant_type=client_credentials', {
        method: 'POST',
    })
        .then(res => res.json())
        .then(res => {
            var token = res.access_token
            fetch('https://api.twitch.tv/helix/users/follows?to_id=184268998', {
                method: 'GET',
                headers: {
                    'Client-ID': clientid,
                    'Authorization': 'Bearer ' + token,

                }
            })
                .then(res => res.json())
                .then(res => {
                    fetch("https://www.googleapis.com/youtube/v3/channels?part=statistics&id=" + channelid + "&key=" + apikey)
                        .then(ytres => ytres.json())
                        .then(ytres => {
                            io.emit('subs', res.total, ytres.items[0].statistics.subscriberCount)
                        })
                })
        })
}
follows()
var interval = setInterval(function () {
    follows()
}, 30000)
const twitchclient = new tmi.client(opts);
//twitchclient.on('message', onMessageHandler);
twitchclient.on('connected', onConnectedHandler);

twitchclient.connect();
function geticon(input) {
    var dusers = getMembers()
    const exceptions = {
        "undodog345": "691700459395743855", //gamer
        "z2w_02": "673550715137818635", //z2w
        "komalibot": "702572373261680796",//kb2
        "liorwastaken": "454356237614841870", //Lior x1
        "underscorelior": "454356237614841870", //Lior x2
        "epicsgeiler": "448790275372875789", //Puper
        "llsky_dragonll": "724430835880558664", //Sky
        "nimbus78": "753308545327300608", //nimbus
        "kisameruns": "552298601418850345", //Kisame
        "therealfishal": "797266395284766741", //Fishal
        "flixiander": "802649322054877235"//flixi
    }
    if (Object.keys(exceptions).includes(input.toLowerCase())) {
        //console.log(client.users.cache.find(x => x.username == exceptions[input.toLowerCase()]))
        try {
            return "<div class=\"image-cropper\"> <img src=\"" + client.users.cache.get(exceptions[input.toLowerCase()]).displayAvatarURL({ format: 'png', dynamic: true }) + "\" alt=\"avatar\" class=\"profile-pic\"> </div>"
        }
        catch (e) {
            return "<div class=\"image-cropper\"> <img src=\"https://discord.com/assets/6debd47ed13483642cf09e832ed0bc1b.png\" alt=\"avatar\" class=\"profile-pic\"> </div>"
        }


        //this returns correctly
        //return "<div class=\"image-cropper\"> <img src=\"" + client.users.cache.find(x => x.username == exceptions[input.toLowerCase()]).avatarURL() + "\" alt=\"avatar\" class=\"profile-pic\"> </div>"
        
    } 
    else if (dusers.includes(input.toLowerCase().replace(/[^a-zA-Z]/g, ""))) {
        //console.log(client.users.cache.find(x => x.username.toLowerCase().replace(/[^a-zA-Z]/g, "") == input.toLowerCase().replace(/[^a-zA-Z]/g, "")).avatarURL())
        return "<div class=\"image-cropper\"> <img src=\"" + client.users.cache.find(x => x.username.toLowerCase().replace(/[^a-zA-Z]/g, "") == input.toLowerCase().replace(/[^a-zA-Z]/g, "")).displayAvatarURL({ format: 'png', dynamic: true }) + "\" alt=\"avatar\" class=\"profile-pic\"> </div>"
    }

else {
return ""
}


    //return "<div class=\"image-cropper\"> <img src=\"https://images-ext-2.discordapp.net/external/4vqypLMTLOvQ0Q5NixUJa0fk2mexJ-t_E7_H8hq-Bag/https/cdn.discordapp.com/avatars/702572373261680796/74321559a062e2ca0184adb28b61c2b2.webp\" alt=\"avatar\" class=\"profile-pic\"> </div>"
}
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/chat.html');
});
app.get('/follows', function (req, res) {
    res.sendFile(__dirname + '/sensor.html')
})

app.use(express.static('public'))
var selectedChannel = "751797116271198228"
var allch = false;

    client.on("message", async (message) => {
        try {
        var splitMessage = message.content.split(" ")
        var kappacount = (message.content.match(/:Kappa:/gi) || []).length
        if (kappacount != 0) updateKappa(kappacount)
        if (splitMessage[0] == "&channel") {
            if (splitMessage[1] == "all") {
                allch = true
                message.channel.send("Changed Selected Channel to All Channels")
            } else {
                allch = false
                selectedChannel = message.channel.id.toString()
                message.channel.send("Changed Selected Channel to " + message.channel.toString())
            }
        }
        if (splitMessage[0] == "&duration") {
            if (!isNaN(splitMessage[1])) {
                try {
                    if (splitMessage[1] == "infinite") {
                        io.emit("duration", "infinite")
                    }
                    else {
                    io.emit("duration", parseInt(splitMessage[1]))
                        message.channel.send("Changing Message Duration to " + splitMessage[1] + " milliseconds")
                    }
                } catch (e) {
                    message.channel.send("Something went wrong :/")
                }
            } else {
                message.channel.send("Please Provide a Valid Number!")
            }
        }
        if (message.channel.id == selectedChannel || allch) {
            var outfile = "";
            var string = message.content;
            //string = string.replace(/</g, "&lt;").replace(/>/g, "&gt;")
            var files = " "
            files = message.attachments.size ? {
                files: message.attachments.array()
            } : " "
            if (message.attachments.size > 0) {
                var re = /(?:\.([^.]+))?$/
                var imgFiles = ["png", "jpg", "jpeg", "svg"]
                if (imgFiles.includes(re.exec(files.files[0].url)[1])) {
                    outfile = "<br><img class='attachment' src='" + files.files[0].url + "'>"
                }
                else {
                    var name = files.files[0].name
                    if (name.length > 18) name = name.substring(0, 15) + "... ." + re.exec(files.files[0].url)[1]   
                    outfile = '<div class="otherfile"> <img src="https://discord.com/assets/481aa700fab464f2332ca9b5f4eb6ba4.svg" style = "margin-left:5px;margin-top:5px;"> <p style="color:#00b0f4;display:inline-block;position:absolute;margin-left:5px;">' + name +'</p> </div>'
                }
            }
            
            var hcolor = message.member.displayHexColor == "#000000" ? "#ffffff" : message.member.displayHexColor
            string = discordify(string)
            string = string.replace(/\\/g, '');
            var mod = false
            let modroles = ["599376736811089940", "691659096759205924"]
            var modcheck = false
            for (var i in modroles) {
                if (message.member.roles.cache.has(modroles[i])) {
                    mod = true
                    break
                }
            }
            var mEs = JSON.parse(JSON.stringify(message.embeds));
            console.log(message.content)
            console.log(mEs.length, typeof mEs)
            console.log(JSON.stringify(mEs[0]))
            if(mEs.length !== 0) {
                //console.log("Contains lb: ", JSON.stringify(mEs[0]).includes("\\n"))
                console.log("TYPE: ", typeof mEs)
                mEs[0] = JSON.parse(JSON.stringify(mEs[0]).replace(/\\n/g, "&gt;br&lt;"))
                console.log(JSON.stringify(mEs[0]).replace(/\\n/g, "<br"))
                console.log(mEs[0])
                if(mEs[0].type == "rich"){
                    if(mEs[0].title) mEs[0].title = discordify(mEs[0].title) 
                    if(mEs[0].description) mEs[0].description = discordify(mEs[0].description) 
                    for(i in mEs[0].fields){
                        mEs[0].fields[i].name = discordify(mEs[0].fields[i].name)
                        mEs[0].fields[i].value = discordify(mEs[0].fields[i].value)
                    }
                    
                mEs[0] = JSON.parse(JSON.stringify(mEs[0]).replace(/&gt;br&lt;/g, "<br>")) 
                }
                
            }
            console.log(mEs[0])
            io.emit("discordmessage", hcolor, message.author.username, string, message.author.displayAvatarURL({ format: 'png', dynamic: true }), message.author.id, mod, outfile, mEs)

        }
    }
    //<img height=25 src='
    catch (err) { }
    })


twitchclient.on("chat", function (channel, user, message, self) {
  
    var customemotes = JSON.parse(fs.readFileSync('./customemotes.json', 'utf8'))
try{
    //console.log(channel, user, message, self)
    // Don't listen to my own messages..
    var splitMessage = message.split(" ")
    var string = message
    var kappacount = (string.match(/Kappa/g) || []).length
    if (kappacount != 0) updateKappa(kappacount)
    //console.log(Object.keys(twitchemotes))
    var objKeys = Object.keys(twitchemotes)
    var customKeys = Object.keys(customemotes)
    /*for (i = 0; i < objKeys.length; i++) {
        var regex = new RegExp(objKeys[i], "g")
        string = string.replace(regex, twitchemotes[objKeys[i]])
        //console.log(string)
    }*/
    var counter = 0
    var newstr = string
    if (user.emotes != null) {
        //console.log("has emotes")

        var emoteKeys = Object.keys(user.emotes)
        //console.log(user)
        for (i = 0; i < emoteKeys.length; i++) {
            var thisInstance = user.emotes[emoteKeys[i]]
            for (j = 0; j < thisInstance.length; j++) {

                var start = parseInt(thisInstance[j].split("-")[0])
                var end = parseInt(thisInstance[j].split("-")[1]) + 1
                try {
                    var replacement = new RegExp(string.substring(start, end), "g")
                    newstr = newstr.replace(replacement, "<img height = '25' src = 'TWITCHDOMAIN/emoticons/v1/" + emoteKeys[i] + "/3.0'>")
                    //console.log(newstr)
                }
                catch (e) {
                    newstr = newstr
                }




            }
        }
    }

    string = newstr





    if (self) {
        for (i = 0; i < objKeys.length; i++) {
            var regex = new RegExp(objKeys[i], "g")
            string = string.replace(regex, twitchemotes[objKeys[i]].replace("<img height=25 src='", "CUSTOMTAGXXXXXX"))
            //console.log(string)
        }
    }



    for (i = 0; i < customKeys.length; i++) {
        var regex2 = new RegExp(customKeys[i], "g")
        string = string.replace(regex2, customemotes[customKeys[i]].replace(/\<img height\=25 src\=\'/g, "CUSTOMTAGXXXXXX"))
        //console.log(string)
    }
    //console.log(string)
    //console.log("==========================================================" + geticon(user["display-name"]))
    const default_colors = [
        ["Red", "#FF0000"],
        ["Blue", "#0000FF"],
        ["Green", "#00FF00"],
        ["FireBrick", "#B22222"],
        ["Coral", "#FF7F50"],
        ["YellowGreen", "#9ACD32"],
        ["OrangeRed", "#FF4500"],
        ["SeaGreen", "#2E8B57"],
        ["GoldenRod", "#DAA520"],
        ["Chocolate", "#D2691E"],
        ["CadetBlue", "#5F9EA0"],
        ["DodgerBlue", "#1E90FF"],
        ["HotPink", "#FF69B4"],
        ["BlueViolet", "#8A2BE2"],
        ["SpringGreen", "#00FF7F"]
    ]
    // const default_colors = ["#FF0000", "#0000FF", "#00FF00", "#B22222", "#FF7F50", "#9ACD32", "#FF4500", "#2E8B57", "#DAA520", "#D2691E", "#5F9EA0", "#1E90FF", "#FF69B4", "#8A2BE2", "#00FF7F"]
    var uColor = user.color
    //console.log(user)
    if (user.color == null) {

        var n = user['display-name'].charCodeAt(0) + user['display-name'].charCodeAt(user['display-name'].length - 1);
        uColor = default_colors[n % default_colors.length][1]
        console.log(default_colors[n % default_colors.length][1])
    }
  //  console.log("hi")
    let userbadges = user.badges ? user.badges : {};
    for(i in Object.keys(userbadges)){
        userbadges[Object.keys(userbadges)[i]] = badgeURLs.badge_sets[Object.keys(userbadges)[i]].versions["1"]["image_url_4x"]
    }
    

    io.emit("twitchmessage", userbadges, uColor, user['display-name'], string, user, geticon(user["display-name"]))

    //commands
    if (message.trim() == "!technicalities") {
        twitchclient.say(channel, "If we take out all the menuing from both runs, Paradox's run is still faster; he had really bad menuing at the end")
    }

    if (message.trim().toLowerCase().includes("bigfollows") || message.trim().toLowerCase().includes("want to become famous") || message.trim().toLowerCase().includes("wanna become famous") || message.trim().toLowerCase().includes("wanna be famous") || message.trim().toLowerCase().includes("want to be famous")) {
        twitchclient.timeout(channel, user['display-name'], 1, "bot")
    }
    if (message.trim().startsWith("!eval")) {
        io.emit("eval", message.replace("!eval", "").trim())
    }



    //console.log(user['display-name'], user.badges)
    if (message.split(" ")[0] == "!slots") {
         
                var slotStr = "";
                var slotRepeat = splitMessage[1];
                if (isNaN(slotRepeat) || slotRepeat < 2) {
                    slotRepeat = 3;
                }
                if (slotRepeat > 50) {
                    slotRepeat = 50;
                }
                //if (self ) return;
                var str = ""
                for (i = 0; i < slotRepeat; i++) {
                    var emotes = Object.keys(twitchemotes)
                    str = str + emotes[Math.floor(Math.random() * emotes.length)] + " "
                }
                twitchclient.say(channel, str)
                twitchclient.say(channel, "Please Play Again")
        
    

    }
    if (message.trim().toLowerCase() == "!discord") {
        twitchclient.say(channel, "Join my Discord Server! https://discord.gg/QWCcXMe")
    }
    if (message.trim().toLowerCase() == "!rules") {
        twitchclient.say(channel, "I cannot wb in shrines or learn btb setups beforehand")
    }
    if (message.trim().toLowerCase() == "!mist") {
        twitchclient.say(channel, "I'm helping Periwinkle test out this timer; It only crashes when I am streaming so I am trying to get some error logs out of it to see why")
    }
    if(message.trim().toLowerCase() == "!monke"){
        twitchclient.say(channel, "Eat a banana while crouching during the monkey sound effects that play in the Faron jungle")
    }


}
catch(e) {
    console.log(e.toString());
}
});
http.listen(port, function () {
    console.log('listening on *:' + port);
});
function onConnectedHandler(addr, port) {
    console.log(`Logged in to ${addr}:${port}`);
}
client.login(auth["shrine_task_bot"])
