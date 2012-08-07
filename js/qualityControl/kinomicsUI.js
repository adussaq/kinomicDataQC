//'use strict';

//This series of functions was written to display and allow analysis of basic kinomic data
	// ie the time series and end level basic fluorescence of median well-background
	// My hope is that it is used as the framework for downstream UI as well.
	// Many of these functions require amdjs.js
kinomicsImportUI = {



//This defines the major portions of my page
setUpPage:function()
	{
	var func = kinomicsImportUI.peptideTableViewer;
	//This is the top portion of the page contain buttons and the loading bar
	$('<div/>',{class:"container",id:"top"}).appendTo('#qualtityControl');
	
	//This contains the buttons themselves
	$('<div/>',{class:"span5",id:"buttons"}).appendTo('#top');
	
	//The place for the bar
	$('<div/>', {class:"3 offset 1", id: "barSpot"}).appendTo($('#top'));
	
	//The place for the table, figures, and figure info
	$('<div/>', {class:"container", id:"superDiv"}).appendTo('#qualtityControl');
	$('<div/>', {id:'mainDiv',class:"row"}).appendTo('#superDiv');
	$('<div/>', {id:'peptideList',class:"span5"}).appendTo('#mainDiv');
	$('<div/>', {id:'infoAndInteraction',class:"span3"}).appendTo('#mainDiv');
	$('<div/>', {id:'slideBar',class:"span3"}).appendTo('#infoAndInteraction');
	$('<h4/>',{id:"figHeader"}).appendTo('#infoAndInteraction');
	$('<div/>', {id:'figure1Info',class:"span3"}).appendTo('#infoAndInteraction');
	$('<div/>', {id:'figure2Info',class:"span3"}).appendTo('#infoAndInteraction');
	$('<div/>', {id:'figurePageTurn',class:"span3"}).appendTo('#infoAndInteraction');
	$('<div/>', {id:'figures',class:"span4"}).appendTo('#mainDiv');
	
	//Add the figure paces and the header for the place
	$('<div/>', {id: 'chart1',style:"width:385px;height:237px;"}).appendTo('#figures');
	$('<div/>', {id: 'chart2',style:"width:385px;height:237px;"}).appendTo('#figures');
	
	//Add the next peptide buttons...
	$('<div/>',{ class:"pagination", id: "pepTurn"}).appendTo('#figurePageTurn');
	$('#pepTurn').hide();
	$('<li/>',{ html: "<a><b><i class = 'icon-arrow-left'></i> Prev</b></a>"}).click(function(){func.movePrev()}).appendTo('#pepTurn'); // This is the icon as defined by twitter bootstrap
	$('<li/>',{ html: "<a><b>Next <i class = 'icon-arrow-right'></i></b></a>"}).click(function(){func.moveNext()}).appendTo('#pepTurn'); // This is the icon as defined by twitter bootstrap
	
	
	//Initilize by adding the first button!
	kinomicsImportUI.buttons.importFile();
	
	},

buttons: 
	{	
	//This function loads the first button
	importFile:function()
		{
		var but = $( '<button/>', {
		class:'btn',
		id: "importFileButton",
		'data-loading-text':'Importing',
		'data-complete-text':'File Imported and Parsed',
		text:'Import File',
		});
		but.click(function()
			{
			//For testing
			var tempfile = "Export_2rawGBM.txt";
			$('#importFileButton').button('loading');
			workers.fileImporter(tempfile);
			});
		but.appendTo('#buttons');
		},
	
	//This function is called at the end of the previous buttons processes.
	fitCurves:function()
		{
		//Reset old button
		$('#importFileButton').button('complete');
		$('#importFileButton').unbind();
		
		//Create new button
		var but = $( '<button/>', {
		class:'btn',
		id: "fitCurves",
		'data-loading-text':'Fitting Data, this may take a while',
		'data-complete-text':'Curves have been fitted',
		text:'Fit Curves',
		});
		//Give it functionality
		but.click(function()
			{
			//For testing
			$('#fitCurves').button('loading');
			workers.fitDataToCurves(kinomicsActiveData.JSON.barcodes, "all");
			});
		but.appendTo('#buttons');
		}
	},
	
addSlideBar:function()
	{
	var the = kinomicsImportUI.peptideTableViewer.JSON;
	var func = kinomicsImportUI.peptideTableViewer;
		
	$('<div/>', {class:"sliderbar", id: "sliderbar", style:"text-align:right"}).appendTo('#slideBar');
	$('<div/>', {id:"Number", html: "Cutoff: " + amdjs.doMathSrc("R^2=0.80"), style:"text-align:right"}).appendTo('#slideBar');
	
	$(function(){$("#sliderbar").noUiSlider("init", 
		{ dontActivate: "lower", startMax: 0.8, scale: [0, 1],
		tracker: function()
			{
			var val = $("#sliderbar").noUiSlider("getValue");
			$('#Number').html("Cutoff: " + amdjs.doMathSrc("R^2="+(Math.round(val*100)/100).toFixed(2)));
			if(typeof the.currentBar != undefined){ func.printPeptides()};
			},
		clickmove: function()
			{
			var val = $("#sliderbar").noUiSlider("getValue");
			$('#Number').html("Cutoff: " + amdjs.doMathSrc("R^2="+(Math.round(val*100)/100).toFixed(2)));
			if(typeof the.currentBar != undefined){ func.printPeptides()};
			},
		});});
	},

startTable:function()
	{
	var the = kinomicsImportUI.barcodeTableViewer.JSON; // For global variables
	var funcBar = kinomicsImportUI.barcodeTableViewer;
	var funcPep = kinomicsImportUI.peptideTableViewer;
	the();
	
	$('#fitCurves').button('complete');
	$('#fitCurves').unbind();
	//loadButton3(); - for triples when I get there...
		
	//Add sliderbar for setting R^2 to the cutoff point
	kinomicsImportUI.addSlideBar();
	
	//Build the table
	$('<table/>', {class:"table table-striped table-bordered", id:'barcodes' }).appendTo('#peptideList');
	$('<col/>', {style: "width:30%"}).appendTo('#barcodes');
		
	//Add the header
	$('<tr/>',{id:'trhead',width:"190"}).appendTo('#barcodes');
	$('<th/>',{id:'tdbars',text:"UIDs"}).appendTo('#trhead');
	$('<th/>',{id:'theadPep',text:""}).appendTo('#trhead');
	
	//Add the rows
	for( var i = 0; i<the.idsPerPage; i++ )
		{
		$('<tr/>',{id:'tr'+i}).appendTo('#barcodes');
		
		//Barcode Side
		$('<td/>',{id:'td'+i}).appendTo('#tr'+i);
		$('#td'+i).text("");
		$('#td'+i).html("&nbsp;");
		$('#td'+i).click(function(){console.log("Not set up")});
		
		//Peptide Side
		$('<td/>',{id:'tdpep'+i, }).appendTo('#tr'+i);
		$('#tdpep'+i).text("");
		$('#tdpep'+i).html("&nbsp;");
		$('#tdpep'+i).click(function(){console.log("Not set up")});
		}
	
	//Add the pagination portions
	$('<tr/>',{id:'trpages',width:"190"}).appendTo('#barcodes');
	$('<td/>',{id:'tdpages'}).appendTo('#trpages');
	
	//Barcode
	$('<div/>',{width:"190", class:"pagination", id: "peptidePages"}).appendTo('#tdpages');
	$('<li/>',{ id: "idPrev"}).appendTo('#peptidePages');
	$('<a/>',{ id:"idaprev"} ).click(function(){funcBar.moveLeft()}).appendTo('#idPrev');
	$('<i/>', { class:"icon-arrow-left"}).appendTo('#idaprev'); // This is the icon as defined by twitter bootstrap
	$('<li/>',{ id: "pageNum"}).appendTo('#peptidePages');
	$('<a/>',{id:"idPageA",text:"Page 1/1"}).appendTo('#pageNum');
	$('<li/>',{ id: "idNext"}).appendTo('#peptidePages'); // This is the icon as defined by twitter bootstrap
	$('<a/>',{id:"idanext"} ).click(function(){funcBar.moveRight()}).appendTo('#idNext');
	$('<i/>', { class:"icon-arrow-right"}).appendTo('#idanext');
	
	//Peptides
	$('<td/>',{id:'tdpeppages'}).appendTo('#trpages');
	$('<div/>',{width:"190", class:"pagination", id: "peppeptidePages"}).appendTo('#tdpeppages');
	$('<li/>',{ id: "pepPrev"}).appendTo('#peppeptidePages');
	$('<a/>',{id:"pepaprev"}).click(function(){funcPep.moveLeft()}).appendTo('#pepPrev');
	$('<i/>', { class:"icon-arrow-left"}).appendTo('#pepaprev');
	$('<li/>',{ id: "peppageNum"}).appendTo('#peppeptidePages');
	$('<a/>',{id:"pepPageA",text:"Page 1/1"}).appendTo('#peppageNum');
	$('<li/>',{ id: "pepNext"}).appendTo('#peppeptidePages');
	$('<a/>',{id:"pepanext"} ).click(function(){funcPep.moveRight()}).appendTo('#pepNext');
	$('<i/>', { class:"icon-arrow-right"}).appendTo('#pepanext');
	
	//Begin adding the actual information
	funcBar.showTable();
	
	},

barcodeTableViewer:
	{
	JSON:function()
		{
		var the = kinomicsImportUI.barcodeTableViewer.JSON;
		the.barcodes = new Array();
		the.idsPerPage = 10;
		the.tableStop = 0;
		the.pageStop = 1;
		the.cPage = 1;
		kinomicsImportUI.peptideTableViewer.JSON.cPage = 1; //Here for the peptide table, only needs to be set once.
		},
		
	showTable:function()
		{
		var the = kinomicsImportUI.barcodeTableViewer.JSON; // The location of the global constants
		var func = kinomicsImportUI.barcodeTableViewer;
		
		//Set up the variables
		func.JSON();
		
		//Add all currently active barcodes to the table
		for( var i in kinomicsActiveData.JSON.barcodes ){the.barcodes.push(i)}
		the.barcodes = the.barcodes.sort();
		the.tableStop = the.barcodes.length;
		the.pageStop = Math.ceil(the.tableStop/the.idsPerPage);
		
		//Upadate barcode pages
		func.updatePageNum();
		
		//Put information in the rows
		func.printBarcodes();
		
		},

	updatePageNum:function()
		{
		var the = kinomicsImportUI.barcodeTableViewer.JSON;
		$('#idPageA').text("Page "+the.cPage+'/'+the.pageStop);
		},
		
	printBarcodes:function()
		{
		var the = kinomicsImportUI.barcodeTableViewer.JSON; // The location of the global constants
		var func = kinomicsImportUI.peptideTableViewer;
		var startPlace = (the.cPage-1)*the.idsPerPage;
		for( var i = 0; i<the.idsPerPage; i++ )
			{
			if(startPlace+i<the.tableStop)
				{
				$('#td'+i).unbind('click');
				var cBar = amdjs.clone(the.barcodes[startPlace+i]);
				if( cBar == func.JSON.currentBar )
					{
					$('#td'+i).html("<b>"+cBar+"</b>");
					}
				else
					{
					$('#td'+i).html(cBar);
					}
				$('#td'+i).val([cBar,startPlace+i]);	
				$('#td'+i).click( function() {func.showTable($(this).val());kinomicsImportUI.barcodeTableViewer.printBarcodes()} );
				}
			else
				{
				$('#td'+i).unbind('click');
				$('#td'+i).text("");
				$('#td'+i).html("&nbsp;");
				}
			}
		},
	
	moveRight:function()
		{
		var the = kinomicsImportUI.barcodeTableViewer.JSON; // The location of the global constants
		var func = kinomicsImportUI.barcodeTableViewer; // Location of the functions to be called
		
		//Update the page
		if( the.cPage == the.pageStop ) {return}
		the.cPage++;
		func.printBarcodes();
		func.updatePageNum();
		},
		
	moveLeft:function()
		{
		var the = kinomicsImportUI.barcodeTableViewer.JSON; // The location of the global constants
		var func = kinomicsImportUI.barcodeTableViewer; // Location of the functions to be called
		
		//Update the current page
		if( the.cPage == 1 ) {return}
		the.cPage--;
		func.printBarcodes();
		func.updatePageNum();
		},
	},
	
peptideTableViewer:
	{
	JSON:function()
		{
		var the = kinomicsImportUI.peptideTableViewer.JSON;
		the.peptides = new Array();
		the.currentBar = "";
		the.currentBarInd = 0;
		the.idsPerPage = kinomicsImportUI.barcodeTableViewer.JSON.idsPerPage;
		the.tableStop = 0;
		the.pageStop = 0;
		the.currentInd = 0;
		},
	
	showTable:function(barcode)
		{
		var the = kinomicsImportUI.peptideTableViewer.JSON; // The location of the global constants
		var func = kinomicsImportUI.peptideTableViewer;
		
		//initialize/reset the variables
		func.JSON();
		
		//Set the variables
		the.currentBarInd = barcode[1];
		barcode = barcode[0];
		the.currentBar = barcode;
		for( var i in kinomicsActiveData.JSON.barcodes[barcode].peptides ){the.peptides.push(i)}
		the.peptides = the.peptides.sort();
		the.tableStop = the.peptides.length;
		the.pageStop = Math.ceil(the.tableStop/the.idsPerPage);
		

		
		//If a figure already exists update it for the new barcode	
		if( typeof kinomicsImportUI.figureCreation.JSON.figureHere != undefined 
				&& kinomicsImportUI.figureCreation.JSON.figureHere == true )
			{
			kinomicsImportUI.figureCreation.createFigures(kinomicsImportUI.figureCreation.JSON.currentPeptide);
			}
		
		//Set the header
		$('#theadPep').text(barcode);
	
		//Print the peptides and update the page number at the bottom
		func.updatePageNum();
		func.printPeptides();
		},
	
	updatePageNum:function()
		{
		var the = kinomicsImportUI.peptideTableViewer.JSON;
		$('#pepPageA').text("Page "+the.cPage+'/'+the.pageStop);
		},
	
	printPeptides:function()
		{
		var the = kinomicsImportUI.peptideTableViewer.JSON;
		var func = kinomicsImportUI.figureCreation;
		var barcode = the.currentBar;
		var startPlace = (the.cPage-1)*the.idsPerPage;
		var pepList = kinomicsActiveData.JSON.barcodes[barcode].peptides;
		
		for( var i = 0; i<the.idsPerPage; i++ )
			{
			if(startPlace+i<the.tableStop)
				{
				//Get R^2 and cmp value from sliderbar
				var r2 = pepList[the.peptides[startPlace+i]].timeSeries.R2;
				var r2_2 = pepList[the.peptides[startPlace+i]].postWash.R2;
				r2 = Math.round(r2*1000)/1000;
				var cmp = Math.round($("#sliderbar").noUiSlider("getValue")*100)/100;
				var cPep = the.peptides[startPlace+i];
				
				//Add name
				if( cPep == func.JSON.currentPeptide )
					{
					$('#tdpep'+i).html("<b>"+cPep+ " " +"</b>");
					}
				else
					{
					$('#tdpep'+i).html(cPep+ " ");
					}
				
				$('#tdpep'+i).val([cPep,startPlace+i]);
				
				//Add flag if needed
				if( r2 < cmp || r2_2 < cmp )
					{
					$('<i/>', { class:" icon-exclamation-sign"}).appendTo('#tdpep'+i);
					}
				$('#tdpep'+i).unbind('click');
 				$('#tdpep'+i).click(function()
 					{
 					func.createFigures( $(this).val()[0] );
 					kinomicsImportUI.peptideTableViewer.printPeptides();
 					the.currentInd = $(this).val()[1];
 					} );
				}
			else
				{
				$('#tdpep'+i).text("");
				$('#tdpep'+i).html("&nbsp;");
				$('#tdpep'+i).attr("onclick","");
				}
			}
		},
	
	moveRight:function()
		{
		var the = kinomicsImportUI.peptideTableViewer.JSON;
		var func = kinomicsImportUI.peptideTableViewer;
		if( the.cPage == the.pageStop ) {return}
		the.cPage++;
		func.printPeptides();
		func.updatePageNum();
		},
		
	moveLeft:function()
		{
		var the = kinomicsImportUI.peptideTableViewer.JSON;
		var func = kinomicsImportUI.peptideTableViewer;
		if( the.cPage == 1 ) {return}
		the.cPage--;
		func.printPeptides();
		func.updatePageNum();
		},
		
	moveNext:function()
		{
		var the = kinomicsImportUI.peptideTableViewer.JSON;
		var theBar = kinomicsImportUI.barcodeTableViewer.JSON;
		var func = kinomicsImportUI.peptideTableViewer;
		var funcBar = kinomicsImportUI.barcodeTableViewer;
		var startPlace = (the.cPage-1)*the.idsPerPage;
		var cTabLoc = the.currentInd-startPlace;
		the.currentInd++;
		
		//If we are on the last peptide move to the next barcode peptide 1
		if( the.currentInd >= the.peptides.length )
			{
			the.currentBarInd++;
			//Make sure we are not already at the last barcode
			if( the.currentBarInd < theBar.barcodes.length )
				{
				the.currentInd = 0;
				the.currentBar = theBar.barcodes[the.currentBarInd];
				
				//If we are not on the correct page move back to it
				theBar.cPage = Math.floor(the.currentBarInd/10)+1;
				
				//Make sure we are not on a new page, if we are update
				var startBarPlace = (theBar.cPage-1)*theBar.idsPerPage;
				var cBarTabLoc = the.currentBarInd-startBarPlace;
				if( cBarTabLoc >= 9 )
					{
					funcBar.moveRight();
					}
				
				//Update the variables
				var startBarPlace = (theBar.cPage-1)*theBar.idsPerPage;
				var cBarTabLoc = the.currentBarInd-startBarPlace;
				
				//Do the final print
				funcBar.printBarcodes();
				funcBar.updatePageNum();
				$('td'+cBarTabLoc).click();
				$('#theadPep').text(the.currentBar);
				}
			else 
				{
				the.currentBarInd--; 
				the.currentInd--;
				return; 
				}
			}
		
		//If we are at the end of a page move to the next page
		if(cTabLoc >= 9)
			{
			func.moveRight();
			//Update the variables, new page so new cTabLoc
			}
		
		//If we are not on the correct page move back to it
		the.cPage = Math.floor(the.currentInd/10)+1;
		func.printPeptides();
		func.updatePageNum();
		//Update the variables
		startPlace = (the.cPage-1)*the.idsPerPage;
		cTabLoc = the.currentInd-startPlace;
		
		
			
		//Now that we are in the right place click the right link
		var cLoc = cTabLoc;
		$('#tdpep'+cLoc).click();
		},
	
	movePrev:function()
		{
		var the = kinomicsImportUI.peptideTableViewer.JSON;
		var theBar = kinomicsImportUI.barcodeTableViewer.JSON;
		var func = kinomicsImportUI.peptideTableViewer;
		var funcBar = kinomicsImportUI.barcodeTableViewer;
		var startPlace = (the.cPage-1)*the.idsPerPage;
		var cTabLoc = the.currentInd-startPlace;
		the.currentInd--;
		
		//If we are on the first peptide move to the next barcode peptide 1
		if( the.currentInd < 1 )
			{
			the.currentBarInd--;
			//Make sure we are not already at the first barcode
			if( the.currentBarInd > 0 )
				{
				the.currentInd = the.peptides.length-1;
				the.currentBar = theBar.barcodes[the.currentBarInd];
				
				//If we are not on the correct page move back to it
				theBar.cPage = Math.floor(the.currentBarInd/10)+1;
				
				//Make sure we are not on a new page, if we are update
				var startBarPlace = (theBar.cPage-1)*theBar.idsPerPage;
				var cBarTabLoc = the.currentBarInd-startBarPlace;
				
				if( cBarTabLoc < 1 )
					{
					funcBar.moveLeft();
					}
				
				//Update the variables
				var startBarPlace = (theBar.cPage-1)*theBar.idsPerPage;
				var cBarTabLoc = the.currentBarInd-startBarPlace;
				
				//Do the final print
				funcBar.printBarcodes();
				funcBar.updatePageNum();
				$('td'+cBarTabLoc).click();
				$('#theadPep').text(the.currentBar);
				}
			else 
				{
				the.currentBarInd++; 
				console.log("It Worked, we are at the end!");return; 
				}
			}
		
		//If we are not on the correct page move back to it
		the.cPage = Math.floor(the.currentInd/10)+1;
		
		//If we are at the beginning of a page move to the previous page
		
		//Update the table
		func.printPeptides();
		func.updatePageNum();
		
		//Update the variables
		startPlace = (the.cPage-1)*the.idsPerPage;
		cTabLoc = the.currentInd-startPlace;
			
		//Now that we are in the right place click the right link
		var cLoc = cTabLoc;
		$('#tdpep'+cLoc).click();
		
		console.log("Prev")
		},
	
	},

figureCreation:
	{
	JSON:function()
		{
		var the = kinomicsImportUI.figureCreation.JSON;
		the.currentBarcode = kinomicsImportUI.peptideTableViewer.JSON.currentBar;
		the.currentPeptide = "";
		the.figureHere = false;
		},
		
	createFigures:function(peptide)
		{
		//Set variables
		var the = kinomicsImportUI.figureCreation.JSON;
		var func = kinomicsImportUI.figureCreation;
		the();
		the.figureHere = true;
		the.currentPeptide = peptide;
		
		//Change header
		$('#figHeader').text(the.currentBarcode +" "+the.currentPeptide);
	
		func.makeTimeSeriesFigure();			
		func.makePostWashFigure();
		$('#pepTurn').show();
		},
	
	makeTimeSeriesFigure:function()
		{
		
		var the = kinomicsImportUI.figureCreation.JSON;
		var func = kinomicsImportUI.figureCreation;
		var plot = new Array(["cycle","read","removed","fit"],
							 [-10,-10,-10,-10]);
		var TS = kinomicsActiveData.JSON.barcodes[the.currentBarcode].peptides[the.currentPeptide].timeSeries;
		var params = TS.parameters;
		var eq = kinomicsActiveData.JSON.timeSeriesFunc;
		
		
		//break data into usable chunks - time series
		for( var i=0; i< TS.cycleN.length; i++ )	
			{
			var cycle = TS.cycleN[i];
			var y = TS.number[i];
			var include = TS.goodData[i];
			if( include )
				{
				plot.push([Number(cycle),Number(y),null,null]);
				}
			else
				{
				plot.push([Number(cycle),null,Number(y),null]);
				}
			}
		
		//Add the fit data
		for( var xVal = 0; xVal< 96; xVal+=.5 )
			{
			plot.push([xVal,null,null,eq([xVal],params)]);
			}
		
		var data = google.visualization.arrayToDataTable(plot);
		
		var options = 
	        {
	        title: "Time Series",
	        hAxis: {title: plot[0][0],
	        		viewWindowMode:'explicit',viewWindow:{max:100,min:30}},
	        vAxis: {title: plot[0][1]},
	        legend: 'none',
	        seriesType: "scatter",
	        series: {2: {type: "line", enableInteractivity:false}}
	    	}
		
		//Actual data to be listed
	    var r2 = TS.R2;
	    var indent = "&nbsp;&nbsp;&nbsp;&nbsp;";
	    $('#figure1Info').empty();
	    $('#figure1Info').html
			(
			"<b>Figure 1:</b><br/><ul>"+ 
			"<li>" + amdjs.doMathSrc("R^2= "+Math.round(r2*100)/100 )+ "</li>" +
			"<li>" + amdjs.doMathSrc("Wilcoxon Rank= "+Math.round(TS.wilcox*100)/100 )+ "</li>" +
			"<li>"+ "Equation: "+
			amdjs.doMathSrc("y(c)={y_{max}·v_{i}·(c-c_0)}/{y_{max}+v_{i}·(c-c_0)}") + "</li>" +
			"<li>"+"With parameters:<br/>" + 
			indent+amdjs.doMathSrc( "v_{i}=" + Math.round(params[0]*100)/100 )+ "<br/>" +
			indent+amdjs.doMathSrc( "c_0=" + Math.round(params[1]*100)/100 )+ "</li>" +
			//indent+amdjs.doMathSrc( "y_0=" + Math.round(params[0]*100)/100 )+ "<br/>" +
			indent+amdjs.doMathSrc( "y_{max}=" + Math.round(params[2]*100)/100 )+ "<br/>" +
			"</ul>"
			);
		
		//This chart was added in a while back...	
	    var chart = new google.visualization.ComboChart(document.getElementById('chart1'));
	    chart.draw(data, options);
		
		google.visualization.events.addListener(chart, 'select', function() 
	    	{
	 		var point = chart.getSelection();
	 		point=point[0];
	 		
	 		//Change from good to bad
	 		if( point && Number(point.column) == 1 )
	 			{
		 		TS.goodData[point.row-1]=false;
		 		workers.fitDataToSingleCurve
		 			(
		 			[TS,the.currentBarcode,the.currentPeptide,"timeSeries"],//Command to be executed [data,barcode,peptide,type], no control on types...
		 			func.makeTimeSeriesFigure,//callback function
		 			""//Just to make sure it doesn't throw an error
		 			);
	 			
	 			}
	 		//Change from bad to good	
	 		else if( point && Number(point.column) == 2 )
	 			{
	 			TS.goodData[point.row-1]=true;
	 			workers.fitDataToSingleCurve
		 			(
		 			[TS,the.currentBarcode,the.currentPeptide,"timeSeries"],//Command to be executed [data,barcode,peptide,type], no control on types...
		 			func.makeTimeSeriesFigure,//callback function
		 			""//Just to make sure it doesn't throw an error
		 			);
		 		}
			});
		
		},
		
	makePostWashFigure:function()
		{
		
		var the = kinomicsImportUI.figureCreation.JSON;
		var func = kinomicsImportUI.figureCreation;
		var plot = new Array(["exposure time","read","removed","fit"],
							 [-10,-10,-10,-10]);
		var PW = kinomicsActiveData.JSON.barcodes[the.currentBarcode].peptides[the.currentPeptide].postWash;
		var params = PW.parameters;
		var eq = kinomicsActiveData.JSON.postWashFunc;
		
		
		//break data into usable chunks - time series
		for( var i=0; i< PW.cycleN.length; i++ )	
			{
			var cycle = PW.exposureT[i];
			var y = PW.number[i];
			var include = PW.goodData[i];
			if( include )
				{
				plot.push([Number(cycle),Number(y),null,null]);
				}
			else
				{
				plot.push([Number(cycle),null,Number(y),null]);
				}
			}
		
		//Add the fit data
		for( var xVal = 0; xVal< 200; xVal+=5 )
			{
			plot.push([xVal,null,null,eq([xVal],params)]);
			}
		
		var data = google.visualization.arrayToDataTable(plot);
		
		var options = 
	        {
	        title: "Post Wash",
	        hAxis: {title: plot[0][0],
	        		viewWindowMode:'explicit',viewWindow:{max:220,min:0}},
	        vAxis: {title: plot[0][1]},
	        legend: 'none',
	        seriesType: "scatter",
	        series: {2: {type: "line", curveType: "function", enableInteractivity:false}}
	    	}
		
		//Actual data to be listed
	    var r2 = PW.R2;
	    var indent = "&nbsp;&nbsp;&nbsp;&nbsp;";
	    $('#figure2Info').empty();
	    $('#figure2Info').html
			(
			"<b>Figure 2:</b><br/><ul>"+ 
			"<li>" + amdjs.doMathSrc("R^2= "+Math.round(r2*100)/100 )+ "</li>" +
			"<li>"+ "Equation: "+
			amdjs.doMathSrc("y(t)=k·t+y_0") + "</li>" +
			"<li>"+"With parameters:<br/>" + 
			indent+amdjs.doMathSrc( "k=" + Math.round(params[0]*100)/100 )+ "<br/>" +
			indent+amdjs.doMathSrc( "y_0=" + Math.round(params[1]*100)/100 )+ "</li>" +
			"</ul>"
			);
			
		//This chart was added in a while back...	
	    var chart = new google.visualization.ComboChart(document.getElementById('chart2'));
	    chart.draw(data, options);
		
		google.visualization.events.addListener(chart, 'select', function() 
	    	{
	 		var point = chart.getSelection();
	 		point=point[0];
	 		
	 		//Change from good to bad
	 		if( point && Number(point.column) == 1 )
	 			{
		 		PW.goodData[point.row-1]=false;
		 		workers.fitDataToSingleCurve
		 			(
		 			[PW,the.currentBarcode,the.currentPeptide,"postWash"],//Command to be executed [data,barcode,peptide,type], no control on types...
		 			func.makePostWashFigure,//callback function
		 			""//Just to make sure it doesn't throw an error
		 			);
	 			
	 			}
	 		//Change from bad to good	
	 		else if( point && Number(point.column) == 2 )
	 			{
	 			PW.goodData[point.row-1]=true;
	 			workers.fitDataToSingleCurve
		 			(
		 			[PW,the.currentBarcode,the.currentPeptide,"postWash"],//Command to be executed [data,barcode,peptide,type], no control on types...
		 			func.makePostWashFigure,//callback function
		 			""//Just to make sure it doesn't throw an error
		 			);
		 		}
			});
		
		},
	
	        
    },


}

//Run these to initialize the variables, and set up the page overlying architecture
kinomicsImportUI.setUpPage();