function getCompanyDetails(){
	
	var el=$('body');
	
	var result={};
	
	result.profileId = (function() {
      var data, err, id;
      data = el.find('#pagelet_timeline_main_column').attr('data-gt');
      try {
        id = $.parseJSON(data)['profile_owner'];
        if (!(id && id.match(/^\d+/))) {
          return null;
        }
        return "facebook/company-" + id;
      } catch (_error) {
        err = _error;
        return null;
      }
    })();
    result.tags = ['contact clipper', 'facebook'];
    
    result.companyName = $.trim(el.find('#fbProfileCover .nameButton').text());
    
    result.phone = $.trim(el.find(".contactInfoTable td:contains('Phone')").parent().find('td').last().text());
    
    result.email = (function() {
      var text = $.trim(el.find(".contactInfoTable td:contains('Email')").parent().find('td').last().text());
      if (text && text.match('@'))return text;
      return '';
    })();
    result.website = (function() {
      var url = $.trim(el.find(".contactInfoTable td:contains('Website')").parent().find('td').last().text());
      if (url) return url;
      return $.trim(el.find(".profileInfoTable th:contains('Website')").parent().find('td a:first').text());
    })();
	result.address = (function() {
      var url = $.trim(el.find(".contactInfoTable td:contains('Location')").parent().find('td').last().text());
      if (url) return url;
      return $.trim(el.find(".profileInfoTable th:contains('Location')").parent().find('td a:first').text());
    })();
    result.facebook = (function() {
      var link, url;
      url = $.trim(el.find('a.profileThumb').attr('href'));
      link = document.createElement('a');
      link.href = url;
      return "" + link.protocol + "//" + link.hostname + link.pathname;
    })();
    result.description = (function() {
      var text;
      text = el.find('#timelineNavContent .fbTimelineSummarySection .fbLongBlurb').text();
      return $.trim(text).replace(/\s+/g, ' ');
    })();
    
	console.log(result);
	
	result.addressCity = '';
    var addr = result.address.split(/\s+,\s+/g);//replace(/^[ ,]*/,'');
	
	for(var i=0;i<addr.length;++i){
		if(!addr[i])continue;
		
		if(countryName2Code[addr[i]])
			result.addressCountry = addr[i];
		else result.addressCity+=', '+addr[i];	
	}

	result.addressCity=result.addressCity.replace(/^[ ,]*/,'');
		chrome.runtime.sendMessage({msg:"contact_dialog",template: "fb-company", data: result}, function(response) {
			  console.log('-----response------',response);
			  crmioIframe=createPopupIframe(response.dialog);
			  $('iframe#_crmio_extn_iframe').fadeIn();
			});
	/* crmioIframe=createPopupIframe("<h3 style='text-align:center;'>Add Company</h3>\
				<table style='margin:10px;'><tody>\
				<tr><td><label for='name'>Name : </label></td><td><input name='name' type='text' class='_crmio_inp' value='"+result.companyName+"' placeholder='Company Name'><br/></td></tr>\
				<tr><td><label>URL : </label></td><td><input name='url' type='text' class='_crmio_inp' value='"+result.website+"' placeholder='Website, http(s)://*'><br/></td></tr>\
				<tr><td><label>Email : </label></td><td><input name='email' type='text' class='_crmio_inp' value='"+result.email+"'placeholder='Email Address'><br/></td></tr>\
				<tr><td><label>Phone No. : </label></td><td><input name='phone' data-subtype='mobile' type='text' class='_crmio_inp' value='"+result.phone+"'placeholder='Mobile No.'><br/></td></tr>\
				<tr><td><label>Facebook : </label></td><td><input name='website' data-subtype='FACEBOOK' type='text' class='_crmio_inp' value='"+result.facebook+"' placeholder='http(s)://*'><br/></td></tr>\
				<tr><td><label>Address :	</label></td><td><input name='addressCity' type='text' class='_crmio_inp_custom address' value='"+result.addressCity+"' placeholder='City'><br/></td></tr>\
							<tr><td></td><td><input name='addressRegion' type='text' class='_crmio_inp_custom address' placeholder='State'>\
							<input name='addressZip' type='text' class='_crmio_inp_custom address' placeholder='Zip'>\
							<tr><td></td><td><select name='addressCountry' class='_crmio_inp_custom address' style='width:150px;'>"+
								getCountryOptions(result.addressCountry)
                            +"</select></td></tr>\
							</tbody></table>\
				<div style='text-align:center;'>\
					<input type='button' value='Save' class='_crmio_save_' onclick='onSaveCompany();'>\
						&nbsp;&nbsp;\
					<input type='button' value='Cancel' class='_crmio_cancel_' onclick='onClose();'>\
				</div>");
	
	
	$(crmioIframe).fadeIn(); */
}

function getContactDetails(){
	console.log('fb - scrapper');
	
	var el=$('body');
	
	var result={};
	
	result.profileId = (function() {
      var data, err, id;
      data = el.find('#pagelet_timeline_main_column').attr('data-gt');
      try {
        id = $.parseJSON(data)['profile_owner'];
        if (!(id && id.match(/^\d+/))) {
          return null;
        }
        return "facebook/member-" + id;
      } catch (_error) {
        err = _error;
        return null;
      }
    })();
    
	result.facebook = el.find('#fbProfileCover h2 a').attr('href') || '';
	
    result.fullName = $.trim(el.find('#fbTimelineHeadline img.profilePic').attr('alt'));
    
    result.firstName = (function(){
      var names;
      names = result.fullName.split(/\s+/);
      if (names.length > 1) {
        return names[0];
      } else {
        return '';
      }
    })();
    
    result.lastName = (function() {
      var names;
      names = result.fullName.split(/\s+/);
      if (names.length > 1) {
        return $.trim(names.slice(1).join(' '));
      } else {
        return names[0] || '';
      }
    })();
        
    result.mobile = $.trim(el.find('.profileInfoTable .contactInfoPhone:first').text());
        
    result.address = $.trim(el.find('#current_city .aboutSubtitle').parent().find('a').text());
    
    result.website = el.find(".profileInfoTable th:contains('Website')").parent().find('td a').text();
    
    result.skype = (function() {
      var span, th;
      th = el.find(".profileInfoTable th:contains('Screen Name')");
      span = th.parent().find("td li span:contains('Skype')");
      if (span) {
        return span.parent().find('a').text();
      } else {
        return '';
      }
    })();
    
    result.company = $.trim(el.find('.fbProfileExperience:first .experienceTitle').text());
    
    result.title = $.trim(el.find('.fbProfileExperience:first .experienceBody span:first').text());
    
    result.tags = ['contact clipper', 'facebook'];
	
	if(result.title.length==0 || result.address.length==0 || result.company.length==0){
		
		console.log('Desperate Attempt to fetch info');
		var lists=$("div#timeline_about_unit li li");
		
		for(var i=0;i<lists.length;++i)
		{
			var elm=lists.get(i);
			if(!elm || !elm.innerText)continue;
			var txt=elm.innerText;
				
			try{
				if(result.address.length==0 && txt.indexOf('Lives')==0)
					result.address = txt.split('Lives in ')[1];
				else if(txt.indexOf('Studied')==0){}
				else if(txt.indexOf('From')==0){}
				else if(result.title.length==0 || result.company.length==0){
					var res=txt.split(' at ');
					
					if(res.length>=2){
						
						if(elm.childNodes[0].innerText){
							if(result.title.length==0)result.title = elm.childNodes[0].innerText;
							if(result.company.length==0)result.company = elm.childNodes[2].innerText;
						}	
						else{
							if(result.title.length==0)result.title = elm.childNodes[0].nodeValue.substr(0,elm.childNodes[0].nodeValue.lastIndexOf('at')-1) ;
							if(result.company.length==0)result.company = elm.childNodes[1].innerText;
						}
					}
				}
			}catch(ex){}
		}
	}
	
	result.addressCity = $.trim(result.address.substr(0,result.address.lastIndexOf(',')));
    
    result.addressCountry = $.trim(result.address.substr(result.address.lastIndexOf(',')+1)).replace(/^[ ,]*/,'');
	
	if(!countryName2Code[result.addressCountry])
	{	
		result.addressCity+=', '+result.addressCountry;
		result.addressCountry='';
	}

	result.addressCity=result.addressCity.replace(/^[ ,]*/,'');
	
    console.log(result);
	chrome.runtime.sendMessage({msg:"contact_dialog",template: "contact-add", data: result}, function(response) {
			  console.log('-----response------',response);
			  crmioIframe=createPopupIframe(response.dialog);
			  $('iframe#_crmio_extn_iframe').fadeIn();
			});
	/*crmioIframe=createPopupIframe("<h3 style='text-align:center;'>Add Contact</h3>\
				Name : <input name='first_name' type='text' class='_crmio_inp' value='"+result.firstName+"' placeholder='First Name'>&nbsp;\
						<input name='last_name' type='text' class='_crmio_inp' value='"+result.lastName+"' placeholder='Last Name'><br/>\
				Company : <input name='company' type='text' class='_crmio_inp' value='"+result.company+"' placeholder='Company'><br/>\
				Job Description : <input name='title' type='text' class='_crmio_inp' value='"+result.title+"' placeholder='Job Title'><br/>\
				Email : <input name='email' type='text' class='_crmio_inp' placeholder='Email Address'><br/>\
				Mobile : <input name='phone' data-subtype='mobile' type='text' class='_crmio_inp' value='"+result.mobile+"' placeholder='Mobile No.'><br/>\
				Website : <input name='website' data-subtype='URL' type='text' class='_crmio_inp' value='"+result.website+"' placeholder='http(s)://*'><br/>\
				Skype : <input name='website' data-subtype='SKYPE' type='text' class='_crmio_inp' value='"+result.skype+"' placeholder='Skype Id'><br/>\
				Facebook : <input name='website' data-subtype='TWITTER' type='text' class='_crmio_inp' value='"+result.facebook+"' placeholder='Facebook page'><br/>\
				Address : <input name='addressCity' type='text' class='_crmio_inp_custom address' value='"+result.addressCity+"' placeholder='Address City'>\
							<select name='addressCountry' class='_crmio_inp_custom address' style='width:150px;'>"+
								getCountryOptions(result.addressCountry)
                            +"</select>\
				<div style='text-align:center;'>\
					<input type='button' value='Save' class='_crmio_save_' onclick='onSaveContact();'>\
						&nbsp;&nbsp;\
					<input type='button' value='Cancel' class='_crmio_cancel_' onclick='onClose();'>\
				</div>");
    $(crmioIframe).fadeIn(); */
    
    return result;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    if (request == 'crmio_get_contact_details'){  
		if($('#fbTimelineHeadline a[data-medley-id="pagelet_timeline_medley_friends"]').length) sendResponse(getContactDetails());
		else sendResponse(getCompanyDetails());
	}	
});
