/////////////////////////////////////////////////////////////////////////////////////////
// I would recommend using a text editor with collapsable tabs for viewing these...    //
// There are a lot of functions here.												   //
/////////////////////////////////////////////////////////////////////////////////////////

//My first worker, it functions to import data from different sources.
//These series of functions were written for parsing, and analyzing the kinomic data
kinomicsImportDA = {

//This holds the raw kinomics data
JSON:function() 
	{
	//Global access variables
	kinomicsImportDA.JSON.triples = new String(); // List of triples for current import
	kinomicsImportDA.JSON.barcodes = new Object(); // List of active barcodes with all associated data
	},


//Actually opens the file and begins processing - this is for original flat files
	// This is depreciated with use of new export as JSON function from Bionavigator
flatFileAnalysis:
	{
	
	/////////////////////////////////////////////////////////////////////////////////////////
	// The Global variables				                                                   //
	/////////////////////////////////////////////////////////////////////////////////////////
	
	//This holds the raw kinomics file data	
	JSON:function()
		{
		//Global access variables
		var the = kinomicsImportDA.flatFileAnalysis.JSON;
		the.file = new Object(); // Entire file string for current import
		the.bioNavVersion = new String(); // Bionavigator version for current import
		the.protocolFileName = new String(); // Protocol file name for current import
		the.dateAnalyized = new String(); // Date analysis was done for current import
		the.peptides = new Array();
		the.metadata = new Array();
		the.metaDataLocations = new Object();
		},
	
	
	/////////////////////////////////////////////////////////////////////////////////////////
	// The Main Functions   			                                                   //
	/////////////////////////////////////////////////////////////////////////////////////////
	
	//Gets rid of weird \r characters, removes all extra blanks lines, and all blank lines at
		// The end of the file. Then calls the getHeaderInfo on the split by remaining new 
		// line chars, this will get the header out and start really parsing the file
	cleanAndSplitFile:function(file)
		{
		file = file.replace(/\r/g, "\n");
		file = file.replace(/\n+$/g, "\n");
		file = file.replace( /\n\n/g, "\n" );
		file = file.replace(/\n\s+\n/g,"\n");
		kinomicsImportDA.flatFileAnalysis.getHeaderInfo(file.split('\n'));
		},	
	
	//Gets information out of the file header for parsing, reports them to the globals and
		// calls the next function on the rest of the file
	getHeaderInfo:function(lines)
		{
		//Variables
		var the = kinomicsImportDA.flatFileAnalysis.JSON; // Objects to be saved
		var func = kinomicsImportDA.flatFileAnalysis; // Function location
		var headerL, header; // For the header as a line and an array respectively
		
		//Parse the header into it's parts
		headerL = lines.shift();
		headerL = headerL.replace(/\s+$|^\s+/,"");
		headerL = headerL.replace(/\"/g,"");
		header = headerL.split(/\t|Date/); // Due to an error in the bionavigator tabulation, date is added to the parse list
		
		//Get the useful portion of the data
		the.bioNavVersion = func.findInHeader( "BioNavigator Version", header );
		the.protocolFileName = func.findInHeader( "Protocol file name", header );
		the.dateAnalyized = header.pop();
		
		//Now that the header has been removed parse the actual lines of the file
		func.splitFile(lines);
		},
	
	//Splits up and filters the lines of the file removing extra spaces at the end and
		//Beginning of lines, extracting the keys, and removing unwanted characters
		//Then it calls mapMetaData
	splitFile:function( lines )
		{
		var the = kinomicsImportDA.flatFileAnalysis.JSON; // Objects to be saved
		var func = kinomicsImportDA.flatFileAnalysis; // Function location
		var keys = new Array(); // for storing the keys of the file
		
		//Loop through the file, split it on tabs, and save the row headers as 'keys'
		for( var i = 0; i < lines.length; i++ )
			{
			//Get 'line', get rid of leading and ending spaces, and split it on tabs
			var line = lines[i].replace(/^\s+|\s+$/,"");
			var splitLine = line.split('\t');
			
			//Get the key and edit it to remove all non word characters and replace them with '_'
			var key = splitLine.shift();
			key = key.replace( /[^\w-]+/g, "_");
			key = key.replace( /[_]+/g, "_");
			key = key.replace( /[_]+$/, "");	
			keys.push(key);
			
			//Save the line as key-> array of line for later use
			the.file[key] = splitLine;
			}
		
		//Pull the peptides and the metadata based on the assumption that there will always be
			// 144 peptides + 8 standards, so the last 152 lines.
		the.peptides = keys.slice(keys.length-152, keys.length);
		the.metadata = keys.slice(0,keys.length-152);
		
		//Map the data to the final location: kinomicsImportDA.JSON.barcodes
		func.mapDataToJSON();
		},
	
	//This looks at the rows for metadata, selects which parts of it to save, and calls the 
		// functions that add the data to the final resting place: kinomicsImportDA.JSON.barcodes
	mapDataToJSON:function()
		{
		var kinomics = kinomicsImportDA.JSON; // final resting place
		var the = kinomicsImportDA.flatFileAnalysis.JSON; // Objects to be saved
		var func = kinomicsImportDA.flatFileAnalysis; // Function location
		var row = the.metaDataLocations; // The location to save metadata locations by key
		var metaToRemove, metaToRemoveStr; // To determine what metadata we do not want to save
		
		
		//The following several lines figure out the key name of various important metadata since
			// Bionavigator is less than consistant on the order of output or even the form this 
			// allows me to ignore order and capitalization.
		row.bar = func.grep(the.metadata,/\bbarcode\b/i)[0];
		row.well = func.grep(the.metadata,/\brow\b/i)[0];
		row.image = func.grep(the.metadata,/\bimage\b/i)[0];
		row.exposureTime = func.grep(the.metadata,/\bexposure/i)[0];
		row.cycleNum = func.grep(the.metadata,/\bcycle\b/i)[0];
		
		//Selects the metadata we have determined not useful to exclude
		metaToRemove = func.grep(the.metadata,/\bimage_timestamp|\barray|\bfilter|\binstrument_unit|\bgrid/i);
		metaToRemoveStr = metaToRemove.join("|");
		
		//Save the metadata regex of removal
		row.toRemove = 
		  new RegExp(row.image+"|"+row.exposureTime+"|"+row.cycleNum+"|"+metaToRemoveStr,"i");
	
		//This creates my main variable for holding data, the UID is barcode_Well
		the.file[row.bar].map( 
			function(barcode,index)
				{
				var well = the.file[row.well][index];
				var key = "barcode"+barcode+"_well"+well;
				if( typeof kinomics.barcodes[key] == 'undefined' )
					{
					//See sample function to see how this is initialized
					kinomics.barcodes[key]=new func.Sample(key);
					}
				func.addFullMetaData(key, index);
				func.addFullProtData(key, index);
				});
				
		//Once the above is done this will send the information back to the caller
		self.postMessage(JSON.stringify(kinomics.barcodes));
		},
	
	// Adds the metadata to the sample, enjoyably...
	addFullMetaData:function( uid, column )
		{
		var kinomics = kinomicsImportDA.JSON; // final resting place
		var the = kinomicsImportDA.flatFileAnalysis.JSON; // Objects to be saved
		var func = kinomicsImportDA.flatFileAnalysis; // Function location
		var sample = kinomics.barcodes[uid]; //The actual sample to be added to
		var row = the.metaDataLocations; // The location to save metadata locations by key
		
		//Store all the metadata
		for( var i in the.metadata )
			{
			var meta = the.metadata[i];
			var data = the.file[meta][column];
			if( func.checkMeta(meta) ){/*Do nothing because this metadata has been slated for removal*/}
			else 
				{
				//If it is good, make sure it has been defined
				if( typeof kinomics.barcodes[uid][meta] == 'undefined' )
					{sample[meta]= new Object();
				sample[meta][data]=0;}
				if( typeof sample[meta][data] == 'undefined' )
					{sample[meta][data]=0;}
					
				//Then add the data with count (So all variations are included if there are multiple.
				sample[meta][data]++;
				}		
			}
		
		//Keep track of the total number of reads
		sample.totalReads++;
		},
	
	//This adds all the protein data to the constant
	addFullProtData:function(uid, column)
		{
		var kinomics = kinomicsImportDA.JSON; // final resting place
		var the = kinomicsImportDA.flatFileAnalysis.JSON; // Objects to be saved
		var func = kinomicsImportDA.flatFileAnalysis; // Function location
		var sample = kinomics.barcodes[uid]; //The actual sample to be added to
		var row = the.metaDataLocations; // The location to save metadata locations by key
		var peptides = sample.peptides; // Peptides object
		
		for( var ind in the.peptides )
			{
			
			var peptide = the.peptides[ind];
			
			if( typeof peptides[peptide] == 'undefined' )
				{peptides[peptide]=new func.Peptide();}
			
			var image = the.file[row.image][column];
			var exposureT = the.file[row.exposureTime][column];
			var cycleN = the.file[row.cycleNum][column];
			var number = the.file[peptide][column];
			var TS = peptides[peptide].timeSeries;
			var PW = peptides[peptide].postWash;
			
			if( cycleN < 93 ) 
				{
				TS.image.push(image);
				TS.exposureT.push(exposureT);
				TS.cycleN.push(cycleN);
				TS.number.push(number);
				TS.goodData.push(true);
				}
			else
				{
				PW.image.push(image);
				PW.exposureT.push(exposureT);
				PW.cycleN.push(cycleN);
				PW.number.push(number);
				PW.goodData.push(true);
				}
			}
		},
	
	
	/////////////////////////////////////////////////////////////////////////////////////////
	// The Object Definitions			                                                   //
	/////////////////////////////////////////////////////////////////////////////////////////
	
	//The nature of the sample here initializes it to the important metadata and protein locations
	Sample:function()
		{
		var the = kinomicsImportDA.flatFileAnalysis.JSON; // Objects to be saved
		
		//Initialize some global metadata
		this.bioNavVersion = new Object();
		this.protocolFileName = new Object();
		this.dateAnalyized = new Object();
		this.bioNavVersion[the.bioNavVersion] = 1;
		this.protocolFileName[the.protocolFileName]=1;
		this.dateAnalyized[the.dateAnalyized]=1;
		this.totalReads = 0;
		
		//Initialize General protein terms
		this.peptides = new Object();
		},
	
	Peptide:function()
		{
		var the = kinomicsImportDA.flatFileAnalysis.JSON; // Objects to be saved
		
		//Initialize the major holders
		this.timeSeries = new Object();
		this.postWash = new Object();
		
		//Initialize the data holders for timeSeries
		var TS = this.timeSeries;
		TS.cycleN = new Array();
		TS.image = new Array();
		TS.exposureT = new Array();
		TS.number = new Array();
		TS.goodData = new Array();
		
		//Do the same for post wash
		var PW = this.postWash;
		PW.cycleN = new Array();
		PW.image = new Array();
		PW.exposureT = new Array();
		PW.number = new Array();
		PW.goodData = new Array();
		},
	
	/////////////////////////////////////////////////////////////////////////////////////////
	// The Secondary Functions			                                                   //
	/////////////////////////////////////////////////////////////////////////////////////////
	
	//This function removes unwanted variables from the data storage
	checkMeta:function(meta)
		{
		var the = kinomicsImportDA.flatFileAnalysis.JSON; // Objects to be saved
		var row = the.metaDataLocations; // The location to save metadata locations by key
		if( meta.match(row.toRemove)){return 1;}
		else{return 0;}
		},
	
	// This function simple returns the of the string, 'search' as found in the array 'text'
	findInHeader:function( text, search )
		{
		var ind = search.indexOf(text);
		return search[ind+1];
		},
	grep:function( arr, regExp )
		{
		var results = new Array();
		arr.map( function(val){
			if(val.match(regExp)){
				results.push(val);
				} 
			});
		return results;
		}
	
	},	

fitData:function(data)
	{
	var plot = data.shift(), barcode= data.shift(), peptide=data.shift(), type= data.shift();

	var xIni = new Array();
	var yIni = new Array();
	var iIni = new Array();
	var func, params;
	
	//Handle the two types of functions that are called into here
	if( type == "postWash" )
		{
		xIni = plot.exposureT;
		yIni = plot.number;
		iIni = plot.goodData;
		func = kinomicsActiveData.JSON.postWashFunc;
		var Xmax = amdjs.Arr_max(xIni);
		var Xmin = amdjs.Arr_min(xIni);
		var Ymax = amdjs.Arr_max(yIni);
		var Ymin = amdjs.Arr_min(yIni);
		// y=mx+b
		params= [Ymin/Xmin,10];
		}
	else if( type == "timeSeries" )
		{
		xIni = plot.cycleN;
		yIni = plot.number;
		iIni = plot.goodData;
		func = kinomicsActiveData.JSON.timeSeriesFunc;
		var Xmax = amdjs.Arr_max(xIni);
		var Xmin = amdjs.Arr_min(xIni);
		var Ymax = amdjs.Arr_max(yIni);
		var Ymin = amdjs.Arr_min(yIni);
		//P[0] = Yo P[1]=k, P[2]= Xo, p[3] = Ymax
		params =  [-10, Ymin/32, -10, 3500];
		}
	else{return;}

	//Save the final data
	var x1 = new Array();
	var y1 = new Array();
	
	//break data into usable chunks
	for( var i=0; i< xIni.length; i++ )	
		{
		var x = xIni[i];
		var y = yIni[i];
		if( iIni[i] )
			{
			y1.push(Number(y));
			//Remember x has to be a matrix, not a vector
			x1.push([Number(x)]);
			}
		}
	
	var results = amdjs.fmincon(func,params,x1,y1);
	
	//Parse and post results
	results = [barcode, peptide,type].concat(results);
	self.postMessage(JSON.stringify(results));
	}

};


//In order for any of these globals to work I have to initialize them here
kinomicsImportDA.JSON();
kinomicsImportDA.flatFileAnalysis.JSON(); //Depreciated

self.addEventListener('message', function(e) 
	{
	var myMessage = JSON.parse(e.data);
	var myFunc = myMessage.shift();
	var myData = myMessage.shift();
	
	//This is a call to convert as a flat file
	if( myFunc == "getFileFromFlat" ) 
		{kinomicsImportDA.flatFileAnalysis.cleanAndSplitFile(myData);}
	
	//This is a call to fit the data to curves
	if( myFunc == "fitData" ) 
		{
		importScripts("amdjs.js");
		importScripts("kinomicsDA.js");
		kinomicsImportDA.fitData(JSON.parse(myData));
		}
	}, false);