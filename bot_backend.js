const TelegramBot = require('node-telegram-bot-api');
const BOT_TOKEN = process.env.BOT_TOKEN
const express = require("express")
const crypto = require('crypto');

var bodyParser = require('body-parser');
const HMAC_SECRET = crypto.createHmac('sha256','WebAppData').update(BOT_TOKEN).digest();

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const bot = new TelegramBot(BOT_TOKEN);
const URL = "https://0999-109-245-36-244.ngrok-free.app"

function verifyTelegramUser(data){
    const hash = data['hash']

    var appd_data = []
    for(key in data){
        if(key != "hash"){
            appd_data.push(key+"="+data[key])
        }
    }

    appd_data.sort((a, b) => a.localeCompare(b));
    appd_data = appd_data.join("\n")

    const _hash = crypto
    .createHmac("sha256",HMAC_SECRET)
    .update(appd_data)
    .digest("hex");

    console.log(_hash,hash)

    return _hash == hash

}

bot.setWebHook(`${URL}/webhook`);
//setup webhook: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-server.com/webhook

bot.onText("/start", async (msg,match)=>{
    await bot.sendMessage(msg.chat.id,"*Let's get your coins set up.* \n\nClick the button below to start the app.",{
        "reply_markup":{
            "inline_keyboard":[
            [
                {
                  text: "Click to get laid 🦄",
                  web_app: { url: URL }
                },
            ]
        ]
        },parse_mode: 'Markdown'
    })
})

bot.on("callback_query",(ev)=>{
    console.log("AHH",ev)
})

app.post("/webhook",(req,res)=>{
    const data = req.body

    bot.processUpdate(req.body)
    res.sendStatus(200)
})

app.post("/checkAuthentication",(req,res)=>{
   
    const data = req.body
   
    if(verifyTelegramUser(data)){
        res.sendStatus(200)
    }else{
        res.sendStatus(403)
    }


})

//SEND TO THIS ADDR:"0x2Bf278b5d944Ce658B57f70227984E250bCD56e9"

app.listen(3001,()=>{
    console.log("** Backend server started")
})

