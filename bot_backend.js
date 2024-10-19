const TelegramBot = require('node-telegram-bot-api');
const BOT_TOKEN = process.env.BOT_TOKEN
const express = require("express")
const crypto = require('crypto');

var bodyParser = require('body-parser');
const HMAC_SECRET = crypto.createHmac('sha256','WebAppData').update(BOT_TOKEN).digest();

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express()
console.log(BOT_TOKEN)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const bot = new TelegramBot(BOT_TOKEN,{pooling:false});
console.log(bot)
const URL_HOOK = "https://3736-178-148-213-170.ngrok-free.app"
const URL = "https://dacb-178-148-213-170.ngrok-free.app"

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

bot.setWebHook(`${URL_HOOK}/webhook`);

bot.onText("/start", async (msg,match)=>{
    console.log(msg.chat.id)
    await bot.sendMessage(msg.chat.id,"*Let's get your coins set up.* \n\nClick the button below to start the app.",{
        "reply_markup":{
            "inline_keyboard":[
            [
                {
                  text: "Click to get laid 🦄",
                  web_app: { url: URL+`?chat_id=${msg.chat.id}`}
                },
            ]
        ]
        },parse_mode: 'Markdown'
    })
})

bot.on("callback_query",(ev)=>{
    const data = ev.data
    if(data.type == "eth_transaction"){
        const msg = data.msg
        console.log("EV:",ev,"MSG:",msg)
        
        bot.sendMessage(ev.id,`Sending ${msg.amount} ETH (Sepolia) from: ${msg.from} to ${msg.to}...`)
    }
})

app.post("/webhook",(req,res)=>{
    const data = req.body
    console.log(data)
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

app.listen(3001,()=>{
    console.log("** Backend server started")
})

