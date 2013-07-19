expandBarcodeWell = (function () {
            //variable declarations
            var addSetterProp, changes, createObject, func, save, toString, userSave, userToString, toNumber;
            //variable definitions
            changes = [];

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