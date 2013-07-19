/*global KINOMICS, console, FileReader, $*/
//TODO: error reporting for user very important here, make a failed save a ! or a yeild sign.
//TODO: change error so it only occurs on a barcode by barcode basis.

var globs = [];
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
            }
            unloading = true;
            (queue[0])(callFunc);
        };
        return ana;
    };

    lib.newDataObject = function () {
        var expand, collapse, unfoldTriples, that, batchID, data, fileObj, queue, unloading, queuePush;

        queue = [];
        data = {};
        globs.push(data);
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
            //  throw "ParseFile error:  Must pass in a database object, please pass in.";
            //}
            //if (typeof expandBarcodeWell !== 'function') {
            //  throw "ParseFile error:  Must pass in the function for creating barcode prototype.";
            //}
            if (typeof workerObj !== 'object' || workerObj === null) {
                throw "ParseFile error:  Must pass in a worker object, please pass in.";
            }
            if (typeof workersFile !== 'string') {
                throw "ParseFile error:  Must pass in a file, please pass in.";
            }

            workers = workerObj.startWorkers({num_workers: 1, filename: workersFile, onError: function (err) {reportErrorFromWorker(err); onerror(err); }});
            workers.submitJob(file, function (evt) {
                //When this function runs, it returns the JSON triples for the file, this should be saved to the database at this point, and a table line added.
                //If an analysis is open, add this to the analysis...
                //TODO: check for error...
                data.JSON = evt.data;
                globs.push(evt.data);
                //data.save();
                //variable declarations
                //globs = [evt.data, data];
                //unfoldTriples(evt.data);
                //what to do with results
                //for (prop in evt.data) {
                //  if (evt.data.hasOwnProperty(prop)) {
                        //uuid = Math.uuid();
                        //uuids.push(uuid);
                        //barcodes.JSON[uuid] = expandBarcodeWell(evt.data[prop]);
                        //barcodes[uuid].db =  JSON.parse(JSON.stringify(dbObj));
                        //barcodes.JSON[uuid].name = prop;
                        //barcodes.JSON[uuid].uuid = uuid;
                //  }
                //}
            });
            workers.onComplete(function () {
                workers.clearWorkers();
                callback(uuids);
            });
        };


        //This division is used to expand and collapse the data object
        (function () {
            var expanded, isRef, setPropsMain, setPropsMinor;
            expanded = [];

            //helper functions
            isRef = function (input) {
                if (typeof input === "string" && input.match(/^\&\w{8}\-\w{4}\-\w{4}\-\w{4}\-\w{12}/)) {
                    return 1;
                }
                return 0;
            };

            setPropsMain = function (obj, uuid) {
                //This stores the uuid as a property without it getting in the way
                Object.defineProperty(obj[i], 'uuid', {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: uuid
                });
            };

            expand = function (callback) {
                //This has two major goals, to expand on the parents/uuids to make a full unit and to create setter properties for tracking analytical steps
                var i, key, key2, pw_x, ts_x, pep, obj, ref, input_obj;
                input_obj = data.JSON;
                for (key in input_obj.uuids) {
                    if (input_obj.uuids.hasOwnProperty(key)) {
                        //Set object properties
                        setPropsMain(input_obj.uuids[key], key);
                        if (typeof input_obj.uuids[key] === 'object') {
                            obj = input_obj.uuids[key];
                            if (obj instanceof Array) {
                                for (i = 0; i < obj.length; i += 1) {
                                    if (isRef(obj[i])) {
                                        ref = obj[i];
                                        obj[i] = input_obj.uuids[ref.replace(/^\&/, '')];
                                        //This stores the dereference so it can be undone
                                        (function (obj, i, ref) {
                                            expanded.push(function () {obj[i] = ref; });
                                        }(obj, i, ref));
                                    }
                                }
                            } else {
                                for (key2 in obj) {
                                    if (obj.hasOwnProperty(key2) && isRef(obj[key2])) {
                                        ref = obj[key2];
                                        obj[key2] = input_obj.uuids[ref.replace(/^\&/, '')];
                                        //This stores the dereference so it can be undone
                                        (function (obj, key2, ref) {
                                            expanded.push(function () {obj[key2] = ref; });
                                        }(obj, key2, ref));
                                    }
                                }
                            }
                        }
                    }
                }
                //Now set the parents
                for (i = 0; i < input_obj.parents.length; i += 1) {
                    if (isRef(input_obj.parents[i])) {
                        ref = input_obj.parents[i];
                        input_obj.parents[i] = input_obj.uuids[ref.replace(/^\&/, '')];
                        //This stores the uuid as a property without it getting in the way
                        setPropsMain(input_obj.parents[i], ref)
                        //This stores the dereference so it can be undone
                        (function (obj, i, ref) {
                            expanded.push(function () {obj[i] = ref; });
                        }(input_obj.parents, i, ref));
                    }
                }

                //Finally add the x-values to each of the peptides...
                for (i = 0; i < input_obj.parents.length; i += 1) {
                    pw_x = input_obj.parents[i].dataArr.exposureTime;
                    ts_x = input_obj.parents[i].dataArr.cycle;
                    for (pep in input_obj.parents[i].peptides) {// This is the peptide level
                        if (input_obj.parents[i].peptides.hasOwnProperty(pep)) {
                            input_obj.parents[i].peptides.hasOwnProperty(pep).timeSeries.xVals = ts_x;
                            input_obj.parents[i].peptides.hasOwnProperty(pep).postWash.xVals = pw_x;
                        }
                    }
                }

                callback();
            };
            collapse = function (callback) {
                while (expanded.length > 0) {
                    (expanded.pop())();
                }
                callback();
            };
        }());

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
                    console.error('Data Type not recognized. Please either use a file object, or a string with full batch file');
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

        data.expand = function (callback) {
            queuePush([function (c2) {
                expand();
                if (typeof callback === 'function') {
                    callback();
                }
                c2();
            }]);
        };

        data.collapse = function (callback) {
            queuePush([function (c2) {
                console.log('here...');
                collapse();
                if (typeof callback === 'function') {
                    callback();
                }
                c2();
            }]);
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
                }
                return 1;
            }));
        };

        data.listData = function () {
            //simply returns data list avaliable
            return ((cdb.listData()).sort(function (a, b) {
                if (a.date >= b.date) {
                    return -1;
                }
                return 1;
            }));
        };

        data.save = function (dataObj) {
            var that, fileObjFunc, individualBarcodeFunc;
            //purpose of this is to save data to database, since this is data, new batch id is always created
            that = this;

            fileObjFunc = function (callback) {
                if (typeof fileObj === 'object') {
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
                        console.log('prop:', prop);
                        //TODO: fix data thing... 
                        var i, bar, tempObj;
                        bar = {parents: [prop], uuids: {}, families: {}};
                        tempObj = that.JSON.families[prop];
                        bar.families[prop] = tempObj;
                        for (i = 0; i < tempObj.length; i += 1) {
                            bar.uuids[tempObj[i]] = that.JSON.uuids[tempObj[i].replace(/^\&/, '')];
                        }
                        cdb.saveBarcode({id: prop, data: bar, batchID: batchID, callback: callback});
                    };
                };
                funcs.push(collapse);
                for (prop in that.JSON.families) {
                    if (that.JSON.families.hasOwnProperty(prop)) {
                        funcs.push(addBarcodeData(prop));
                    }
                }
                funcs.push(function (callback) {
                    //dataObj.callback();
                    callback();
                });
                funcs.push(expand);
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
            }
            unloading = true;
            (queue[0])(callFunc);
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