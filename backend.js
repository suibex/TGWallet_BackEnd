const express = require("express")
var bodyParser = require('body-parser')
const TelegramBot = require('node-telegram-bot-api');

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const BOT_TOKEN = "7696585854:AAFdYVCEzPXoXzqio8foFa_NU6q9gdOjjv0"
const bot = new TelegramBot(BOT_TOKEN, {polling: true});


app.post("/webhook",(req,res)=>{
    console.log(req)
    bot.processUpdate(req.body)
    res.sendStatus(200)

})


app.listen(3001,()=>{
    console.log("** Backend server started")
})

