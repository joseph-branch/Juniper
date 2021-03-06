require('dotenv').config({ path: 'config.env' });
const WebSocket = require('ws');
const app       = require('./app');
const uuidV4    = require('uuid').v4;
const connections = require('./controllers/connectionsController');

/************************************************
* 
*    THIS IS DUMB FIX IT!!!!!
* 
*************************************************/

// Clears the redis datastore because I wrote dumb code
// that isn't handling sessions properly
// it saves the students that have logged in (they have valid sessions)
// but it sends back the whole list of authenticated students 
// when it should send back only authenticated students who have open
// websocket connections. essentially I need the connections object
// it works even when they reload or navigate away (because on connection it replace the ws in connections)
// const redisClient = require('redis').createClient();
// redisClient.flushall();

/************************************************
* 
*    THAT WAS DUMB FIX IT!!!!!
* 
*************************************************/

const clients = [];

app.set('port', process.env.PORT || 9090);

const server = app.listen(app.get('port'), () => {
    console.log(`Express running → PORT ${server.address().port}`);
});

const wsServer = new WebSocket.Server({
    noServer: true,
})

/* 
 Handle the HTTP upgrade ourselves so we can capture the request object's session property
 Then we pass it by emitting the connection event ourselves so we have access to the request
 in wsServer.on('connection'). From their we can access the ws session (although we won't receive
 updates to the session unless the user reloads
*/
server.on('upgrade', function(request, socket, head) {
    app.get('sessionParser')(request, {}, () => {
        if (!request.session.student && !request.session.instructor && !request.session.assistant) {
            socket.destroy();
            return;
        }
  
        console.log('Session is parsed!');
  
        wsServer.handleUpgrade(request, socket, head, function(ws) {
            wsServer.emit('connection', ws, request);
        });
    });
});

wsServer.on('connection', function connection (ws, request) {
    const firstName = request.session.firstName;
    ws.firstName = firstName;
    ws.id = request.session.uuid;
    ws.courseNumber = request.session.courseNumber;
    ws.role = request.session.role; // this doesn't exist yet
    clients.push(ws);
    connections.addConnection(ws);
    ws.on('message', function incoming (message) {
        const msg = JSON.parse(message);
        if (msg.cmd === 'candidate') {
            candidate(ws, msg);
        } else if (msg.cmd === 'offer') {
            offer(ws, msg);
        } else if (msg.cmd === 'answer') {
            answer(ws, msg);
        }
        console.log(`\nreceived: ${JSON.stringify(msg, null, 2)} from: ${firstName}`);
    });

    ws.on('close', () => {
        delete connections.remove(ws);
    });

    // Utility functions
    ws.isOpen   = () => {return this.readyState === 1;};
    ws.isClosed = () => { return this.readyState === 3;};
});

// send the offer to the target with the sender's
// id as their new target
function offer (ws, msg) {
    const res = {
        cmd: 'offer',
        target: ws.id,
        description: msg.description,
        video: msg.video
    };
    console.log(`sending to: ${JSON.stringify(msg.target, null, 2)}`);
    connections.send(JSON.stringify(res), msg.target);
}

function answer (ws, msg) {
    const res = {
        cmd: 'answer',
        target: ws.id,
        description: msg.description,
        video: msg.video,
    };
    console.log(`sending to: ${JSON.stringify(msg.target, null, 2)}`);
    connections.send(JSON.stringify(res), msg.target);
}

function candidate (ws, msg) {
    const res = {
        cmd: 'candidate',
        target: ws.id,
        candidate: msg.candidate,
        video: msg.video
    };
    console.log(`sending to: ${JSON.stringify(msg.target, null, 2)}`);
    connections.send(JSON.stringify(res), msg.target);
}