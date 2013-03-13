/*global KINOMICS: false, console: false */

KINOMICS.qualityControl.DA = (function () {
	'use strict';

	//Local Variables
	var lib, barWellObj, dataUpdateCallback, fitCurve, fitCurves, makeDeepCopy, reportError, run;

	//Define variables
	lib = {};

	//Define global functions
	lib.fitCurve = function (input_obj) {
		/*/////////////////////////////////////////////////////////////
		TODO: fill in these comments
		These will be comments for the user....
		Fit the curve specified by input_obj
		*//////////////////////////////////////////////////////////////
		run(fitCurve)(input_obj);
	};

	lib.fitCurves = function (input_obj) {
		/*/////////////////////////////////////////////////////////////
		TODO: fill in these comments
		These will be comments for the user....
		Fits all curves that do not already have data...
		*//////////////////////////////////////////////////////////////
		run(fitCurves)(input_obj);
	};

	//Define Local functions
	dataUpdateCallback = function (event) {
		//variable declarations
		var barcode, data, fit, params, peptideI, percentFinished, R2, totalSSE, type;
		//Get location of original data
		barcode = event.data.shift();
		peptideI = event.data.shift();
		type = event.data.shift();
		fit = event.data.shift();
		data = barWellObj[barcode].peptides[peptideI][type];
		// console.log("Came back for barcode: " + barcode + " peptide: " + peptideI);
		//variable defintions
		data.parameters = fit.parameters;
		data.R2 = fit.R2;
		data.totalSqrErrors = fit.totalSqrErrors;
	};

	fitCurve = function (input_obj) {
		//varible declarations
		var worker, workerObj, workerFile;
		//variable declarations
		barWellObj = input_obj.barWellContainer;
		workerObj = input_obj.workersLocation;
		workerFile = input_obj.workersFile;
		//TODO: check user input

		//the point of this pattern is to start a worker only one time. No need to close it then...
		worker = workerObj.startWorkers({filename: workerFile, num_workers: 1});
		fitCurve = function (input_obj) {
			//variable declarations
			var analysisType, barcode, callback, data, peptide;

			//variable definitions
			analysisType = input_obj.analysisType;
			barcode = input_obj.barcode;
			callback = input_obj.callback || function () {};
			peptide = input_obj.peptide;
			//TODO: check user input

			worker.submitJob([barWellObj[barcode].peptides[peptide][analysisType], barcode, peptide, analysisType],
				dataUpdateCallback);

			worker.onComplete(callback);
		};
		//call the new definition to do work
		fitCurve(input_obj);
	};

	fitCurves = function (input_obj) {
		//variable declarations
		var callback, progressBar, barcodesAnalyzed, barContainer, barWell, barWellChanged, progress,
			peptide, percentFinished, total, updateData, workers, workersFile, workerObj, i, length;

		//variable definitions
		barcodesAnalyzed = [];
		barWellObj = input_obj.barWellContainer;
		barWellChanged = [];
		percentFinished = 0;
		progress = 0;
		progressBar = input_obj.progressBar;
		total = 0;
		workerObj = input_obj.workersLocation;
		workersFile = input_obj.workersFile;
		callback = input_obj.callback;

		//TODO: check user input
		//function definitions
		updateData = function (event) {
			dataUpdateCallback(event);
			//Update the bar
			progress += 1;
			percentFinished = Math.floor(progress / total * 100);
			progressBar.width(percentFinished + '%');
			progressBar.text(percentFinished + '%');
		};

		//Open workers
		workers = workerObj.startWorkers({filename: workersFile, num_workers: 4});

		//Start submitting jobs
		for (barWell in barWellObj) {
			if (barWellObj.hasOwnProperty(barWell) && barWellObj[barWell].db.fit === false) {
				barWellChanged.push(barWell);
				//Hopefully I can get rid of the barcodesAnalyzed part, and just update the table...
				barcodesAnalyzed.push(barWell);
				for (peptide in barWellObj[barWell].peptides) {
					if (barWellObj[barWell].peptides.hasOwnProperty(peptide)) {
						//TODO: add in dealing with '0' data, and errors based on barcode_well rather than file.
						workers.submitJob([makeDeepCopy(barWellObj[barWell].peptides[peptide].postWash), barWell, peptide, "postWash"],
							updateData);
						workers.submitJob([makeDeepCopy(barWellObj[barWell].peptides[peptide].timeSeries), barWell, peptide, "timeSeries"],
							updateData);
						total += 2;
					}
				}
			}
		}

		//Now that all jobs have been submitted we can show the bar growing
		progressBar.show();

		workers.onComplete(function () {
			//Finalize the loading bar
			progressBar.width(100 + '%');
			workers.clearWorkers();
			length = barWellChanged.length;
			for (i = 0; i < length; i += 1) {
				barWell = barWellChanged[i];
				barWellObj[barWell].db.fit = true;
				barWellObj[barWell].db.changed = true;
			}
			callback();
			//Adds data to the fusion table object - this can occur after the data has been
				//displayed, it should run in the background no problem... Just make sure
				//the save button shows up after this is done.
			//fileUpload.sendBarcodesToDB(barcodesAnalyzed, fileUpload.showSaveDataButton);
		});
	};

	makeDeepCopy = function (obj) {
		//This function accesses all portions of the data and makes a copy to insure properties with getters/setters work
		var outObj, prop, i;
		if (typeof obj !== 'object') {
			outObj = obj;
		} else if (Array.isArray(obj)) {
			outObj = [];
			for (i = 0; i < obj.length; i += 1) {
				outObj[i] = makeDeepCopy(obj[i]);
			}
		} else {
			outObj = {};
			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					outObj[prop] = makeDeepCopy(obj[prop]);
				}
			}
		}
		return outObj;
	};

	reportError = function (err) {
		return console.log("Error with quality control data analysis: " + err + "\nTo display more information for any" +
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

	return lib;
}());