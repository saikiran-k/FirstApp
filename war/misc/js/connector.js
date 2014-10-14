/**
 * Connector for connecting to various crms, as of now connects directly to AgileCRM through its developer's api.
 * **/
function CRMConnector()
{
	if(!USER_SETTINGS)
	{
		this.init_status=false;
		return;
	}
	
	var settings=USER_SETTINGS;
	
	if(settings.crm)
	{
		this.headers = { Authorization:"xx "+btoa(settings.email+':'+settings.apikey) };
	//	this.base_url="https://"+settings.domain+".agilecrm.com/dev/api/";
		this.base_url="https://"+settings.domain+"-dot-sandbox-dot-agile-crm-cloud.appspot.com/dev/api/";
		this.js_url='https://'+settings.domain+'.agilecrm.com/core/js/api/';
	}
	
	this.init_status=true;
}

CRMConnector.prototype.notifications=function(onLoad,cursor){
	console.log('Running...');
	if(!cursor)cursor='';
	
	$.ajax({
		type:"GET",
		url:"http://agilecrmio.appspot.com/core/active-stream?page_size=5&cursor="+cursor,
		dataType:"json",
		success:function(response){ 
					if(response.length && response[response.length-1].stats_cursor)
					{
						response[response.length-1].next_url='http://agilecrmio.appspot.com/core/active-stream?page_size=5&cursor='+response[response.length-1].stats_cursor;
					}
					onLoad(response); 
				},
		error: function (jqXHR, textStatus, errorThrown) {
					console.log("Error - ");
				}
	});
};

CRMConnector.prototype.liveNotifications=function(onLoad){
	
	if(!USER_SETTINGS.crm)return;
	
	$.ajax({
		type:"GET",
		url:this.base_url+"notifications",
		dataType:"json",
		headers:this.headers,
		success:function(response){ onLoad(response); },
		error: function (jqXHR, textStatus, errorThrown) {
					console.log("Error - ");
				}
	});
};

CRMConnector.prototype.upcomingTasks=function(onLoad){
	
	if(!USER_SETTINGS.crm)return;
	
	$.ajax({
		type:"GET",
		url:this.base_url+"tasks/my/dashboardtasks",
		dataType:"json",
		headers:this.headers,
		success:function(response){ onLoad(response); },
		error: function (jqXHR, textStatus, errorThrown) {
					console.log("Error - ");
				}
	});
};

CRMConnector.prototype.search=function(keyword,onLoad){
	
	if(!USER_SETTINGS.crm)return;
	
	$.ajax({
		type:"GET",
		url:this.base_url+"search/all/"+keyword+"?page_size=5&type=person",
		dataType:"json",
		headers:this.headers,
		success:function(response){ onLoad(response); },
		error: function (jqXHR, textStatus, errorThrown) {
					console.log("Error - ");
				}
	});
};

CRMConnector.prototype.loadUrl=function(userUrl,onLoad){
	
	if(!USER_SETTINGS.crm)return;
	
	$.ajax({
		type:"GET",
		url:userUrl,
		dataType:"json",
		headers:this.headers,
		success:function(response){ onLoad(response); },
		error: function (jqXHR, textStatus, errorThrown) {
					console.log("Error - ");
				}
	});
};

CRMConnector.prototype.loadSimpleUrl=function(userUrl,onLoad){
	$.ajax({
		type:"GET",
		url:userUrl,
		dataType:"json",
		headers:this.headers,
		success:function(response){ onLoad(response); },
		error: function (jqXHR, textStatus, errorThrown) {
					console.log("Error - ");
				}
	});
};

CRMConnector.prototype.loadTemplatesInfo=function(onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Loading Template List');
	$.ajax({
		type:'GET',
		url:this.base_url+'email/templates',
		headers:this.headers,
		dataType:'json',
		success:function(resp){ onLoad(resp); },
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(); 
		}
	});
};

CRMConnector.prototype.loadTemplate=function(templateFile,onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Loading Template : '+templateFile);
	$.ajax({
		type:'GET',
		url:this.base_url+'template/content?path='+encodeURIComponent('email/'+templateFile),
		headers:this.headers,
		dataType:'text',
		success:function(resp){ onLoad(resp); },
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(); 
		}
	});
};

CRMConnector.prototype.getContactDetails=function(emailId,onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Getting info : '+emailId);
	$.ajax({
		type:'GET',
		url:this.base_url+'contacts/search/email/'+emailId,
		headers:this.headers,
		dataType:'json',
		success:function(resp){ 
			onLoad(resp); 
			console.log('got info');
		},
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(); 
		}
	});
};

CRMConnector.prototype.addContact=function(contact,onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Add contact hit : -----');
	console.log(contact);
	//return;
	
	$.ajax({
		type:'POST',
		url:this.base_url+'contacts',
		headers:this.headers,
		data:JSON.stringify(contact),
		dataType:'json',
		contentType: "application/json",
		success:function(resp){ 
			onLoad(resp); 
		},
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(xhr); 
		}
	});
};

CRMConnector.prototype.addTask=function(email,task,onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Add task hit : -----');
	console.log(task);
	//return;
	
	$.ajax({
		type:'POST',
		url:this.base_url+'tasks/email/'+email,
		headers:this.headers,
		data:JSON.stringify(task),
		dataType:'json',
		contentType: "application/json",
		success:function(resp){ 
			onLoad(resp); 
		},
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(xhr); 
		}
	});
};

CRMConnector.prototype.createTask=function(task,onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Add task hit : -----');
	console.log(task);
	//return;
	
	$.ajax({
		type:'POST',
		url:this.base_url+'tasks',
		headers:this.headers,
		data:JSON.stringify(task),
		dataType:'json',
		contentType: "application/json",
		success:function(resp){ 
			onLoad(resp); 
		},
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(xhr); 
		}
	});
};

CRMConnector.prototype.updateTask=function(task,onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Update task hit : -----');
	console.log(task);
	//return;
	
	$.ajax({
		type:'POST',
		url:this.base_url+'tasks',
		headers:this.headers,
		data:JSON.stringify(task),
		dataType:'json',
		contentType: "application/json",
		success:function(resp){ 
			onLoad(resp); 
		},
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(xhr); 
		}
	});
};

CRMConnector.prototype.addDeal=function(email,deal,onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Add deal hit : -----');
	console.log(deal);
	//return;

	$.ajax({
		type:'POST',
		url:this.base_url+'opportunity/email/'+email,
		headers:this.headers,
		data:JSON.stringify(deal),
		dataType:'json',
		contentType: "application/json",
		success:function(resp){ 
			onLoad(resp); 
		},
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(xhr); 
		}
	});
};

CRMConnector.prototype.createDeal=function(deal,onLoad,onError){
	if(!USER_SETTINGS.crm)return;
	console.log('Add deal hit : -----');
	console.log(deal);
	//return;

	$.ajax({
		type:'POST',
		url:this.base_url+'opportunity',
		headers:this.headers,
		data:JSON.stringify(deal),
		dataType:'json',
		contentType: "application/json",
		success:function(resp){ 
			onLoad(resp); 
		},
		error: function(xhr,status,err){ 
			console.log('Error');
			if(typeof(onError)=='function')onError(xhr); 
		}
	});
};
