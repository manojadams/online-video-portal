const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
	res.setHeader('Content-type', 'text/html');
	res.writeHead(200);
	fs.readFile('index.html', (err, data) => {
		if (err) {console.log(err); return;};
		res.end(data);
	});
});

server.listen(80, '', () => {
	console.log('server is running');
});
