    //= require d3.v3.min.js
    //= require_tree ./Mantis/
    //= require rickshaw.min.js

// Steps For Initializing Mantis.
// a) Initialize the Views that you need
// b) Initialize the models you can attach
// c) Create the controller system by attaching selected models
// d) Start the system



function init_views () {
    // Attaching known Models
    var my_map_shader = MapShader();
    mantis.register_new_view(my_map_shader);
    var my_hm = HorizontalMenu();
    mantis.register_new_view(my_hm);
    var my_vm = VerticalMenu();
    mantis.register_new_view(my_vm);
    var my_basic_treemap = BasicTreeMap();
    mantis.register_new_view(my_basic_treemap);
    var my_tf_Tree = TilfordTree();
    mantis.register_new_view(my_tf_Tree);
    var my_dmvm = DataModelVerticalMenu();
    mantis.register_new_view(my_dmvm);
    var my_tg = TemporalGraphs();
    mantis.register_new_view(my_tg);
    var my_tgm = TemporalGraphsMerged();
    mantis.register_new_view(my_tgm);
    var my_bp = BarPlot();
    mantis.register_new_view(my_bp);
    var my_sp = ScatterPlot();
    mantis.register_new_view(my_sp);
    var my_tgsf = TemporalGraphStaticFlipbook();
    mantis.register_new_view(my_tgsf);
};

function init_models () {
    	var viz_model = new mantis.ModelBase();
	viz_model.name = 'Visulizations';
	viz_model.format_supported = ['actionlist'];
	viz_model.endpoint = undefined;
	viz_model.data = mantis.registered_views;
	mantis.register_new_model(viz_model);
    	
	var data_model = new mantis.ModelBase();
	data_model.name = 'Models';
	data_model.format_supported = ['actionlist'];
	data_model.endpoint = undefined;
	data_model.data = mantis.registered_models;
	mantis.register_new_model(data_model);
	
};

function init_mantis_controller() {
	mantis.controller.add_system("test");
	mantis.controller.register_to_system("test", "#VizContainer", 'ColouredMap', 'aggregated_domain_by_country');
	//mantis.controller.register_to_system("test", "#VizContainer", 'BasicTreeMap', 'node_in_degree');
	//mantis.controller.register_to_system("test", "#VizContainer", 'TilfordTree', 'node_in_degree');
	mantis.controller.register_to_system("test", "#VizMenu", 'HorizontalMenu', 'Visulizations');
	mantis.controller.register_to_system("test", "#DataMenu", 'DataModelVerticalMenu', 'Models');

	mantis.controller.init();
};

function populate_model_list_from_server  (data) {
       	if (data != undefined) {
            var temp_obj = undefined;
            while (mantis.registered_models.length > 0) {
                temp_obj = mantis.pop();
                delete temp_obj;
            }
	// Now add new models
	// Also we need to add a Model for the data list
	for (var source_name in data) {
	    var temp_model = new mantis.ModelBase();
	    temp_model.name = source_name;
	    temp_model.endpoint = data[source_name].endpoint;
	    temp_model.format_supported = data[source_name].format_supported;
	    temp_model.display_name = data[source_name].display_name;
	    temp_model.sub_filter = data[source_name].sub_filter;
	    mantis.register_new_model(temp_model);
	}
  }
};

function init_mantis (data) {
  mantis.init(endpoint);
  populate_model_list_from_server(data);
  init_models();
  init_views();
  init_mantis_controller();
}
    
function get_data_models_from_server(endpoint, callback, scope) {
	var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", endpoint, true);
	xmlhttp.onreadystatechange = function() {
	    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		callback.call( scope, JSON.parse(xmlhttp.responseText));
            } 
    	};
	xmlhttp.send();
}

endpoint = '/congressional_dataset';
model_data_endpoint = endpoint + "?model=model_listing&data_format=123";
get_data_models_from_server(model_data_endpoint, init_mantis);
















