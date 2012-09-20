/*global KINOMICS: false, console: false */

KINOMICS.expandBarcodeWell = (function () {
	"use strict";
	//variable declarations
	var createObject, func, run, reportError, toString, userToString, toNumber;
	//variable definitions

	//functionsToReturn
	func = function (init) {
		/*/////////////////////////////////////////////////////////////////////
			This function expands a barcode object and gives it functionality.
				ARGVS: init: (object) small barcode object, required
		*/////////////////////////////////////////////////////////////////////
		return run(createObject)(init);
	};

	//functions to attach to object
	userToString = function (length) {
		/*/////////////////////////////////////////////////////////////////////
			Turns the object into a string using one of two methods based on the
			argument passed in: short [the minimized version that can be expanded
			by calling lib.newBarcodeWell(JSON.parse('barcodeAsString'))] or long
			[the full version that can be pasted into any enviroment] 
				ARGVS: length: (string) can be either 'short' or 'long',
					determines the type of string created by the object.
		*/////////////////////////////////////////////////////////////////////
		return run(toString)(length, this);
	};

	//local functions
	toString = function (lengthStr, that) {
		//variable declarations
		var peptide, stringReturn;

		//variable definitions
		that = JSON.parse(JSON.stringify(that)); //Must create a deep copy to avoid killing original.

		//check user input
		if (typeof lengthStr !== 'string' || !lengthStr.match(/^(short|long)$/)) {
			throw "length must be a string either 'short' or 'long'";
		}

		if (lengthStr === 'short') {
			for (peptide in that.peptides) {
				if (that.peptides.hasOwnProperty(peptide)) {
					delete that.peptides[peptide].timeSeries.cycleNum;
					delete that.peptides[peptide].postWash.exposureTime;
				}
			}
		}
		delete that.toString;
		stringReturn = JSON.stringify(that);
		that = {}; // Since a deep copy was made I want to be sure it is removed before returning
		return stringReturn;
	};

	reportError = function (err) {
		console.log("Error with BarcodeProto.js: " + err);
	};

	run = function (func) {
		return function () {
			var y;
			try {
				y = func.apply(this, arguments);
			} catch (err) {
				reportError(err);
			}
			return y;
		};
	};

	toNumber = function (arr) {
		var i, n = arr.length;
		for (i = 0; i < n; i += 1) {
			arr[i] = Number(arr[i]);
		}
	};

	createObject = function (init) {
		//variable declarations
		var bar, obj, peptide;

		//variable defintions
		obj = init || undefined;

		//check user input 1
		if (obj === undefined) {
			throw "Must pass in a barcode object to expandBarcodeWell.";
		}
		if (obj.peptides === undefined) {
			throw "Must pass in a barcode object with a peptiedes object.";
		}

		//Change cylces and exposure times to numbers
		toNumber(obj.dataArr.timeSeries.cycle);
		toNumber(obj.dataArr.postWash.exposureTime);
		toNumber(obj.dataArr.postWash.cycle);
		toNumber(obj.dataArr.timeSeries.exposureTime);

		//define references to obj.dataArr.timeSeries and
			//obj.dataArr.postWash - note this minimizes the
			//memory needed
		for (peptide in obj.peptides) {
			if (obj.peptides.hasOwnProperty(peptide)) {
				//check user input 2
				if (obj.peptides[peptide].timeSeries === undefined || obj.peptides[peptide].postWash === undefined) {
					throw "All peptides must have both time series and post wash data " + peptide +
						" is missing one of them.";
				}
				obj.peptides[peptide].timeSeries.cycleNum = obj.dataArr.timeSeries.cycle;
				obj.peptides[peptide].postWash.exposureTime = obj.dataArr.postWash.exposureTime;
				toNumber(obj.peptides[peptide].postWash.number); //Make the values into numbers
				toNumber(obj.peptides[peptide].timeSeries.number); //Make the values into numbers
			}
		}

		//define to string functions
		obj.toString = userToString;
		return obj;
	};
	return func;
}());