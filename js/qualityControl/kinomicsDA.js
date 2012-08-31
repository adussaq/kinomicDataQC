//'use strict';
kinomicsActiveData = {
JSON:function() 
	{
	var the = kinomicsActiveData.JSON;
	the.barcodes = new Object(); // Actual list of active barcodes with associated data
	
	//Functions to fit the data
	the.timeSeriesFunc = function( xVector, P )
		{
		//Yo + 1/[1/(k*[x-Xo])+1/Ymax]   P[0]=k, P[1]= Xo, p[2] = Ymax
		//if( xVector[0] < P[1] ) {return 0;}
		return (1/(1/(P[0]*(xVector[0]-P[1]))+1/P[2]));
		//return params[0]+1/(1/(params[1]*(xVector[0]-params[2]))+1/params[3]);
		};
	the.postWashFunc = function( xVector, params )
		{
		//Y = mx+b, params[0]=m, parmas[1]=b
		return params[0]*xVector[0]+params[1];
		};
	
	the.workersLocation = "js/qualityControl/kinomicsWorkers.js";
		
	},

};


//This series of functions call the workers in kinomicsWorkers.js
workers = {

//This sends the 'got' file to a worker for analysis
fileImporter_sendToWorker:function( fileObj, additionalObj, callback )
		{
		var the = kinomicsActiveData.JSON;
		//Create worker
		var worker = new Worker(the.workersLocation);
	
		//Add call back
		worker.addEventListener('message', function(e)
			{
			//Kill the worker
			worker.terminate();
		
			//Update active barcodes
			var result = JSON.parse(e.data);
			for (var attrname in result) 
				{
				kinomicsActiveData.JSON.barcodes[attrname] = result[attrname]; 
				kinomicsActiveData.JSON.barcodes[attrname].db = amdjs.clone(additionalObj);
				}
			
			//Update UI to allow user to begin fitting curves - removed to be more finely
			//  controlled, should be preformed by the callback
			//kinomicsImportUI.buttons.fitCurves();
			
			//Callback
			callback();
			
			},false);
	
		//Get worker started (use a function string command found at the bottom of kinomicsWorkers.js
		worker.postMessage( JSON.stringify(["getFileFromFlat",fileObj]) );
	},


//This worker imports files
fileImporter:function(fileName)
	{
	var the = kinomicsActiveData.JSON;
	//Define my non global functions
	var getFile = function( file )
		{
		$.get(file).success(function(result) {workers.fileImporter_sendToWorker(result)});
		};
	//Actually start the process
	getFile(fileName);
	},

//This take an input of any object containing any number of 'sample' objects and fits
	// them to the appropriate curve(s), curveToBeFit can be all, postWash, timeSeries
	// if it is not set, then it will be set to all.
	//Data format: sample[barcode].peptides[peptide].(timeSeries/postWash)
fitDataToCurves:function(samples, CurveToBeFit)
	{
	if( typeof CurveToBeFit == undefined || !CurveToBeFit.match(/all|timeSeries|postWash/) ){CurveToBeFit="all";}
	var the = kinomicsActiveData.JSON
	var barcodesAnalyzed = [];
	
	//Vars for running the slider bar
	var total=0, count=0, bar, percentFinished = 0;
	//Vars for running the looping to answer the functions
	var loop, currentlyOn = 0, maximumOn = 4, commands = new Array(), finished = false; 
		//max based on firefox limitation found: http://stackoverflow.com/questions/9339892/does-a-firefox-workers-limit-exist
	
		
	//Create and show the bar
	var barContainer = $('<div/>', {class:"progress progress-striped active", id: "fittingBarContainer"}).appendTo('#barSpot');
	var bar = $('<div/>', {class:"bar", style:"width: 0%", id:"bar"}).appendTo(barContainer);

	//Initialize my list of commands to run
	for( var barcode in samples )
		{
		if( the.barcodes[barcode].db.fit == true) {continue};
		barcodesAnalyzed.push(barcode);
		the.barcodes[barcode].db.fit = true
		for ( var peptide in samples[barcode].peptides )
			{
			if( CurveToBeFit == "all" )
				{
				commands.push(JSON.stringify([samples[barcode].peptides[peptide].postWash,barcode,peptide,"postWash"]));
				commands.push(JSON.stringify([samples[barcode].peptides[peptide].timeSeries,barcode,peptide,"timeSeries"]));
				}
			else if( CurveToBeFit == "postWash" )
				{
				commands.push(JSON.stringify([samples[barcode].peptides[peptide].postWash,barcode,peptide,"postWash"]));
				}
			else if( CurveToBeFit == "timeSeries" )
				{
				commands.push(JSON.stringify([samples[barcode].peptides[peptide].timeSeries,barcode,peptide,"timeSeries"]));
				}
			}
		}	
	total = commands.length;
	var lalacount = 0;
	//function that actually runs the program
	loop = function()
		{
		if( currentlyOn < maximumOn && commands.length > 0 )
			{
			currentlyOn++;
			var worker = new Worker(the.workersLocation);
			worker.addEventListener('message', function(e)
				{
				//Kill the worker
				worker.terminate();
				
				//Update the bar
				count++;
				percentFinished = Math.floor(count/total*100);
				bar.width(percentFinished+'%');
				bar.text(percentFinished+'%');
				
				//load the results into kinomics.barcodes
				var results = JSON.parse(e.data);
				
				var barcode = results.shift(), peptide = results.shift(), type = results.shift();
				var params = results[0]; var totalSSE = results[1];var R2 = results[2];
				var data = the.barcodes[barcode].peptides[peptide][type];
				
				data.parameters = params;
				data.R2 = R2;
				data.totalSqrErrors = totalSSE;
				data.wilcox = results[3];
				
				//Reset the loop
				currentlyOn--;
				loop();
				},false);
			worker.postMessage( JSON.stringify(["fitData",commands.shift()]) );
			loop();
			}
		//This means all processing is done!
		else if( commands.length == 0 && ! finished && percentFinished==100 )
			{
			finished = true;
			kinomicsImportUI.peptideTableViewer.addBarcodesToTable(barcodesAnalyzed);

			//Finalize the loading bar
			bar.width(100+'%');
			barContainer.removeClass("active").hide();
			
			//Adds data to the fusion table object - this can occur after the data has been
				//displayed, it should run in the background no problem... Just make sure
				//the save button shows up after this is done.
			fileUpload.sendBarcodesToDB(barcodesAnalyzed,fileUpload.showSaveDataButton);
			

			
			}
		}
	loop();
	
	},
	
fitDataToSingleCurve:function(command, callback, callbackArg)
	{
	var the = kinomicsActiveData.JSON
	var worker = new Worker(the.workersLocation);
	worker.addEventListener('message', function(e)
		{
		//Kill the worker
		worker.terminate();
				
		//load the results into kinomics.barcodes
		var results = JSON.parse(e.data);
		var barcode = results.shift(), peptide = results.shift(), type = results.shift();
		var params = results[0]; var totalSSE = results[1];var R2 = results[2]; 
		var data = the.barcodes[barcode].peptides[peptide][type];
				
		data.parameters = params;
		data.R2 = R2;
		data.totalSqrErrors = totalSSE;
		data.wilcox = results[3];
		
		//Call Next Function
		callback(callbackArg);
		},false);
	// command looks like this: [data,barcode,peptide,type]
	//Actually run the proccess
	worker.postMessage( JSON.stringify(["fitData",JSON.stringify(command)]) );
	},
		

};

//In order for these functions to work we have to initialize variables
kinomicsActiveData.JSON();
