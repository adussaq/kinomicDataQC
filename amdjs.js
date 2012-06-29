amdjs = {

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
		}
	else if( typeof options.step == undefined )
		{
		options.step = x0.map(function(s){return s/100;});	
		}
	else if( typeof options.maxItt == undefined )
		{
		options.maxItt = 10000;	
		}
		
		
	for( itt = 0; itt<options.maxItt; itt++ )
		{
		var x1 = amdjs.clone(x0)
		for( parI in x1 )
			{
			x1[parI]+=options.step[parI];
			if( sqrSumOfErrors(fun, X,y,x1)<sqrSumOfErrors(fun, X,y,x0) )
				{
				x0[parI]=x1[parI];
				options.step[parI]*=1.2;
				}
			else
				{
				options.step[parI]*=-0.5;
				}
			} 
		}
	//I added the following 'R^2' like calculation. It is not included in fmincon, but
		// is useful for my needs.
		var SSDTot = sqrSumOfDeviations(y);
		var SSETot = sqrSumOfErrors(fun, X, y, x0);
		var corrIsh = 1-SSETot/SSDTot;
	
	return [amdjs.clone(x0), SSETot, corrIsh];
	
	
	
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
	var srcE =new Object();
	var h;
	srcE.value = equation;
	var ms = srcE.value.replace(/&([-#.\w]+);|\\([a-z]+)(?: |(?=[^a-z]))/ig,
			function(s, e, m) 
				{
				if (m && (M.macros_[m] || M.macro1s_[m]))	return s;	// e.g. \it or \sc
				var t = '&'+(e || m)+';', res = $('<span>'+t+'</span>').text();
				return res != t ? res : ents_[e || m] || s;
				}),
	h = ms.replace(/</g, '&lt;');
	
	if (srcE.value != h)	srcE.value = h;	// assignment may clear insertion point
	var t;
	try {t = M.sToMathE(ms, true);} 
	catch(exc) {t = String(exc);}
	return t.innerHTML;
	},	

}