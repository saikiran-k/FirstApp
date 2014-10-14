/**
 * fxn_code is a variable which will hold javascript code. This code will be inserted
 * in the page.
 */
 
var fxn_code='(' +function(){

/* In this I override XMLHttpRequest.open & send functions. Remember to run at document_start.
 * */

XHR = XMLHttpRequest.prototype;
_open = XHR.open;
_send = XHR.send;

/* helper function to extract properties(props) from string_inf
	So, string_inf = 'alpha=65&alpha=67&beta=39' & props=['alpha','beta]
	Returns -> { alpha : ['65','39'], beta:['39'] }
*/  
_getProperties=function(string_inf,props){

	var result={};					// hold result object
	var str=string_inf.split("&");
	var p={};						// fast check if a property exists in props.

	for(var i=0;i<props.length;++i){ 
		p[props[i]]=true; 
		result[props[i]]=[]; 
	}

	for(var i=0;i<str.length;++i)
	{
		var s2=str[i].split('='); 

		if(!p[s2[0]])continue;
											// we now have { s2[0] : s2[1] } to add to result
		var val = decodeURIComponent(s2[1]);

		if(!val || val.length==0)continue;

		if(!result[s2[0]])result[s2[0]]= [ val ];
		else result[s2[0]].push(val);
	}

	return result;
};


/**
 * Returns a unique GUID. 
 */ 
_getGUID = function(){

	var s4=function(){
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

// overridden open
XHR.open=function(method,url){
	this._method=method;
	this._url=url
	alert("hai");
	return _open.apply(this,arguments);
};

// overridden send
XHR.send=function(postData){

	var urlData={},mailData={};

	try{		
		var txt=this._url.slice(this._url.indexOf('?')+1);//['rid','autosave']);

		if(!(txt.indexOf('rid=')!=-1 && txt.indexOf('autosave=')==-1)) // if url has rid && no autosave, then this is a mail sending attempt.
			return _send.apply(this,arguments);

		mailData=_getProperties(postData,['body','from','to','cc','bcc','subject']);

		if(postData.indexOf('&body=')==-1)
			return _send.apply(this,arguments);		// if no body, do default

		// this block fails when attaching a file, so catch returns default method
	}catch(ex)
	{

		return _send.apply(this,arguments);
	}

	if(true)
	{
		//mail sending attempt, tracking enabled

		var elem=document.createElement('div');
		elem.innerHTML=mailData.body[0];	// elem is now message, we can modify via DOM fxns.

		console.log('Q1');

		var prevTrack = elem.querySelectorAll("img[src^='https://agilecrmio.appspot.com/track/img.jpg']");

		console.log('Found existing trackers : ' + prevTrack.length +', removing them..');

		for(var i=0;i<prevTrack.length;++i)
			prevTrack[i].remove();

		console.log('done..');	

		if(mailData.body[0].indexOf('crmio-track')!=-1)
		{
			// if tracker found -> append tracking image & change links to tracked links

			var tracker=elem.querySelector('div#crmio-track'); 
			console.log('Q2');

			if(tracker)
			{
				console.log('Q3');
				var crmioId=_getGUID();	
				var message_body_trim_limit=100; // can save max 100 characters of message body. Can be used to remind
												// user of message that was send.

				var emailInfo={
					from : mailData.from,
					to : mailData.to,
					cc : mailData.cc,
					bcc : mailData.bcc,
					subject : mailData.subject[0],
					body : (elem.innerText).slice(0,message_body_trim_limit)
				};

				if(elem.innerText.length>message_body_trim_limit)emailInfo.body+=' ...';

				var param='mkey='+encodeURIComponent(crmioId);

				var hrefs=elem.querySelectorAll('a[href]');
				var regex=/((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/; // regex for links	
				var trackedLinks=[];

				for(var i=0;i<hrefs.length;++i)
				{
					if(hrefs[i].href.indexOf('https://agilecrmio.appspot.com/track')==-1 && regex.test(hrefs[i].href))
					{
						var lnk={ 
							mkey : crmioId, 
							target : hrefs[i].href, 
							text : hrefs[i].innerText, 
							lkey : _getGUID()
						};
						trackedLinks.push(lnk);

						hrefs[i].href="https://agilecrmio.appspot.com/track?type=link&next="+
							encodeURIComponent(hrefs[i].href)+"&"+param+"&lkey="+lnk.lkey+"&from=<EXTENSION_ID_MD5>";
					}
				}

				tracker.innerHTML="<img src='https://agilecrmio.appspot.com/track/img.jpg?from=<EXTENSION_ID_MD5>&type=image&"+param+"' width='1px' height='1px'>";

				emailInfo.links=trackedLinks;

				postData=postData.replace(/body=[^&]*/,'body='+encodeURIComponent(elem.innerHTML));	

				var xhrObj=this;
				// event listener to parse reply of sending mail.
				xhrObj.addEventListener("load",function(){
					var resp=this.responseText.toString();
					var format='our message has been sent.",["';
					var idx=resp.indexOf(format);

					if(idx!=-1)
					{
						var mid='';

						for(var i=idx+format.length;resp[i]!='"' && i<resp.length;++i)
							mid+=resp[i];

						// message id as mid -> this is id of message as seen by gmail

						window.postMessage({
							type : 'EMAIL_DETAILS',
							gId : mid,				// message id in gmail
							cId : crmioId,			// message id for mapping on server
							from : emailInfo.from,
							to : emailInfo.to,
							cc : emailInfo.cc,
							bcc : emailInfo.bcc,
							subject : emailInfo.subject,
							body : emailInfo.body,     // be sure to trim body
							links : emailInfo.links
							},"*");	

						console.log(emailInfo);	
					}
				}); // end xhrObj event load
			}	// if tracker
		}
	} 	// if mail sending attempt

	return _send.apply(this,arguments);
};

} + ')();';


var s = document.createElement('script');
s.type="text/javascript";

// load user settings from background page, and add code to page.		
chrome.runtime.sendMessage({from:'_crmio_content',msg:'user_settings'},function(resp){	
		if(resp && resp.assoc_email)
		{	
			EXTENSION_ID_MD5=MD5(resp.assoc_email);
			s.innerHTML=fxn_code.replace(/<EXTENSION_ID_MD5>/g,EXTENSION_ID_MD5);
			(document.head||document.documentElement).appendChild(s);
			console.log('Embedded Script');
		}
});

// listener for post message from the inserted js script.
window.addEventListener("message",function(evt){

	if(evt.data.type!='EMAIL_DETAILS')return;

	console.log('SENDING message = ',evt.data);

	// tell background page to send details to agilecrmio server.
	chrome.runtime.sendMessage({
		from:'_crmio_content',
		msg: 'email_details',
		content: evt.data
	});
},false);


