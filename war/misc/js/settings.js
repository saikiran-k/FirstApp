var USER_SETTINGS={};

var sucess_msg = "<strong>Verification successful</strong> - Your preferences have been successfully saved. <br/><strong>Please restart the browser</strong> -> The new credentials will be applied after you restart your browser.";

/**	
	Save settings via chrome.storage.local
**/
function saveSettings(settings,onSaved)
{
	if(!settings)return;
	
	chrome.storage.local.set({'USER_SETTINGS': settings}, function(){
		console.log(chrome.runtime.lastError);
		console.log('User settings saved.');
		if(onSaved)
			onSaved();
	});
	chrome.storage.sync.set({'USER_SETTINGS': settings}, function(){
		console.log(chrome.runtime.lastError);
		console.log('User settings saved.');
		if(onSaved)
			onSaved();
	});

}

/** 
	Load USER_SETTINGS from chrome.storage
**/
function loadSettings(onLoad)
{
	chrome.storage.local.get(function(item){
		if(item.USER_SETTINGS)
		{
			USER_SETTINGS=item.USER_SETTINGS;
			console.log(USER_SETTINGS);
		}
		else USER_SETTINGS={};
		
		if(onLoad)onLoad();
	});
}

function showOnlyClass(cls)
{
	var elem=$("div#crm-user-settings>p");
	elem.hide();
	elem.filter('.'+cls).show();
}


function unsubscribeToPubNub(oldDomain)
{
	//console.log('Unsubscribe to pubnub.--------',oldDomain);
	var pubnub = PUBNUB.init({ 'publish_key' : 'pub-c-e4c8fdc2-40b1-443d-8bb0-2a9c8facd274','subscribe_key' : 'sub-c-118f8482-92c3-11e2-9b69-12313f022c90', ssl : true, origin : 'pubsub.pubnub.com' });
		pubnub.ready();
	 pubnub.unsubscribe({
				channel : oldDomain,
			 });
}

$(function(){

	loadSettings(function(){
		
		if(USER_SETTINGS.assoc_email)
		{
			$("input[name='assoc-user-email']").val(USER_SETTINGS.assoc_email);
		}
		else $("div#crm-integration").hide();
		
		if(USER_SETTINGS.crm)
		{
			var elem_settings=$('form#agile-form');
		
			//elem_settings.find("input[name='user-name']").val(USER_SETTINGS.name);
			elem_settings.find("#inputEmail").val(USER_SETTINGS.email);
			elem_settings.find("#inputDomain").val(USER_SETTINGS.domain);
			elem_settings.find("#inputKey").val(USER_SETTINGS.apikey);
		
			showOnlyClass(USER_SETTINGS.crm);
			$("div#crm-selection>div[data-crm='"+USER_SETTINGS.crm+"']").addClass('active');
			
			$('#setting_link').show();
			$('#setting_link').attr('href','https://'+USER_SETTINGS.domain+'.agilecrm.com/#notification-prefs');
		}
		else
		{
			showOnlyClass('_agile');
			$("div#crm-selection>div[data-crm='_agile']").addClass('active');
		}
	});
	
	$("#agile-submit").on("click",function(){
		var elem_settings=$('form#agile-form');
		if(USER_SETTINGS.domain)
		USER_SETTINGS.oldDomain = USER_SETTINGS.domain;
		changeSubmit('disable');
		//USER_SETTINGS.crm=$("div#crm-selection>div.active").data('crm');
		//USER_SETTINGS.name=elem_settings.find("input[name='user-name']").val();
		USER_SETTINGS.email=elem_settings.find("#inputEmail").val();
		USER_SETTINGS.domain=elem_settings.find("#inputDomain").val();
		USER_SETTINGS.apikey=elem_settings.find("#inputKey").val();
		USER_SETTINGS.crm = 'agilecrm';
		
		$.ajax({
			type: "get",
			url: "https://"+USER_SETTINGS.domain+".agilecrm.com/core/js/api/email?id="+USER_SETTINGS.apikey+"&email=as",
			cache: false,
			dataType: "json",
			success: function(response) {
				$("#message").html(sucess_msg).show();
				USER_SETTINGS.verified=true;
				saveSettings(USER_SETTINGS,function(){ 
					//associateGmail();
					changeSubmit('enable');
					$('#setting_link').show();
					$('#setting_link').attr('href','https://'+USER_SETTINGS.domain+'.agilecrm.com/#notification-prefs');
					loadSettings();
					setTimeout(function(){
					$("#message").hide();
					}, 10000);
				});
			},
			error: function (jqXHR, textStatus, errorThrown) {
				$("#err_msg").text("Please verify the Username or/and API Key.").show();
				changeSubmit('enable');
				setTimeout(function(){$("#err_msg").hide();}, 5000);
				
			}
		});
	});
	
	$("#btn_close").on("click",function(){
		window.close();
	});
	
	$("#btn_remove_crm").on("click",function(){
		USER_SETTINGS ={};
		saveSettings(USER_SETTINGS, function()
		{
			alert('');
			window.location.reload();
		});
		
	});
	
	function changeSubmit(val)
{
	if(val == 'disable')
	{
		// Disable
		document.getElementById("agile-submit").disabled = true;
		$('#agile-submit').html("Please wait");
	}
	else
	{
		// Disable
		document.getElementById("agile-submit").disabled = false;
		$('#agile-submit').html("Submit");
	}
	
}
	
	function associateGmail(){ 
		$('#loaderImage').show();
		//console.log('Associating Gmail...');
		var old_email_addr=USER_SETTINGS.assoc_email;
		var settings_tab_id;
		
		chrome.tabs.getCurrent(function(settings_tb){
			//chrome.cookies.onChanged.addListener(function(info){

				var email_addr=$("p#assoc-user-settings input[name='assoc-user-email']").val();
				
				// successful integration & association
				
				//USER_SETTINGS.assoc_email=email_addr;
				
				saveSettings(USER_SETTINGS,function(){
					
					chrome.tabs.update(settings_tb.id,{active:true,highlighted:true},function(){
						//$('p#assoc-user-settings span#status').html('Successful Integration - '+email_addr);
						$("div#crm-integration").show();
						$('#loaderImage').hide();
						var tagId = '';
						chrome.tabs.query({ url: 'https://mail.google.com/*' }, function(gmailTabs){
							//console.log(gmailTabs);
							gmailTabs.forEach(function(tb){
								if(tb.title)
								{
									chrome.tabs.reload(tb.id);
									/* var title=tb.title;

									if(!title)return;
									
									var idx=title.indexOf("-");
									
									if(idx<=0)return;
									
									current_gmail_id='';
									
									for(var i=idx+2;title[i]!=' ' && i<title.length;++i)
										current_gmail_id+=title[i];
										
									if(current_gmail_id.indexOf('@')==-1 || current_gmail_id!=email_addr)return;
										
									//console.log('got here');
									if(tabId !== tab.id)
									{
										tabId = tb.id;
										chrome.tabs.reload(tb.id);
									} */
								}
							});
						});
					});	
				});
						
			//});
		
			$('p#assoc-user-settings span#status').html('Waiting Integration - '+$("p#assoc-user-settings input[name='assoc-user-email']").val());		
		});
	}
	
	// Selecting Appropriate CRM
	
	$("div#agile-select").on("click",function(){
		showOnlyClass('_agile');
		$(this).addClass('active').siblings().removeClass('active');
	});
	
	/*$("div#salesforce-select").on("click",function(){
		showOnlyClass('_salesforce');
		$(this).addClass('active').siblings().removeClass('active');
	});
	
	$("div#sugar-select").on("click",function(){
		showOnlyClass('_sugar');
		$(this).addClass('active').siblings().removeClass('active');
	});
	
	$("div#nimble-select").on("click",function(){
		showOnlyClass('_nimble');
		$(this).addClass('active').siblings().removeClass('active');
	});*/
});
