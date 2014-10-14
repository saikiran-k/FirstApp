var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var body = document.querySelector('body');

var mail_binding=[]; // array representing bound compose windows.
var mail_templates=[]; // array of email templates
var mail_templates_details=[]; // content of mail templates

var crm; // CRMConnector

/**
	Selectors for various components of gmail. In case gmail's UI is changed and
	the selectors fail to work, update here.
**/
var selectors={
compose_window:"td.I5",							// compose window, after binding class "agile_compose" is added
send_button:".T-I.J-J5-Ji.aoO.L3",      		// Send button (+.T-I-atl - normal send, +.T-I-ax7 - "send & archive" send)
message_box:"div.Am.Al.editable",				// div which contains message
gmail_id:"span.gbps2:first,a.gb_n.gb_K",		 	// email id of the current gmail user, "span.gbps3" works too.
subject:"input[name='subjectbox']",
mail_window:"div.ii.gt.adP.adO"
};

var tracking_image={ src:"img/track_test.png", id:"tracking_image" };
var agile_send="<div id='agile_send_button'><img src='https://s3.amazonaws.com/agilecrm/panel/uploaded-logo/prabathk/png?id=uploadDocumentForm' style='vertical-align:middle;' height='18' width='18'> Send</div>";
var agile_checkbox="<div style='display:inline-block;padding-left:5px;font-family:arial,sans-serif;font-size:11px;' data-tooltip='Enable Tracking with Agile CRM'><input type='checkbox' style='vertical-align:middle;margin-right:5px;'>Track Mail</div>";

/**
	Binds to compose_window.
	If fails to detect send_button and message_box, sets init_status=false and returns.
	If ok, continues.
**/
function GmailComposeBind(compose_window)
{
	this.send_button=compose_window.find(selectors.send_button);
	this.message_box=compose_window.find(selectors.message_box);
	this.compose_window=compose_window;
	
	if(!check_valid(this.send_button,this.message_box))
	{
		this.init_status=false;
		return;
	}
	
	this.check_box=$(agile_checkbox);     //tick box next to send button, which enables/disables tracking
	this.agile_send_button=$(agile_send); //our own send button
	
	// copy styles from original button to our button, so it looks exactly similar
	this.agile_send_button.attr('style',extract_css(this.send_button.get(0)));
	
	//this.send_button.after(this.check_box);
	this.send_button.after(this.agile_send_button);
	
	compose_window.addClass('agile_compose'); // add class to prevent binding next time
	
	this.init_status=true; // set to true, so that the caller knows it succeeded in binding
	
	// enable tracking by default if set in user preferences
	if(USER_SETTINGS && USER_SETTINGS.defaultTrack)
	{
		this.setTracked();
		this.check_box.find('input').attr('checked','ok');
	}	
	else this.setUntracked();
	
	if(USER_SETTINGS.crm)
	{
		var tpl_bind=this.send_button.closest('table').parent().parent();
		tpl_bind.children().get(0).insertAdjacentHTML('afterend',"<div style='background-color:whitesmoke;padding:5px;font-size:0.9em;'><select class='_agileTemplate' style='width:230px;font-family:arial,sans-serif;font-size:11px;float:right;'><option value='-1'>Select Agile CRM Mail Template</option></select></div>");
		this.template_binder=tpl_bind.find('select._agileTemplate');
		this.template_binder.before(this.check_box);
	}
	
	// Event handlers
	var self=this;
	
	// When checkbox is clicked, toggling between checked/unchecked
	this.check_box.click(function(){
		if(self.check_box.find(':checked').length)
			self.setTracked();
		else self.setUntracked();
	});	
	
	// When our send button is clicked, append tracking image and trigger clicking of original send button
	this.agile_send_button.click(function(){
		self.appendTrackingMessage();
		self.send_button.trigger("click");
	});
	
	this.compose_window.get(0).addEventListener('keydown',function(e){
		if(e.which === 13 && (e.metaKey || e.ctrlKey)){ //enter key
				/*e.stopImmediatePropagation();
				e.stopPropagation();
				e.preventDefault();
				return false;*/
				self.appendTrackingMessage();
				return true;
		}
	},true);
	
	this.removeTrackingMessage();
	
}

// enable tracking, hide original send button, show our button
GmailComposeBind.prototype.setTracked=function(){
	this.send_button.hide();
	this.agile_send_button.show();
	USER_SETTINGS.defaultTrack=true;
	chrome.storage.local.set({'USER_SETTINGS': USER_SETTINGS});
};

// diable tracking, reverse of setTracked()
GmailComposeBind.prototype.setUntracked=function(){
	this.send_button.show();
	this.agile_send_button.hide();
	USER_SETTINGS.defaultTrack=false;
	chrome.storage.local.set({'USER_SETTINGS': USER_SETTINGS});
};

// appends tracking image
GmailComposeBind.prototype.appendTrackingMessage=function(){
	
	var subject = this.compose_window.find("input[name='subjectbox']").val();
	var to = this.compose_window.find("input[name='to']").prev('span').attr('email');
	var time = (new Date()).getTime();
	var url = "https://"+USER_SETTINGS.domain+"-dot-sandbox-dot-agile-crm-cloud.appspot.com/open?e="+to+"&d="+subject+"&fr="+USER_SETTINGS.email+"&s="+time;
	this.message_box.find('div#crmio-track').remove();
	this.message_box.append('<div id="crmio-track"></div>');
	this.message_box.find('div#crmio-track').html('<img src="'+url+'" nosend="1" width="1" height="1"></img>');
	
}

// remove tracking image
GmailComposeBind.prototype.removeTrackingMessage=function(){
	
	this.message_box.find('div#crmio-track').remove();
}

GmailComposeBind.prototype.agileTemplates=function(){
	if(!this.template_binder)return;
	
	var str='';
	
	for(var i=0;i<mail_templates.length;++i)
	{
		str+="<option value='"+i.toString()+"'>"+mail_templates[i].subject+"</option>";
	}
	
	this.template_binder.append(str);
	
	var base=this;
	
	this.template_binder.on("change",function(){
		try{
			var idx = parseInt(this.value);
			//console.log("--------------------------------");
			if(idx<0) base.fillTemplate();		
			else base.fillTemplate(idx);
			
		}catch(err){}
	});	
};

GmailComposeBind.prototype.fillTemplate=function(tplIdx){

	if(tplIdx==undefined || tplIdx<0)
	{	
		if(this.default_mail)
			this.message_box.html(this.default_mail);
		return;	
	}
	
	if(!this.default_mail)
		this.default_mail=this.message_box.html();
	
	if(mail_templates[tplIdx])
	{
		this.message_box.html(getHTML(mail_templates[tplIdx].text,{}));
		this.compose_window.find("input[name='subjectbox']").val(mail_templates[tplIdx].subject);
		this.message_box.focus();
	}
};

/**
 * Remove the custom fields from the templates using handlebars.
 */
function getHTML(tpl,data)
{
	var fxn=Handlebars.compile(tpl);
	
	if(Object.prototype.toString.call(data)==='[object Array]')
	{
		return fxn( {length:data.length, content:data} );
	}
	
	return fxn(data);
}

/** Registering tab, so as to know from which tabs, image request should be blocked **/
var isRegistered=false;

function registerTab(isForced)
{
	if(isRegistered && !isForced)return;
	
	chrome.runtime.sendMessage({from:'_crmio_gmail_content',msg:'register'},function(resp){isRegistered=true;});
}

function unregisterTab()
{
	if(!isRegistered)return;
	
	chrome.runtime.sendMessage({from:'_crmio_gmail_content',msg:'unregister'},function(resp){isRegistered=false;});
}

/**
 * Extract Gmail Id from title.
 **/ 
function getCurrentGmailId()
{	
	var title=document.querySelector("head>title").innerHTML;
	
	if(!title)return '';
	
	var idx=title.indexOf("-");
	
	if(idx<=0)return '';
	
	current_gmail_id='';
	
	for(var i=idx+2;title[i]!=' ' && i<title.length;++i)
		current_gmail_id+=title[i];
		
	if(current_gmail_id.indexOf('@')==-1)
			return '';
		
	return current_gmail_id;	
}

var mail_observer = new MutationObserver(function(i){
	//console.log('BOUND - Observing user mails.');
	if(USER_SETTINGS && USER_SETTINGS.email)
	{
		var image_link = 'fr='+USER_SETTINGS.email;
		$(selectors.mail_window).each(function(){
			$(this).find('img').each(function(){
				if($(this).attr('src').contains(image_link))
					$(this).remove();
			});
		});
	}
});

/** MutationObserver for the body,
	Accumulates results, ran fewer times that domNodeInserted.
	
	Checks if this email-id is allowed in preferences.
	Binds to each compose window.
**/
var compose_observer=new MutationObserver(function(m){
	
	/*if(!USER_SETTINGS || !USER_SETTINGS.assoc_email || USER_SETTINGS.assoc_email!=getCurrentGmailId())
	{
		unregisterTab(); // when user logs out
		return;
	}*/
	// Remove comment to above code if you want to Allow binding only if email is allowed from the extension.
	
	//console.log("BOUND - Binded all Gmail tabs.");
	
	registerTab();
	
	$(selectors.compose_window).not(".agile_compose").each(function(){
	
		var gmail_bind=new GmailComposeBind($(this));	
			
		if(gmail_bind.init_status)
		{	
			mail_binding.push(gmail_bind);
			
			if(!crm && USER_SETTINGS.crm && mail_templates.length==0)
			{	
				crm=new CRMConnector();
				
				crm.loadTemplatesInfo(function(data){
					mail_templates=data;
					//console.log('Mail Templates : '+data.length);
					gmail_bind.agileTemplates();
				});
			}
			else if(mail_templates.length>0)
			{
				gmail_bind.agileTemplates();
			}	
		}
	});
	
});

compose_observer.observe(body,{attributes:true,childList:true});

/** Load templates **/



