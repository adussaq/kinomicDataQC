POST https://www.googleapis.com/fusiontables/v1/tables?key=AIzaSyBjXKVpOKsYQd7DSzWRzQEVY0c7kiDJa4M&access_token=ya29.AHES6ZQpxYDqhY9-mV8ke8EDkZPvMRC_LjCdA9PSRPRlBlE

Content-Type: application/json

$.post( 'https://www.googleapis.com/fusiontables/v1/tables?key=AIzaSyBjXKVpOKsYQd7DSzWRzQEVY0c7kiDJa4M&access_token=ya29.AHES6ZQpxYDqhY9-mV8ke8EDkZPvMRC_LjCdA9PSRPRlBlE',
	{"name": "Insects","columns": [{"name": "Species","type": "STRING"},{"name": "Elevation","type": "NUMBER"},{"name": "Year","type": "DATETIME"}], "description": "Insect Tracking Information.", "isExportable": true},
	function(e){console.log(e)});
	
$.ajax
	({ 
	type: 'POST',
	url:'https://www.googleapis.com/fusiontables/v1/tables?key=AIzaSyBjXKVpOKsYQd7DSzWRzQEVY0c7kiDJa4M&access_token=ya29.AHES6ZQpxYDqhY9-mV8ke8EDkZPvMRC_LjCdA9PSRPRlBlE',
	data: {"name": "Insects","columns": [{"name": "Species","type": "STRING"},{"name": "Elevation","type": "NUMBER"},{"name": "Year","type": "DATETIME"}], "description": "Insect Tracking Information.", "isExportable": true},
	dataType: 'json',
	success: function(e){console.log(e)}
	});
	
	HTTP/1.1 400 Bad Request
status: 400 Bad Request
version: HTTP/1.1
access-control-allow-origin: http://127.0.0.1:8000
cache-control: private, max-age=0
content-encoding: gzip
content-length: 157
content-type: application/json; charset=UTF-8
date: Wed, 22 Aug 2012 19:28:02 GMT
expires: Wed, 22 Aug 2012 19:28:02 GMT
server: GSE
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
x-xss-protection: 1; mode=block

HTTP/1.1 400 Bad Request
status: 400 Bad Request
version: HTTP/1.1
access-control-allow-origin: chrome-extension://mfnfenonhjlmbdlnkchdknppadbajhkl
cache-control: private, max-age=0
content-encoding: gzip
content-length: 157
content-type: application/json; charset=UTF-8
date: Wed, 22 Aug 2012 19:40:44 GMT
expires: Wed, 22 Aug 2012 19:40:44 GMT
server: GSE
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
x-xss-protection: 1; mode=block



