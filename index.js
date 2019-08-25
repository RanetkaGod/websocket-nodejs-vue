const port = 3000
const express = require('express')
const WebSocket = require('ws')
const app = express();
const http = require('http')
const server = http.createServer(app)
const expressWs = require('express-ws')(app)
const MongoClient = require('mongodb').MongoClient
const session = require('express-session')
const aWss = expressWs.getWss('/')
let ObjectID = require('mongodb').ObjectID
let uuid4 = require('uuid4')
const wss = new WebSocket.Server({server})
const cors = require('cors')

function startMongoDbConnection() {
    MongoClient.connect('mongodb://localhost:27017/states', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, client) {
        console.log('connected successfully to mongo')
        if (err) {
            throw err;
        }
        startWebSocketServer(client.db('state'))
        startHTTPServer(client.db('state'))
    })
}

function startWebSocketServer(db) {
    let user_token
    wss.on('connection', async (ws, req) => {
        user_token = req.url.replace('/?token=', '')
        let token_docs = await db.collection('user-tokens').findOne({token: user_token})
        if (token_docs) {
            let username = token_docs.username
            let user_data = await db.collection('users').findOne({username: username})
            let role = user_data.role
            console.log(role)
            ws.on('message', message => {
                let msg = JSON.parse(message)
                try {
                    db.collection('project-data').updateOne(
                        {_id: ObjectID(msg._id)},
                        {$set: {state: msg.state}},
                        function (err, result) {
                            if (result) {
                                db.collection('project-data').find({}).toArray(function (err, docs) {
                                    aWss.clients.forEach(function each(client) { //Тут я должен отправить данные в бд
                                        if (client.readyState === 1)
                                            client.send(JSON.stringify(docs))
                                    })
                                })
                            }
                        }
                    )
                } catch (e) {
                    console.log(e)
                }
            })
            db.collection('project-data').find({}).toArray(function (err, docs) {
                ws.send(JSON.stringify(docs))
            })

        }
        ws.on('close', async (ws, req) => {
            await db.collection('user-tokens').findOneAndDelete({token: user_token})
        })
    })


}

function startHTTPServer(db) {
    let sess = {
        secret: 'caltaihenculus',
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 60000},
        authorized: true
    }
    app.use(cors({
        credentials: true,
        origin: "http://localhost:8080"
    }));
    app.use(express.json())
    app.use(session(sess))
    app.post('/auth', (req, res) => {
        db.collection('users').find({'username': req.body.username, 'password': req.body.password})
            .count(function (err, count) {
                if (count) {
                    req.session.authorized = true
                    req.session.username = req.body.username
                    res.sendStatus(200)
                } else {
                    res.sendStatus(401)
                }
            })
    })
    app.get('/ticket', async (req, res) => {
        if (req.session.authorized) {
            const token = uuid4()
            try {
                await db.collection('user-tokens').insertOne({
                    username: req.session.username,
                    token: token
                })
                res.send({token: token})
            }
            catch (e) {
                console.log(e)
                res.sendStatus(500)
            }
        } else
            res.sendStatus(401)
        console.log(req.session)
    })
    app.get('/session', async (req, res) =>{
        let users
        try {
            users = await db.collection('users').findOne({username: req.session.username})
            const role = users.role
            res.send({role: role})
        } catch (e) {
            console.log(e)
            res.sendStatus(500)
        }
    })
    server.listen(port, function (err) {
        if (err)
            console.log(err)
        console.log(`Http server is listening on ${port}`)
    })
}

startMongoDbConnection()


