
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
     
    //console.log(result); 
    result.addressCity=result.addressCity.replace(/^[ ,]*/,'');
	return result;
}

function getContactDetails(){
	//console.log('linkedin - scrapper');
	
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
		try{
		var match;
		if (match = $.trim(profileId(el)).match(/linkedin\/member-(\w+)/))
			return "http://www.linkedin.com/profile/view?id=" + match[1];
     
        return '';
		} catch(err){
			return '';
		}
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
	//console.log('----------result-------',result);
    return result;
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
   /*  console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension"); */
    if (request == 'crmio_get_contact_details')
    {  
		if($('body #top-card').length)sendResponse({type:'PERSON', data: getContactDetails()});
		else if($('body #activity-feed').length)sendResponse({type:'COMPANY', data: getCompanyDetails()});
	}	
  });
