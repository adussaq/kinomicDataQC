//'use strict';
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
	kinomicsImportDA.JSON.triples = ""; // List of triples for current import
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
		the.bioNavVersion = ""; // Bionavigator version for current import
		the.protocolFileName = ""; // Protocol file name for current import
		the.dateAnalyized = ""; // Date analysis was done for current import
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
		//get rid of quotation marks to help prevent downstream errors
		file = file.replace(/"|'/g,"");
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
		var max_variations = 8;
		if( Ymin == 0 ) {Ymin=10;}
		// y=mx+b
		params= [Ymin/Xmin,10];
		}
	else if( type == "timeSeries" )
		{
		xIni = plot.cycleN;
		yIni = plot.number;
		iIni = plot.goodData;
		func = kinomicsActiveData.JSON.timeSeriesFunc;		
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
	
	if( type == "timeSeries" )
		{
		var Xmax = amdjs.Arr_max(x1);
		var Ymax = amdjs.Arr_max(y1);
		var Ymin = amdjs.Arr_min(y1);
		//P[0] = Yo P[1]=k, P[2]= Xo, p[3] = Ymax
		var x1s = amdjs.clone(x1);
		x1s=x1s.sort();
		
		var xx0 =x1s.shift();
		var xxN = x1s.pop();
		//Because it is an array of arrays
		xx0=xx0[0];xxN=xxN[0];
		var yy0 =Number(yIni[xIni.indexOf(JSON.stringify(xx0))]);
		var yyN =Number(yIni[xIni.indexOf(JSON.stringify(xxN))]);
		var Ym, vi, c;
		
		//Deal with overall negative values
		if( (yyN-yy0)/(xxN-xx0) < 0 )
			{
			Ym=Ymin;
			}
		else
			{
			Ym=Ymax;
			}
		vi=Ym/5;
		c = Ymax*yy0/(vi*(Ymin-Ymax))+xx0;
		params =  [vi, c, Ym];
		}

	//Actually fit the line
	var result = amdjs.fmincon(func,params,x1,y1);
	
	//Since the time series does not tend to fit well the below fixes that, this is only
		//preformed if the wilcox test has a poor result
	if( type == "timeSeries" && result[3]<0.4 )
		{
		var results = new Array();
		results[0] = result;
		//Vary the starting conditions to find better fit
		/*
		for( var ln = 0; ln < max_variations; ln++ )
			{
			var params2 = amdjs.clone(params);
			for ( var ind in params2 )
				{
				params2[ind] = params2[ind] + 1.9*(Math.random()-.5)*params2[ind];
				}
			results[ln+1]=amdjs.fmincon(func,params2,x1,y1);
			}*/
	
		var x2 = amdjs.clone(x1);
		var y2 = amdjs.clone(y1);
		var xi, yi;
		//Remove each point, get new fit and test it
		for( var point = 0; point<x1.length; point++ )
			{
			//Remove the first point
			xi = x2.shift();
			yi = y2.shift();
			
			//Fit the functions
			var res = amdjs.fmincon(func,results[0],x2,y2);
			
			//Fit the original with the starting conditions from above
			res[1] = amdjs.sqrSumOfErrors(func, x1, y1, res[0] );
			results[point+1]=res;
			
			//To make this as quick as possible if we get an R^2>.995  
				// or a poor mans test > 0.6 stop doing this
			if( res[2]>=0.995 || res[3]>=0.6 )
				{
				break;
				}
			
			//Add the point back to the arrays
			x2.push(xi);
			y2.push(yi);
			
			}

		//This determines the best result
		for( var ln = 0; ln < max_variations; ln++ )
			{
			if( results[ln+1][1]<result[1] )
				{
				result = results[ln+1];
				}
			}
			
		// As a final step run the fit one last time to fix any slight alterations that 
		// need to take place
		result = amdjs.fmincon(func,result[0],x1,y1);
		
		}
	
	
	//Parse and post results
	result = [barcode, peptide,type].concat(result);
	self.postMessage(JSON.stringify(result));
	}

};

//A copy of essential amdjs_1.0 functions for these routines
amdjs = {

// function for the calculation of error
sqrSumOfErrors:function(fun, X, y, x0)
		{
		var error = 0;
		for( var i in X )
			{
			error += Math.pow(fun(X[i], x0)-y[i],2);
			}
		return error;
		},
//My attempt at curve fitting. Should be generalizable to multiple x dimensions, although
	// I have not done significant testing.
fmincon:function(fun, x0, X, y, options)
	{
	//Options must be entered as an object
	// Very loosely based on fmincon:function(fun,x0,A,b,Aeq,beq,lb,ub,nonlcon,options)
		// from matlab


	// Used to calculate total deviations squared from the mean
	var sqrSumOfDeviations = function(y)
		{
		var error = 0;
		var avg = amdjs.Arr_avg(y);
		for( var i in X )
			{
			error += Math.pow(avg-y[i],2);
			}
		return error;
		};
	
	
	//Set the options
	var options = new Object();
	options.step = x0.map(function(s){return s/100;})
	options.maxItt = 1000;	
	options.minPer = 1e-6;
	
	var lastItter = Infinity;
	var count = 0;
		
	for( itt = 0; itt<options.maxItt; itt++ )
		{
		var x1 = amdjs.clone(x0)
		for( parI in x1 )
			{
			x1[parI]+=options.step[parI];
			if( amdjs.sqrSumOfErrors(fun, X,y,x1)<amdjs.sqrSumOfErrors(fun, X,y,x0) )
				{
				x0[parI]=x1[parI];
				options.step[parI]*=1.2;
				}
			else
				{
				options.step[parI]*=-0.5;
				}
			} 
		var sse = amdjs.sqrSumOfErrors(fun, X,y,x0);
		
		//barcode631030102_well1 10_1_RB_804_816
		//make it so it checks every 3 rotations for end case
		if( count > 3 )
			{
			if( Math.abs( 1- sse/lastItter )< options.minPer )
				{
				break;
				}
			lastItter = sse;
			count = -1;
			}
		count++;

		}

	
	//I added the following 'R^2' like calculation. It is not included in fmincon, but
		// is useful for my needs.
		var SSDTot = sqrSumOfDeviations(y);
		var SSETot = amdjs.sqrSumOfErrors(fun, X, y, x0);
		var corrIsh = 1-SSETot/SSDTot;
	
	//I also added a wilcox test to this so we can determine the goodness of fit in 
		// another manner	
	var yCMP = new Array();
	X.map(function(xVal){return yCMP.push(fun(xVal,x0))});
	var WilcoxTest = amdjs.lookAtRes(y,yCMP);
	var SSETot = amdjs.sqrSumOfErrors(fun, X, y, x0);
	return [amdjs.clone(x0), SSETot,corrIsh, WilcoxTest];
	},

lookAtRes:function( arr1, arr2 )
	{
	var val=0;
	var res1 = new Array();
	for( var ind in arr1 ) {res1[ind] = arr1[ind]-arr2[ind];}
	var res2 = amdjs.clone(res1);
	res2.shift();
	for( var ind in res2 )
		{
		if( res2[ind]*res1[ind] > 0 ){val++}
		}
	return 1-val/arr2.length;
	},

//Minimum of an array
Arr_min:function(A)
	{
	return Math.min.apply(null, A)
	},

//Maximum of an array
Arr_max:function(A)
	{
	return Math.max.apply(null, A)
	},

//Finds the sum of an array
sum:function(x)
	{ //Stole this one from Jonas :-)
	if(Array.isArray(x[0])){return x.map(function(xi){return jmat.sum(xi)})}
	else{return x.reduce(function(a,b){return a+b})};
	},

//clone object without functional elements
clone:function(x)
	{ 
	return JSON.parse(JSON.stringify(x))
	},
	
//Average an array
Arr_avg:function(A)
	{ 
	return amdjs.sum(A)/A.length;
	}

};

//A copy of essential variables/equations
kinomicsActiveData = {
JSON:function() 
	{
	var the = kinomicsActiveData.JSON;
	
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
		}	
	}

};


//In order for any of these globals to work I have to initialize them here
kinomicsImportDA.JSON();
kinomicsActiveData.JSON();
kinomicsImportDA.flatFileAnalysis.JSON(); //Depreciated

self.addEventListener('message', function(e) 
	{
	var myMessage = JSON.parse(e.data);
	var myFunc = myMessage.shift();
	var myData = myMessage.shift();
	
	//This is a call to convert as a flat file
	if( myFunc == "getFileFromFlat" ) 
		{
		kinomicsImportDA.flatFileAnalysis.cleanAndSplitFile(myData);
		}
	
	//This is a call to fit the data to curves
	if( myFunc == "fitData" ) 
		{
// 		importScripts("kinomicsDA.js");
		kinomicsImportDA.fitData(JSON.parse(myData));
		}
	}, false);
	
