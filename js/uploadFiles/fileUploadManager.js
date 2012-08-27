//Global variables and function declarations
fileUpload = 
	{
	//Variables
	loggedIn:false,
	
	//Functions
	setUploadToS3DB:function(){},
	setUploadToFUSE:function(){}
	
	};



//Private variables and functions
(function()
	{
	//Variables
	
	
	//Variables with definitions
	var currentUpload = $('#defaultFile');
	var main = fileUpload;
	var menuText = 'Select Database';
	var nameText = "Login";
	
	//Local functions
	var changeDisplay = function()
		{
		$('.fileOpts').hide();
		currentUpload.show();
		$('#curData').text(menuText);
		$('#username').html(nameText);
		}
	
	
	//Global function definitions
	main.setUploadToS3DB = function()
		{
		var inner = function()
			{
			//Switches display and functionality to S3DB
			main.loggedIn = true;
			currentUpload = $('#S3DBupload');
			menuText = 'S3DB';
			nameText = s3dbfu.username();
			changeDisplay();
			}
		//Check to see if logged in
		if(s3dbfu.apikey()!=""){ main.setUploadToS3DB = inner; inner(); }
		else
			{
			main.loggedIn = false;
			currentUpload = $('#defaultFile');
			menuText = 'S3DB';
			nameText = 'Login';
			changeDisplay();
			}
		}
	
	main.setUploadToFUSE = function()
		{
		var inner = function()
			{
			main.loggedIn = true;
			//Switches display and functionality to Fusion Tables
			currentUpload = $('#fusionUpload');
			menuText = 'Fusion Tables';
			nameText = fuse.JSON.userName;
			changeDisplay();
			}
		if(fuse.JSON.loggedIn){ main.setUploadToFUSE =inner; inner();}
		else
			{
			main.loggedIn = false;
			currentUpload = $('#defaultFile');
			menuText = 'Fusion Tables';
			nameText = 'Login';
			changeDisplay();
			}
		}
	
	//Initiate the display
	changeDisplay();
	

	
	}())//End private