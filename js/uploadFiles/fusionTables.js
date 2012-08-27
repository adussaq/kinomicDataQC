//Global variables and function declarations
fuse = {
JSON:
	{
	access_token:"",
	userName:"",
	loggedIn:false
	},

//Authenticates the log in information, must have pop-up blocker off...
authenticate:function(){}

};

     
     
     
// Private functions 
(function()
	{
	///////////////////
	//Local Variables//
	///////////////////
	var publicTabID = '1WbPPf-vYO_EUVp1bV01zzQCwUU2i98AOD5IADGQ';
	var clientId = '547674207977.apps.googleusercontent.com';
	var apiKey = 'AIzaSyBjXKVpOKsYQd7DSzWRzQEVY0c7kiDJa4M';
	var scopes = ['https://www.googleapis.com/auth/fusiontables','https://www.googleapis.com/auth/userinfo.email'];
	
	///////////////////
	//Local Functions//
	///////////////////
	
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
	
	//Main runner for all submits/grabs/queries from fusion tables
	var runClientRequest = function (request, callback) 
		{
    	var restRequest = gapi.client.request(request);
    	restRequest.execute(callback);
    	};
	
	//Submits a line to a fusion table
	var submit = function(that, callback)
		{
		//Publicly available file...
		var file = publicTabID;
		
		//Request to add information from jQuery object that was passed in, note that the columns must have no spaces in their names
		var request = 'INSERT INTO ' + file + ' (FileName, DateCreated, FileContents, FileSize, JSONFileID) VALUES (' +
			"'" + that.data('fileName') +"', '" + new Date +"', '" 
			+ that.data('fileContents').replace(/'/g,'"').replace(/\\/g,"/") +"', '"+that.data('fileSize')+"', '')";
        var path = '/fusiontables/v1/query';
        var body = 'sql=' + encodeURIComponent(request);
        runClientRequest({
            path: path,
            body: body,
            headers: 
            	{
              	'Content-Type': 'application/x-www-form-urlencoded',
              	'Content-Length': body.length
            	},
            method: 'POST'
          	}, callback); //Note - callback is typically updateTable for adding bionavigator files
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
		
		}
	
	//Updates the table after submit has completed
	var updateTable = function(uploadButton)
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
				console.log(ftrow);
				
				//1st portion need a button to add to qc
				var button = $('<button>',{'type':"reset"}).appendTo(row.find("td")[0]);
				addQCbutton( button, ftrow );
				
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
	
	var displayFUSEtable = function()
		{
		var request = 'SELECT ROWID, FileName, FileSize FROM ' + publicTabID;
		getRow(request, function(res)
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
				addQCbutton( $('#addHere'+rowInd), res.rows[rowInd][ridInd] );
        	  	}
			});
		};
	
	var addQCbutton = function( jqueryButton, ftROWID )
		{
		var getFileReq = 'SELECT FileContents FROM ' + publicTabID + ' WHERE ROWID = ' + ftROWID;
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
				that.html("<i class='icon-ok icon-white'></i>");
				that.attr('class','btn btn-info');
				workers.fileImporter_sendToWorker(res.rows[0][0]);
				});
			});
		};
	
	//Define Global Functions
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
			displayFUSEtable();
			//Make changes to the upload display
			the.loggedIn = true;
			
			});
		};

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
						submit(that, updateTable(that));
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