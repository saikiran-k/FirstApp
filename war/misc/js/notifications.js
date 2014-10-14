/**
 * notification.js is a script file to show notifications.'socket.io.js' is used
 * to emit data received from server. Notification preferences are fetched for
 * current user.Some jquery plugins are used to show pop-up messages.
 * 
 * @module Notifications
 */
var notification_prefs;
var socket;
var notifId=1;


/**
 * Sets sockets with the obtained api key by using socket.io.js
 * 
 * @param api_key
 *            API Key.Socket is connected using the api key.
 */
function _setupSockets(api_key) {
	console.log("Connecting " + api_key);

	var agile = api_key;
	socket = io.connect('https://push.agilecrm.com');

	socket.on('connect', function() {
		console.log('socket connected');
		socket.emit('subscribe', {
			agile_id : agile
		});
	});

	socket.on('browsing', function(data) {
		console.log('browsing');
		console.log(data);
	});
	
	socket.on('disconnect',function(){
		console.log('disconnected');
	});

	socket.on('notification', function(data) {
		console.log('notification');
		console.log(data);
		
		var notif=JSON.parse(data);
		var opt;
		
		if(notif.type== 'EMAIL_OPEN')
			opt= {
				type: "basic",
				title: "Email Opened",
				message: notif.notification,
				iconUrl: ""
			};
		else if(notif.type=='BROWSING')
			opt= {
				type: "basic",
				title: "Viewing",
				message: notif.notification,
				iconUrl: ""
			};
			
		chrome.notifications.create((++notifId).toString(),opt,function(id){});	
	});
}

function _disconnectSockets()
{
	if(socket)
		socket.disconnect();
}


