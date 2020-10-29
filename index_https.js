const https = require('https');
const fs = require('fs');
const socket = require('socket.io');
const users = new Map();

const options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, (req, res) => {
	const path = req.url;
	const defaultFIle = path === '' || path === '/' ? 'index.html' : path;
	let fileExtension = 'text/html';
	if (defaultFIle.endsWith('.html')) {
		fileExtension = 'text/html';
	} else if (defaultFIle.endsWith('.js')) {
		fileExtension = 'text/javascript';
	}
	res.setHeader('Content-type', fileExtension);
	res.writeHead(200);
	fs.readFile(__dirname + '/' + defaultFIle, (err, data) => {
		if (err) {console.log(err); return;};
		res.end(data);
	});
});

const io = socket(server);

io.on('connection', (socket) => {
	// communication related to users
	socket.on('new-user', (userid) => {
		const list = [];
		users.forEach((l,u) => list.push(u));
		const match = list.find(l => l === userid);
		if (!match) {
			users.set(userid, socket.id);
			socket.broadcast.emit('new-user', userid);
		}
	});
	socket.on('fetch-users', () => {
		const list = [];
		users.forEach((l, m) => list.push(m));
		socket.emit('old-users', list);
	});
	// communication related to peer-connection
	socket.on('request-offer', (userid) => {
		socket.broadcast.emit('request-offer', userid);
	});
	socket.on('offer', (userid, description) => {
		socket.broadcast.emit('offer', description);
	});
	socket.on('description', (userId, description) => {
		socket.broadcast.emit('description', description);
	});
	socket.on('candidate', (userId, candidate) => {
		socket.broadcast.emit('candidate', candidate);
	});
	socket.on('answer', description => {
		socket.broadcast.emit('answer', description);
	})
});

server.listen(443, '', () => {
	console.log('server is running');
});