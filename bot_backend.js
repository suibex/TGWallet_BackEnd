const { TonClient, WalletContractV4, internal }= require("@ton/ton");
const { mnemonicNew, mnemonicToPrivateKey } =  require("@ton/crypto");
const { Address } = require("@ton/core");
const TelegramBot = require('node-telegram-bot-api');
const BOT_TOKEN = process.env.BOT_TOKEN
const express = require("express")
const TonWeb = require("tonweb")
const crypto = require('crypto');
var bodyParser = require('body-parser');
const HMAC_SECRET = crypto.createHmac('sha256','WebAppData').update(BOT_TOKEN).digest();

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express()
console.log("[*] Bot Token:",BOT_TOKEN)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/* NOTE: cinjenica da sam ovako lepo leak svaki api key je zabrinjavajuca, ali znam naravno da treba da stoji u dotenv, samo nisam mislio da ces da mi zameris */

const bot = new TelegramBot(BOT_TOKEN,{pooling:false});

const URL_HOOK = "https://81ac-178-148-213-170.ngrok-free.app"
const URL = "https://f79e-178-148-213-170.ngrok-free.app"

const PINATA_API_KEY =  "d11a1d80064eee2c8549"
const PINATA_API_SECRET =  "ea5de5db8fb29f05340c68b914af8cfd1dd98165c0b2a1623c67665be960733c"

const TONCENTER_API_KEY = "aa4a1d5c3003e4ca123ad6c4891c3a3dacf2860b8b2a50f612a99807013d248a"


const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: TONCENTER_API_KEY, // Optional, but note that without api-key you need to send requests once per second, and with 0.25 seconds
  });


// Function to fetch minted tokens from a contract
async function getMintedTokens(contractAddress) {
    const address = Address.parse("kQAkneVt7fcXEOMsvwBKDLkoKbmQhoqYG-9TV4hABKx2_WUX")

    try {
        const result = await client.callGetMethod(address, 'get_collection_data');
        
        return result.stack.items[0].value

    } catch (error) {
        console.error('Error fetching minted NFT indices:', error);
      }
    return undefined
}


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
app.post("/getNFTCollectionIdx",async (req,res)=>{
    const data = req.body
    console.log(data.addr)

    var idx = await getMintedTokens(data.addr)
    console.log(idx)
    res.send(JSON.stringify({
        'idx':parseInt(idx)
    }))

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
