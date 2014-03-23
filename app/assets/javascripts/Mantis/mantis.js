// This is the mantis name space
var mantis = function () {
    var mantis = {};
    mantis.contianer_list = new Array();
    function register_container(container) {
        if (mantis.contianer_list.indexOf(container) > -1) {
            return false;
        }
        mantis.contianer_list.push(container);
        return true;
    };

    function remove_contianer(contianer) {
        var index =  contianer_list.indexOf(contianer);
        if (index > -1) {
            contianer_list.splice(index, 1);
        }
    };

    function get_data(endpoint, callback, scope) {
	var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", endpoint, true);
	xmlhttp.onreadystatechange = function() {
	    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		callback.call( scope, JSON.parse(xmlhttp.responseText));
            } 
    	};
	xmlhttp.send();
    }
    
    // Later we will only keep the class
    function get_view_object(view_name) {
        if (view_name in mantis.registered_views) {
            return mantis.registered_views[view_name];
        }
        return false;
    };
    
    function get_model_object(model_name) {
        if (model_name in mantis.registered_models) {
            return mantis.registered_models[model_name];
        }
        return false;
    };
    
    
    // View Class
    // ==================================================================
    // ==================================================================
    // ==================== View Class ==================================
    // ==================================================================
    // ==================================================================
    mantis.ViewBase = function (name, data_format) {
        this.name = name;
        this.data_format = data_format;
	this.message_handler = {};
        this.message_handler[mantis.MessageType.VIEW_INIT] = undefined;
        this.message_handler[mantis.MessageType.SOURCE_UPDATE] = undefined;

        this.send_message_controller = mantis.controller.handle_message;
    };
    
    mantis.registered_views = new Array();
    mantis.register_new_view = function (view_obj) {
        if ( view_obj === mantis.ViewBase ) {
            // May generate a Error
            return false;
        }
        // Checking name of controller
        if (view_obj.name == undefined) {
            return false;
        }
        // Checking data_format of controller
        if (view_obj.data_format == undefined) {
            return false;
        }
        // Note :- May need to Check if it is not already registered
        mantis.registered_views[view_obj.name] = view_obj;
        return true;
    };
    
    // Model Class
    // ==================================================================
    // ==================================================================
    // ==================== Model Class =================================
    // ==================================================================
    // ==================================================================
    mantis.ModelBase =  function () {
        this.name = undefined;
        this.endpoint = mantis.server_endpoint;
        this.format_supported = undefined;
	this.display_name = undefined;
    };
    
    mantis.registered_models = new Array();
    mantis.register_new_model = function (model_obj) {
        if ( model_obj === mantis.ModelBase ) {
            // May generate a Error
            return false;
        }
        // Checking name of controller
        if (model_obj.name == undefined) {
            return false;
        }
        // Checking data_format of controller
        if (model_obj.format_supported == undefined) {
            return false;
        }
        // Note :- May need to Check if it is not already registered
        mantis.registered_models[model_obj.name] = model_obj;
        return true;
    };
    
    // Message Table
    // ==================================================================
    // ==================================================================
    // ========================== Message Table =========================
    // ==================================================================
    // ==================================================================
    mantis.MessageType = {
	// Visualization messages
	VIEW_INIT : '1',
	SOURCE_UPDATE : '2',
	// Controller Messages
	UPDATE_SOURCE: '3',
	UPDATE_VIEW: '4'
    };

    // Mantis Controller 
    // =======================================================================
    // =======================================================================
    // =======================================================================
    // =====================Mantis Controller=================================
    // ===================== It is a singleton object ========================
    // =======================================================================
    // =======================================================================
    // =======================================================================
    // =======================================================================
    mantis.controller = function () {
        var controller = {};
        controller.system_list = Array();
        // This is the variable which maintains the current state of the system
        // as we can create a system
        // Each system is mapped to a array of tuples
        // Each tuple maintains the (container, view, model)
        controller.system_map = {};
	controller.message_map = {};
        controller.message_map[mantis.MessageType.UPDATE_SOURCE] = update_source;
        controller.message_map[mantis.MessageType.UPDATE_VIEW] = update_view;

        
        controller.add_system = function (system_name) {
            // System name has to be unique across all code 
            // Since installing subsystems is responsibility
            // we are fine with that.
            if (controller.system_list.indexOf(system_name) > -1) {
                return false;
            }
            controller.system_list.push(system_name);
            controller.system_map[system_name] = [];
        };
        
        controller.register_to_system = function (system_name, 
                                                  viz_container, 
                                                  default_view,
                                                  default_source) {
            if (controller.system_list.indexOf(system_name) < 0) {
                return false;
            }
            if (default_view == undefined || default_source == undefined) {
                return false;
            }
            if (viz_container == undefined || !register_container(viz_container)) {
                return false;
            }
	    view_obj = get_view_object(default_view);
	    source_obj = get_model_object(default_source);
	    if (source_obj.format_supported.indexOf(view_obj.data_format) == -1) {
		return false;
	    }
            controller.system_map[system_name].push({container : viz_container, 
						     view : default_view, 
	    					     source : default_source});
            return true;
        };
        
        function get_source_query(view_obj, source_obj, filter_options) {
            var query = source_obj.endpoint + "?data_format=" + view_obj.data_format + "&model=" + source_obj.name; 
	    if (filter_options != undefined) {
		for (var key_name in filter_options) {
		    query += "&" + key_name + "=" + filter_options[key_name];
		}
	    }
            return query;
        };

        function refreash_view(view_obj, source_obj) {
            var refreash_handler = view_obj.message_handler[mantis.MessageType.SOURCE_UPDATE];
            var query = get_source_query(view_obj, source_obj);
            get_data(query, refreash_handler, view_obj);
        };
        
        function intilize_view(view_obj, source_obj, filter_options) {
            var init_handler = view_obj.message_handler[mantis.MessageType.VIEW_INIT];
            var query = get_source_query(view_obj, source_obj, filter_options);
            get_data(query, init_handler, view_obj);
        };

        function check_compatibilty(view_obj, source_obj) {
            if (source_obj.format_supported.indexOf(view_obj.data_format) > -1) {
                return true;
            }
            return false;
        };

	function get_nearest_model_obj(view_obj) {
	   for (var model_name in mantis.registered_models) {
		// FIXME:- Direct access to model array
	       	var model_obj = mantis.registered_models[model_name];
		if(check_compatibilty(view_obj, model_obj)) {
		    return model_name;
		}
	   }
	   return false;
	}

	function get_nearest_view_obj(model_obj) {
	   for (var view_name in mantis.registered_views) {
		// FIXME:- Direct access to model array
	       	var view_obj = mantis.registered_views[view_name];
		if(check_compatibilty(view_obj, model_obj)) {
		    return view_name;
		}
	   }
	   return false;
	}

        // These are set of message handlers in the controller
        function update_source(message) {
            var system_name = message.system_name;
            var source_obj = get_model_object(message.source_id);
            var components = controller.system_map[system_name];
            for (var comp_index = 0; comp_index < components.length; comp_index ++) {
		component = components[comp_index];
                var view_obj = get_view_object(component.view);
                if (view_obj.type == "Menu") {
                    continue;
                }

		// Adding nearest compatibility matching
		if (!check_compatibilty(view_obj, source_obj)) {
		    var view_name = get_nearest_view_obj(source_obj);
		    if(view_name) {
			// Cleaning Previous view object 
			view_obj.container = undefined;
			view_obj.system_name = undefined;
			component.view = view_name;
			view_obj = get_view_object(view_name);
			view_obj.system_name = system_name;
			view_obj.container = component.container;
		    } else {
			continue;
		    }
		}
                component.source = message.source_id;
                intilize_view(view_obj, source_obj, message.filter_options);
            }
        };
        
        // These are set of message handlers in the controller
        function update_view(message) {
            var system_name = message.system_name;
            var view_obj = get_view_object(message.viz_id);
            view_obj.system_name = message.system_name;
            var components = controller.system_map[system_name];
            for (var comp_index = 0; comp_index < components.length; comp_index ++) {
		component = components[comp_index];
                // The Menu views do not get updated
                var source_obj = get_model_object(component.source);
                var prev_view_obj = get_view_object(component.view);
                if (prev_view_obj.type == "Menu") {
                    continue;
                }
		if (!check_compatibilty(view_obj, source_obj)) {
		   var source_name = get_nearest_model_obj(view_obj);
		   if (source_name) {
		       component.source = source_name;
		       source_obj = get_model_object(source_name);
		   } else {
		       	continue;
		   }
		}
                // Cleaning previous system
                prev_view_obj.container = undefined;
                prev_view_obj.system_name = undefined;
                component.view = message.viz_id;
		// Cleaning container
		view_obj.container = component.container;
                intilize_view(view_obj, source_obj);
            }
        };



        controller.handle_message = function (message) {
	    if (controller.message_map.hasOwnProperty(message.type)) {
		controller.message_map[message.type](message);
	    } else {
	    // TODO:- we need to do this
	    // We Broadcast this message over all systems
	    }
        };

        controller.init = function () {
            // All systems GO
            for (var system_name in controller.system_map) {
                for (var comp_index = 0 ; comp_index < controller.system_map[system_name].length; comp_index ++) {
                    var component = controller.system_map[system_name][comp_index];
                    var view_obj = get_view_object(component.view);
                    var model_obj = get_model_object(component.source);
                    var viz_container = component.container;
                    // In case of menu view do not need to query
                    // FIXME :-  Menu is being treated as a special case
                    // can it be improved
                    view_obj.system_name = system_name;
                    view_obj.container = viz_container;
                    if (view_obj.type == "Menu") {
                        view_obj.message_handler[mantis.MessageType.VIEW_INIT].call(view_obj, model_obj.data);
                    } 
                    else {
                        intilize_view(view_obj, model_obj);
                    }
                }
            }
        };
        return controller;
    }();
    

   // Mantis Initialization
    mantis.init = function (server_endpoint) {
        mantis.server_endpoint = server_endpoint;
    };
    return mantis;
}();


