/*global KINOMICS, console, FileReader, $*/
//TODO: error reporting for user very important here, make a failed save a ! or a yeild sign.
//TODO: change error so it only occurs on a barcode by barcode basis.


KINOMICS.fileManager.DA = (function () {
	'use strict';

	//variable declarations
	var lib, parseFile, run, saveChanges, addDataFile,
		reportError, reportErrorFromWorker, cdb, parseObj;


	//variable definitions
	lib  = {};

/*
	var fuse = KINOMICS.fileManager.DA.fusionTables;
	fuse.JSON = 
	{
	access_token:"",
	userName:"",
	activeTables:new Array(),
	loggedIn:false,
	barWellColumns:['Barcode_Well','JSON','RDF','Referring Table and Row']
	},
*/

	//Define global functions
	lib.parseFile = function (input_obj) {
		/*////////////////////////////////////////////////////////////////////////////////
		This function uses workers to parse xtab export from bionavigator and adds the
			data to the global data object: KINOMICS.barcodes
		ARGV: input_obj has seven required parts, and one optional:
			file -  (string) the file to be parsed.
			workerfile - the file that defines the worker's tasks
			workers - (object) the object that is attached to workersPackage.js
			barcodes - (object) the object where barcode information is to be added
			barcodeCreator - (function) function to be called to convert barcode data
				into complete object, originally: KINOMICS.expandBarcodeWell.
			database - (object) the database information for future formatting, requires
				following parameters:
				{ dbType: (string) <fusionTables or S3DB>,

				//For fusion tables:
				originFile: (string) <fusion table file ID>,
				originLine: (string/number) <line number of full file contents>,
				?BarcodeFileToWriteTo:?

				//For S3DB - ?Shukai will determine, and rewrite.
				collectionID:
				ruleID:
				itemID:
				}
			callback - (function) called once file is parsed, no default and is
				necessary since this function uses web workers, no parameters.
			onError - (function) [optional] called if a web worker reports an error,
				default is to call reportError().
		*/////////////////////////////////////////////////////////////////////////////////
		var that = this;
		run(parseFile)(input_obj, that);
	};

	lib.login = function (db, pack, parse, callback) {
		cdb = db;
		parseObj = parse;
		cdb.login(pack, callback);
	};

	lib.saveChanges = function (barcodeObj, currentDB, callback, uiUpdate) {
		//TODO: user docs
		run(saveChanges)(barcodeObj, currentDB, callback, uiUpdate);
	};

	lib.writeFile = function (input_obj) {
		//TODO: seperate these
		//TODO: make docs
		//TODO: check user input
		if (input_obj.db.name === 'Fusion Tables') {
			input_obj.db.writeFile(input_obj.file, input_obj.callback, input_obj.parseObj);
		} else if (input_obj.db.name === 'S3DB') {
			console.error('S3DB not set up yet');
		} else {
			console.error('File cannot be written to unknown database: ' + input_obj.db);
		}
	};

	lib.convertToTriples = function (barcode, depth) {
		var category, triples;
		triples = [];
		//TODO: seperate these
		//TODO: make docs
		//TODO: check user input
		//TODO: account for multiple depths, for now, just using metadata depth
		//TODO: get rid of globals here.
		for (category in KINOMICS.barcodes[barcode]) {
			if (KINOMICS.barcodes[barcode].hasOwnProperty(category)) {
				if (typeof KINOMICS.barcodes[barcode][category] === 'object') {
					triples.push([barcode, category, JSON.stringify(KINOMICS.barcodes[barcode][category])]);
				} else if (typeof KINOMICS.barcodes[barcode][category] !== 'function') {
					triples.push([barcode, category, KINOMICS.barcodes[barcode][category]]);
				}
			}
		}
		return triples;
	};

	lib.newAnalysisObject = function (initialObj) {
		var ana, queue, queuePush, unloading;

		//TODO: check user input, add user docs
		unloading = false;
		queue = [];
		ana = {};
		ana.data = [];
		ana.id = Math.uuid();
		ana.name = initialObj.name;
		ana.main = {};
		ana.date = (new Date()).toISOString();

		queuePush = function (array) {
			var i;
			//Adds something to the adjacent place in the queue instead of the end.
			//TODO: (for this and data) make sure it is an array...
			if (typeof array !== 'object') {
				console.error('must use an array for queuePush function');
				return false;
			}
			for (i = 0; i < array.length; i += 1) {
				if (typeof array[i] === 'function') {
					queue.push(array[i]);
				} else {
					console.error(array[i] + ' is not a function');
				}
			}
			ana.unloadQueue();
		};

		ana.loadData = function (dataObj) {
			queuePush([function (qContinue) {
				var data, callback;
				callback = function () {
					var prop;
					for (prop in data.JSON) {
						if (data.JSON.hasOwnProperty(prop)) {
							//makes link to data itself...
							ana.main[prop] = data.JSON[prop];
						}
					}
					dataObj.callback();
					qContinue();
				};
				data = lib.newDataObject();
				ana.data.push(data);
				data.loadData({info: dataObj.info, callback: callback});
			}]);
		};

		ana.loadAnalysis = function (dataObj) {
			queuePush([function (callback) {
				callback();
			}]);
		};

		ana.save = function (dataObj) {
			queuePush([function (callback) {
				callback();
			}]);
		};

		ana.unloadQueue = function (callback) {
			//All functions for this have one parameter: callback, they all call callFunc to indicate completion of task.
			var callFunc = function () {
				unloading = false;
				queue.shift();
				ana.unloadQueue();
			};

			if (typeof callback === 'function' && callback !== ana.unloadQueue && callback !== callFunc) {
				queuePush([callback]);
			}
			//How to interact with the Queue that is responsible for handling data
			if (unloading) {
				return false;
			}
			if (queue.length < 1) {
				unloading = false;
				return true;
			} else {
				unloading = true;
				(queue[0])(callFunc);
			}
		};
		return ana;
	};

	lib.newDataObject = function () {
		var that, batchID, data, fileObj, queue, unloading, queuePush, expandBarcodeWell;

		queue = [];
		data = {};
		that = data;
		unloading = false;
		batchID = Math.uuid();

		data.JSON = {};
		data.string = "";

		queuePush = function (array) {
			var i;
			//Adds something to the adjacent place in the queue instead of the end.
			if (typeof array !== 'object') {
				console.error('must use an array for queuePush function');
				return false;
			}
			for (i = 0; i < array.length; i += 1) {
				if (typeof array[i] === 'function') {
					queue.push(array[i]);
				} else {
					console.error(array[i] + ' is not a function');
				}
			}
			data.unloadQueue();
		};

		//TODO: finish checking user input...
		expandBarcodeWell = (function () {
			//variable declarations
			var addSetterProp, changes, createObject, func, save, toString, userSave, userToString, toNumber;
			//variable definitions
			changes = [];


//			deserialize = function ($x) {
	     // This function is a JSON-based deserialization utility that can invert
	     // the `serialize` function provided herein. Unfortunately, no `fromJSON`
	     // equivalent exists for obvious reasons -- it would have to be a String
	     // prototype method, and it would have to be extensible for all types.
	     // NOTE: This definition could stand to be optimized, but I recommend
	     // leaving it as-is until improving performance is absolutely critical.
	        /*jslint unparam: true */
//	        return JSON.parse($x, function reviver(key, val) {
	         // This function is provided to `JSON.parse` as the optional second
	         // parameter that its documentation refers to as a `reviver` function.
	         // NOTE: This is _not_ the same as Quanah's `revive`!
//	            var f, re;
//	            re = /^\[(FUNCTION|REGEXP) ([A-z0-9\+\/\=]+) ([A-z0-9\+\/\=]+)\]$/;
	         // Is the second condition even reachable in the line below?
//	            if (is_String(val)) {
//	                if (re.test(val)) {
//	                    val.replace(re, function ($0, type, code, props) {
	                     // This function is provided to the String prototype's
	                     // `replace` method and uses references to the enclosing
	                     // scope to return results. I wrote things this way in
	                     // order to avoid changing the type of `val` and thereby
	                     // confusing the JIT compilers, but I'm not certain that
	                     // using nested closures is any faster anyway. For that
	                     // matter, calling the regular expression twice may be
	                     // slower than calling it once and processing its output
	                     // conditionally, and that way might be clearer, too ...
//	                        f = sandbox(atob(code));
//	                        copy(deserialize(atob(props)), f);
//	                        return;
//	                    });
//	                }
//	            }
//	            return (f !== undefined) ? f : val;
//	        });
//	    };

			//functionsToReturn
			func = function (init) {
			/*/////////////////////////////////////////////////////////////////////
			This function expands a barcode object and gives it functionality.
			ARGVS: init: (object) small barcode object, required
			*/////////////////////////////////////////////////////////////////////
				return createObject(init);
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

			userSave = function (callback) {
			/*/////////////////////////////////////////////////////////////////////
			Saves the data to the appropriate database if there has been a
				change.
			ARGVS: callback: optional callback function.
			*/////////////////////////////////////////////////////////////////////
				run(save)(this, callback);
			};

			//local functions
			toString = function (lengthStr, that) {
				//variable declarations
				var peptide, stringReturn;

				//variable definitions
				that = JSON.parse(JSON.stringify(that)); //Must create a deep copy to avoid killing original.

				//check user input
				if (typeof lengthStr !== 'string' || !lengthStr.match(/^(short|long)$/)) {
					lengthStr = 'short';
				}

				if (lengthStr === 'short') {
					for (peptide in that.peptides) {
						if (that.peptides.hasOwnProperty(peptide)) {
							delete that.peptides[peptide].timeSeries.cycleNum;
							delete that.peptides[peptide].postWash.exposureTime;
							delete that.peptides[peptide].timeSeries.goodData;
							delete that.peptides[peptide].postWash.goodData;
						}
					}
				}
				delete that.db;
				delete that.toString;
				stringReturn = JSON.stringify(that);
				that = {}; // Since a deep copy was made I want to be sure it is removed before returning
				return stringReturn;
			};

			toNumber = function (arr) {
				var i, n = arr.length;
				for (i = 0; i < n; i += 1) {
					arr[i] = Number(arr[i]);
				}
			};

			//TODO: block other ways to add? 
			//TODO: turn the input into an object, add user docs ecetra.
			addSetterProp = function (obj, prop, val, identifier) {
				var a;
				Object.defineProperty(obj, prop, {
					enumerable: true,
					get: function () {return a; },
					set: function (x) {
						changes.push(['setting ' + a + ' to ' + x + ' at property ' + prop + ' for ', identifier]);
						a = x;
					}
				});
				obj[prop] = val;
			};

			createObject = function (init) {
				//variable declarations
				var bar, obj, peptide, i;

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
				//TODO: make this a more permenate solution...
				obj.db = obj.db || {};
				obj.db.fit = false;
				obj.db.changes = changes;
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
						obj.peptides[peptide].timeSeries.goodData = [];
						obj.peptides[peptide].postWash.goodData = [];
						obj.peptides[peptide].addProperty = addSetterProp; //To keep track of changes to the object
						for (i = 0; i < obj.peptides[peptide].timeSeries.number.length; i += 1) {
							addSetterProp(obj.peptides[peptide].timeSeries.goodData, i, true, {uuid: obj.uuid, peptide: peptide, type: 'timeSeries', prop: 'goodData'});
						}
						for (i = 0; i < obj.peptides[peptide].postWash.number.length; i += 1) {
							addSetterProp(obj.peptides[peptide].postWash.goodData, i, true, {uuid: obj.uuid, peptide: peptide, type: 'timeSeries', prop: 'goodData'});
						}
					}
				}

				//define to string functions
				obj.asString = userToString;
				obj.save = userSave;
				return obj;
			};
			return func;
		}());

		parseFile = function (input_obj) {
			//variable declarations
			var barcodes, callback, dbObj, file, onerror, workers, workerObj, workersFile, uuids = [];

			if (typeof input_obj !== 'object' || input_obj === null) {
				throw "input_obj was not defined";
			}

			workersFile = 'js/fileManagement/fileParseWorker.js';
			workerObj = KINOMICS.workers;

			//variable definitions
			//barcodes = input_obj.barcodes || undefined;
			barcodes = that;
			callback = input_obj.callback || undefined;
			//dbObj = input_obj.database || undefined;
			file = barcodes.string || undefined;
			onerror = input_obj.onError || function (err) {reportError(err); };
			//workerObj = input_obj.workers || undefined;
			//workersFile = input_obj.workersfile || undefined;

			//check user input
			if (typeof callback !== 'function') {
				throw "ParseFile error: Callback must be defined and a function.";
			}
			//if (typeof dbObj !== 'object' || dbObj === null) {
			//	throw "ParseFile error:  Must pass in a database object, please pass in.";
			//}
			//if (typeof expandBarcodeWell !== 'function') {
			//	throw "ParseFile error:  Must pass in the function for creating barcode prototype.";
			//}
			if (typeof workerObj !== 'object' || workerObj === null) {
				throw "ParseFile error:  Must pass in a worker object, please pass in.";
			}
			if (typeof workersFile !== 'string') {
				throw "ParseFile error:  Must pass in a file, please pass in.";
			}

			workers = workerObj.startWorkers({num_workers: 1, filename: workersFile, onError: function (err) {reportErrorFromWorker(err); onerror(err); }});
			workers.submitJob(file, function (evt) {
				//variable declarations
				var prop, uuid;

				//what to do with results
				for (prop in evt.data) {
					if (evt.data.hasOwnProperty(prop)) {
						uuid = Math.uuid();
						uuids.push(uuid);
						barcodes.JSON[uuid] = expandBarcodeWell(evt.data[prop]);
						//barcodes[uuid].db =  JSON.parse(JSON.stringify(dbObj));
						barcodes.JSON[uuid].name = prop;
						barcodes.JSON[uuid].uuid = uuid;
					}
				}
			});
			workers.onComplete(function () {
				workers.clearWorkers();
				callback(uuids);
			});
		};

		data.addData = function (dataObj) {
			var that, dealWithInput, readFileObject, parseFileString;
			that = this;
			//This grabs the string passed to it, and handles it... Maybe, just deals directly with file object?
			dealWithInput = function (callback) {
				if (dataObj.type === 'string') {
					data.string = dataObj.data;
				} else if (dataObj.type === 'fileObj') {
					fileObj = dataObj.data;
				} else {
					console.error('Data Type not recognized. Please either use a file object, or a string');
				}
				callback();
			};
			readFileObject = function (callback) {
				var reader;
				if (typeof fileObj === 'object') {
					reader = new FileReader();
					reader.onload = function (e) {
						that.string = e.target.result;
						callback();
					};
					reader.readAsText(fileObj);
				} else {
					callback();
				}
			};
			parseFileString = function (callback) {
				if (that.string) {
					parseFile({callback: callback});
				} else {
					console.error('No file string found...');
					callback();
				}
			};

			queuePush([dealWithInput, readFileObject, parseFileString]);
		};

		data.loadData = function (dataObj) {
			//purpose of this funciton is is grab the actual data from data base
			//Note once this occurs, saving should no longer be an option
			batchID = "";
			data.save = function () {
				console.error('Cannot save when data has been loaded from database');
			};
			queuePush([function (qContinue) {
				var callbackFunc = function (triples) {
					var i;
					for (i = 0; i < triples.rows.length; i += 1) {
						data.JSON[[triples.rows[i][0]]] = expandBarcodeWell(JSON.parse(triples.rows[i][2]));
					}
					dataObj.callback();
					qContinue();
				};
				cdb.loadData({data: [dataObj.info], callback: callbackFunc});
			}]);
		};

		data.listBatches = function () {
			//simply returns data list avaliable
			return ((cdb.listBatches()).sort(function (a, b) {
				if (a.date >= b.date) {
					return -1;
				} else {
					return 1;
				}
			}));
		};

		data.listData = function () {
			//simply returns data list avaliable
			return ((cdb.listData()).sort(function (a, b) {
				if (a.date >= b.date) {
					return -1;
				} else {
					return 1;
				}
			}));
		};

		data.save = function (dataObj) {
			var that, fileObjFunc, individualBarcodeFunc;
			//purpose of this is to save data to database, since this is data, new barcode is always created
			that = this;

			fileObjFunc = function (callback) {
				if (typeof (fileObj) === 'object') {
					//save file object, add information to config file
					cdb.writeFile({data: fileObj, callback: callback, batchID: batchID});
				} else {
					callback();
				}
			};
			individualBarcodeFunc = function (callback) {
				var prop, funcs = [], addBarcodeData;
				addBarcodeData = function (prop) {
					return function (callback) {
						//TODO: fix data thing... 
						cdb.saveBarcode({id: prop, data: that.JSON[prop], batchID: batchID, callback: callback});
					};
				};
				for (prop in that.JSON) {
					if (that.JSON.hasOwnProperty(prop)) {
						funcs.push(addBarcodeData(prop));
					}
				}
				funcs.push(function (callback) {
					dataObj.callback();
					callback();
				});
				queuePush(funcs);
				callback();
			};

			queuePush([fileObjFunc, individualBarcodeFunc]);
		};

		data.unloadQueue = function (callback) {
			//All functions for this have one parameter: callback, they all call callFunc to indicate completion of task.
			var callFunc = function () {
				unloading = false;
				queue.shift();
				data.unloadQueue();
			};

			if (typeof callback === 'function' && callback !== data.unloadQueue && callback !== callFunc) {
				queue.push(callback);
			}
			//How to interact with the Queue that is responsible for handling data
			if (unloading) {
				return false;
			}
			if (queue.length < 1) {
				unloading = false;
				return true;
			} else {
				unloading = true;
				(queue[0])(callFunc);
			}
		};
		return data;
	};

	//Define Local functions 
	reportError = function (err) {
		$('<div/>', {'class': 'alert alert-error', html:
			'<button type="button" class="close" data-dismiss="alert">×</button>' +
			"File Manager Error: " + err
			}).appendTo('#errors');
		console.error("File Manager Error: " + err + "<br />To display more information for any" +
			" function type [func_name] instead of [func_name](...)");
	};

	reportErrorFromWorker = function (err) {
		var message = err.message || err;
		reportError(message + " In worker Package...");
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