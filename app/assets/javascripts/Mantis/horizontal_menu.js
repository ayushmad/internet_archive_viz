function HorizontalMenu() {
    var HorizontalMenu = new mantis.ViewBase("HorizontalMenu", "actionlist");
    // Menus need to have a type associated with them
    HorizontalMenu.type = "Menu";
    HorizontalMenu.create_menu = function (object_hash) {
	var base_list = d3.select(this.container)
	  	          .append('ul');
	var parent_obj = this;
	// Converting to Object list
	var object_list= new Array();
	for (var object_name in object_hash) {
	    object_list.push(object_hash[object_name]);
	}
	
	base_list.attr('class', 'horizontalMenu')
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
		 .append('a')
		 .attr('href', '#')
		 .on('click', function (d) {
		     // FIXME :-  We need to identify if its a view object
		     // Currently Hard coded
		     parent_obj.send_message_controller({ 'type': "4",
		     					  'system_name': parent_obj.system_name,
		     					  'viz_id': d.name});
		  })
		  .text(function (d) {
		      if (d.display_name == undefined) {  
		      	  return d.name;
		      } else {
		      	  return d.display_name;
		      }
		  });
	
    }
    HorizontalMenu.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	this.create_menu(data);
    };

    HorizontalMenu.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return HorizontalMenu;
}
