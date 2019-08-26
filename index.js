const port = process.env.PORT || 8080
const express = require('express')
const WebSocket = require('ws')
const app = express()
const http = require('http')
const server = http.createServer(app)
const MongoClient = require('mongodb').MongoClient
const session = require('express-session')
const ObjectID = require('mongodb').ObjectID
const uuid4 = require('uuid4')
const wss = new WebSocket.Server({server})
const cors = require('cors')
const MongoDBStore = require('connect-mongodb-session')(session)
const serveStatic = require('serve-static')
const history = require('connect-history-api-fallback')

const store = new MongoDBStore({
    uri: 'mongodb://admin:admin1@ds213178.mlab.com:13178/heroku_1g72mc5f',
    collection: 'sessions'
})
store.on('error', (error) => {
    console.error(error, ' storage error')
})

async function startMongoDbConnection() {
    try {
        const client = await MongoClient.connect('mongodb://admin:admin1@ds213178.mlab.com:13178/heroku_1g72mc5f', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        startWebSocketServer(client.db('heroku_1g72mc5f'))
        startHTTPServer(client.db('heroku_1g72mc5f'))
        console.info('connected successfully to mongo')
    } catch (e) {
        console.error(e, ' db connect error')
    }
}

function startWebSocketServer(db) {
    let user_token
    wss.on('connection', async (ws, req) => {
        user_token = req.url.replace('/?token=', '')
        let token_docs = await db.collection('user-tokens').findOne({token: user_token})
        if (token_docs) {
            let username = token_docs.username
            let user_data = await db.collection('users').findOne({username: username})
            ws.on('message', onWsMessage)
        }
        db.collection('project-data').find({}).toArray((err, docs) => ws.send(JSON.stringify(docs)))
        ws.on('close', async () => {
            await db.collection('user-tokens').findOneAndDelete({token: user_token})
        })
    })

    async function onWsMessage(message) {
        let msg = JSON.parse(message)
        if (role === 1) {
            try {
                await db.collection('project-data').updateOne({_id: ObjectID(msg._id)}, {$set: {state: msg.state}})
                db.collection('project-data').find({}).toArray((err, docs) => {
                    wss.clients.forEach((client) => {
                        if (client.readyState === 1) {
                            client.send(JSON.stringify(docs))
                        }
                    })
                })
            } catch (e) {
                console.error(e, ' error on update project data')
            }
        }
    }
}

function startHTTPServer(db) {
    const sess = {
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
        origin: ["http://vue-test-websocket.herokuapp.com", "https://vue-test-websocket.herokuapp.com", "http://localhost:8080"]
    }))
    app.use(express.json())
    app.use(session(sess))
    app.use(history())
    app.use(serveStatic('frontend/dist'))
    app.post('/auth', (req, res) => {
        db.collection('users').find({'username': req.body.username, 'password': req.body.password})
            .count((err, count) => {
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
                console.error(e, ' ticket error')
                res.sendStatus(500)
            }
        } else {
            res.sendStatus(401)
        }
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
            console.error(e, ' session error')
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
            console.error(e, ' logout error')
        }
    })

    app.post('/new', async (req, res) => {
        let user_data = await db.collection('users').findOne({username: req.session.username})
        let role = user_data.role
        if (req.session.authorized && role === 1) {
            try {
                let req_data = req.body
                await db.collection('project-data').insertOne({'project-info': req_data.info, 'state': req_data.state})
                res.sendStatus(200)
                db.collection('project-data').find({}).toArray((err, docs) => {
                    wss.clients.forEach((client) => {
                        if (client.readyState === 1) {
                            client.send(JSON.stringify(docs))
                        }
                    })
                })
            } catch (e) {
                res.sendStatus(500)
            }
        } else {
            res.sendStatus(500)
        }
    })

    app.delete('/delete', async (req, res) => {
        let user_data = await db.collection('users').findOne({username: req.session.username})
        let role = user_data.role
        if (req.session.authorized && role === 1) {
            try {
                await db.collection('project-data').deleteOne({'_id': ObjectID(req.query.id)})
                res.sendStatus(200)
                let project_data = await db.collection('project-data').find({}).toArray()
                wss.clients.forEach((client) => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(project_data))
                    }
                })
            } catch (e) {
                console.error(e, ' error deleting data')
                res.sendStatus(500)
            }
        } else {
            res.sendStatus(500)
        }
    })


    server.listen(port, (err) => {
        if (err) {
            console.error(err)
        }
        console.info(`Http server is listening on ${port}`)
    })
}

startMongoDbConnection().then(
    result => {
        console.info(result, ' connected to db successfully')
    },
    error => {
        console.error(error, ' error on connecting db')
    }
)


