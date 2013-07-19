/*global KINOMICS, console, $, FileReader */
//TODO: error reporting for user very important here, make a failed save a ! or a yeild sign.
//TODO: change error so it only occurs on a barcode by barcode basis.
//TODO: add display for what is going on. ie parsing file, uploading file, downloading file, ect.

var glob;
KINOMICS.fileManager.UI = (function () {
	'use strict';

	//variable declarations
	var displayTables, lib, fuse, files, analysis, analyses,
		run, reportError, fusePackage, s3dbPackage, s3db, qcUI,
		workersfile, workers, barcodes, barcodeCreator, thisDA,
		navigationBar, table, parseObj, currentLoaded;

	//variable definitions
	lib = {};
	analyses = [];

	//library function definitions
	fusePackage = KINOMICS.fusionTables;
	s3dbPackage = KINOMICS.S3DB;
	fuse = KINOMICS.fileManager.DA.fusionTables;
	s3db = KINOMICS.fileManager.DA.s3db;
	workersfile = 'js/fileManagement/fileParseWorker.js';
	workers = KINOMICS.workers;
	barcodes = KINOMICS.barcodes;
	barcodeCreator = KINOMICS.expandBarcodeWell;
	thisDA = KINOMICS.fileManager.DA;
	qcUI = KINOMICS.qualityControl.UI;
	parseObj = {func: thisDA.parseFile, params: {
		//Will need to add, file: filename; dbObj: {info on db};
		callback: qcUI.fitCurvesBut.update,
		workersfile: 'js/fileManagement/fileParseWorker.js',
		workers: workers,
		barcodes: barcodes,
		barcodeCreator: barcodeCreator
	}};

	//main element declarations
	navigationBar = $('#colBrowse');
	table = $('#fileTable');

	//local function definitions
	reportError = function (err) {
		return console.error("Kinomics File Manager User Interface Error: " + err + "\nTo display more information for any" +
			" function type <func_name> instead of <func_name>(...)");
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

	//define UI element function groups
	//Page set up - general
	(function () {
		//variable declarations

		//variable definitions

		//set up login menu - fusion tables, allowing gapi to be here for getting the access token to determine user name.
		$('#authFT').click(function (evt) {
			lib.formControl.setUpload('fuse');
			thisDA.login(fuse, fusePackage, parseObj, lib.table.update);
		});

		//set up login menu - s3db
	}());

	//Page set up, accesable elements
	lib.formControl = (function (mainLib) {
		//variable declarations
		var defaultMessage, s3dbPanel, fusePanel, lib, update, makeTableLineForNewFile,
			setUpload, saveToDb, panel, dbSelector, addFileToTable, newAnalysis, box,
			analysisTextBox, currentAnaDisplay;

		//variable definitions
		lib = {};
		defaultMessage = $('#defaultFile');
		s3dbPanel = $('#S3DBupload');
		fusePanel = $('#fusionUpload');
		dbSelector = $('.dbSelector');

		lib.update = function () {
			//TODO: user docs...
			run(update)();
		};

		lib.setUpload = function (str) {
			//TODO: user docs...
			run(setUpload)(str);
		};

		dbSelector.setText = function (text) {
			$('.curData').text(text);
		};

		//outdated?
		makeTableLineForNewFile = function (fileName, fileSize, callback) {
			return function (fileReaderObj) {
				//TODO: handle bad file or file reader...

				//variable declaration
				var fileContent, pushButton, trow, tempElem, clickFunc;

				//variable definition
				fileContent = fileReaderObj.target.result;

				trow = $('<tr />', {'class': 'uploadRow originRow'});

				//space
				$('<td />').appendTo(trow);

				//File name
				$("<td />", {text: fileName}).appendTo(trow);

				//File size
				$("<td />", {html: fileSize + "&nbsp KB"}).appendTo(trow);

				//Where loading bar would be
				$("<td />").appendTo(trow);

				//Upload Button
				tempElem = $('<td />').appendTo(trow);
				pushButton = $('<button />', {'class': 'btn btn-primary upload uploadBtn',
					html: "<i class='icon-upload icon-white'></i> Upload to " + saveToDb.name}).
					appendTo(tempElem);

				//Where cancel upload would be
				tempElem = $("<td />").appendTo(trow);
				$('<button />', {'class': 'btn btn-danger',
					html: "<i class='icon-trash icon-white'></i>Cancel Upload"}).
					click(function (evt) {$(this).parent().parent().remove(); }).
					appendTo(tempElem);
				//TODO: re work so that this is more fluid....
				//Actually give upload button something to do
				clickFunc = (function (cdb) {
					return function (evt) {
						var that = $(this), i;
						that.unbind();
						that.attr('class', that.attr('class') + ' disabled');
						evt.preventDefault();
						cdb.addFile(fileName, fileSize, fileContent, function (row) {
							console.log(that, row, "done!");
							that.parent().parent().replaceWith(row);
						}, parseObj);
					};
				}(saveToDb));
				pushButton.click(clickFunc);
				callback(trow);
			};
		};

		addFileToTable = function (evt) {
			//variable declarations
			var  i, file, reader, dataObj;
			//variable definitions
			files = evt.target.files; // FileList object
			evt.preventDefault();
			// Loop through the FileList and read the files
			for (i = 0; i < files.length; i += 1) {
				file = files[i];
				//reader = new FileReader();
				//reader.onload = makeTableLineForNewFile(file.name, Math.round(file.size / 10.24) / 100, mainLib.table.addLineToTableTop);
				//NOTE: this is changed to call the general write file function
				//TODO: make sure this works for S3DB and fusion tables
				//thisDA.writeFile({db: saveToDb, file: file, callback: function (x) {console.log(x, '\nFile written\n'); }, parseObj: parseObj});
				dataObj = thisDA.newDataObject();
				dataObj.addData({type: 'fileObj', data: file});
				dataObj.save({callback: mainLib.table.update});
			}
		};

		newAnalysis = function (evt) {
			var analysisName;
			evt.preventDefault();
			box.modal('toggle');

			//get analysis name and reset text
			analysisName = analysisTextBox.val();
			analysisTextBox.val("");
			analysis = thisDA.newAnalysisObject({name: analysisName});
			analyses.push(analysis);
			currentLoaded = {};
			currentAnaDisplay.text('Current Analysis: ' + analysisName);
		};

		setUpload = function (str) {
			if (str === 'fuse') {
				saveToDb = fuse;
				saveToDb.name = 'Fusion Tables';
				panel = fusePanel;
				dbSelector.setText('Fusion Tables');
			} else if (str === 's3db') {
				saveToDb = s3db;
				saveToDb.name = 'S3DB';
				panel = s3dbPanel;
				dbSelector.setText('S3DB');
			} else {
				throw 'Must use setUpload with a string passed in of either s3db or fuse';
			}
			update();
		};

		update = function () {
			if (typeof saveToDb !== 'undefined' && saveToDb.loggedIn) {
				defaultMessage.hide();
				navigationBar.show();
				panel.show();
				saveToDb.getUserName(function (userName) {
					$('.username').text(userName);
				});
				//$('.hiddenBut').click();
				//$('#fuseSub').click();
				//$('#multiUp').click();
			} else {
				defaultMessage.show();
				s3dbPanel.hide();
				fusePanel.hide();
				navigationBar.hide();
				$('.username').text('Login');
			}
		};

		//actually set up elements...
		(function () {
			var tempElem;
			defaultMessage.show();
			s3dbPanel.hide();
			fusePanel.hide();
			$('<li />', {html: "<a>Fusion Tables</a>"}).click(function () {setUpload('fuse'); }).appendTo(dbSelector);
			$('<li />', {html: "<a>S3DB</a>"}).click(function () {setUpload('s3db'); }).appendTo(dbSelector);
			dbSelector.setText('Select Database');
			$('#FUSEsub').unbind();
			$('#FUSEsub').bind('change', addFileToTable);

			//Add current analysis info
			currentAnaDisplay = $('.currentAnaDisp').text('To begin analysis, please select or create an analysis.');

			//Gives the new analyisis Button Function.
			$('#NEWanalysis').unbind();
			$('#NEWanalysis').click(function (evt) {
				evt.preventDefault();
				box.modal('toggle');
				analysisTextBox.focus();
			});
			box = $('<div />', {'aria-labelledby': "myModalLabel", 'aria-hidden': "true", role: 'dialog', tabindex: '-1', 'class': 'modal hide fade'}).appendTo('#tableDiv');
			$('<div />', {'class': 'modal-header', html: '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><h3>Give analysis a name.</h3>'}).appendTo(box);
			tempElem = $('<div />', {'class': 'modal-body', html: ''}).appendTo(box);
			analysisTextBox = $('<input />', {type: "text"}).keypress(function (e) {
				if (e.which === 13) {
					newAnalysis(e);
				}
			}).appendTo(tempElem);
			tempElem = $('<div />', {'class': 'modal-footer'}).appendTo(box);
			$('<button />', {'class': "btn btn-primary", text: 'Create Analysis'}).click(newAnalysis).appendTo(tempElem);
			box.on('shown', function () { analysisTextBox.focus(); });
		}());

		return lib;
	}(lib));

	lib.navigationBar = (function (mainLib) {
		//variable declarations
		var bar, currentDataType, lib, resizeMenus, setDataType, update;

		//variable definitions
		lib = {};
		currentDataType = 'origin';

		lib.setDataType = function (str) {
			//TODO: user docs
			run(setDataType)(str);
		};

		resizeMenus = function () {
			if ($('#tag3').parent().attr('class') === "active") {
				var max = 20;
				$('.fileOpts').each(function (ind, x) {
					$(x).height('auto');
					if ($(x).is(":visible")) {
						max = Math.max($(x).height(), max);
					}
				}).height(max);
			}
		};

		setDataType = function (str) {
			currentDataType = str || currentDataType;
			switch (currentDataType) {
			case 'origin':
				$('.batch').show();
				$('.data').hide();
				$('.analysis').hide();
				break;
			case 'barcode':
				$('.batch').hide();
				$('.data').show();
				$('.analysis').hide();
				break;
			case 'analysis':
				$('.batch').hide();
				$('.data').hide();
				$('.analysis').show();
				break;
			default:
				throw "Must pass nothing, or a string ==(origin||barcode), you passed: " + str;
			}
			resizeMenus();
		};

		(function () {
			var tempElem;
			navigationBar.hide();
			lib.setDataType('analysis');
			tempElem = $('<div/>', {'class': 'sidebar-nav'}).appendTo(navigationBar);
			tempElem = $('<ul/>', {'class': 'nav nav-list'}).appendTo(tempElem);
			$('<li />', {'class': 'nav-header', text: 'Collections'}).appendTo(tempElem);
			$('<li />', {'class': 'active', html: '<a>Anaylses</a>'}).click(function () {
				tempElem.find('li:not(.nav-header)').attr('class', '');
				$(this).attr('class', 'active');
				setDataType('analysis');
			}).appendTo(tempElem);
			$('<li />', {html: '<a>Bionavigator Output</a>'}).click(function () {
				tempElem.find('li:not(.nav-header)').attr('class', '');
				$(this).attr('class', 'active');
				setDataType('origin');
			}).appendTo(tempElem);
			$('<li />', {html: '<a>Samples</a>'}).click(function () {
				tempElem.find('li').attr('class', '');
				$(this).attr('class', 'active');
				setDataType('barcode');
			}).appendTo(tempElem);
		}());

		return lib;
	}(lib));

	lib.table = (function (mainLib) {
		//variable declarations
		var addToAnalysis, addLineToTableTop, addLinesToTable, placeLine, lib, update;

		//variable definitions
		lib = {};
		table.hide();

		//user functions
		lib.update = function () {
			//TODO: User docs...
			run(update)();
		};

		lib.addLineToTableTop = function (line) {
			//TODO: user docs...
			run(addLineToTableTop)(line);
		};

		//local functions
		addToAnalysis = function (obj) {
			return function (evt) {
				var i, that = $(this);
				evt.preventDefault();
				that.unbind('click');
				if (analysis) {
					that.attr('class', 'btn btn-warning');
					that.html("<i class='icon-refresh icon-white'></i>");
					analysis.loadData({info: obj, callback: function () {
						var prop;
						KINOMICS.barcodes = analysis.main;
						if (obj.files) {
					console.log('here I am look at me', obj);
							for (i = 0; i < obj.files.length; i += 1) {
								currentLoaded[obj.files[i][2]] = 1;
							}
						}
						currentLoaded[obj.id] = 1;
						qcUI.fitCurvesBut.update();
						update();
						that.attr('class', 'btn btn-info');
						that.html("<i class='icon-ok icon-white'></i>");
					}});
				} else {
					that.click(addToAnalysis(obj));
					throw 'No analysis create one first please';
				}
			};
		};

		addLineToTableTop = function (line) {
			//TODO: check user input...
			table.prepend(line);
		};

		placeLine = function (tableTitle, cmpTitle) {
			if (tableTitle.split('_madeBy:')[0] < cmpTitle.split('_madeBy:')[0]) {
				return false;
			}
			return true;
		};

		addLinesToTable = function (linesObj) {
			var i, j, pushButton, tempElem, trow;

			for (i = 0; i < linesObj.objects.length; i += 1) {
				trow = $('<tr />', {'class': 'tableRow ' + linesObj['class']});

				//space
				tempElem = $('<td />').appendTo(trow);
				pushButton = $('<button />', {'class': 'btn btn-success',
					html: "<i class='icon-plus icon-white'></i>"}).click(addToAnalysis(linesObj.objects[i])).appendTo(tempElem);
				console.log(currentLoaded);
				if (analysis && (analysis.main[linesObj.objects[i].id] || currentLoaded[linesObj.objects[i].id])) {
					pushButton.attr('class', 'btn btn-info');
					pushButton.html("<i class='icon-ok icon-white'></i>");
					pushButton.unbind('click');
				}

				//File name
				$("<td />", {text: linesObj.objects[i].name}).appendTo(trow);

				//File date
				$("<td />", {html: (new Date(linesObj.objects[i].date)).toLocaleDateString()}).appendTo(trow);

				//Where loading bar would be
				$("<td />").appendTo(trow);

				//Download Button - space
				$('<td />').appendTo(trow);

			 	//Where cancel upload would be
				tempElem = $("<td />").appendTo(trow);
				$('<button />', {'class': 'btn btn-danger',
					html: "<i class='icon-trash icon-white'></i>Remove From List"}).
					appendTo(tempElem);

				table.append(trow);
			}
			table.show();
			mainLib.formControl.update();
			mainLib.navigationBar.setDataType();
		};
		update = function () {
			//variable definitions
			var obj;
			//change display elements
			table.find("tr:.tableRow").remove();
			table.hide();
			$('#defaultFile').hide();
			obj = thisDA.newDataObject();
			addLinesToTable({objects: obj.listBatches(), 'class': 'batch'});
			addLinesToTable({objects: obj.listData(), 'class': 'data'});
		};

		return lib;
	}(lib));

	return lib;
}());








/*
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

$('#subBut'+size).click(function(evt)
						{
						var that = $(this); 
						that.button('loading');
						//To keep form submission from actually occurring...
						evt.preventDefault();
						submitFileToFuse(that, updateTable(that,originalFileTabID));
						that.unbind('click');
						});














































































var fuse = KINOMICS.fusionTables;
fuse.JSON = 
	{
	access_token:"",
	userName:"",
	activeTables:new Array(),
	loggedIn:false,
	barWellColumns:['Barcode_Well','JSON','RDF','Referring Table and Row']
	},


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
	var scopes = ['https://www.googleapis.com/auth/fusiontables','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/plus.me'];
	var max_requests = 2;
	var numberOfRequests = 0;
	var requestBuffer = [];
	
	///////////////////
	//Local Functions//
	///////////////////
	
	//Main runner for all submits/grabs/queries from fusion tables - every call to google
		//runs through this function...
	
	//Changes the menu once authentication has taken place
	changeMenu = function()
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
		fuse.getRow(request, callback)
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
	
	displayFUSEtable = function(fuseFile)
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
				KINOMICS.fileManager.DA.parseFile({
					file:res.rows[0][0],
					workersfile: 'js/fileManagement/fileParseWorker.js',
					workers: KINOMICS.workers,
					barcodes: KINOMICS.barcodes,
					barcodeCreator: KINOMICS.expandBarcodeWell,
					database: {fit:false,changed:false,'dbType':'fusionTables', originFile: {file: fuseFile, rowID: ftROWID}, barcodeFiles: [{file:barWellFileID}]},
					callback: afterAddedToQC(that,fuseFile,ftROWID),
					//callback: function(x){}
					
					});
			});});
		};
	
	var afterAddedToQC = function(buttonElement,fuseFile,ftROWID)
		{
		return function()
			{
			//vars
			var columns = fuse.JSON.barWellColumns;
			var lines = [];
			var barObject = KINOMICS.barcodes;
			
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
							KINOMICS.qualityControl.UI.fitCurvesBut.update();
							}
						}
					
					//Any data that is new will be added to the table after it is fit
						// No point in adding data at this stage, doing this will just
						// make the fitting algorithm a little longer.
					//Add the data to be fit if need be
					KINOMICS.qualityControl.UI.fitCurvesBut.update();
					
					buttonElement.html("<i class='icon-ok icon-white'></i>");
					buttonElement.attr('class','btn btn-info');
					}
				});
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
	$("#fusionUpload").find(".start").unbind().click(function(evt){evt.preventDefault();$('#fileTable').find('.push').click()});
	
    }()) */