//Global variables and function declarations
fuse = {
JSON:
	{
	access_token:"",
	userName:"",
	activeTables:new Array(),
	loggedIn:false,
	barWellColumns:['Barcode_Well','JSON','RDF','Referring Table and Row']
	},

/*////////////////////////////////////////////////////////////////////////////////////////
Authenticates the log in information, must have pop-up blocker off
	Takes a callback function for what to do following authentication
	Depends of client ID and scopes
/////*////////////////////////////////////////////////////////////////////////////////////
authenticate:function(callback){},

/*////////////////////////////////////////////////////////////////////////////////////////
Adds a line or series of lines to a table in fusion tables.
	ARGV: tableID - fusion table ID
		ColumnNames - array of the names of the columns ie [name,age]
		rows - 2d array containing data for rows [['Susan',34],['John Appleseed',12]]
		callback - function to execute after addition, arguments returned to this are
		  fusion tables returns, which are an object containing column names
		  and some other info as an object then as a stringified object, 
		  sure it can handle an error - reported as: return:{error:{..},..}
/////*////////////////////////////////////////////////////////////////////////////////////
submitLineToTable:function(tableID, columnNames, rowID, callback){},


/*////////////////////////////////////////////////////////////////////////////////////////
Changes a line of a table in fusion tables.
	ARGV: tableID - fusion table ID
		columnChanges - object of form: {columnID:newValue}
		rowID - rowID from fusion table query/insert
		callback - function to execute after addition, arguments returned to this are
		  fusion tables returns, which are an object containing column names
		  and some other info as an object then as a stringified object, 
		  sure it can handle an error - reported as: return:{error:{..},..}
/////*////////////////////////////////////////////////////////////////////////////////////
updateTableLine:function(tableID, columnChanges, rowID, callback){},


/*////////////////////////////////////////////////////////////////////////////////////////
Not yet written
/////*////////////////////////////////////////////////////////////////////////////////////
deleteTableLines:function(){},

/*////////////////////////////////////////////////////////////////////////////////////////
Query's a fusion table for specific parameters, can take a series of arguments.
  https://developers.google.com/fusiontables/docs/v1/sql-reference#Select has a good 
  summary of the available options. Particularly how to write the where statement.
	ARGV: tableID - fusion tableID
		queryParams - an object with a series of properties any of which can be left 
		  out:
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
/////*////////////////////////////////////////////////////////////////////////////////////
queryTable:function(tableID, queryParams, callback){}

};

// Private functions 
(function()
	{
	///////////////////
	//Local Variables//
	///////////////////
	var originalFileTabID = '1WbPPf-vYO_EUVp1bV01zzQCwUU2i98AOD5IADGQ';
	var barWellFileID = '1PLV48H-2oR2dQNJAZct2qkaPhJV97mYhsOD4lEI';
	var clientId = '547674207977.apps.googleusercontent.com';
	var apiKey = 'AIzaSyBjXKVpOKsYQd7DSzWRzQEVY0c7kiDJa4M';
	var scopes = ['https://www.googleapis.com/auth/fusiontables','https://www.googleapis.com/auth/userinfo.email'];
	var max_requests = 2;
	var numberOfRequests = 0;
	var requestBuffer = [];
	
	///////////////////
	//Local Functions//
	///////////////////
	
	//Main runner for all submits/grabs/queries from fusion tables - every call to google
		//runs through this function...
	var runClientRequest = function (request, callback) 
		{
		if(request != undefined){requestBuffer.push([request,callback]);}
		if( numberOfRequests <= max_requests && requestBuffer.length>0 )
			{
			numberOfRequests++
			var r = requestBuffer.shift();
			var restRequest = gapi.client.request(r[0]);
    		restRequest.execute(function(x,y)
    			{
    			r[1](x,y);
    			numberOfRequests--;
    			runClientRequest();
    			});
    		}
    	};
	
	//Changes the menu once authentication has taken place
	var changeMenu = function()
		{
		//Following Authentication to show that we are logged in...
		var the = fuse.JSON;
		var getUserName = function(info)
			{
			the.userName = info.email;
			$('#auth').html("&nbsp&nbsp" + the.userName + "&nbsp&nbsp");
			//Do this here so the username is set when the collection changes
			fileUpload.setUploadToFUSE();
			}
		$.get('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token='+the.access_token,getUserName);
		};	
	
	//Submits a line to a fusion table
	var submitFileToFuse = function(that, callback)
		{
		//Note - callback is typically updateTable for adding bionavigator files
    	fuse.submitLinesToTable(originalFileTabID, 
    		["FileName","DateCreated","FileContents","FileSize","JSONFileID"], 
    		[[that.data('fileName'), new Date, 
    			that.data('fileContents').replace(/'/g,'"').replace(/\\/g,"/"),
    			that.data('fileSize'), ""]], 
    		callback);
    	};
	
	//Gets a row(s) of a table
	var getRow = function(request,callback)
		{
		
		var path = '/fusiontables/v1/query?' +Math.random().toString().replace('0.','');
		//var body = encodeURIComponent(request);
		
		runClientRequest({
            path: path,
            params:{'sql':request}
          	}, callback);
		
		};
	
	//Updates the table after submit has completed
	var updateTable = function(uploadButton, fuseFile)
		{
		//This is done so we can tell which line was submitted
		return function(evt)
			{
			//variables
			var id, ftrow, row;
			
			if( evt.error != undefined )
				{
					//There is an error and I need to handle it... Somehow....
				}
			else
				{
				// change the row to reflect it worked :-)
				
				//get the table row
				row = uploadButton.parent().parent();
				
				//get the fusion table row id
				ftrow = evt.rows[0][0];
				
				//1st portion need a button to add to qc
				var button = $('<button>',{'type':"reset"}).appendTo(row.find("td")[0]);
				addQCbutton( button, ftrow, fuseFile );
				
				//Change the sending button to a delete button
				var delID = 'delete' + uploadButton.attr('id');
				uploadButton.parent().html($('<button>',{'class':'btn btn-danger', 'id':delID,'html':'<i class="icon-trash icon-white"></i>Delete'}));
				$('#'+delID).click( function(del)
					{
					del.preventDefault();
					console.log('PC LOAD LETTER');
					});
					
				//Delete the loading bar and the cancel button if they are ever added...
				$(row.find("td")[3]).html("");
				$(row.find("td")[5]).html("");
				
				
				}
			}
	};
	
	var displayFUSEtable = function(fuseFile)
		{
		fuse.queryTable(originalFileTabID, {columns:['ROWID','FileName','FileSize','DateCreated'],order:'DateCreated',orderD:'ASC'}, function(res)
			{
			var fnInd = 1;
			var ridInd = 0;
			var fsInd = 2;
			for( var rowInd in res.rows )
				{
				//Add line to the table
        		$('<tr>',{'class':'fuserow', html:
        	  	
        	  	//Add to QC button
        	  	"<td><button type=reset id=addHere"+rowInd+"></button></td>"+
        	  	
        	  	//File name
        	  	"<td>"+res.rows[rowInd][fnInd]+"</td>" + 
        	  	
        	  	//File size - not added yet
        	  	"<td>" + res.rows[rowInd][fsInd]+ "&nbsp KB</td>" +
        	  	
        	  	//Where loading bar would be
        	  	"<td></td>"+
        	  	
        	  	//Delete Button
        	  	"<td><button class='btn btn-danger'>"+
        	  	"<i class='icon-trash icon-white'></i>"+
        	  	"Delete</button></td>"+
        	  	
        	  	//Where cancel upload would be
        	  	"<td></td>"}).appendTo($('#fileTable'));
        	  	
        	  	//Actually give add to QC button something to do
        	  	//1st portion need a button to add to qc
				addQCbutton( $('#addHere'+rowInd), res.rows[rowInd][ridInd], fuseFile );
        	  	}
			});
		};
	
	var addQCbutton = function( jqueryButton, ftROWID, fuseFile )
		{
		var getFileReq = 'SELECT FileContents FROM ' + fuseFile + ' WHERE ROWID = ' + ftROWID;
		//This must be set in original creation of the button
		//jqueryButton.attr('type','reset');
		jqueryButton.attr('class','btn btn-success');
		jqueryButton.html("<i class='icon-plus icon-white'></i>");				  
		jqueryButton.data('queryName',getFileReq);
		
		jqueryButton.click(function()
			{
			var that = $(this);
			that.unbind('click');
			that.html("<i class='icon-ok icon-refresh'></i>");
			that.attr('class','btn btn-warning');

			//Load the file into QC	
			getRow(that.data('queryName'),function(res)
				{
				//If it fails
				
				
				//If it works
				workers.fileImporter_sendToWorker(res.rows[0][0],
					{fit:false,changed:false,'dbType':'fusionTable','originFile':fuseFile,'originLine':ftROWID,barcodeFile:barWellFileID},afterAddedToQC(that,fuseFile,ftROWID));
				});
			});
		};
	
	var afterAddedToQC = function(buttonElement,fuseFile,ftROWID)
		{
		return function()
			{
			//vars
			var columns = fuse.JSON.barWellColumns;
			var lines = [];
			var barObject = kinomicsActiveData.JSON.barcodes;
			
			//check to make sure data does not already exist
			fuse.queryTable(barWellFileID, {columns:['Barcode_Well','JSON'], 
						where: "'Referring Table and Row' = '" + fuseFile + '_row_' + ftROWID + "'"}, 
			//callback
			function(res)
				{
				//If error, handle it
				if(0){}
				
				else
					{
					//Check if new data arrived
					var barcodesFound = [];
					for( var rowNum in res.rows )
						{
						//If the barcode returned is present, update data
						var bar = res.rows[rowNum][0];
						if(typeof barObject[bar] != undefined)
							{
							barObject[bar] = JSON.parse(res.rows[rowNum][1]);
							barObject[bar].db.looked = true;
							barcodesFound.push(bar);
							}
						kinomicsImportUI.peptideTableViewer.addBarcodesToTable(barcodesFound);
						}
					
					//Any data that is new will be added to the table after it is fit
						// No point in adding data at this stage, doing this will just
						// make the fitting algorithm a little longer.
					//Add the data to be fit if need be
					for( var bar in barObject )
						{
						if( barObject[bar].db.fit == false )
							{
							kinomicsImportUI.buttons.fitCurves();
							break;
							}
						}
					
					buttonElement.html("<i class='icon-ok icon-white'></i>");
					buttonElement.attr('class','btn btn-info');
					}
				});
			}
		}
	
	////////////////////
	//Global Functions//
	////////////////////
	fuse.authenticate = function(callback)
		{
		gapi.client.setApiKey(apiKey);
		gapi.auth.authorize({client_id:clientId,scope:scopes,auth:true},
		//Callback function
		function(e)
			{
			var the = fuse.JSON;
			the.access_token=e.access_token;
			changeMenu();
			callback(e);
			displayFUSEtable(originalFileTabID);
			//Make changes to the upload display
			the.loggedIn = true;
			
			});
		};
	
	fuse.updateTableLine = function(tableID, columnChanges, rowID, callback)
		{
		var path = '/fusiontables/v1/query'; 
		var request = 'UPDATE ' + tableID + ' SET';
		for( var colName in columnChanges )
			{
			request = request + " '" + colName + "' = '" + columnChanges[colName] + "',";
			}
		request = request.replace(/,$/, '');
		request = request + ' WHERE ROWID = ' + "'"+rowID+"'";
		body = 'sql=' + encodeURIComponent(request);
		
		runClientRequest({
			path: path,
			body: body,
			headers: 
            	{
              	'Content-Type': 'application/x-www-form-urlencoded',
              	'Content-Length': body.length
            	},
            method: 'POST'
          	}, callback);
		
		};
	
	fuse.submitLinesToTable = function(tableID, columnNames, rowsIn, callback)
		{
		//Variables
		var body;
		var request = "";	
		var path = '/fusiontables/v1/query';        
		var rowNum;
		var thisCallback = callback;
		var rows = amdjs.clone(rowsIn);
		//Build request	
		for( rowNum = 0; 0 < rows.length; rowNum++ ) //Nothing goes here, this is a while it exists loop
			{
			var row = rows.pop();
			//Define the request and what table it goes into
			var thisReq = 'INSERT INTO ' + tableID + 
		
			//Column names should to strings, make that work automatically
			" ( '"+columnNames.join("', '")+"') " + 
			
			//Finally Values
			"VALUES ( '"+row.join("', '")+"') ;";
			
			if( (request.length + thisReq.length) > 2000000 || rowNum>480 || (rowNum*columnNames.length)>9900 )
				{
				rows.push(row);
				thisCallback = function(x)
					{
					fuse.submitLinesToTable(tableID, columnNames,amdjs.clone(rows),function(res)
						{
						res.rows.map(function(r){ x.rows.push(r) });
						callback(x,JSON.stringify(x));
						});
					};
				break;
				}
			else{request = request+thisReq}
			}
		//console.log(request.length,rowNum,rowNum*columnNames.length);
		body = 'sql=' + encodeURIComponent(request);	
        runClientRequest({
            path: path,
            body: body,
            headers: 
            	{
              	'Content-Type': 'application/x-www-form-urlencoded',
              	'Content-Length': body.length
            	},
            method: 'POST'
          	}, thisCallback); //Note - callback is typically updateTable for adding bionavigator files
		};
		
	fuse.queryTable = function(tableID, query, callback)
		{
		//Path has number on the end to make sure it is not cached...
		var path = '/fusiontables/v1/query?' +Math.random().toString().replace('0.','');
		
		var isEmpty = function (map) {for(var key in map) {if (map.hasOwnProperty(key)) {return false;}}return true;};
		
		if( isEmpty(query) ) 
			{
			var request = 'SELECT * FROM ' + tableID;
			runClientRequest({
	            path: path,
    	        params:{'sql':request}
        	  	}, callback);
        	}
        else
        	{
        	var request = 'SELECT ';
        	//Columns
        	request = (typeof query.columns != 'object')?request+' * ':request+"'"+query.columns.join("', '")+"' ";
        	
        	request = request + 'FROM ' + tableID;
        	
        	//Where
        	request = (typeof query.where != 'string')?request:request+ ' WHERE ' + query.where;
        	
        	//Group - did not do because I could not see the need for it...
        	
        	//Order
        	request = (typeof query.order != 'string')?request:request+ ' ORDER BY ' + "'"+query.order+"'";
        	request = (typeof query.orderD != 'string')?request:request+ ' ' + query.orderD;
        	
        	//Offset
        	request = (typeof query.offset != 'number')?request:request+ ' OFFSET ' + query.offset;
        	
        	//Limit
        	request = (typeof query.limit != 'number')?request:request+ ' LIMIT ' + query.limit;
        	
        	request = request.replace(/'ROWID'/g,"ROWID"); //Does not like ROWID to be in quotes, however very helpful for everything else
        	runClientRequest({
	            path: path,
    	        params:{'sql':request}
        	  	}, callback);
        	}
		}
	
	//Actual events to run at load
	//Change Add files button
	$('#FUSEsub').unbind();
	$('#FUSEsub').bind('change', function(evt)
		{
		var files = evt.target.files; // FileList object
		evt.preventDefault();
	    // Loop through the FileList and read the files
    	for (var i = 0, f; f = files[i]; i++) 
    		{
		    var reader = new FileReader();
			
	    	// Closure to capture the file information.
	      	reader.onload = (function(theFile) 
    	  		{
        		return function(e) 
        			{
        			//Delete the elemets of the wrong class I cannot get rid of otherwise since it is the one generated by the file upload tool...
					$('#fileTable').find('.template-upload').remove();
        			
        			//Get all lines of the table
        			var lines = $('#fileTable').find('tr');
        			
        			//Determine the length of the table
	        		var size = lines.length;
					
		          	//Add line to the table
        	  		$('<tr>',{'class': 'fuserow', html:"<td></td><td>"+theFile.name+"</td><td>" + Math.round(theFile.size/10.24)/100 + "&nbsp KB</td><td>load</td><td><button class='btn btn-primary push' id='subBut"+size+"'><i class='icon-upload icon-white'></i>Push To Fusion Tables</button></td><td>Cancel</td>"}).appendTo($('#fileTable'));
					
					//Make sure submit button does not behave badly
					$('#subBut'+size).unbind();
					
					//Give submit button a new calling, and the contents of the file
					$('#subBut'+size).data('fileContents',amdjs.clone(e.target.result));
					$('#subBut'+size).data('fileName',amdjs.clone(theFile.name));
					$('#subBut'+size).data('fileSize',amdjs.clone(Math.round(theFile.size/10.24)/100));
					$('#subBut'+size).attr('data-loading-text','Sending...');
					$('#subBut'+size).click(function(evt)
						{
						var that = $(this); 
						that.button('loading');
						//To keep form submission from actually occurring...
						evt.preventDefault();
						submitFileToFuse(that, updateTable(that,originalFileTabID));
						that.unbind('click');
						});
    	    		};
      			})(f);
	      	// Read in the image file as a data URL.
    	  	reader.readAsText(f);
    		}
		});
	
	//Change Submit All Button
	$("#fusionUpload").find(".start").click(function(){$('#fileTable').find('.push').click()});
	
    }())