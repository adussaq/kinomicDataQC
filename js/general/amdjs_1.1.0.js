amdjs = {

//Wilcoxon signed-rank test
wilcoxonSR:function( arr1, arr2 )
	{
	//Documentation is copied from http://en.wikipedia.org/wiki/Wilcoxon_signed-rank_test#Test_procedure
	
	var arrComp = new Array();
	
	//Make sure the arrays are the same length
	if( arr1.length != arr2.length )
		{
		return false;
		}
	
	
	//For i = 1, ..., N, calculate |x_2,i-x_1,i| and sgn(x_2,i-x_1,i), where sgn is the sign function.
	//Exclude pairs with x_2,i-x_1,i=0. 
	for( var ind in arr1 )
		{
		var dif = arr2[ind]-arr1[ind];
		if( dif > 0 )
			{
			arrComp.push({"diff":dif, "sgn":1});
			}
		else if( dif < 0 )
			{
			arrComp.push({"diff":-1*dif, "sgn":-1});
			}
		}
	//Let Nr be the reduced sample size.	
	var Nr = arrComp.length;
	
	//Order the remaining  pairs from smallest absolute difference to largest absolute difference.
	arrComp=arrComp.sort( function(a,b){return parseFloat(a.diff)-parseFloat(b.diff)});
	
	// Rank the pairs, starting with the smallest as 1. 
	// Ties receive a rank equal to the average of the ranks they span. 
	// Let Ri denote the rank.
	// Calculate the test statistic W. W=|Sum[sgn(x_2,i-x_1,i)*Ri,i=1,Ni]|, 
	// the absolute value of the sum of the signed ranks.
	var W = 0, Ri=1, lastVal=0;
	for( var ind=0; ind<Nr; ind++ )
		{
		if( lastVal == arrComp[ind].diff ) 
			{Ri--;}
		W+=arrComp[ind].sgn*Ri;
		Ri++;
		lastVal=arrComp.diff;
		}
	return Math.abs(W);
	//Test data should equal 9
	// ar1= [125,	115,	130,	140,	140,	115,	140,	125,	140,	135];
	// ar2=[110,	122,	125,	120,	140,	124,	123,	137,	135,	145];	
	},


//My attempt at curve fitting. Should be generalizable to multiple x dimensions, although
	// I have not done significant testing.
fmincon:function(fun, x0, X, y, options)
	{
	//Options must be entered as an object
	// Very loosely based on fmincon:function(fun,x0,A,b,Aeq,beq,lb,ub,nonlcon,options)
		// from matlab

	// function for the calculation of error
	var sqrSumOfErrors = function(fun, X, y, x0)
		{
		var error = 0;
		for( var i in X )
			{
			error += Math.pow(fun(X[i], x0)-y[i],2);
			}
		return error;
		}
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
		}
	
	
	//Set the options
	if( typeof options == undefined || typeof options != Object )
		{
		options = new Object();
		options.step = x0.map(function(s){return s/100;});	
		options.maxItt = 1000;
		options.minPer=1e-6;
		}
	if( typeof options.step == undefined )
		{
		options.step = x0.map(function(s){return s/100;});	
		}
	if( typeof options.maxItt == undefined )
		{
		options.maxItt = 1000;	
		}
	if( typeof options.minPer == undefined )
		{
		options.minPer = 1e-6;
		}	
	
	var lastItter = Infinity;
	var count = 0;
	var x1 = amdjs.clone(x0)
		
	for( itt = 0; itt<options.maxItt; itt++ )
		{	
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
				x1[parI]=x0[parI];
				options.step[parI]*=-0.5;
				}
			} 
		
		//make it so it checks every 3 rotations for end case
		if( (itt %3) === 0 )
			{
			var sse = amdjs.sqrSumOfErrors(fun, X,y,x0);
			if( Math.abs( 1- sse/lastItter )< options.minPer )
				{
				break;
				}
			else
				{
				lastItter = sse;
				}
			}
		}

	
	var SSETot = sqrSumOfErrors(fun, X, y, x0);
	
	
	
	return [amdjs.clone(x0), SSETot];
	
	
	
	/*//Temporary variables from testing
	var X = [[32],[37],[42],[47],[52],[57],[62],[67],[72],[77],[82],[87],[92]];
	var y = [749,1525,1947,2201,2380,2537,2671,2758,2803,2943,3007,2979,2992];
	var fun = function( xVector, params )
		{
		return params[0]+params[1]*(1-Math.exp(-params[2]*(xVector[0]-params[3])));
		}
	//var x0 = [749,3007,0.1,32];
	var x0 = [100,3000,1,30];
	*/	
	},

refresh:function(){return ""},
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

//Average an array
Arr_avg:function(A)
	{ 
	return amdjs.sum(A)/A.length;
	},

//clone object without functional elements
clone:function(x)
	{ 
	return JSON.parse(JSON.stringify(x))
	},

//Multiply two matrices
matrixMult:function( mat1, mat2 )
	{
	if( typeof mat1 == undefined || typeof mat1[0] == undefined ||  
	    typeof mat2 == undefined || typeof mat2[0] == undefined ||
	    mat1[0].length != mat2.length)
	    {return undefined;}
	var height = mat1.length;
	var width = mat2[0].length;
	var otherDim = mat1[0].length;
		
	if( height == 1 && width == 1 )
		{
		var res = 0;
		for( var i = 0; i<otherDim; i++ )
			{
			res += mat1[0][i]*mat2[i][0];
			}
		return res;
		}
		
		
	var res = new Array();
		
	for( var hInd = 0; hInd<height; hInd++ )
		{
		res[hInd] = new Array();
		for( var wInd = 0; wInd<width; wInd++ )
			{
			res[hInd][wInd]=0;
			for( var oInd = 0; oInd<otherDim; oInd++ )
				{
				res[hInd][wInd]+=mat1[hInd][oInd]*mat2[oInd][wInd];
				}
			}
		}
	return res;
	},

//This function converts math strings into the proper form, requires mathscribe/jqmath
doMathSrc:function(equation) 
	{
	/*var h, ms, t, srcE = {};
	srcE.value = equation;
	ms = srcE.value.replace(/&([-#.\w]+);|\\([a-z]+)(?: |(?=[^a-z]))/ig,
			function(s, e, m) 
				{
				if (m && (M.macros_[m] || M.macro1s_[m]))	return s;	// e.g. \it or \sc
				t = '&'+(e || m)+';', res = $('<span>'+t+'</span>').text();
				return res != t ? res : ents_[e || m] || s;
				}),
	h = ms.replace(/</g, '&lt;');
	
	if (srcE.value != h)	srcE.value = h;	// assignment may clear insertion point
	try {t = M.sToMathE(ms, true);} 
	catch(exc) {t = String(exc);}*/
	var aba = M.sToMathE(equation);
	return aba;//.outerHTML //|| $(aba).html();
	},	

}