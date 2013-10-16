/**
 * brightnessMonitor
 * install "serialport"
 * $ npm install serialport
 * start node server.
 * $ node server.js
 */
(function(){

	// ----------------------------------
	// HTTPサーバーの準備
	var http = require('http');
	var url = require('url');
	var fs = require('fs');
	var webserverPortNum = 80;

	// ドキュメントルートのファイルパス
	var documentRoot = './htdocs/';

	var server = http.createServer(function(request, response) {

		// アクセスされたURLを解析してパスを抽出
		var path = url.parse(request.url).pathname;
		 
		// ディレクトリトラバーサル防止
		if (path.indexOf("..") != -1) {
		    path = '/';
		}
		if(path.length-1 == path.lastIndexOf('/')) {
			// リクエストが「/」で終わっている場合、index.htmlをつける。
		    path += 'index.html';
		}
		fs.readFile(documentRoot + path, function(error, data){
		    if(error) {
		        response.writeHead(404, 'NotFound', {'Content-Type': 'text/html'});
		        response.write('<!DOCTYPE html>');
		        response.write('<html>');
		        response.write('<head>');
		        response.write('<meta charset="UTF-8" />');
		        response.write('</head>');
		        response.write('<body>');
		        response.write('<h1>404 Not found.</h1>');
		        response.write('<p>ファイルが見つかりません。</p>');
		        response.write('</body>');
		        response.write('</html>');
		        response.end();
		    } else {
				var pathExt = (function (path) {
					var i = path.lastIndexOf('.');
					return (i < 0) ? '' : path.substr(i + 1);
				})(path);
				var mime = 'text/html';
				switch( pathExt ){
					case 'html': case 'htm':             mime = 'text/html';break;
					case 'js':                           mime = 'text/javascript';break;
					case 'css':                          mime = 'text/css';break;
					case 'gif':                          mime = 'image/gif';break;
					case 'jpg': case 'jpeg': case 'jpe': mime = 'image/jpeg';break;
					case 'png':                          mime = 'image/png';break;
					case 'svg':                          mime = 'image/svg+xml';break;
				}
				response.writeHead(200, { 'Content-Type': mime });
				response.write(data);
				response.end();
		    }
		});

	});

	// HTTPサーバーの準備
	// ----------------------------------


	// ----------------------------------
	// シリアル通信の準備
	var serialport = require('serialport');

	// Serial Port
	var portName = '/dev/tty.usbmodem1421'; // Mac環境
	var sp = new serialport.SerialPort(portName, {
	    baudRate: 9600,
	    dataBits: 8,
	    parity: 'none',
	    stopBits: 0,
	    flowControl: false,
	    parser: serialport.parsers.readline("\n")   // ※修正：パースの単位を改行で行う
	});
	// シリアル通信の準備
	// ----------------------------------

	var io = require('socket.io').listen(server);
	var socket;
	io.sockets.on('connection', function (tmpSocket) {
		// if( socket ){
		// 	console.log('connection canceled.');
		// 	return;
		// }
		socket = tmpSocket;
		console.log('Socket Connected.');
	});

	// data from Serial port
	sp.on('data', function(input) {
		// シリアルポートから値を受け取る
		var buffer = new Buffer(input);
		var deviceMsg = buffer.toString('utf8');

		// 受け取った値をブラウザに送る
		if(socket){
			socket.emit('report', deviceMsg);
		}
	});
	console.log(portName);
	console.log('device(s) standby.');



	// ポート番号を指定して、LISTEN状態にする
	server.listen(webserverPortNum);
	console.log('HTTP Server, standby on port '+(webserverPortNum)+'.');



})();
