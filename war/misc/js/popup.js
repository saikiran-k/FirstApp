var USER_SETTINGS={};
var crm={};

function fetchActiveContact(onFail){
	chrome.tabs.query({active:true,highlighted:true}, function(tb){
		//console.log(tb.length+ ' -> '+tb[0].url);
		
		
			if(tb[0].url.indexOf('www.linkedin.com/profile')!=-1 || tb[0].url.indexOf('www.linkedin.com/company')!=-1){
			$("div.crmio-navbar li").removeClass('active');
			$("li#menu-new").addClass('active');
			$("div#crm_others ").html(getHTML("linkedin-active",{tabId:tb[0].id}));
			$("div#container>div").addClass('hidden');
			$("div#crm_others ").removeClass('hidden');
		}
		else if(tb[0].url.indexOf('www.facebook.com')!=-1){
			$("div.crmio-navbar li").removeClass('active');
			$("li#menu-new").addClass('active');
			$("div#crm_others").html(getHTML("facebook-active",{tabId:tb[0].id}));
			$("div#container>div").addClass('hidden');
			$("div#crm_others ").removeClass('hidden');
		}
		else{
			onFail();
			return;
		} 
		
		/* When showing UI here
		chrome.tabs.sendMessage(tb[0].id,'crmio_get_contact_details',function(resp){
			//console.log(resp);
		});
		*/
	});
}

function loadSettings(onLoad)
{
	chrome.storage.local.get(function(item){
		if(item.USER_SETTINGS)
			USER_SETTINGS=item.USER_SETTINGS;
		else USER_SETTINGS={};
		
		if(onLoad)onLoad();
	});
}

function loadNotifications()
{
	$("div.crmio-navbar li").removeClass('active');
	$("li#menu-notification").addClass('active');
	$("div#container>div").addClass('hidden');
	$("div#notifications").removeClass('hidden');
	if(!crm.init_status)
	{
		//console.log("Connector failed");
		return;
	}
	
	$("div#notifications").html("<div style='text-align:center; margin-top:5px;'><img src='../images/ajax-loader-cursor.gif'></div>");
	
	
	chrome.storage.local.get('agile_notifications',function(data){ 
		//console.log("Notifications",data);
		var html = '';
		if(data.agile_notifications)
		{
			
			$.each(data.agile_notifications, function(index, message)
			{
				if(index%2!=0)
					message.class = 'active';
				//console.log('message',message);
				if(message.notification == 'CAMPAIGN_NOTIFY')
					html += getHTML('campaign-notify', message);
				else if(message.notification == 'CALL')
					html += getHTML('call-notification', message);
				else
					html += getHTML('notify-html', message);
	
			});
		} else {
			html = '<div id="message" class="alert alert-info alert-nobg">No Notifications.</div>';
		}
		////console.log(html);
		$("div#notifications").html(html);
		$(".time-ago").timeago();
		$(".text_avatar").closest("img").error(function()
		  {
		   $(this).initial({charCount: 2});
		  });
	});
}

function loadUpcomingTasks()
{
	$("div.crmio-navbar li").removeClass('active');
	$("li#menu-upcoming").addClass('active');
	$("div#container>div").addClass('hidden');
	$("div#upcoming").removeClass('hidden');
	if(!crm.init_status)
	{
		//console.log("Connector failed");
		return;
	}
	
	$("div#upcoming").html("<div style='text-align:center; margin-top:5px;'><img src='../images/ajax-loader-cursor.gif'></div>");
	
	crm.upcomingTasks(function(data){ 
		$("div#upcoming").html(getHTML("upcoming-tasks",data));
		$.each(data, function(index, task)
		{
			$("div#upcoming").find('li#'+task.id).data(task);
		});
		$.timeago.settings.allowFuture = true;
		$(".time-ago").timeago();
	});	
}

function loadSearch()
{
	$("div.crmio-navbar li").removeClass('active');
	$("li#menu-search").addClass('active');
	$("div#container>div").addClass('hidden');
	$("div#crm_search").removeClass('hidden');
	$("div#crm_search").html(getHTML("search"));
		$("#btn_search").on("click",function(evt){
		loadSearchResults();
	});
}

function loadSearchResults()
{
	if(!crm.init_status)
	{
		//console.log("Connector failed");
		return;
	}
	$("#btn_search").button('loading');
	$("div#container #search-results").html("<div style='text-align:center; margin-top:5px;'><img src='../images/ajax-loader-cursor.gif'></div>");
	
	crm.search($("input#inp_search_text").val(),function(contacts){
		
		//console.log('------------',contacts);
		var html = '<div id="message" class="alert alert-info">No Contacts found matching the keyword.</div>';
		if(contacts.length > 0)
			html = getHTML("search-results",contacts);
		
		$("div#container #search-results").html(html);
		$("#btn_search").button('reset');
		$('.search-results').on('click', function(){
			window.open($(this).attr('data-url'));
		});
		$(".text_avatar").closest("img").error(function()
		  {
		   $(this).initial({charCount: 2});
		  });
	});
	
}

function saveDeal()
{
	var deal = {};
	$("#deal_form").find(".form-control").each(function()
	{	
		var value = $(this).val();
		var label = $(this).attr('name');
		if(label=='close_date')
		{
			var date = new Date(value);
			value = date.getTime() / 1000;
		}
		// Ignore the Email in JSON as it is to be sent in the URL but not in the JSON.
		// This is the email of the contact to which this deal is related to.
		if(label!='email')
			deal[label] = value;
	});
	//console.log(deal);
	var email = $("#deal_form input[name='email']").val();
	
	if(email.length == 0)
	{
		
		crm.createDeal(deal, 
		function(resp)
		{	
			$('#save_deal').attr('disabled','disabled');
			//console.log(resp);
			$("#deal_form").append('<div id="message" class="alert alert-info">Deal is added in AgileCRM.</div>');
		},
		function(err)
		{
			//console.log(err);
			$("#deal_form").append('<div id="message" class="alert alert-danger">'+err.responseText+'</div>');
		});
	} else {
		//console.log(email);

		crm.addDeal(email, deal, 
		function(resp)
		{	
			$('#save_deal').attr('disabled','disabled');
			//console.log(resp);
			$("#deal_form").append('<div id="message" class="alert alert-info">Deal is added in AgileCRM.</div>');
		},
		function(err)
		{
			//console.log(err);
			$("#deal_form").append('<div id="message" class="alert alert-danger">'+err.responseText+'</div>');
		});
	}
		email = null;
		
	
}

/**
 * Generate the JSON by the values in the form and create a Task in Agile CRM.
**/
function saveTask()
{
	var task = {};
	$("#task_form").find(".form-control").each(function()
	{	
		var value = $(this).val();
		var label = $(this).attr('name');
		if(label=='due')
		{
			var date = new Date(value);
			value = date.getTime() / 1000;
		}
		// Ignore the Email in JSON as it is to be sent in the URL but not in the JSON.
		// This is the email of the contact to which this task is related to.
		if(label!='email')
			task[label] = value;
	});
	//console.log(task);
	var email = $("#task_form input[name='email']").val();
	if(email.length == 0)
	{
		crm.createTask(task, 
		function(resp)
		{
			$('#save_task').attr('disabled','disabled');
			//console.log(resp);
			$("#task_form").append('<div id="message" class="alert alert-info">Task is added in AgileCRM.</div>');
		},
		function(err)
		{
			//console.log(err);
			$("#task_form").append('<div id="message" class="alert alert-danger">'+err.responseText+'</div>');
		});
	} else {
		//console.log(email);
	crm.addTask(email, task, 
		function(resp)
		{
			$('#save_task').attr('disabled','disabled');
			//console.log(resp);
			$("#task_form").append('<div id="message" class="alert alert-info">Task is added in AgileCRM.</div>');
		},
		function(err)
		{
			//console.log(err);
			$("#task_form").append('<div id="message" class="alert alert-danger">'+err.responseText+'</div>');
		});
	}

}

/**
 * Generate the JSON by the values in the form and create a Task in Agile CRM.
**/
function completeTask(task)
{
	var rel_contacts = [];
	$.each(task.contacts, function(index, contact)
	{
		if(contact.id)
			rel_contacts.push(contact.id);
		else
			rel_contacts.push(contact);
		//console.log(contact.id);
	});
	task.contacts = rel_contacts;
	task.owner_id = task.taskOwner.id;
	//console.log("Completed Task",task);
	crm.updateTask(task, 
		function(resp)
		{
			//console.log(resp);
			$("#"+task.id).css('text-decoration: line-through;');
			$("#"+task.id).data(resp)
		},
		function(err)
		{
			//console.log(err);
			//$("#task_form").append('<p class="bg-danger">'+err.responseText+'</p>');
		});
}

/**
 * Generate the JSON by the values in the form and create a Contact in Agile CRM.
**/
function saveContact()
{
	var contact = {};
	var properties = [];
	$("#contact_form").find(".form-control").each(function()
	{	
		var value = $(this).val();
		var label = $(this).attr('name');
		var property = {};
		if(value)
		{
			//console.log(label +' : '+ value);
			property.value= value;
			property.name=label;
			property.type="SYSTEM";
			properties.push(property);
		}
	});
	contact.properties = properties;
	//console.log(contact);
	crm.addContact(contact, function(resp)
		{	
			$('#save_contact').attr('disabled','disabled');
			//console.log(resp);
			var contactLink = 'https://'+USER_SETTINGS.domain+'.agilecrm.com/#contact/'+resp.id;
			$("#contact_form").append('<div id="message" class="alert alert-info">Contact added to AgileCRM. Click here to <a href="'+contactLink+'" target="_blank">Open Contact</a></div>');
		}, 
		function(err)
		{
			//console.log(err);
			$("#contact_form").append('<div id="message" class="alert alert-danger">'+err.responseText+'</div>');
		});
}

function onSave(actionMsg){
			//console.log('onSave - hit');
			//var inputs=$('div#crm_others input._crmio_inp');
			var props=[];
			$('#crm_others').find('input._crmio_inp').each(function()
			{
				if($(this).val()) {
				
				if($(this).attr('data-subtype'))
					props.push({name:$(this).attr('name'),value:$(this).val(),type:'SYSTEM',subtype:$(this).attr('data-subtype')});
				else props.push({name:$(this).attr('name'),value:$(this).val(),type:'SYSTEM'});
				}
			});
			
			var addrCustom={};
			var addrElems=document.querySelectorAll('div#_crmio_extn_addContact ._crmio_inp_custom.address[name]');
			$('#crm_others').find('._crmio_inp_custom.address[name]').each(function()
			{
				if($(this).val() && $(this).val().length>0)
					addrCustom[$(this).attr('name')]=$(this).val();
			});

			//console.log(addrCustom);
			if(addrCustom.addressCity || addrCustom.addressCountry)
			{
				var obj={};
				if(addrCustom.addressCity)obj.city=addrCustom.addressCity;
				if(addrCustom.addressCountry)obj.country=addrCustom.addressCountry;
				props.push({name:'address',value:JSON.stringify(obj),subtype:''});
			}
			//console.log('Properties 2 Save :',props);
			var contact = {};
			contact.properties = props;
			contact.type=actionMsg;
			
			crm.addContact(contact, function(resp)
				{	
					$('#crm_others').find('input[type="button"]').attr('disabled','disabled');
					//console.log(resp);
					var contactLink = 'https://'+USER_SETTINGS.domain+'.agilecrm.com/#contact/'+resp.id;
					$("#crm_others").append('<div id="message" class="alert alert-info">Contact added to AgileCRM. Click here to <a href="'+contactLink+'" target="_blank">Open Contact</a></div>');
				}, 
				function(err)
				{
					//console.log(err);
					$("#crm_others").append('<div id="message" class="alert alert-danger">'+err.responseText+'</div>');
				});
		
		}

$.validator.addMethod(
        "customPhone",
        function(value, element) {
            var re = new RegExp("[0-9\-\(\)\s]+");
			//console.log(value,re.test(value));
            return this.optional(element) || re.test(value);
        },
        "Please enter valid Phone Number."
);

function validateDealForm()
{
	$('#deal_form').validate({
		submitHandler: function(form){
			saveDeal();
		},
        rules: {
            name:"required",
			expected_value: {
				required: true,
				number: true,
				max: 1000000000000
			},
			probability: {
				required: true,
				number: true,
				max: 100
			},
			milestone: "required",
            email: {
				email: true
            }
        },
		messages: {
			name: "Please enter a name for the Deal.",
			probability: {
			required: "This field is required",
			number: "Please enter valid number",
			max: "Please enter a value less than or equal to 100."
			},
			expected_value:  {
			required: "This field is required",
			number: "Please enter valid number",
			max: "Please enter a value less than or equal to 1000000000000."
			},
			milestone: "Please select the milestone for the Deal.",
			email: "Please enter a valid Email Address."
		}
		
    });
}

function validateTaskForm()
{
	$('#task_form').validate({
		submitHandler: function(form){
			saveTask();
		},
        rules: {
            subject:"required",
			type: "required",
			due: "required",
            email: {
				email: true
            }
        },
		messages: {
			subject: "Please enter Task.",
			type: "Please select the Type of the Task.",
			due: "Please select a due date.",
			email: "Please enter a valid Email Address."
		}
		
    });
}

function validateContactForm()
{
	$('#contact_form').validate({
		submitHandler: function(form){
			saveContact();
		},
        rules: {
            first_name:"required",
			last_name: "required",
            email: {
				email: true
            },
			phone: {
				customPhone: true
			}
        },
		messages: {
			first_name: "Please enter your First Name.",
			last_name: "Please Enter your Last Name.",
			email: "Please enter a valid Email Address."
		}
		
    });
}

function validateFBLNContactForm()
{
	$('#crm_others form').validate({
		submitHandler: function(form){
			onSave('PERSON');
		},
        rules: {
            first_name:"required",
			last_name: "required",
            email: {
				email: true
            },
			phone: {
				customPhone: true
			}
        },
		messages: {
			first_name: "Please enter your First Name.",
			last_name: "Please Enter your Last Name.",
			email: "Please enter a valid Email Address."
		}
		
    });
}

function showDealForm()
{
	$("div.crmio-navbar li").removeClass('active');
	$("li#menu-new").addClass('active');
	$("#menu-add-deal").addClass('active');
	$("div#container>div").addClass('hidden');

	// Get the owners list from the server.
	crm.loadSimpleUrl(crm.base_url+'users',function(response){
		//console.log(response);
        var html = '';
        // Construct the option for the Milestones Select list dynamicly.
        $.each(response,function(index,user)
        {
             html += '<option value="'+user.id+'">'+ user.name+'</option>';
        });
       $("#deal_form #owner_id").html(html);
	});
	
	// Get the milestone from the server.
	crm.loadSimpleUrl(crm.base_url+'milestone',function(response){
		//console.log(response);
		var milestones = response.milestones.split(',');
        var html = '';
        // Construct the option for the Milestones Select list dynamicly.
        for(var i=0; i < milestones.length; i++)
        {
             html += '<option value="'+milestones[i]+'">'+ milestones[i]+'</option>';
        }
       $("#deal_form #milestone").html(html);
		$("div#new_deal").removeClass('hidden');
	});
	$('.date').datepicker();
	validateDealForm();
}

function showTaskForm()
{
	$("div.crmio-navbar li").removeClass('active');
	$("li#menu-new").addClass('active');
	$("#menu-add-task").addClass('active');
	$("div#container>div").addClass('hidden');
	// Get the owners list from the server.
	crm.loadSimpleUrl(crm.base_url+'users',function(response){
		//console.log(response);
        var html = '';
        // Construct the option for the Milestones Select list dynamicly.
        $.each(response,function(index,user)
        {
             html += '<option value="'+user.id+'">'+ user.name+'</option>';
        });
       $("#task_form #owner_id").html(html);
	   
	   $("div#new_task").removeClass('hidden');
	});
	
	$('#dueDate').datepicker();
	validateTaskForm();
}

function showContactForm()
{
	$("div.crmio-navbar li").removeClass('active');
	$("li#menu-new").addClass('active');
	$("#menu-add-lead").addClass('active');
	$("div#container>div").addClass('hidden');
	$("div#new_contact").removeClass('hidden');
	$('#save_contact').removeAttr('disabled');
	validateContactForm();
}

$(function(){

        $("html,body").css("overflow-y","hidden");
		

	loadSettings(function(){
		if(!USER_SETTINGS.email)
		{
			chrome.tabs.create({url: "html/settings.html"});
			window.close();
			return;
		}
		
		crm=new CRMConnector();
		
		if(!USER_SETTINGS.crm)
		{
			//$("div.crmio-navbar").hide();
			//$("div.crmio-navbar-simple").show();
			loadNotifications();
		}
		else{
			fetchActiveContact(loadNotifications);
		}

	});
	
	$("#btn_settings").on("click",function(){
		chrome.tabs.create({url: "html/settings.html"});
		window.close();
		return;
	});
	
	$("#menu-notification").on("click",loadNotifications);
	$("#menu-upcoming").on("click",loadUpcomingTasks);
	$("#menu-search").on("click",loadSearch);
	$("#menu-add-lead").on("click",showContactForm);
	$("#menu-add-task").on("click", showTaskForm);
	$("#menu-add-deal").on("click", showDealForm);
	$("div#container").on("keypress","input#inp_search_text",function(evt){
		if(evt.keyCode==13){
			loadSearchResults();
		}
	});
	
	//$("#contact_form #save_contact").on("click", saveContact);
	//$("#task_form #save_task").on("click", saveTask);
	$("div#container").on("click","input.btn_cursor_more",function(evt){
		evt.stopPropagation();
		var btn=$(this).closest("input.btn_cursor_more");
		
		if(!btn)return;
		
		var url=btn.attr('data-next-url');
		var tpl=btn.attr('data-template');
		
		if(!url)return;
		
		crm.loadSimpleUrl(url,function(data){
			
			if(data.length && data[data.length-1].stats_cursor)
			{
				data[data.length-1].next_url=url.replace(/cursor=[^&]*/,'cursor='+data[data.length-1].stats_cursor);
			}
			
			btn.before(getHTML(tpl,data));
			btn.remove();
		});
	});
	
		$("div#container").on("click","input#facebookFetch",function(evt){
		chrome.tabs.sendMessage(parseInt(this.dataset['tabid']),'crmio_get_contact_details', function(contact){
			//console.log(contact);
			contact.data.countrycode = countryCode2Name;
			if(contact.type=='PERSON')
			{
				$('#crm_others').html(getHTML('contact-add',contact.data));
				validateFBLNContactForm();
			}
			else
				$('#crm_others').html(getHTML('fb-company',contact.data));
			
		});
		//window.close();
		
	});
	$("div#container").on("click","input#linkedinFetch",function(evt){
		chrome.tabs.sendMessage(parseInt(this.dataset['tabid']),'crmio_get_contact_details', function(contact){
			//console.log(contact);
			contact.data.countrycode = countryCode2Name;
			if(contact.type=='PERSON')
			{
				$('#crm_others').html(getHTML('contact-add',contact.data));
				validateFBLNContactForm();
			}
			else
				$('#crm_others').html(getHTML('ln-company',contact.data));
			
		});
		//window.close();
		
	});
	
	$('#crm_others').delegate('#company_save','click',function()
	{
		onSave('COMPANY');
	});
	/* $('#crm_others').delegate('#contact_save','click',function()
	{
		alert('saving');
		onSave('PERSON');
	}); */
	$('#upcoming').delegate('.complete_task','click',function()
	//$(".complete_task").live('click', function(evt)
	{
		var listSelector =  $('li#'+$(this).attr('data-task'));
		var task =listSelector.data();
		//console.log($(this).parent().data());
		if($(this).prop('checked'))
		{
			$(this).parent().find('i').addClass("checked");
			task.is_complete = true;
			listSelector.find('span.subject').css('text-decoration','line-through');
		}
		else
		{
			$(this).parent().find('i').removeClass("checked");
			task.is_complete = false;
			listSelector.find('span.subject').css('text-decoration','none');
		}
		//task.progress = "100";
		completeTask(task);
	});
	
	$(".text_avatar").closest("img").error(function()
	  {
	   $(this).initial({charCount: 2});
	  });
		chrome.browserAction.setBadgeText({'text':''});
});