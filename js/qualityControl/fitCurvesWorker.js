/*global self: false */

// TODO: check user input...

//Container for all code. Will be run on load
(function () {
	'use strict';

	//variable declarations
	var fmincon, determineRunningConditions, postWashFunc, timeSeriesFunc;

	//variable definitions


	//function definitions
	fmincon = (function () {
		//please note - this is a minimized version of fmincon from amdjs_1.1.0.js
		//variable declarations
		var avg, sqrSumOfErrors, sqrSumOfDeviations, func;

		//variable defintions

		//function definitions
		func = function (fun, x0, X, y) {
			//variable definitions
			var corrIsh, count, itt, lastItter, options, parI, SSDTot, sse, SSETot, x1;

			//variable declarations
			options = {
				step: x0.map(function (s) {return s / 100; }),
				maxItt: 1000,
				minPer: 1e-6
			};
			lastItter = Infinity;
			count = 0;
			x1 = JSON.parse(JSON.stringify(x0));

			//Actually begin looping through all the data
			for (itt = 0; itt < options.maxItt; itt += 1) {

				//Go through all the parameters
				for (parI in x1) {
					if (x1.hasOwnProperty(parI)) {
						x1[parI] += options.step[parI];
						if (sqrSumOfErrors(fun, X, y, x1) < sqrSumOfErrors(fun, X, y, x0)) {
							x0[parI] = x1[parI];
							options.step[parI] *= 1.2;
						} else {
							x1[parI] = x0[parI];
							options.step[parI] *= -0.5;
						}
					}
				}

				//make it so it checks every 3 rotations for end case
				if ((itt % 3) === 0) {
					sse = sqrSumOfErrors(fun, X, y, x0);
					if (Math.abs(1 - sse / lastItter) < options.minPer) {
						break;
					} else {
						lastItter = sse;
					}
				}
			}

			//I added the following 'R^2' like calculation.
			SSDTot = sqrSumOfDeviations(y);
			SSETot = sqrSumOfErrors(fun, X, y, x0);
			corrIsh = 1 - SSETot / SSDTot;
			return {parameters: x0, totalSqrErrors: SSETot, R2: corrIsh};
		};

		sqrSumOfErrors = function (fun, X, y, x0) {
			//variable declarations
			var error = 0, i, n = X.length;
			for (i = 0; i < n; i += 1) {
				error += Math.pow(fun(X[i], x0) - y[i], 2);
			}
			return error;
		};

		sqrSumOfDeviations = function (y) {
			//variable declarations
			var avg, error, length, i;
			//variable definitions
			error = 0;
			avg = 0;
			length = y.length;
			//find average
			for (i = 0; i < length; i += 1) {
				avg += y[i];
			}
			avg = avg / length;
			//find ssd
			for (i = 0; i < length; i += 1) {
				error += Math.pow(y[i] - avg, 2);
			}
			return error;
		};



		//return function
		return func;
	}());

	determineRunningConditions = function (points, type) {
		//variable declarations
		var func, i, X, xIni, xS, xVec, xMax, xMin, y0, yIni, yMax, yMin, yN,
			Ym, vi, c, params, length;
		//variable defintions
		if (type === 'postWash') {
			func = postWashFunc;
			X = points.exposureTime;
		} else {
			func = timeSeriesFunc;
			X = points.cycleNum;
		}
		xIni = [];
		xVec = [];
		yIni = [];
		length = X.length;

		//determine what points are 'good'
		for (i = 0; i < length; i += 1) {
			if (points.goodData[i]) {
				xIni.push([X[i]]);
				xVec.push(X[i]);
				yIni.push(points.number[i]);
			}
		}

		if (type === "postWash") {
			xMin = Math.min.apply(null, xVec);
			yMin = Math.min.apply(null, yIni);
			yMin = yMin === 0 ? 10 : yMin;
			xMin = xMin === 0 ? 10 : xMin;
			params = [yMin / xMin, xMin];
		} else {
			//P[0] = Yo P[1]=k, P[2]= Xo, p[3] = Ymax
			xS = JSON.parse(JSON.stringify(xVec));
			xS = xS.sort();
			xMin = xS.shift();
			xMax = xS.pop();
			y0 = yIni[xVec.indexOf(xMin)];
			yN = yIni[xVec.indexOf(xMax)];
			yMin = Math.min.apply(null, yIni);
			yMax = Math.max.apply(null, yIni);

			//Deal with overall negative slopes
			Ym = ((yN - y0) / (xMax - xMin) < 0) ? yMin : yMax;

			//Assign parameters
			vi = Ym / 5;
			vi = vi === 0 ? -10 : vi;
			Ym = Ym === 0 ? -10 : Ym;
			// y0 = Ym === y0 ? Ym - 1 : y0;
			// c = Ym * y0 / (vi * (y0 - Ym)) + xMin;
			c = y0 / xMin;
			params =  [vi, c, Ym];
		}
		return {params: params, X: xIni, y: yIni, func: func};
	};

	postWashFunc = function (xVector, params) {
		//Y = mx+b, params[0]=m, parmas[1]=b
		return params[0] * xVector[0] + params[1];
	};

	timeSeriesFunc = function (xVector, P) {
		//Yo + 1/[1/(k*[x-Xo])+1/Ymax]   P[0]=k, P[1]= Xo, p[2] = Ymax
		//if( xVector[0] < P[1] ) {return 0;}
		return 1 / (1 / (P[0] * (xVector[0] - P[1])) + 1 / P[2]);
		//return params[0]+1/(1/(params[1]*(xVector[0]-params[2]))+1/params[3]);
	};

	self.onmessage = function (event) {
		//variable declarations
		var barcode, peptide, points, result, runCond, type, x0;
		//variable definitions
		barcode = event.data[1];
		peptide = event.data[2];
		points = event.data[0];
		type = event.data[3];

		runCond = determineRunningConditions(points, type);

		result = fmincon(runCond.func, runCond.params, runCond.X, runCond.y);

		//return result
		self.postMessage([barcode, peptide, type, result]);
	};
}());