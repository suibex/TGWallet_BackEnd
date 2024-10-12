const express = require("express")
var bodyParser = require('body-parser')

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var SAVED_SESSIONS = {} 

var DISCONNECTED = {} 

app.post("/reactLogger",urlencodedParser,(req,res)=>{
    console.log(req.body.data)
    res.json({ message: "----" });
})


/// ****** CONNECT STUFF ******
// what he can do is save the result here and then use anotehr function with useEffect to fetct the data using sessionId
app.get("/onPhantomConnect",urlencodedParser,(req,res)=>{
    const data = req.query
    try{
        SAVED_SESSIONS[data['session_id']] = {
            'phantom_encryption_public_key':data['phantom_encryption_public_key'],
            'nonce':data['nonce'],
            'data':data['data']
        }
        console.log(`*** saving session #${data['session_id']} data...`)
        console.log(SAVED_SESSIONS[data['session_id']])
        res.redirect("tg://geocoldzmaj_bot")

    }catch(e){
        res.json({result:e})
    }
})

app.get("/getPhantomConnected",urlencodedParser,(req,res)=>{
    const data = req.query
    var session_id = data['session_id']
    if(session_id in SAVED_SESSIONS ){
       if(SAVED_SESSIONS[session_id] != undefined){

        console.log(`*** accessing session #${session_id} data...`)
        console.log(SAVED_SESSIONS[session_id])

        res.json({result:
            SAVED_SESSIONS[session_id]})
        //free up mem here ty!
        SAVED_SESSIONS[session_id] = {}

       }
    }else{
        res.json({result:-1})
    }
})



app.listen(3001,()=>{
    console.log("** Proxy server started")
})

