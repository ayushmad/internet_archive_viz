function DataModelVerticalMenu() {
    var DataModelVerticalMenu = new mantis.ViewBase("DataModelVerticalMenu", "actionlist");
    // Menus need to have a type associated with them
    DataModelVerticalMenu.type = "Menu";
    DataModelVerticalMenu.create_menu = function (object_hash) {
	var base_list = d3.select(this.container)
	  	          .append('ul');
	var parent_obj = this;
	
	// Converting to Object list
	var object_list= new Array();
	for (var object_name in object_hash) {
	    object_list.push(object_hash[object_name]);
	}

	base_list.attr('class', 'dataModelVerticalMenu')
		 .selectAll('li')
		 .data(object_list.filter(function (d){
		     var val = (d.type == undefined || 
			     d.type != "Menu" ) &&  
			     (d.format_supported == undefined || 
			     d.format_supported.indexOf('actionlist') == -1) 
		     	     ? true : false;
		     return val;
		 }))
		 .enter()
		 .append('li')
		 .attr('id', function(d) { return d.name;})
		 .append('a')
		 .attr('href', '#')
		 .on('click', function (d) {
		     // If it does not have sub filter this is call
		     // Else we will just call toggle
		     if (d.sub_filter == undefined) {
		     	parent_obj.send_message_controller({ 'type': "3",
		     					     'system_name': parent_obj.system_name,
		     					     'source_id': d.name});
		     } else {
			 if (d.open == undefined) {
			     d.open = true;
			     parent_d3_obj = this;
			     parent_menu_name = d.name;
			     var sub_menu_div = d3.select('#' + parent_menu_name)
			       		          .append('div')
			       		          .attr('class', 'subMenu')
		                                  .append('ul');
			     		          
			      var sub_menu_elements  = sub_menu_div.selectAll('li')
			 		      		        .data(d.sub_filter)
			 		                        .enter()
			                                        .append('li');
		             // Adding Drop Down
		             sub_menu_elements.filter(function (d) {
				 				if (d.sub_menutype == "dropdown") {
				 					return true;
				 				} else {
								    	return false;
								}
			     				  }).html(function(d) { if (d.sub_menu_display_name != undefined) {
							      				return "<span>" + d.sub_menu_display_name + "</span>"; } 
			     							else { 
										   	return "<span>" + d.sub_menu_name + "</span>" ;
										}})
			     				    .append('select')
							    .attr('class', 'subMenuInput subMenuSelect')
							    .attr('key-name', function(d){ return d.sub_menu_name})
			     				    .selectAll('option')
							    .data(function (d) { return d.sub_menu_options})
							    .enter()
							    .append('option')
							    .attr('value', function (d) {  return d.name})
							    .text(function(d) { if (d.display_name != undefined){return d.display_name} else { return d.name;}});
		             // Adding Drop Down
		             sub_menu_elements.filter(function (d) {
				 				if (d.sub_menutype == "search_bar") {
				 					return true;
				 				} else {
								    	return false;
								}
			     				  }).html(function(d) { if (d.sub_menu_display_name != undefined) {
							      				return "<span>" + d.sub_menu_display_name + "</span>"; } 
			     							else { 
										   	return "<span>" + d.sub_menu_name + "</span>" ;
										}})
							    .append('input')
							    .attr('class', 'subMenuInput subMenuTextField')
							    .attr('key-name', function(d){ return d.sub_menu_name})
							    .attr('type', 'text');
			   // Adding Apply button
			   sub_menu_div.append('li')
			       	       .append('button')
			               .attr('name', 'applyButton')
			       	       .on('click',  function (d) {
						// Extracting
						var sub_filter_options = {};
						// Extracting select options
						$('.subMenuInput').each( function (index, element) {
						    			selected_element = $(this);
						    			sub_filter_options[selected_element.attr('key-name')] = selected_element.val();
						    			});
		     				parent_obj.send_message_controller({ 'type': "3",
		     					     			     'system_name': parent_obj.system_name,
		     					     			     'source_id': parent_menu_name,
										     'filter_options': sub_filter_options});
				       })
			   	       .text('Apply');
			    
			     				    
			 } else {
			     d.open = undefined;
			     d3.select('#'+ d.name).select('div').remove();
			 }
		     }
		  })
		  .text(function (d) {
		      if (d.display_name == undefined) {  
		      	  return d.name;
		      } else {
		      	  return d.display_name;
		      }
		  });
    }
    DataModelVerticalMenu.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	this.create_menu(data);
    };

    DataModelVerticalMenu.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return DataModelVerticalMenu;
}
