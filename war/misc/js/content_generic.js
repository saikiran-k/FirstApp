var crm; // CRM Connector
var crmioIframe; //iframe for adding contact

var emailIds={};

function highlightNumbers() {
    linkPhoneNumbers(document.body);
    document.body.addEventListener("DOMNodeInserted", OnNodeInserted, false);
}

function linkPhoneNumbers(node) {

    var phoneNumberRegEx = /\b(?:[a-zA-Z0-9_\.\-])+\@(?:(?:[a-zA-Z0-9\-])+\.)+(?:[a-zA-Z0-9]{2,4})+/;
    var phoneNumberRegExMatcher = new RegExp(phoneNumberRegEx);

    for (var i = 0; i < node.childNodes.length; ++i) {
        var child = node.childNodes[i];
        if (child.nodeName == "SCRIPT" || child.nodeName == "NOSCRIPT" || child.nodeName == "OBJECT" || child.nodeName == "EMBED" || child.nodeName == "APPLET" || child.nodeName == "IFRAME")
            continue;

        if (child.childNodes.length > 0) {
            linkPhoneNumbers(child); // do for all the nodes
        } else if (child.nodeType == 3) {
            var phoneNumbers = phoneNumberRegExMatcher.exec(child.nodeValue);
            if (phoneNumbers) {
                var nextChild = child.nextSibling;
                if (nextChild && nextChild.class == '_crmio_extn_') {
                    continue;
                }

                var phoneNumber = phoneNumbers[0];
                var formattedPhoneNumber = phoneNumbers[0];

				var image = document.createElement("i");
				image.display='inline';
				
				if(emailIds[phoneNumber])
					image.innerHTML = "&nbsp;<i class='fa fa-check' title='Found in AgileCRM'></i>&nbsp;";
				else	
					image.innerHTML = "&nbsp;<i class='fa fa-refresh fa-spin' title='Searching...' style='display:none;'></i>"+
									"<i class='fa fa-search' title='Search in AgileCRM' style='cursor:pointer;'></i>"+
									"<i class='fa fa-plus-circle' title='Add to AgileCRM' style='cursor:pointer;display:none;'></i>"+
									"<i class='fa fa-check' title='Found in AgileCRM' style='cursor:pointer;display:none;'></i>"+
									"&nbsp;";
									
                image.setAttribute("data-email", phoneNumber);
                image.className='_crmio_extn_';
                
                image.onclick=function(evt){
					evt.stopImmediatePropagation();
					evt.stopPropagation();
					evt.preventDefault();
					initClickHandler(evt.target.className,evt.currentTarget.getAttribute('data-email'));
					return false;
				};
          
                child.splitText(phoneNumbers.index + phoneNumbers[0].length);
                node.insertBefore(image, node.childNodes[++i]);
                --i;
            }
        }
    }
}

function initClickHandler(className,emailAddr){
	var cls = className;
	var elements=$("i._crmio_extn_[data-email='"+emailAddr+"']");
	if(!crm)crm=new CRMConnector();
	
	if(cls.indexOf('fa-search')!=-1)
	{
			
		elements.find('i.fa.fa-refresh.fa-spin').css('display','inline');
		elements.find('i.fa.fa-search').css('display','none');
		elements.find('i.fa.fa-plus-circle').css('display','none');
		elements.find('i.fa.fa-check').css('display','none');
		
		crm.getContactDetails(emailAddr,function(data){
			
			if(data && typeof(data)=="object")
			{
				var contact_link = 'https://'+data.owner.domain+'.agilecrm.com/#contact/'+data.id;
				// contact present in CRM
				console.log(data);
				elements.find('i.fa.fa-refresh.fa-spin').css('display','none');
				elements.find('i.fa.fa-search').css('display','none');
				elements.find('i.fa.fa-plus-circle').css('display','none');
				elements.find('i.fa.fa-check').css('display','inline').attr('data-url',contact_link);
				
				emailIds[emailAddr]=data;
			}	
			else 
			{
				// contact not present
				elements.find('i.fa.fa-refresh.fa-spin').css('display','none');
				elements.find('i.fa.fa-search').css('display','none');
				elements.find('i.fa.fa-check').css('display','none');
				elements.find('i.fa.fa-plus-circle').css('display','inline');
			}
		},
		function(){
			// contact not present
		});
		// do search
	}
	else if(cls.indexOf('fa-plus-circle')!=-1)
	{
		// add to crm
		
		var elm=$('iframe#_crmio_extn_iframe');
		
		if(elm.length==0)
		{			
			chrome.runtime.sendMessage({msg: "contact_form",template: "contact-form"}, function(response) {
			  console.log(response);
			  crmioIframe=createPopupIframe(response.dialog);
			  elm=$('iframe#_crmio_extn_iframe');
			elm.fadeIn();
			crmioIframe.contentDocument.querySelector("input._crmio_inp[name='email']").value=emailAddr;
			});
			/* crmioIframe=createPopupIframe("<h3 style='text-align:center;'>Add Contact</h3>\
				Name : <input name='first_name' type='text' class='_crmio_inp'>&nbsp;\
						<input name='last_name' type='text' class='_crmio_inp'><br/>\
				Email : <input name='email' type='text' class='_crmio_inp'><br/>\
				Job Title : <input name='title' type='text' class='_crmio_inp'><br/>\
				Company : <input name='company' type='text' class='_crmio_inp'><br/>\
				<div style='text-align:center;'>\
					<input type='button' value='Save' class='_crmio_save_' onclick='onSaveContact();'>\
						&nbsp;&nbsp;\
					<input type='button' value='Cancel' class='_crmio_cancel_' onclick='onClose();'>\
				</div>");
			 elm=$('iframe#_crmio_extn_iframe');
			elm.fadeIn();
			crmioIframe.contentDocument.querySelector("input._crmio_inp[name='email']").value=emailAddr; */
			
		}
		else 
		{
			elm.fadeIn();
			crmioIframe.contentDocument.querySelector("input._crmio_inp[name='email']").value=emailAddr;
		}	
	}
	else if(cls.indexOf('fa-check')!=-1)
	{
		console.log(elements.find('i.fa.fa-check').attr('data-url'));
		window.open(elements.find('i.fa.fa-check').attr('data-url'));
	}
}

function createPopupIframe(_html){
	var stylesheets = '<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">\
													<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap-theme.min.css">\
													<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>\
													<script src="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>';
	if(crmioIframe){
		
		crmioIframe.contentDocument.body.innerHTML = stylesheets +"<div id='_crmio_extn_addContact' style='width:100%;height:100%;border:1px solid grey;background-color:white;'>"+_html+"</div>";
		//$(crmioIframe).find('head').html(stylesheets);
		return crmioIframe;
	}
		
	var ifr=document.createElement('iframe');
	ifr.id='_crmio_extn_iframe';
	ifr.setAttribute('style','border:0px;position:fixed;bottom:0;right:0;width:500px;height:400px;display:none;z-index:100000;');
	//ifr.setAttribute('seamless');
	document.documentElement.appendChild(ifr);
	ifr.contentDocument.body.innerHTML = stylesheets +
	"<div id='_crmio_extn_addContact' style='width:100%;height:100%;border:1px solid grey;background-color:white;'>"+_html+"</div>"
	
	var JS= document.createElement('script');
	JS.text= 
	"function onSave(actionMsg){\
			console.log('onSave - hit');\
			var inputs=document.querySelectorAll('div#_crmio_extn_addContact input._crmio_inp');\
			var props=[];\
			\
			for(var i=0;i<inputs.length;++i){\
				if(!inputs[i].value)continue;\
				\
				if(inputs[i].dataset['subtype'])\
					props.push({name:inputs[i].name,value:inputs[i].value,subtype:inputs[i].dataset['subtype']});\
				else props.push({name:inputs[i].name,value:inputs[i].value,type:'SYSTEM'});\
			}\
			var addrCustom={};\
			var addrElems=document.querySelectorAll('div#_crmio_extn_addContact ._crmio_inp_custom.address[name]');\
			\
			for(var i=0;i<addrElems.length;++i){\
				if(addrElems[i].value && addrElems[i].value.length>0)\
					addrCustom[addrElems[i].name]=addrElems[i].value;\
			}\
			console.log(addrCustom);\
			if(addrCustom.addressCity || addrCustom.addressCountry)\
			{\
				var obj={};\
				if(addrCustom.addressCity)obj.city=addrCustom.addressCity;\
				if(addrCustom.addressCountry)obj.country=addrCustom.addressCountry;\
				props.push({name:'address',value:JSON.stringify(obj),subtype:''});\
			}\
			console.log('Properties 2 Save :',props);\
			parent.postMessage({from:'crmio_extn',action:actionMsg,properties:props},'*');\
		}\
		function onSaveContact(){ onSave('add_contact'); }\
		function onSaveCompany(){ onSave('add_company'); }\
		\
		function onClose(){\
			parent.postMessage({from:'crmio_extn',action:'close'},'*');\
		}";
	ifr.contentDocument.body.appendChild(JS);
	ifr.contentDocument.body.style.margin='0';
	ifr.contentDocument.body.style.overflow='hidden';
	crmioIframe=ifr;
	
	window.addEventListener("message",function(evt){
		if(evt.data.from!='crmio_extn')
			return;
			
		if(evt.data.action=='add_contact' || evt.data.action=='add_company')	
		{
			var contact={};
			contact.contact_company_id=null;
			contact.properties=evt.data.properties;
			contact.tags=[];
			contact.tagsWithTime=[];
			
			if(evt.data.action=='add_contact')contact.type='PERSON';
			else contact.type = 'COMPANY';
				
			console.log('Contact Info : ',contact);	
			
			if(!crm)crm=new CRMConnector();
			
			crm.addContact(contact,function(resp){
				console.log('Added');
				$(crmioIframe).fadeOut();
				
				var elemSelector='';
				
				for(var i=0;i<resp.properties.length;++i)
				{	
					if(resp.properties[i].name='email')
					{	
						elemSelector+="i._crmio_extn_[data-email='"+resp.properties[i].value+"'],";
						emailIds[resp.properties[i].value]=resp;
					}
				}	
				
				var elements = $(elemSelector.replace(/,$/,''));
				elements.find('i.fa.fa-refresh.fa-spin').css('display','none');
				elements.find('i.fa.fa-search').css('display','none');
				elements.find('i.fa.fa-plus-circle').css('display','none');
				elements.find('i.fa.fa-check').css('display','inline');
			},
			function(){
				console.log('Error - try again');
			});	
		}
		else if(evt.data.action=='close')
		{
			$(crmioIframe).fadeOut();
		}
	},false);
	
	return crmioIframe;
}

var linking = false;

function OnNodeInserted(event) {
    if (linking) return;
    linking = true;
    linkPhoneNumbers(event.target)
    linking = false;
}

if(window.location.origin.indexOf('mail.google.com')==-1)
{
	if(window.location.origin.indexOf('-dot-sandbox-dot-agilecrmbeta.appspot.com')==-1){
	
		var lnk=document.createElement('link');
		lnk.href=chrome.extension.getURL('css/font-awesome.min.css');
		lnk.rel='stylesheet';
		lnk.type='text/css';
		(document.head||document.documentElement).appendChild(lnk);
		
		console.log('**highlighting email addresses**');
		highlightNumbers();
		
		$(document).on("click","div#_crmio_extn_addContact",function(evt){
			console.log('Add Contact clicked');
			console.log(evt);
			
			if(evt.target.className=='_crmio_cancel_'){
				$(this).hide();
			}
			else if(evt.target.className=='_crmio_save_'){
				var contact={};
				contact.contact_company_id=null;
				contact.tags=[];
				contact.tagsWithTime=[];
				contact.type='PERSON';
				contact.properties=[];;
			}
		});
	} else {
		$('body').append('<div id="agilecrm_extension"></div>');
	}
	//initClickHandler();
}

