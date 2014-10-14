var EXTENSION_ID_MD5;//=MD5(chrome.i18n.getMessage("@@extension_id"));

/**
	Encode object info as get parameter list.
	So if obj={ p1:'v1 v2', p2:'v2' };
	
	This returns : "base64(p1=v1%32v2&p2=v2)"
**/
function encodeTrackingInfo(info)
{
	var params='';
	
	for(var key in info)
	{
		params+='&'+key+'='+encodeURIComponent(info[key]);
	}
	
	return btoa(params.replace(/^&/,''));
}

function decodeTrackingInfo(string_inf)
{
	var result={};
	
	var str=string_inf.split("&");
	
	for(var i=0;i<str.length;++i)
	{
		var s2=str[i].split('=');
		result[s2[0]]=decodeURIComponent(s2[1]);
	}
	
	return result;
}

/**
	Generate Tracking Image based on info
**/
function generate_tracking_image(info)
{
	return "https://agilecrmio.appspot.com/track-email?from="+EXTENSION_ID_MD5+"&type=image&time="+(Date.now())+"&id="+encodeTrackingInfo(info);
}

/**
	Checks validity of jquery objects, i.e. number of elements selected>0.
	Pass jquery objects as arguments.
**/
function check_valid()
{
	for(var i=0;i<arguments.length;++i)
	{
		if(!arguments[i] || arguments[i].length==0)return false;
	}
	return true;
}

/**
	Extracts all CSS styles from htmlElement, and returns as a single string.
**/
function extract_css(htmlElement)
{
	var txt='';
	
	var rules=window.getMatchedCSSRules(htmlElement);
	
	for(var i=0;i<rules.length;++i)
	{
		txt+=rules[i].style.cssText;
	}
	
	return txt;
}

/**
	USER_SETTINGS handler
**/

var USER_SETTINGS={};
  
/**
	When started, read USER_SETTINGS from storage.
**/  
chrome.storage.local.get(function(item){
		USER_SETTINGS=item.USER_SETTINGS;
		
		if(USER_SETTINGS && USER_SETTINGS.assoc_email)
			EXTENSION_ID_MD5=MD5(USER_SETTINGS.assoc_email);
		else EXTENSION_ID_MD5='undefined';
});  
  
/**
	When USER_SETTINGS is changed, reload from storage.
**/  
chrome.storage.onChanged.addListener(function(changes,namespace){
	if(changes.USER_SETTINGS)
	{	
		USER_SETTINGS=changes.USER_SETTINGS.newValue;
		
		if(USER_SETTINGS && USER_SETTINGS.assoc_email)
			EXTENSION_ID_MD5=MD5(USER_SETTINGS.assoc_email);
		else EXTENSION_ID_MD5='undefined';	
		
		if(typeof(registerTab)=='function')
			registerTab(true);
	}
});  

