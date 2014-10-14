chrome.runtime.onInstalled.addListener(function(details){
  try{
		if(details.reason == "install")
		{
			chrome.tabs.create({url: "html/settings.html"});
		}
		else if(details.reason == "update")
		{
			var thisVersion = chrome.runtime.getManifest().version;
			//console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
		}
	}catch(err){
		console.log(err);
	}
});

var crm;
var USER_SETTINGS={};

var notification_prefs = {};

var notif_types = ['IS_BROWSING', 'OPENED_EMAIL', 'CLICKED_LINK', 'DEAL_CREATED', 'DEAL_CLOSED', 'TAG_ADDED', 'TAG_DELETED', 'CONTACT_ADDED', 'CONTACT_DELETED', 'CAMPAIGN_NOTIFY'];

/**
	When started, read USER_SETTINGS from storage.
**/  
$(function(){
	// Wait for 1 Min for chrome to load the data.
	setTimeout(function(){loadSettings();}, 50000);
});

/**
 * Load settings from the local storage.
 */
function loadSettings(){
	chrome.storage.local.get(null,function(item){
		console.log('Items-- : ',item);
		USER_SETTINGS=item.USER_SETTINGS;
		//console.log('USER_SETTINGS', USER_SETTINGS);
		if(USER_SETTINGS)
		{
			crm=new CRMConnector();
			if(!crm.init_status){ crm=undefined; return; }
			console.log('GET-subscribe to pubnub.');
			//unsubscribeToPubNub();
			subscribeToPubNub(USER_SETTINGS.domain);
			getNotificationPrefs();
		}
});  
 }

/**
	When USER_SETTINGS is changed, reload from storage.
**/  
chrome.storage.onChanged.addListener(function(changes,namespace){
try {
	if(changes.USER_SETTINGS)
	{	
		USER_SETTINGS=changes.USER_SETTINGS.newValue;
		
		if(USER_SETTINGS)
		{
			crm=new CRMConnector();
			if(!crm.init_status){ crm=undefined; return; }	
			//console.log('LISTNER-subscribe to pubnub.');
			//unsubscribeToPubNub();
			//subscribeToPubNub(USER_SETTINGS.domain);
			getNotificationPrefs();
			chrome.storage.local.remove('agile_notifications', function(){
			//console.log('Removed Old Notifications');
			});
		}
	}
	}catch(err){
	console.log(err);
	}
});  

var tabBlock={};
var settings={}; // USER_Settings from message

var urlBlock='<none>';

// To stop tracking the email sent when the sender opened it.
chrome.webRequest.onBeforeRequest.addListener(function(details){ 
	try{
	 var trackImage = 'fr='+ USER_SETTINGS.email;
	//console.log(details.url.indexOf(trackImage));
	return {cancel:details.url.indexOf(trackImage) > -1};
	}catch(err){
	console.log(err);
	return '';
	}
},
{urls: ["*://*.googleusercontent.com/*"]},["blocking"]);


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	try{
	//console.log(request);
	//if(request.from!=='_crmio_gmail_content')return;
	
	if(request.msg==='register')
	{
		tabBlock[sender.tab.id]=true;
		urlBlock=getBlockingImageUrl(USER_SETTINGS);
		sendResponse({ok:true});
	}
	else if(request.msg=='unregister')
	{
		delete tabBlock[sender.tab.id];
		sendResponse({ok:true});
	}
	else if(request.msg=='email_details')
	{
		$.ajax({
			method: "POST",
			url: "https://agilecrmio.appspot.com/core/email-details",
			data: "type=EMAIL_DETAILS&content="+encodeURIComponent(JSON.stringify(request.content)),
			success: function(){ 
				//console.log('Success : Info of email sent to CRMio Server'); 
			},
			error: function (jqXHR, textStatus, errorThrown) {  
					//console.log("FAILED : Can't send info of email to CRMio Server");
			}
		});	
	} else if(request.msg == 'contact_dialog')
	{
		request.data.countrycode = countryCode2Name;
		var html = getHTML(request.template, request.data);
		//console.log('Sending html content.');
		sendResponse({dialog:html});
	}else if(request.msg == 'contact_form')
	{
		var html = getHTML(request.template, '');
		//console.log('Sending html content.');
		sendResponse({dialog:html});
	}
	}catch(err){
		console.log(err);
	}
});

function getNotificationPrefs(){
		//console.log('Loading prefs.');
		crm.loadSimpleUrl(crm.base_url+'notifications',function(response){
			//console.log(response);
			// Get the notification rules from the site and save locally.
			notification_prefs = response;
			chrome.storage.local.set({'notification_prefs': notification_prefs}, function(){
				//console.log(chrome.runtime.lastError);
				//console.log('User settings saved.');
				
			});
		});
}

function showNotifications(message)
{
	var contact_link = '<a href="https://'+message.domain+'.agilecrm.com/#contact/'+message.id+'" id="notification-contact-id" style="color:black;font-weight:bold;">'+getPropertyValue(message.properties, 'first_name') + ' ' + getPropertyValue(message.properties, 'last_name')+'</a>';
	 var contact_name = '';
	 if(message.type='PERSON')
		 contact_name = getPropertyValue(message.properties, 'first_name') + ' ' + getPropertyValue(message.properties, 'last_name');
	else
		 contact_name = getPropertyValue(message.properties, 'name') ;
	 var opt = {
				type: "basic",
				title: contact_name,
				message: getNotifInfo(message),
				iconUrl: getGravatarImage(message.properties, 50)
			  }
			  //console.log(opt);
			// Create a simple text notification:
			chrome.notifications.create("",opt,function(id){
				//console.log('----id----',id);
				chrome.notifications.onClicked.addListener(function(id){
					Window.location.href = contact_link;
				});
				if(id)
				setTimeout(function(){
					chrome.notifications.clear(id, function(){});
				}, 6000);

			});
}

function showCallNotifications(message)
{
	var contact_link = '<a href="https://'+message.domain+'.agilecrm.com/#contact/'+message.id+'" id="notification-contact-id" style="color:black;font-weight:bold;">'+getPropertyValue(message.properties, 'first_name') + ' ' + getPropertyValue(message.properties, 'last_name')+'</a>';
	 var contact_name = getPropertyValue(message.properties, 'first_name') + ' ' + getPropertyValue(message.properties, 'last_name');
	 var opt = {
				type: "basic",
				title: 'Call',
				message: contact_name+' is calling.',
				iconUrl: getGravatarImage(message.properties, 50)
			  }
			// Create a simple text notification:
			chrome.notifications.create("",opt,function(id){
				//console.log('----id----',id);
				chrome.notifications.onClicked.addListener(function(id){
					Window.location.href = contact_link;
				});
			});
}

function showCampaignNotifications(message)
{
	var contact_link = '<a href="https://'+message.domain+'.agilecrm.com/#contact/'+message.id+'" id="notification-contact-id" style="color:black;font-weight:bold;">'+getPropertyValue(message.properties, 'first_name') + ' ' + getPropertyValue(message.properties, 'last_name')+'</a>';
	 var contact_name = getPropertyValue(message.properties, 'first_name') + ' ' + getPropertyValue(message.properties, 'last_name');
	 var opt = {
				type: "basic",
				title: contact_name,
				message: message.custom_value.msg,
				iconUrl: getGravatarImage(message.properties, 50)
			  }
			// Create a simple text notification:
			chrome.notifications.create("",opt,function(id){
				//console.log('----id----',id);
				chrome.notifications.onClicked.addListener(function(id){
					Window.location.href = contact_link;
				});
			});
}

/**
 * Sets notification message
 * 
 * @param message
 *            message from the Pubnub channel.
 */
function _setupNotification(message)
{
	if(message.notification == 'CALL')
		showCallNotifications(message);
	else if(message.notification == 'CAMPAIGN_NOTIFY')
		showCampaignNotifications(message);
	else
		showNotifications(message);
}

/**
 * Decide which url to block depending on sets -> USER_SETTINGS
 */
function getBlockingImageUrl(sets)
{
	return sets.domain;
}

function initNotifications(message, onInit){
	var agileNotifications = [];
	agileNotifications.push(message);
	chrome.storage.local.set({'agile_notifications': agileNotifications}, function() {
		if(onInit)onInit();
    });
}

/**
 * Verifies whether contact owner is same as notification prefs owner. It is
 * used for 'CONTACT_ASSIGNED' option.
 * 
 * @param contact -
 *            contact object.
 */
function is_assigned(contact)
{

	// Current user who logged_in
	var current_user = notification_prefs.prefs.currentDomainUserName;

	// User who created contact
	var contact_created_by = contact.owner_name;

	// checks for assigned contact
	if (current_user == contact_created_by)
		return true;

	return false;
}

/**
 * Verifies whether contact is assigned and starred (having star value).
 * 
 * @param contact -
 *            contact object.
 */
function is_assigned_and_starred(contact)
{

	// checks assigned and starred
	if (is_assigned(contact) && contact.star_value > 0)
		return true;

	return false;
}

/**
 * Shows notification for link clicked, email opened and browsing. It verifies
 * for option selected and shows notification accordingly.
 */
function verifyContact(contact, option)
{	//console.log(option, contact);
	switch (option) {
	case 'CONTACT_ASSIGNED':
		return is_assigned(contact);
	case 'CONTACT_ASSIGNED_AND_STARRED':
		return is_assigned_and_starred(contact);
	case 'ANY_CONTACT':
		return true;
	}

}

/**
 * Verify whether the user asked for this type of notifications.
 */
function verifyRules(message)
{
	if(message.type=='BULK_ACTIONS' || !notification_prefs.control_notifications)
		return false;
	switch(message.notification)
	{
		case "IS_BROWSING":
			return verifyContact(message, notification_prefs.browsing);

		case "CLICKED_LINK":
			return verifyContact(message, notification_prefs.link_clicked);

		case "OPENED_EMAIL":
			//console.log(verifyContact(message, notification_prefs.email_opened));
			 return verifyContact(message, notification_prefs.email_opened);

		case "CONTACT_ADDED":
			return notification_prefs.contact_added;

		case "CONTACT_DELETED":
			return notification_prefs.contact_deleted;

		case "DEAL_CREATED":
			return notification_prefs.deal_created;

		case "DEAL_CLOSED":
			return notification_prefs.deal_closed;

		case "TAG_ADDED":
			return notification_prefs.tag_added;

		case "TAG_DELETED":
			return notification_prefs.tag_deleted;

		default:
			return true;
	}
}

/* function unsubscribeToPubNub()
{	if(USER_SETTINGS.oldDomain){
	//console.log('---old domain--', USER_SETTINGS.oldDomain);
		pubnub.unsubscribe({channel : USER_SETTINGS.oldDomain});
		}
		pubnub.where_now({
     uuid     : 'my_uuid',
     callback : function(m){//console.log(m)},
     error : function(m){//console.log(m)}
 });
} */
/**
 * Subscribes to Pubnub.
 * 
 * @param domain -
 *            Domain name.
 */
function subscribeToPubNub(domain)
{	console.log('Subscribe to pubnub.--------', domain);
	try{
		//chrome.storage.local.remove('agile_notifications', function(){//console.log('removed--------------');});
		var pubnub = PUBNUB.init({ 'publish_key' : 'pub-c-e4c8fdc2-40b1-443d-8bb0-2a9c8facd274','subscribe_key' : 'sub-c-118f8482-92c3-11e2-9b69-12313f022c90', ssl : true, origin : 'pubsub.pubnub.com' });
		pubnub.ready();
		pubnub.subscribe({ channel : domain, callback : function(message)
		{	console.log(message);
			//console.log(verifyRules(message));
			if(verifyRules(message)){
				message.domain = USER_SETTINGS.domain;
				message.notify_time = new Date().getTime();
				_setupNotification(message);
				var agileNotifications = [message];
				chrome.storage.local.get(function(item){
				//console.log('item',item);
				if(item.agile_notifications)
					$.merge(agileNotifications,item.agile_notifications);
				// If there are more than 20 messages, remove the old one and save the new ones.
				if(agileNotifications.length > 20)
					agileNotifications = agileNotifications.splice(0,20);
				saveNotifications(agileNotifications);
						
				});
			}
		} });
		
	} catch(err){
		console.log(err);
	}
}

/**
* Save the notifications in the chrome storage.
*/
function saveNotifications(agileNotifications)
{
	if(agileNotifications.length > 0)
	chrome.storage.local.set({'agile_notifications': agileNotifications}, function() {
			//console.log('Notifications saved.');
			try{
			chrome.browserAction.getBadgeText({}, function(result)
			{
				//console.log('-----------------',result);
				var obj = {};
				obj.text = (parseInt(result)+1).toString();
				if(obj.text == 'NaN')
					obj.text = '1';
				chrome.browserAction.setBadgeText(obj);
			});
			} catch(ex)
			{
			}
		});
}





