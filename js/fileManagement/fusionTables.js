/*global KINOMICS, console, gapi, FileReader, btoa, XMLHttpRequest */

//Global variables and function declarations
//TODO: this is a big deal! I need to figure out how to determine if a file is too big to fit in one row in fusion tables and ammend my method if it is.

KINOMICS.fusionTables = (function () {
	'use strict';

	//variable declarations
	var apiKey, clientId, currentOnComplete, deleteTableLine, getRow, getTablesByName, lib, login, onComplete, queryTable,
		reportError, requests, isEmpty, getUserName, newTable,
		run, runners, runClientRequest, scopes, submitLinesToTable, submitRequest, submitOverflowFunc, updateTableLine;

	//variable definitions
	lib = {};
	clientId = '547674207977.apps.googleusercontent.com';
	apiKey = 'AIzaSyBjXKVpOKsYQd7DSzWRzQEVY0c7kiDJa4M';
	scopes = ['https://www.googleapis.com/auth/fusiontables', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/drive'];
	requests = [];
	currentOnComplete = [];

	//function defintions
	lib.deleteTableLine = function () {
		/*////////////////////////////////////////////////////////////////////////////////////////
		TODO: write delete function
		*/////////////////////////////////////////////////////////////////////////////////////////
		//run()();
	};

	/*Components of a delete function...
		for( x in triples ) {
		if( new Date(triples[x][3]) - new Date('2012-10-18T13:16:17.890Z') >0 ) {
			y = x.replace(/\S+_r_(\S+)/, "$1");
			console.log(y, triples[x][0]);
			req = "sql=" + encodeURIComponent("DELETE FROM 1lbl5Cttwj7XIpsd6XSOJFH6lGWsQaWQw9zPKEXY {WHERE ROWID = '"+ y +"'}");
			restReq = gapi.client.request({
				path: 'fusiontables/v1/query',
				body: req,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': req.length
				},
				method: 'POST'
			});
			restReq.execute(function(x){console.log(x)});
		}
	}*/
	/*Custom query function
		req = encodeURIComponent("SELECT * FROM 1lbl5Cttwj7XIpsd6XSOJFH6lGWsQaWQw9zPKEXY {WHERE ROWID = '"+ y +"'}");
		restReq = gapi.client.request({
			path: 'fusiontables/v1/query',
			params: {'sql': req}
		});
		
		restReq.execute(function(x){console.log(x)});
	}*/

	lib.getUserName = function (callback) {
		/*////////////////////////////////////////////////////////////////////////////////////////
		TODO: write delete function
		*/////////////////////////////////////////////////////////////////////////////////////////
		run(getUserName)(callback);
	};

	lib.getRow = function (request, callback) {
		/*////////////////////////////////////////////////////////////////////////////////////////
		TODO: documentation
		*/////////////////////////////////////////////////////////////////////////////////////////
		run(getRow)(request, callback);
	};

	lib.getTablesByName = function (name, callback) {
		/*/////////////////////////////////////////////////////////////
		TODO: fill in these comments
		These will be comments for the user....
		This function will grab a table by it's name
		*//////////////////////////////////////////////////////////////
		run(getTablesByName)(name, callback);
	};

	lib.login = function (callback) {
		/*/////////////////////////////////////////////////////////////
		TODO: fill in these comments
		These will be comments for the user....
		This will be the login command
		*//////////////////////////////////////////////////////////////
		run(login)(callback);
	};

	lib.onComplete = function (callback) {
		/*/////////////////////////////////////////////////////////////
		TODO: fill in these comments
		These will be comments for the user....
		this is the on complete function for when there are no active 
			requests being called anywhere in the program.
		*//////////////////////////////////////////////////////////////
		run(onComplete)(callback);
	};

	lib.newTable = function (name, columns, otherParams, callback) {
		/*////////////////////////////////////////////////////////////////////////////////////////
		TODO: write these docs
		*/////////////////////////////////////////////////////////////////////////////////////////
		run(newTable)(name, columns, otherParams, callback);
	};

	lib.queryTable = function (tableID, queryParams, callback) {
		/*////////////////////////////////////////////////////////////////////////////////////////
		Query's a fusion table for specific parameters, can take a series of arguments.
		  https://developers.google.com/fusiontables/docs/v1/sql-reference#Select has a good 
		  summary of the available options. Particularly how to write the where statement.
			ARGV: tableID - fusion tableID
				queryParams - an object with a series of properties any of which can be left 
				  out, however the object must be here:
					columns - array of column names to be returned, they will maintain order
					where - a string of the sql where parameter, read the website above for 
					  more information.
					order - a string, what column to order the information based on
					orderD - a string either 'ASC' or 'DESC'
					offset - an integer, indicating to skip the first n rows
					limit - an integer, indicates the maximum number of rows to return
				callback - function to execute after addition, arguments returned to this are
				  fusion tables returns, which are an object containing column names
				  and some other info as an object then as a stringified object, 
				  sure it can handle an error - reported as: return:{error:{..},..}
			
		Examples of the queryParams objects:
			Gets the rows with the information indicated where fileName = export_2rawGBM.txt
				{columns:['ROWID','FileName','FileSize'],where:"'FileName' = 'Export_2rawGBM.txt'"},
			Get the rows with the information indicated, orders by DateCreated, ascending (the
			  default is descending, but this can be set with DESC as well), takes only the 6th-
			  nth element with a limit of 3 being returned:
				{columns:['ROWID','FileName','FileSize','DateCreated'],order:'DateCreated',orderD:'ASC', offset:5, limit:3}
			Gets all the rows and columns except ROWID:
				{}

		Note: Left out 'GROUP BY' entirely and the 'ORDER BY' spatial relationship
		*/////////////////////////////////////////////////////////////////////////////////////////
		run(queryTable)(tableID, queryParams, callback);
	};

	lib.submitLinesToTable = function (tableID, columnNames, columns, callback) {
		/*////////////////////////////////////////////////////////////////////////////////////////
		Adds a line or series of lines to a table in fusion tables.
			ARGV: tableID - fusion table ID
				ColumnNames - array of the names of the columns ie [name,age]
				rows - 2d array containing data for rows [['Susan',34],['John Appleseed',12]]
				callback - function to execute after addition, arguments returned to this are
				  fusion tables returns, which are an object containing column names
				  and some other info as an object then as a stringified object, 
				  sure it can handle an error - reported as: return:{error:{..},..}
		*/////////////////////////////////////////////////////////////////////////////////////////
		run(submitLinesToTable)(tableID, columnNames, columns, callback);
	};

	lib.updateTableLine = function (tableID, columnChanges, rowID, callback) {
		/*////////////////////////////////////////////////////////////////////////////////////////
		Changes a line of a table in fusion tables.
			ARGV: tableID - fusion table ID
				columnChanges - object of form: {columnID:newValue}
				rowID - rowID from fusion table query/insert
				callback - function to execute after addition, arguments returned to this are
				  fusion tables returns, which are an object containing column names
				  and some other info as an object then as a stringified object, 
				  sure it can handle an error - reported as: return:{error:{..},..}
		*/////////////////////////////////////////////////////////////////////////////////////////
		run(updateTableLine)(tableID, columnChanges, rowID, callback);
	};

	//local functions
	getRow = function (request, callback) {
		//TODO: make this so it just passes in a fuse file, and a row ID.
		//TODO: make this deal with parts that have multiple lines...
		//var getFileReq = 'SELECT FileContents FROM ' + fuseFile + ' WHERE ROWID = ' + ftROWID;
		var path = '/fusiontables/v1/query?' + Math.random().toString().replace('0.', '');
		request = {
			path: path,
			params: {'sql': request}
		};
		submitRequest(request, callback);
	};

	lib.getRootFolder = function (callback) {
		//TODO: check user input
		//TODO: seperate call from code
		//TODO: check stuff in the second call for this and getUserName
		callback = typeof callback === 'function' ? callback : function () {};
		submitRequest({path: '/drive/v2/about'}, function (info) {
			callback(info.rootFolderId);
			lib.getRootFolder = function (callback) {
				callback(info.rootFolderId);
			};
		});
	};

	lib.addFileToFolder = function (file, folder, callback) {
		//TODO: check user input
		//TODO: seperate call from code
		submitRequest({
			path: "drive/v2/files/" + folder + "/children",
			body: JSON.stringify({id: file}),
			method: 'POST'
		}, callback);
	};

	lib.removeFileFromFolder = function (file, folder, callback) {
		//TODO: check user input
		//TODO: seperate call from code
		submitRequest({
			path: "drive/v2/files/" + folder + "/children/" + file,
			method: 'DELETE'
		}, callback);
	};

	lib.newFolder = function (name, addParams, callback) {
		var body = addParams;
		body.title = name;
		body.mimeType = "application/vnd.google-apps.folder";
		//TODO: check user input
		//TODO: seperate call from code
		submitRequest({
			path: "drive/v2/files",
			body: JSON.stringify(body),
			method: "POST"
		}, callback);
	};

	lib.writeFile = function (file, folder, callback) {
		//TODO: check user input
		//TODO: seperate call from code
		var reader = new FileReader(),
			boundary = '-------314159265358979323846',
			delimiter = "\r\n--" + boundary + "\r\n",
			close_delim = "\r\n--" + boundary + "--";

		reader.readAsBinaryString(file);
		reader.onload = function (e) {
			var contentType, metadata, base64Data, multipartRequestBody;
			contentType = file.type || 'application/octet-stream';
			metadata = {
				'title': file.name,
				'mimeType': contentType,
				"parents": [{kind: "drive#fileLink", id: folder}]
			};
			base64Data = btoa(reader.result);
			multipartRequestBody =
				delimiter +
				'Content-Type: application/json\r\n\r\n' +
				JSON.stringify(metadata) +
				delimiter +
				'Content-Type: ' + contentType + '\r\n' +
				'Content-Transfer-Encoding: base64\r\n' +
				'\r\n' +
				base64Data +
				close_delim;

			submitRequest({
				'path': '/upload/drive/v2/files',
				'method': 'POST',
				'params': {'uploadType': 'multipart'},
				'headers': {
					'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
				},
				'body': multipartRequestBody
			}, callback);
		};
	};

	lib.readFile = function (file, callback) {
		//TODO: check user input
		//TODO: seperate call from code
		submitRequest({
			path: 'drive/v2/files/' + file
		}, function (file) {
			var accessToken, xhr;
			if (file.downloadUrl) {
				xhr = new XMLHttpRequest();
				accessToken = gapi.auth.getToken().access_token;
				xhr.open('GET', file.downloadUrl);
				xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
				xhr.onload = function (e) {
					callback(e.target.response);
				};
				xhr.onerror = callback;
				xhr.send();
			} else {
				callback(file);
			}
		});
	};

	newTable = function (name, columns, otherParams, callback) {
		var request, body, prop;
		//columns must be objects
		//TODO: check user input
		body = {
			columns: columns,
			name: name,
			isExportable: true
		};

		for (prop in otherParams) {
			if (otherParams.hasOwnProperty(prop)) {
				body.prop = otherParams.prop;
			}
		}

		request = {
			path: "fusiontables/v1/tables",
			body: JSON.stringify(body),
			method: 'POST'
		};
		submitRequest(request, callback);
	};

	getTablesByName = function (name, callback) {
		submitRequest({path: '/drive/v2/files' + "?q=title%3D'" + encodeURIComponent(name) + "'&fields=items(createdDate%2CdownloadUrl%2Cid%2CuserPermission%2Ctitle)", method: 'GET'},
			function (x) {
				var i, results, length;
				results = [];
				if (x.error) {
					//TODO: handle error
					throw JSON.stringify(x.error);
				} else {
					results = x.items;
				}
				callback(results);
			});
	};

	getUserName = function (callback) {
		callback = typeof callback === 'function' ? callback : function () {};
		submitRequest({path: '/oauth2/v2/userinfo'}, function (info) {
			callback(info.email);
			getUserName = function (callback) {
				callback(info.email);
			};
		});
	};

	isEmpty = function (map) {
		var key;
		for (key in map) {
			if (map.hasOwnProperty(key)) {return false; }
		}
		return true;
	};

	reportError = function (err) {
		console.error("Fusion Table Error: " + err + "<br />To display more information for any" +
			" function type [func_name] instead of [func_name](...)");
	};

	run = function (func) {
		return function () {
			var y;
			try {
				y = func.apply(null, arguments);
			} catch (err) {
				reportError(err);
			}
			return y;
		};
	};

	runClientRequest = function () {
		//variable declarations
		var callback, restRequest, request, that;

		//variable defintions
		that = this;

		//run a request
		if (requests.length > 0) {
			that.running = true;
			request = requests.shift();
			callback = request[1];
			request = request[0];
			restRequest = gapi.client.request(request);
			restRequest.execute(function (x, y) {
				callback(x, y);
				if (requests.length > 0) {
					that.run();
				} else {
					that.running = false;
					onComplete();
				}
			});
		}
	};

	//Must be defined after the function is...
	runners = [{running: false, run: runClientRequest}, {running: false, run: runClientRequest}];

	submitRequest = function (request, callback) {
		//variable declarations
		var i, len;

		//variable defintions
		len = runners.length;

		//add request to array
		requests.push([request, callback]);
		//see if there is anything to do
		for (i = 0; i < len; i += 1) {
			if (!runners[i].running) {
				runners[i].run();
				return;
			}
		}
	};

	login = function (callback) {
		gapi.client.setApiKey(apiKey);
		gapi.auth.authorize({client_id: clientId, scope: scopes, auth: true}, callback);
	};

	onComplete = function (callback) {
		//variable declarations
		var i, len, len2, func;

		//variable defintions
		len = runners.length;
		len2 = currentOnComplete.length;

		for (i = 0; i < len; i += 1) {
			if (runners[i].running || requests.length > 0) {
				if (typeof callback === 'function') {
					currentOnComplete.push(callback);
				}
				return;
			}
		}
		for (i = 0; i < len2; i += 1) {
			func = currentOnComplete.shift();
			if (typeof func === 'function') {
				func();
			}
		}
	};

	updateTableLine = function (tableID, columnChanges, rowID, callback) {
		//variable declarations
		var body, path, colName, request, changeDoubleQuotes;

		//variable definitions
		path = '/fusiontables/v1/query';
		request = 'UPDATE ' + tableID + ' SET';
		callback = typeof callback === 'function' ? callback : function () {};
		changeDoubleQuotes = function (x) {
			if (typeof x === 'string') {
				return x.replace(/\'/g, '"').replace(/\\/g, "/");
			} else {
				return x;
			}
		};

		//TODO: deal with rows that are too long...
		for (colName in columnChanges) {
			if (columnChanges.hasOwnProperty(colName)) {
				request = request + " '" + colName + "' = '" + changeDoubleQuotes(columnChanges[colName]) + "',";
			}
		}
		request = request.replace(/,$/, '');
		request = request + ' WHERE ROWID = ' + "'" + rowID + "'";
		body = 'sql=' + encodeURIComponent(request);

		request = {
			path: path,
			body: body,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': body.length
			},
			method: 'POST'
		};
		submitRequest(request, callback);
	};

	submitLinesToTable = function (tableID, columnNames, rowsIn, callback) {
		//Variables declarations
		var body, request, error, path, row, rowNum, thisCallback, rows, thisReq, len, changeDoubleQuotes;

		//variable definitions
		request = "";
		path = '/fusiontables/v1/query';
		thisCallback = callback;
		rows = JSON.parse(JSON.stringify(rowsIn));

		changeDoubleQuotes = function (x) {
			if (typeof x === 'string' && x !== "'ROWID'") {
				return x.replace(/\'/g, '"').replace(/\\/g, "/");
			} else {
				return x;
			}
		};

		//Build request	
		for (rowNum = 0; rows.length > 0; rowNum += 1) { //Nothing goes here, this is a while it exists loop
			row = rows.shift();
			//TODO: deal with rows that are too long...
			//Define the request and what table it goes into
			//check for bad input
			row = row.map(changeDoubleQuotes);
			thisReq = 'INSERT INTO ' + tableID +
				//Column names should to strings, make that work automatically
				" ( '" + columnNames.join("', '") + "') " +
				//Finally Values
				"VALUES ( '" + row.join("', '") + "') ;";

			if ((request.length + thisReq.length) > 2000000 || rowNum > 480 || (rowNum * columnNames.length) > 9900) {
				rows.unshift(row);
				thisCallback = submitOverflowFunc(tableID, columnNames, rows, callback);
				if (thisReq.length > 1000000) {
					error = {error: {message: "A single row is too large to be submitted", code: '414', errors: [[{
						domain: "fusiontables",
						location: "q",
						locationType: "parameter",
						message: "A single row is too large to be submitted.",
						reason: "rowTooLarge"
					}]]}};
					console.error(error);
					return error;
					//TODO deal with a single request being too long to submit... And of course too much info in one cell...
				}
				break;
			} else {
				request = request + thisReq;
			}
		}

		//console.log(request.length,rowNum,rowNum*columnNames.length);
		body = 'sql=' + encodeURIComponent(request);
        request = {
            path: path,
            body: body,
            headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': body.length
			},
            method: 'POST'
		};
		submitRequest(request, thisCallback);
	};

	submitOverflowFunc = function (tableID, columnNames, rows, callback) {
		return function (x) {
			submitLinesToTable(tableID, columnNames, JSON.parse(JSON.stringify(rows)), function (res) {
				res.rows.map(function (r) {x.rows.push(r); });
				callback(x, JSON.stringify(x));
			});
		};
	};

	queryTable = function (tableID, query, callback) {
		//variable declarations
		var path, request;

		//variable definitions
		path = '/fusiontables/v1/query?' + Math.random().toString().replace('0.', ''); //Path has number on the end to make sure it is not cached...
		//TODO: Deal with merging multiple rows
		if (isEmpty(query)) {
			request = 'SELECT * FROM ' + tableID;
			submitRequest({
				path: path,
				params: {'sql': request}
			}, callback);
        } else {
			request = 'SELECT ';
			//Columns
			request = (typeof query.columns !== 'object') ? request + ' * ' : request + "'" + query.columns.join("', '") + "' ";

			request = request + 'FROM ' + tableID;

			//Where
			request = (typeof query.where !== 'string') ? request : request + ' WHERE ' + query.where;

			//Group - did not do because I could not see the need for it...

			//Order
			request = (typeof query.order !== 'string') ? request : request + ' ORDER BY ' + "'" + query.order + "'";
			request = (typeof query.orderD !== 'string') ? request : request + ' ' + query.orderD;

			//Offset
			request = (typeof query.offset !== 'number') ? request : request + ' OFFSET ' + query.offset;

			//Limit
			request = (typeof query.limit !== 'number') ? request : request + ' LIMIT ' + query.limit;

			request = request.replace(/'ROWID'/g, "ROWID"); //Does not like ROWID to be in quotes, however very helpful for everything else
			request = {
				path: path,
				params: {'sql': request}
			};
			submitRequest(request, callback);
		}
	};

	return lib;
}());



/*function printFile(fileId) {
  var request = gapi.client.request({
path:'drive/v2/files/'+fileId
  });
  request.execute(function(resp) {
console.log(resp);
downloadFile(resp,function(x){
   console.log(x);
})
  });
}


// Download a file's content.
//
// @param {File} file Drive File instance.
// @param {Function} callback Function to call when the request is complete.
 
function downloadFile(file, callback) {
  if (file.downloadUrl) {
    var accessToken = gapi.auth.getToken().access_token;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file.downloadUrl);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = function() {
      callback(xhr.responseText);
    };
    xhr.onerror = function() {
      callback(null);
    };
    xhr.send();
  } else {
    callback(null);
  }
}*/
