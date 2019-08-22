const port = 8080
const WebSocket = require('ws')
const wss = new WebSocket.Server({port})
let msg = 'hello world'
wss.on('connection', ws => {
    ws.on('message', message => {
        msg = message
        wss.clients.forEach(function each(client) {
            if(client.readyState === WebSocket.OPEN)
                client.send(msg)
        })
    })
    ws.send(msg)
})
