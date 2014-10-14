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
    
	//console.log(result);
	
	result.addressCity = '';
    var addr = result.address.split(/\s+,\s+/g);//replace(/^[ ,]*/,'');
	
	for(var i=0;i<addr.length;++i){
		if(!addr[i])continue;
		
		if(countryName2Code[addr[i]])
			result.addressCountry = addr[i];
		else result.addressCity+=', '+addr[i];	
	}

	result.addressCity=result.addressCity.replace(/^[ ,]*/,'');
	return result;
}

function getContactDetails(){
	//console.log('fb - scrapper');
	
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
		
		//console.log('Desperate Attempt to fetch info');
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
	
    //console.log(result);
    return result;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    //console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    if (request == 'crmio_get_contact_details'){  
		if($('#fbTimelineHeadline a[data-medley-id="pagelet_timeline_medley_friends"]').length) sendResponse({type:'PERSON', data: getContactDetails()});
		else sendResponse({type:'COMPANY', data: getCompanyDetails()});
	}	
});
