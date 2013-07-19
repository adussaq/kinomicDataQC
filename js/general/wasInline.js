// I do not know what this is for, but it allows the google charts to work :P
window["_GOOG_TRANS_EXT_VER"] = "1";
google.load('visualization', '1', {packages: ['corechart']});

//This is to get the tabs to work at the top of the toolbox
$('#tag1').click(function (e) 
		{
	  	e.preventDefault();
	  	$(this).tab('show');
		});
	$('#tag2').click(function (e) 
		{
	  	e.preventDefault();
	  	$(this).tab('show');
		});
	$('#tag3').click(function (e) 
		{
	  	e.preventDefault();
	  	$(this).tab('show');
		KINOMICS.fileManager.UI.navigationBar.setDataType();
		});
		

Math.uuid = function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b};
