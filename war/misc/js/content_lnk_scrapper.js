
function getCompanyDetails(){
	
	var el=$('body');
	
	var pathname = function(url) {
      var a;
      a = window.document.createElement('a');
      a.href = url;
      return a.pathname;
    };
	
	var result={};
	
	result.profileId = (function() {
      var path, url;
      if (url = el.find('#nav-home a').attr('href')) {
        if (path = pathname(url).split(/\W/).filter(function(e) {
          return e;
        }).join('-')) {
          return "linkedin/" + path;
        }
      }
      return '';
    })();
    
    result.tags = ['contact clipper', 'linkedin'];
   
    result.company = (function() {
      var match, text;
      text = el.find('div.header h1.name span[itemprop="name"]').text();
        if (text && text.length > 0) {
          return $.trim(text);
        }
      return '';
    })();
    
    result.addressStreet = $.trim(el.find('.basic-info .street-address:first').text());
    
    result.addressCity = $.trim(el.find('.basic-info .locality:first').text().replace(/,/g, ' '));
    
    result.addressRegion = $.trim(el.find('.basic-info .region:first').text());
    
    result.addressZip = $.trim(el.find('.basic-info .postal-code:first').text());
    
    result.addressCountry = $.trim(el.find('.basic-info .country-name:first').text());
    
    result.industry = $.trim(el.find('.basic-info .industry:first p').text());
    
    result.website = $.trim(el.find('.basic-info .website:first p').text());
    
    result.description = $.trim(el.find('.basic-info .description:first p:first').text());
    
    result.linkedin = "http://www.linkedin.com" + pathname(el.find('.top-bar .header a:first').attr('href'));
     
    console.log(result); 
    result.addressCity=result.addressCity.replace(/^[ ,]*/,'');
		chrome.runtime.sendMessage({msg:"contact_dialog",template: "ln-company", data: result}, function(response) {
			  console.log('-----response------',response);
			  crmioIframe=createPopupIframe(response.dialog);
			  $('iframe#_crmio_extn_iframe').fadeIn();
			});
        /* crmioIframe=createPopupIframe("<h3 style='text-align:center;'>Add Company</h3>\
				Name : <input name='name' type='text' class='_crmio_inp' value='"+result.company+"' placeholder='Company Name'><br/>\
				URL : <input name='url' type='text' class='_crmio_inp' value='"+result.website+"' placeholder='Website, http(s)://*'><br/>\
				Email : <input name='email' type='text' class='_crmio_inp' placeholder='Email Address'><br/>\
				Phone No. : <input name='phone' data-subtype='mobile' type='text' class='_crmio_inp' placeholder='Mobile No.'><br/>\
				LinkedIn : <input name='website' data-subtype='LINKEDIN' type='text' class='_crmio_inp' value='"+result.linkedin+"' placeholder='http(s)://*'><br/>\
				Address :	<input name='addressStreet' type='text' class='_crmio_inp_custom address' value='"+result.addressStreet+"' placeholder='Street'><br/>\
							<input name='addressCity' type='text' class='_crmio_inp_custom address' value='"+result.addressCity+"' placeholder='City'><br/>\
							<input name='addressRegion' type='text' class='_crmio_inp_custom address' value='"+result.addressRegion+"' placeholder='State'>\
							<input name='addressZip' type='text' class='_crmio_inp_custom address' value='"+result.addressZip+"' placeholder='Zip'>\
							<select name='addressCountry' class='_crmio_inp_custom address' style='width:150px;'>"+
								getCountryOptions(result.addressCountry)
                            +"</select>\
				<div style='text-align:center;'>\
					<input type='button' value='Save' class='_crmio_save_' onclick='onSaveCompany();'>\
						&nbsp;&nbsp;\
					<input type='button' value='Cancel' class='_crmio_cancel_' onclick='onClose();'>\
				</div>");
	$(crmioIframe).fadeIn(); */
}

function getContactDetails(){
	console.log('linkedin - scrapper');
	
	var el=$('body');
	
	var result={};
	
	result.profileId = (function() {
      var id;
      id = el.find('.masthead').attr('id');
      if (!(id && id.match(/^member-\d+/))) {
        return null;
      }
      return "linkedin/" + id;
    })();
    
    result.tags = ['contact clipper', 'linkedin'];
    
    result.fullName = $.trim(el.find('.full-name').text()).replace(/\(.+\)/, '');
    
    result.firstName = (function() {
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
    
    result.email = (function() {
      var val = el.find('#email-view a[href^="mailto:"]').text() || el.find('.abook-email a').text();
      return $.trim(val);
    })();
    
    result.mobile = (function() {
		
	  var text = el.find("#phone-view").find('li').first().text();
	  var mres=text.match(/[\(\)\+\d\s-]+\d/);
	  if(mres)return $.trim(mres[0]);	
	  
	  text = el.find("li.abook-phone").first().text();
	  mres = text.match(/[\(\)\+\d\s-]+\d/);
	  if(mres)return $.trim(mres[0]);	
		
      return '';
    })();
    
    result.website = (function() {
		var url = el.find('#website-view a').first().attr('href');
		if (url) return unescape(url.slice(20)).split('&urlhash')[0];
  
		url = el.find("a[name=overviewsite]").attr('href');
		if (url) return unescape(url.slice(20)).split('&urlhash')[0];
		
		return '';
    })();
    
    var makeLinkedinUrl = function(url) {
      url = $.trim(url);
      if (!(url && url.match(/.*linkedin\.com.+/))) {
        return '';
      }
      if (url.match(/^\w+\.linkedin.com.+/)) {
        return "http://" + url;
      } else if (url.match(/^http.*linkedin.com.+/)) {
        return url;
      } else {
        return '';
      }
    };
    
    result.linkedin = (function() {
		var res = makeLinkedinUrl(el.find('.public-profile span:first').text());
		if(res)return res;
		
		res = makeLinkedinUrl(el.find('.public-profile a').attr('href'));
		if(res)return res;
		
		var match;
		if (match = $.trim(profileId(el)).match(/linkedin\/member-(\w+)/))
			return "http://www.linkedin.com/profile/view?id=" + match[1];
     
        return '';
    })();

    result.twitter = (function() {
		var res = el.find('#twitter-view a').text();
		if(res)return res;
		
		var iframe = el.find('iframe.twitter-follow-button'), match, url;
		if (url = iframe && iframe.attr('src'))
			if (match = url.match(/screen_name=(\w+)/))
				return match[1];
        
		return '';
    })();
    
    result.skype = (function() {
      var text;
      text = '';
      el.find('#im-view li').each(function() {
        var match;
        if (match = $(this).text().match(/(.+)\([Ss]kype\)/)) {
          return text = $.trim(match[1]);
        }
      });
      return text;
    })();
    
    result.addressCity = el.find('#location-container .locality a').text().split(',')[0];
    
    result.addressCountry = (function() {
      var address, addresses;
      address = el.find('#location-container .locality a').text();
      addresses = address.split(',');
      if (addresses.length > 1) {
        return $.trim(addresses.slice(-1)[0]);
      } else {
        return '';
      }
    })();
    
    result.industry = el.find('#location dd.industry').children().text() || '';
    
    result.company = $.trim(el.find('#background-experience .section-item:first header h5').text());
    
    result.title = $.trim(el.find('#background-experience .section-item:first header h4').text());
    
    result.description = $.trim(el.find('#background-experience .section-item:first p.description').text());
	
	chrome.runtime.sendMessage({msg:"contact_dialog",template: "contact-add", data: result}, function(response) {
			  console.log('-----response------',response);
			  crmioIframe=createPopupIframe(response.dialog);
			  $('iframe#_crmio_extn_iframe').fadeIn();
			});
    
   /*  crmioIframe=createPopupIframe("<h3 style='text-align:center;'>Add Contact</h3>\
				Name : <input name='first_name' type='text' class='_crmio_inp' value='"+result.firstName+"' placeholder='First Name'>&nbsp;\
						<input name='last_name' type='text' class='_crmio_inp' value='"+result.lastName+"' placeholder='Last Name'><br/>\
				Company : <input name='company' type='text' class='_crmio_inp' value='"+result.company+"' placeholder='Company'><br/>\
				Job Description : <input name='title' type='text' class='_crmio_inp' value='"+result.title+"' placeholder='Job Title'><br/>\
				Email : <input name='email' type='text' class='_crmio_inp' value='"+result.email+"' placeholder='Email Address'><br/>\
				Mobile : <input name='phone' data-subtype='mobile' type='text' class='_crmio_inp' value='"+result.mobile+"' placeholder='Mobile No.'><br/>\
				Website : <input name='website' data-subtype='URL' type='text' class='_crmio_inp' value='"+result.website+"' placeholder='http(s)://*'><br/>\
				LinkedIn : <input name='website' data-subtype='LINKEDIN' type='text' class='_crmio_inp' value='"+result.linkedin+"' placeholder='Linkedin'><br/>\
				Skype : <input name='website' data-subtype='SKYPE' type='text' class='_crmio_inp' value='"+result.skype+"' placeholder='Skype Id'><br/>\
				Twitter : <input name='website' data-subtype='TWITTER' type='text' class='_crmio_inp' value='"+result.twitter+"' placeholder='Twitter Id'><br/>\
				Address : <input name='addressCity' type='text' class='_crmio_inp_custom address' value='"+result.addressCity+"' placeholder='Address City'>\
							<select name='addressCountry' class='_crmio_inp_custom address' style='width:150px;'>"+
								getCountryOptions(result.addressCountry)
                            +"</select>\
				<div style='text-align:center;'>\
					<input type='button' value='Save' class='_crmio_save_' onclick='onSaveContact();'>\
						&nbsp;&nbsp;\
					<input type='button' value='Cancel' class='_crmio_cancel_' onclick='onClose();'>\
				</div>");
    $(crmioIframe).fadeIn();
     */
    return result;
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request == 'crmio_get_contact_details')
    {  
		if($('body #top-card').length)getContactDetails();
		else if($('body #activity-feed').length)getCompanyDetails();
	}	
  });
