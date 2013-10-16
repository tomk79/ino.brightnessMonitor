/**
 * brightnessMonitor
 * 
 * install node objects.
 * $ npm install socket.io
 * $ npm install serialport
 * starting node server.
 * $ node server.js
 */
(function(){

	// ----------------------------------
	// モジュールのロード
	var http = require('http');
	var url = require('url');
	var fs = require('fs');
	var serialport = require('serialport');
	// var child_process = require('child_process');

	// ----------------------------------
	// 設定
	var conf = {};
	conf.webserverPortNum = 8080;//ウェブサーバーのポート番号
	conf.portName = null; // シリアルポート名

	// ----------------------------------
	// 接続
	var conSockets = {};//←WebSocket接続
	var conSerialPort = null;//←シリアルポート接続


	// ----------------------------------
	// HTTPサーバーの準備

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
	var io = require('socket.io').listen(server);

	// HTTPサーバーの準備
	// ----------------------------------


	// ----------------------------------
	// シリアル通信の準備

	// USBデバイスの検索 (MacOSX環境を想定)
	function search_serial_port(){
		fs.readdir('/dev/', function (err, files){
			if( !conf.portName ){
				// 予め設定されていたら、特に検索はしない
				var usbDevices = [];
				for( var i in files ){
					if( files[i].match( /^tty\.usb.+$/ ) ){
						usbDevices.push(files[i]);
					}
				}
				if( usbDevices.length == 0 ){
					conf.portName = null;
				}else if( usbDevices.length == 1 ){
					conf.portName = '/dev/'+usbDevices[0];
				}
			}

			if( conf.portName ){
				conSerialPort = new serialport.SerialPort(conf.portName, {
					baudRate: 9600,
					dataBits: 8,
					parity: 'none',
					stopBits: 0,
					flowControl: false,
					parser: serialport.parsers.readline("\n")   // ※修正：パースの単位を改行で行う
				});

				// data from Serial port
				conSerialPort.on('data', function(input) {
					// シリアルポートから値を受け取る
					var buffer = new Buffer(input);
					var deviceMsg = buffer.toString('utf8');

					// 受け取った値をブラウザに送る
					for( var i in conSockets ){
						console.log('send value to: '+ conSockets[i].id);
						if(conSockets[i]){
							conSockets[i].emit('report', deviceMsg);
						}
					}
				});
				console.log('USB device detect: '+conf.portName);
				console.log('device(s) standby.');
			}else{
				//シリアルポートが見つからなかったら、リトライ
				search_serial_port();
			}
		});
	}
	search_serial_port();//シリアルポートの検索

	// シリアル通信の準備
	// ----------------------------------

	io.sockets.on('connection', function (tmpSocket) {
		// if( socket ){
		// 	console.log('connection canceled.');
		// 	return;
		// }
		tmpSocket.on('disconnect', function(){
			console.log('disconnected. ('+this.id+')');
			delete conSockets[this.id];
		});
		conSockets[tmpSocket.id] = tmpSocket;
		console.log('Socket Connected.');
		// console.log(conSockets);
	});




	// ポート番号を指定して、LISTEN状態にする
	server.listen(conf.webserverPortNum);
	console.log('HTTP Server, standby on port '+(conf.webserverPortNum)+'.');



})();
