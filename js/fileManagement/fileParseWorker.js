/*global self, Math*/
//Container for all code. Will be run on load
(function () {
    'use strict';

    //variable declarations
    var beginParse, collectBarWell, getTitleInfo, parseToFileObject, transformFile;
    //variable definitions

    //global function

    //local functions
    //This line must be commented out for jsLint to pass...
    Math.uuid = function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b};
    beginParse = function (file) {
        file = file.replace(/\r/g, "\n");
        file = file.replace(/\n+$/g, "\n");
        file = file.replace(/\n\n/g, "\n");
        file = file.replace(/\n\s+\n/g, "\n");
        //get rid of quotation marks to help prevent downstream errors
        file = file.replace(/"|'/g, "");
        return file.split('\n');
    };

    collectBarWell = function (fileObj) {
        //variable declarations
        var barArr, barcodeWellArr, endObj, i, metaArr, prop, propLength, rowArr, tempProp;

        //variable defintions
        endObj = {};
        barcodeWellArr = [];

        //get the properties of the metadata columns
        //metaArr = Object.getOwnPropertyNames(fileObj.meta);

        //Find barcode and well (aka row)
        barArr = fileObj.meta.Barcode;
        rowArr = fileObj.meta.Row;

        //Save metaData
        for (prop in fileObj.meta) {
            if (fileObj.meta.hasOwnProperty(prop)) {
                propLength = fileObj.meta[prop].length;
                for (i = 0; i < propLength; i += 1) {
                    tempProp = 'bar' + barArr[i] + '_well' + rowArr[i];
                    endObj[tempProp] = endObj[tempProp] || {};
                    endObj[tempProp].meta = endObj[tempProp].meta || {};
                    endObj[tempProp].meta[prop] = endObj[tempProp].meta[prop] || [];
                    endObj[tempProp].meta[prop].push(fileObj.meta[prop][i]);
                }
            }
        }

        //Save actual data
        for (prop in fileObj.data) {
            if (fileObj.data.hasOwnProperty(prop)) {
                propLength = fileObj.data[prop].length;
                for (i = 0; i < propLength; i += 1) {
                    tempProp = 'bar' + barArr[i] + '_well' + rowArr[i];
                    endObj[tempProp] = endObj[tempProp] || {};
                    endObj[tempProp].data = endObj[tempProp].data || {};
                    endObj[tempProp].data[prop] = endObj[tempProp].data[prop] || [];
                    endObj[tempProp].data[prop].push(fileObj.data[prop][i]);
                }
            }
        }

        return endObj;
    };

    getTitleInfo = (function () {
        //variable declarations
        var func, findInHeader;
        //variable definitions

        //functions
        findInHeader = function (text, search) {
            var ind = search.indexOf(text);
            return search[ind + 1];
        };

        func = function (headerString) {
            //Variable declarations
            var header, result;

            //Variable definitions
            header = [];
            result = {};

            //Parse the header into it's parts
            headerString = headerString.replace(/\s+$|^\s+/, "");
            headerString = headerString.replace(/\"/g, "");
            header = headerString.split(/\t|Date/); // Due to an error in the bionavigator tabulation, date is added to the parse list

            //Get the useful portion of the data
            result.bioNavVersion = findInHeader("BioNavigator Version", header);
            result.protocolFileName = findInHeader("Protocol file name", header);
            result.dateAnalyized = header.pop();

            //Now that the header has been removed parse the actual lines of the file
            return result;
        };

        //return function
        return func;
    }());

    parseToFileObject = (function () {
        //variable declarations
        var func, handleLine, order, parseLine, splitFile;

        //variable definitions
        order = [];

        //functions
        parseLine = function (line) {
            //Variable declarations
            var key, readHeader, splitLine;

            //Variable definitions
            readHeader = {};

            //once we are no longer at the top of the file redefine getKey
            if (!line.match(/^\s+/)) {
                parseLine = function (line, order) {
                    //varialbe declarations
                    var key, keyArr, splitLine;

                    //what to do once we hit protein information
                    line = line.replace(/^\s+|\s+$/g, "");
                    splitLine = line.split('\t');

                    //Get the key and edit it to remove all non word characters and replace them with '_'
                    keyArr = splitLine.splice(0, 3); //This will save in ID_row_col form
                    key = keyArr[order[0]] + "_r" + keyArr[order[1]] + "_c" + keyArr[order[2]];
                    splitLine.shift(); //This removes a blank row.
                    key = key.replace(/\W+/g, "_");
                    key = key.replace(/_+/g, "_");
                    key = key.replace(/^_+|_+$/g, "");
                    return [key, splitLine];
                };
                //This is what to do for the header of the read section
                line = line.replace(/^\s+|\s+$/, "");
                splitLine = line.split('\t');
                readHeader.row = splitLine.indexOf('spotRow');
                readHeader.column = splitLine.indexOf('spotCol');
                readHeader.protID = splitLine.indexOf('ID');

                //if any of the orders are = -1 (< 0) this means they were not found, report a very specific error and kill program
                if (readHeader.row < 0) {
                    throw "File parsing requires Xtab format with spotRow explicity listed in data header (top of recorded data).";
                }
                if (readHeader.column < 0) {
                    throw "File parsing requires Xtab format with spotCol explicitly listed in data header (top of recorded data).";
                }
                if (readHeader.protID < 0) {
                    throw "File parsing requires Xtab format with ID explicity listed in data header (top of recorded data).";
                }
                if (splitLine.length !== 3) {
                    throw "File parsing requires Xtab format with ONLY ID, spotCol, and spotRow explicitly defined, you have more " +
                        "spot data defined";
                }

                return readHeader;
            }
            //At top of file
            line = line.replace(/^\s+|\s+$/g, "");
            splitLine = line.split('\t');

            //Get the key and edit it to remove all non word characters and replace them with '_'
            key = splitLine.shift();
            key = key.replace(/\W+/g, "_");
            key = key.replace(/_+/g, "_");
            key = key.replace(/^_+|_+$/g, "");
            return [key, splitLine];
        };

        func = function (lines) {
            //variable declarations
            var fileObj, fLength, i, parsedLine;
            //variable defintions
            fileObj = {
                data: {},
                meta: {}
            };
            fLength = lines.length;

            //Loop through the file, split it on tabs, and save the row headers as 'keys'
            for (i = 0; i < fLength; i += 1) {
                handleLine(lines[i], fileObj);
            }
            return fileObj;
        };

        handleLine = function (line, fileObj) {
            //variable declarations
            var parsedLine;

            parsedLine = parseLine(line);

            //If it is an array then save as key value pair, otherwise when the information object shows up,
                // save order then redefine this function.
            if (parsedLine && typeof parsedLine === 'object' && parsedLine.constructor === Array) {
                fileObj.meta[parsedLine[0]] = parsedLine[1];
            } else {
                //define order of row, column, ID
                order[0] = parsedLine.protID;
                order[1] = parsedLine.row;
                order[2] = parsedLine.column;

                //redefine function
                handleLine = function (line, fileObj) {
                    //variable declarations
                    var parsedLine;

                    parsedLine = parseLine(line, order);
                    fileObj.data[parsedLine[0]] = parsedLine[1];
                };
            }
        };

        //return function definition
        return func;
    }());

    transformFile = (function () {
        //Variable declarations
        var determineSameness, func, mergeMetaData, getPeptideData, rdfSerialize;
        //Variable definitions

        //functions
        determineSameness = function (arr) {
            //Variable declarations
            var i, comp, length;

            //Variable definitions
            comp = arr[0];
            length = arr.length;

            for (i = 1; i < length; i += 1) {
                if (comp !== arr[i]) {
                    return {array: arr};
                }
            }
            return comp;
        };

        func = function (fileObj) {
            //Variable declarations
            var barWell, finalObj, peptides, metadata;

            //Variable definitions
            finalObj = {};

            for (barWell in fileObj) {
                if (fileObj.hasOwnProperty(barWell)) {
                    metadata = mergeMetaData(fileObj[barWell].meta);
                    peptides = getPeptideData(metadata.dataArr, fileObj[barWell].data);
                    finalObj[barWell] = metadata;
                    finalObj[barWell].peptides = peptides;
                }
            }

            finalObj = rdfSerialize(finalObj);

            return finalObj;
        };

        rdfSerialize = function (fileObj) {
            var i, prop, barwell, val, finalObj, tracer, obj, tuuid, cuuid, temp, parent;

            finalObj = {
                parents: [],
                families: {},
                uuids: {}
            };
            tracer = [];

            //get barwells/parents
            for (barwell in fileObj) {
                if (fileObj.hasOwnProperty(barwell)) {
                    cuuid = Math.uuid();
                    finalObj.parents.push('&' + cuuid);
                    finalObj.uuids[cuuid] = fileObj[barwell];
                    //finalObj.uuids[cuuid].rdfType = 'sample';
                    tracer.push(cuuid);
                    finalObj.families['&' + cuuid] = [];
                }
            }

            while (tracer.length > 0) {
                tuuid = tracer.pop();
                if (finalObj.families.hasOwnProperty('&' + tuuid)) {
                    parent = '&' + tuuid;
                }
                obj = finalObj.uuids[tuuid];
                //When the object is an array
                if (obj instanceof Array) {
                    for (i = 0; i < obj.length; i += 1) {
                        val = obj[i];
                        if (typeof val === 'object') {
                            cuuid = Math.uuid();
                            tracer.push(cuuid);
                            finalObj.uuids[cuuid] = val;
                            finalObj.uuids[tuuid][i] = '&' + cuuid;
                            finalObj.families[parent].push('&' + cuuid);
                        }
                    }
                } else { //An object
                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            val = obj[prop];
                            if (typeof val === 'object') {
                                cuuid = Math.uuid();
                                tracer.push(cuuid);
                                finalObj.uuids[cuuid] = val;
                                finalObj.uuids[tuuid][prop] = '&' + cuuid;  
                                finalObj.families[parent].push('&' + cuuid);
                                //finalObj.uuids[cuuid].rdfType = prop;
                            }
                        }
                    }
                }
            }
            return finalObj;
        };

        getPeptideData = function (metaDataArr, peptidesIn) {
            //variable declarations
            var arrLength, i, maxCycle, peptide, peptideCount, peptidesOut, prop, targetObj, targetProp;

            //variable definitions
            arrLength = metaDataArr.cycle.length;
            maxCycle = Math.max.apply(null, metaDataArr.cycle);
            peptideCount = 0;
            peptidesOut = {};


            //Change dataArr into two parts: postWash and timeSeries
            for (i = 0; i < arrLength; i += 1) {
                if (metaDataArr.cycle[i] < maxCycle) { // Defined in previous function and checked for existance
                    targetObj = metaDataArr.timeSeries; //Defined in previous function
                    targetProp = 'timeSeries';
                } else {
                    targetObj = metaDataArr.postWash; //Defined in previous function
                    targetProp = 'postWash';
                }
                //This is for the 'meta data'
                for (prop in metaDataArr) {
                    if (metaDataArr.hasOwnProperty(prop) &&
                            (prop !== 'timeSeries' && prop !== 'postWash')) {
                        targetObj[prop] = targetObj[prop] || [];
                        targetObj[prop].push(metaDataArr[prop][i]);
                    }
                }
                //This is for the peptide specific data
                for (peptide in peptidesIn) {
                    if (peptidesIn.hasOwnProperty(peptide)) {
                        peptideCount += 1;
                        peptidesOut[peptide] = peptidesOut[peptide] || {
                            timeSeries: {number: []},
                            postWash: {number: []}
                        };
                        peptidesOut[peptide][targetProp].number.push(peptidesIn[peptide][i]);
                    }
                }
            }

            //Loop through one more time and delete old (non timeseries or postwash) objects
            for (prop in metaDataArr) {
                if (metaDataArr.hasOwnProperty(prop) &&
                        (prop !== 'timeSeries' && prop !== 'postWash')) {
                    delete metaDataArr[prop];
                }
            }

            //Make final metadata check to determine if both post wash and timeseries information have been given
            if (metaDataArr.timeSeries.cycle === undefined) {
                throw "Must export cycle numbers from bionavigator in xtab format for time " +
                    "series and post wash data to use this parser (You are missing time series).";
            }
            if (metaDataArr.postWash.exposureTime === undefined || metaDataArr.postWash.exposureTime.length === 1) {
                throw "Must export cycle numbers from bionavigator in xtab format for time " +
                    "series and post wash data to use this parser (You are missing post wash).";
            }
            if (peptideCount < 2) {
                throw "Must export from bionavigator in xtab format to use this parser. " +
                    "There were no peptides detected.";
            }
            return peptidesOut;
        };

        mergeMetaData = function (metaDataObj) {
            //variable declarations
            var  prop, result, returnObj;

            //variable definitions
            returnObj = {
                array: metaDataObj.Array || undefined,
                barcode: metaDataObj.Barcode || undefined,
                col: metaDataObj.Col || undefined,
                dataArr: {
                    cycle: metaDataObj.Cycle || undefined,
                    exposureTime: metaDataObj.Exposure_time || undefined,
                    timeSeries: {},
                    postWash: {}
                },
                filter: metaDataObj.Filter || undefined,
                imageTimestamp: metaDataObj.Image_timestamp || undefined,
                gridID: metaDataObj.GridID || undefined,
                gridType: metaDataObj.Grid_type || undefined,
                instrumentType: metaDataObj.Instrument_type || undefined,
                instrumentUnit: metaDataObj.Instrument_unit || undefined,
                lampPower: metaDataObj.Lamp_power || undefined,
                lampRefrencePower: metaDataObj.Lamp_refrence_power || undefined,
                pamchipLocation: metaDataObj.PamChip_Location || undefined,
                row: metaDataObj.Row || undefined,
                temperature: metaDataObj.Temperature || undefined,
                image: metaDataObj.Image || undefined
            };

            //Make sure all the needed parts were defined and save arrays for data that changed through the experiment.
            for (prop in returnObj) {
                if (returnObj.hasOwnProperty(prop) && prop !== 'dataArr') {
                    if (returnObj[prop] === undefined) {
                        throw "Error: file must contain " + prop + " and be exported in xTab form.";
                    }
                    result = determineSameness(returnObj[prop]);
                    if (result.array) {
                        returnObj.dataArr[prop] = result.array;
                        delete returnObj[prop];
                    } else {
                        returnObj[prop] = result;
                    }
                }
            }

            //make sure both exposure time and cycle numbers were found
            if (returnObj.dataArr.cycle === undefined) {
                throw "Must export cycle numbers from bionavigator in xtab format to use this parser.";
            }
            if (returnObj.dataArr.exposureTime === undefined) {
                throw "Must export exposure time from bionavigator in xtab format to use this parser";
            }

            return returnObj;
        };

        return func;
    }());

    self.onmessage = function (event) {
        //variable declarations
        var barWellObj, fileArr, fileObj, headerInfo;

        //process file
        fileArr = beginParse(event.data);

        //get tiltle line infos
        headerInfo = getTitleInfo(fileArr.shift());

        //Turn file into key, value pairing (fileObj.meta, and fileObj.data contain the lines)
        fileObj = parseToFileObject(fileArr);

        //Describe file by barcode/well combinations instead of file column/row combination
        fileObj = collectBarWell(fileObj);

        //make the final transformation to barcode/well from barcode_well->arrays to 
            //barcode_well: {metadata, ..., peptides: { peptide: {timeSeries: {dataArr}, postwash: {dataArr}}}}
            //Note that in an effort to store less data no link to cycle number nor exposure time was made in peptide
            //That will be added by creating the functional peptide on the other side of this processing
        barWellObj = transformFile(fileObj);

        self.postMessage(barWellObj);
    };


}());