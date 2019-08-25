const port = process.env.PORT || 8080
const express = require('express')
const WebSocket = require('ws')
const app = express()
const http = require('http')
const server = http.createServer(app)
const expressWs = require('express-ws')(app)
const MongoClient = require('mongodb').MongoClient
const session = require('express-session')
let ObjectID = require('mongodb').ObjectID
let uuid4 = require('uuid4')
const wss = new WebSocket.Server({server})
const cors = require('cors')
const MongoDBStore = require('connect-mongodb-session')(session)
let store = new MongoDBStore({
    uri: 'mongodb://admin:admin1@ds213178.mlab.com:13178/heroku_1g72mc5f',
    collection: 'sessions'
})
store.on('error', function (error) {
    console.log(error, ' storage error')
})

function startMongoDbConnection() {
    MongoClient.connect('mongodb://admin:admin1@ds213178.mlab.com:13178/heroku_1g72mc5f', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, client) {
        console.log('connected successfully to mongo')
        if (err) {
            throw err
        }
        startWebSocketServer(client.db('heroku_1g72mc5f'))
        startHTTPServer(client.db('heroku_1g72mc5f'))
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
            ws.on('message', message => {
                let msg = JSON.parse(message)
                if (role === 1) {
                    try {
                        db.collection('project-data').updateOne(
                            {_id: ObjectID(msg._id)},
                            {$set: {state: msg.state}},
                            function (err, result) {
                                if (result) {
                                    db.collection('project-data').find({}).toArray(function (err, docs) {
                                        wss.clients.forEach(function each(client) {
                                            if (client.readyState === 1) {
                                                client.send(JSON.stringify(docs))
                                            }
                                        })
                                    })
                                }
                            }
                        )
                    } catch (e) {
                        console.log(e, ' error on update project data')
                    }
                }
            })
        }
        db.collection('project-data').find({}).toArray(function (err, docs) {
            ws.send(JSON.stringify(docs))
        })

        ws.on('close', async () => {
            await db.collection('user-tokens').findOneAndDelete({token: user_token})
        })
    })


}

function startHTTPServer(db) {
    let sess = {
        secret: 'caltaihenculus',
        resave: true,
        saveUninitialized: true,
        expires: new Date(Date.now() + 3600000), //1 Hour
        cookie: {maxAge: 6000000},
        store: store,
        authorized: true
    }
    app.use(cors({
        credentials: true,
        origin: "http://localhost:8080"
    }))
    app.use(express.json())
    app.use(session(sess))
    app.post('/auth', (req, res) => {
        console.log(req.body)
        db.collection('users').find({}).toArray(function(err, res){console.log(err, res)})
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
            } catch (e) {
                console.log(e, ' ticket error')
                res.sendStatus(500)
            }
        } else
            res.sendStatus(401)
    })
    app.get('/session', async (req, res) => {
        let users
        try {
            users = await db.collection('users').findOne({username: req.session.username})
            if (users) {
                const role = users.role
                res.send({role: role})
            } else {
                res.sendStatus(401)
            }
        } catch (e) {
            console.log(e, ' session error')
            res.sendStatus(500)
        }
    })
    app.delete('/logout', async (req, res) => {
        try {
            await db.collection('user-tokens').findOneAndDelete({username: req.session.username})
            req.session.authorized = false
            req.session.username = undefined
            res.sendStatus(200)
        } catch (e) {
            console.log(e, ' logout error')
        }

    })
    app.post('/new', async (req, res) => {
        let user_data = await db.collection('users').findOne({username: req.session.username})
        let role = user_data.role
        if (req.session.authorized && role === 1) {
            try {
                let req_data = req.body
                console.log(req_data)
                await db.collection('project-data').insertOne({'project-info': req_data.info, 'state': req_data.state})
                res.sendStatus(200)
                db.collection('project-data').find({}).toArray(function (err, docs) {
                    wss.clients.forEach(function each(client) {
                        if (client.readyState === 1) {
                            client.send(JSON.stringify(docs))
                        }
                    })
                })
            } catch (e) {
                res.sendStatus(500)
            }
        } else
            res.sendStatus(500)
    })
    app.delete('/delete', async (req, res) =>{
        let user_data = await db.collection('users').findOne({username: req.session.username})
        let role = user_data.role
        if (req.session.authorized && role === 1) {
            try {
                await db.collection('project-data').deleteOne({'_id': ObjectID(req.query.id)})
                res.sendStatus(200)
                db.collection('project-data').find({}).toArray(function (err, docs) {
                    wss.clients.forEach(function each(client) {
                        if (client.readyState === 1) {
                            client.send(JSON.stringify(docs))
                        }
                    })
                })
            }catch (e) {
                console.log(e, 'Error deleting data')
                res.sendStatus(500)
            }

        }
        else
            res.sendStatus(500)
    })
    server.listen(port, function (err) {
        if (err)
            console.log(err)
        console.log(`Http server is listening on ${port}`)
    })
}

startMongoDbConnection()


