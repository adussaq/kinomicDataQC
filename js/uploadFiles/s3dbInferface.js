s3dbUI = {

JSON:function()
	{
	var the = s3dbUI.JSON;
	the.s3dbURL='uab.s3db.org/s3db';
	the.fileRuleId = '769';
	the.orginFilesCID='158';
	the.jsonCID='160';
	the.rdfCID='162';
		    
	},
collectionSelection:function()
	{
	var the = s3dbUI.JSON;
		
	$('#ORIGINcol').click(function (e) 
		{
	  	e.preventDefault();
	  	$(this).tab('show');
	  	s3dbUI.changeTable(the.orginFilesCID)
		});
	$('#JSONcol').click(function (e) 
		{
	  	e.preventDefault();
	  	$(this).tab('show');
	  	s3dbUI.changeTable(the.jsonCID)
		});
	$('#RDFcol').click(function (e) 
		{
	  	e.preventDefault();
	  	$(this).tab('show');
	  	s3dbUI.changeTable(the.rdfCID)
		});	
	},

changeTable:function(CID)
	{
	var the = s3dbUI.JSON;
	var func = s3dbUI;
	$(".table[role='presentation']").find("tr").remove();
	var page =  s3dbfu.s3dburl();
	page = page.replace(/(http|ftp|https):\/\//,'http:\/\/' );
	
	/*$('#fileupload').fileupload(
		{
    	url: page +'/multiupload.php?key='+s3dbfu.apikey()+'&collection_id='+CID+'&rule_id='+s3dbfu.ruleid()+'&format=json',
		done: function(e,data) {s3dbUI.tableLoadCallback(e,data);}},
			        'option',
			        'redirect',
			        
			        window.location.href.replace(
			            /\/[^\/]*$/,
			            '/cors/result.html?%s'
			        )
		);*/
	
	$("#fileupload").attr('action', page +'/multiupload.php?key='+s3dbfu.apikey()+'&collection_id='+CID+'&rule_id='+s3dbfu.ruleid()+'&format=json');
    
	// Load S3DB's existing files for the specified collection:
	/*$('#fileupload').each(function () 
 		{
 		var that = this;
 		console.log(this.action);
	    $.getJSON(this.action, function (result) 
 			{
        	if (result && result.length) 
 				{
                var tmp_str,tmp_str1,reg=/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/;
		        for(var i=0; i < result[0].message.result.length; i++) 
			 		{
	    			tmp_str = result[0].message.result[i].value.replace(' ', '');
				    tmp_str1 = tmp_str.match(reg);
        			if(tmp_str1 && tmp_str1.length > 0) 
 						{
			    	    result[0].message.result[i].download_url = tmp_str1[0];
	         			} 
		 			else 
 						{
					    result[0].message.result[i].download_url = '#';
					    }
		     		//fix delete button
    		    	}
				 $(that).fileupload('option', 'done').call(that, null, {result: result[0].message.result});
            	}
		 	});
		
		});*/
	
 	},

tableLoadCallback:function(e,data)
	{
	var func = s3dbUI;
	console.log(e,data);
	if( e == null )
		{
		func.addToTable();
		}
	else
		{
		func.addToTableMin();
		}
	},

addToTable:function()
	{
	console.log("I work!");
	$(".table[role='presentation']").prepend("<tr><th>Add to QC</th><th></th><th>File</th><th>Size</th><th></th><th></th><th>Delete</th></tr>");
	var rows = $(".table[role='presentation']").find("tr");
	for( var ind=1; ind<rows.length; ind++ )
		{
		$(rows[ind]).prepend('<td><button type="reset" class="btn btn-success" id="addBars'+ind+'"><i class="icon-plus icon-white"></i></button></td>');
		$('#addBars'+ind).val(amdjs.clone($(rows[ind]).find('a').attr('href')));
		$('#addBars'+ind).click(function()
			{
			workers.fileImporter($(this).val());
			});
		}
	},
	
addToTableMin:function()
	{
	console.log("I work as well!");
	//$(".table[role='presentation']").prepend("<tr><th>Add to QC</th><th></th><th>File</th><th>Size</th><th></th><th></th><th>Delete</th></tr>");
	var rows = $(".table[role='presentation']").find("tr");
	for( var ind=1; ind<rows.length; ind++ )
		{
		if( $('#addBars'+ind) != [] ) { break; }
		$(rows[ind]).prepend('<td><button type="reset" class="btn btn-success" id="addBars'+ind+'"><i class="icon-plus icon-white"></i></button></td>');
		$('#addBars'+ind).val(amdjs.clone($(rows[ind]).find('a').attr('href')));
		$('#addBars'+ind).click(function()
			{
			workers.fileImporter($(this).val());
			});
		}
	}

	

	
}
s3dbUI.collectionSelection();
s3dbUI.JSON();

