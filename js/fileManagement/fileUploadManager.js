//Global variables and function declarations
fileUpload = 
	{
	//Variables
	loggedIn:false,
	
	//Functions
	setUploadToS3DB:function(){},
	setUploadToFUSE:function(){},
	sendBarcodesToDB:function(barcodeArr){},
	showSaveDataButton:function(){}
	};
	
//Private variables and functions
(function()
	{
	//Variables
	
	
	//Variables with definitions
	var currentUpload = $('#defaultFile');
	var main = fileUpload;
	var menuText = 'Select Database';
	var nameText = "Login";
	
	//Local functions
	var changeDisplay = function()
		{
		$('.fileOpts').hide();
		currentUpload.show();
		$('#curData').text(menuText);
		$('#username').html(nameText);
		};
	
	var FUSE_sendBarcodesToDB = function(barObject,callback)
		{
		var lines = [];
		var columns = fuse.JSON.barWellColumns;
		for( var bar in barObject )
			{
			lines.push([bar,JSON.stringify(barObject[bar]),
				"", barObject[bar].db.originFile + "_row_" + barObject[bar].db.originLine]);
			}
		if( lines.length > 0 )
			{
			fuse.submitLinesToTable(barObject[bar].db.barcodeFile,columns,lines,function(res,res2)
				{
				for( var ind in lines ) 
					{
					var bar = lines[ind][0];
					var db =  barObject[bar].db;
					db.barLine = res.rows[ind][0];
					fuse.updateTableLine(db.barcodeFile, {JSON:JSON.stringify(barObject[bar])}, db.barLine, callback);
					}
				callback(res,res2);
				});
			}
		};
	
	var S3DB_sendBarcodesToDB = function(barcodes,callback)
		{
		
		};
	
	var FUSE_saveChanges = function(barObject,callback)
		{
		var lines = [];
		for( var bar in barObject )
			{
			var db =  barObject[bar].db;
			fuse.updateTableLine(db.barcodeFile, {JSON:JSON.stringify(barObject[bar])}, db.barLine, callback);
			}
		}
		
	var S3DB_saveChanges = function()
		{
		
		};
		
	var setFunctionsToFuse = function()
		{};

	var setFunctionsToS3DB = function()
		{};
		
	var saveChanges = function(callback)
		{
		var FUSEobj = {};
		var S3DBobj = {};
		var barcodes = kinomicsActiveData.JSON.barcodes;
		//Find the ones that have been changed
		for( bar in barcodes )
			{
			if(	barcodes[bar].db.changed == true )
				{
				if( barcodes[bar].db.dbType == 'fusionTable' )
					{
					FUSEobj[bar]=barcodes[bar];
					}
				else if( barcodes[bar].db.dbType == 'S3DB' )
					{
					S3DBobj[bar]=barcodes[bar];
					}
				else
					{
					console.log('unknown database type in fileUpload.sendBarcodesToDB');
					}
				}
			}
		FUSE_saveChanges(FUSEobj,callback);
		S3DB_saveChanges(S3DBobj,callback);
		}
	
	//Global function definitions
	main.setUploadToS3DB = function()
		{
		var inner = function()
			{
			//Switches display and functionality to S3DB
			$('.fuserow').hide()
			main.loggedIn = true;
			currentUpload = $('#S3DBupload');
			menuText = 'S3DB';
			nameText = s3dbfu.username();
			jQuery('.template-download').show();
			changeDisplay();
			}
		//Check to see if logged in
		if(s3dbfu.apikey()!=""){ main.setUploadToS3DB = inner; inner(); }
		else
			{
			main.loggedIn = false;
			$('.fuserow').hide()
			currentUpload = $('#defaultFile');
			menuText = 'S3DB';
			nameText = 'Login';
			changeDisplay();
			}
		};
	
	main.setUploadToFUSE = function()
		{
		var inner = function()
			{
			//Hide any S3DB elements
			jQuery('.template-download').hide();
			main.loggedIn = true;
			//Switches display and functionality to Fusion Tables
			currentUpload = $('#fusionUpload');
			menuText = 'Fusion Tables';
			nameText = fuse.JSON.userName;
			$('.fuserow').show()
			setFunctionsToFuse();
			changeDisplay();		
			}
		if(fuse.JSON.loggedIn){ main.setUploadToFUSE =inner; inner();}
		else
			{
			//Hide any S3DB elements
			jQuery('.template-download').hide();
			main.loggedIn = false;
			currentUpload = $('#defaultFile');
			menuText = 'Fusion Tables';
			nameText = 'Login';
			setFunctionsToS3DB();
			changeDisplay();
			}
		};
	
	main.sendBarcodesToDB = function(barcodes,callback)
		{
		var FUSEobj = {};
		var S3DBobj = {};
		
		for( barInd in barcodes )
			{
			if( kinomicsActiveData.JSON.barcodes[barcodes[barInd]].db.dbType == 'fusionTable' )
				{
				FUSEobj[barcodes[barInd]]=kinomicsActiveData.JSON.barcodes[barcodes[barInd]];
				}
			else if( kinomicsActiveData.JSON.barcodes[barcodes[barInd]].db.dbType == 'S3DB' )
				{
				S3DBobj[barcodes[barInd]]=kinomicsActiveData.JSON.barcodes[barcodes[barInd]];
				}
			else
				{
				console.log('unknown database type in fileUpload.sendBarcodesToDB');
				}
			}
		FUSE_sendBarcodesToDB(FUSEobj,callback);
		S3DB_sendBarcodesToDB(S3DBobj,callback);
		}
	
	main.showSaveDataButton = function()
		{
		$('#saveChanges').show();
		}
	
	//Initiate the display
	changeDisplay();
	
	
	//Make, but hide the save button
	var saveButtonGo = function()
		{
		//var func = this;
		var save = $('<button>',{'class':'btn btn-info pull-right',id:'saveChanges',html:"<i class='icon-upload icon-white'></i>Save JSON Changes"});
		
		save.click(function(x) 
			{
			console.log('I was clicked');
			var that = $(this);
			that.unbind('click');
			that.html('Saving...');
			saveChanges(saveButtonGo);
			});
		$('#saveChanges').is('*')?$('#saveChanges').replaceWith(save):save.appendTo('#buttons').hide();
		
		};
	saveButtonGo();
	
	}())//End private