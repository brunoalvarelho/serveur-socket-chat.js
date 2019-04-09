const io = require('socket.io')();
const cuid = require('cuid');
const users = {};

io.on('connect', socket => {

    socket.on('login', name => {
        if (users[socket.client.id]) {
            return;
        }
        users[socket.client.id] = {uid: cuid(), name};
        socket.emit('loggedin', {user: users[socket.client.id], users: Object.values(users)});
        socket.broadcast.emit('user.loggedin', {user: users[socket.client.id], timestamp: Date.now()});
    });

    socket.on('rename', newName => {
        users[socket.client.id].name = newName;
        socket.emit('renamed', {user: users[socket.client.id]});
        socket.broadcast.emit('user.renamed', {user: users[socket.client.id], timestamp: Date.now()});
    });

    socket.on('logout', reason => {
        if (!users[socket.client.id] || typeof reason !== 'string') {
            return;
        }
        const {uid} = users[socket.client.id];
        delete users[socket.client.id];
        socket.emit('loggedout');
        socket.broadcast.emit('user.loggedout', {uid, reason, timestamp: Date.now()});
    });

    socket.on('disconnect', () => {
        if (users[socket.client.id]) {
            const {uid} = users[socket.client.id];
            delete users[socket.client.id];
            socket.broadcast.emit('user.loggedout', {uid, reason: 'disconnect', timestamp: Date.now()});
        }
    });

    socket.on('send.message', message => {
        if (typeof message !== 'object' && typeof message.type !== 'string' && typeof message.payload !== 'string') {
            return;
        }
        const {uid} = users[socket.client.id];
        io.emit('user.sent.message', {sender: uid, type: message.type, payload: message.payload, timestamp: Date.now()});
    });

});

io.listen(process.env.PORT || 8080);