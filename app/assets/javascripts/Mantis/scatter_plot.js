function ScatterPlot() {
    var ScatterPlot = new mantis.ViewBase("ScatterPlot", "bar_data");
    
    ScatterPlot.create_layout = function (data) {
	var container = this.container;
	var width = d3.select(this.container).style('width').replace('px', '');
	var height = d3.select(this.container).style('height').replace('px', '');
	var left_checkbox = width - 300;
	var top_checkbox = 10;

	var canvas = d3.select(container)
	  		.append('div')
			.attr('id', 'scatterPlotBaseDiv')
			.attr('width', width)
			.attr('height', height);
	
	var legend_container = canvas.append('div')
				  .attr('id', 'legend_container');
	legend_container.append('div')
	    	        .attr('id', 'smoother')
			.attr('title', 'Smoothing');

	var legend_canvas = legend_container.append('div')
				  .attr('id', 'scatterPlotLegend')
				  .attr('class', 'roundedCornerContainer');
	
	var graph_canvas = canvas.append('div')
				 .attr('id', 'scatterPlotGraph');
	
	var xaxis_canvas = canvas.append('div')
				 .attr('id', 'scatterPlotXaxis')
				 .style('position', 'absolute')
				 .style('top', height -20 + 'px')
				 .style('left', '10px');

	var flip_check_box = canvas.append('div')
	    			   .attr('id', 'scatterPlotk_p_checkbox')
				   .attr('class', 'roundedCornerContainer')
				   .style('height', '75px')
				   .style('position', 'absolute')
				   .style('top', top_checkbox +'px')
				   .style('left', left_checkbox + 'px');

	this.width = width;
	this.height = height;
	this.canvas = canvas;
	this.legend_canvas = legend_canvas;
	this.graph_canvas = graph_canvas;
	this.xaxis_canvas = xaxis_canvas;
    };

    ScatterPlot.process_edges = function(data) {
	var stacked_data = [];
	var tick_list = [];
	var tick_map ={};
	var pos = 0;
	var tick_values = [];
	var group_count = data.content.length;
	var get_color = d3.scale.category10();
	for (var index = 0; index < group_count; index ++) {
		var sub_entries = data.content[index].bar_data;
		var sub_list = [];
		var sorted_entry_list = [];
		for (var tick_name in sub_entries) {
		    if (!tick_map.hasOwnProperty(tick_name)) {
			tick_values.push(pos);
			tick_map[tick_name] = pos++;
			tick_list.push(tick_name);
		    }
		    if (tick_name == "US") {
			sub_entries[tick_name] = 1;
		    }
		    sorted_entry_list.push([tick_map[tick_name], sub_entries[tick_name]]);
		}
		sorted_entry_list.sort(function(a,b){return a[0]-b[0]});
		sorted_entry_list.forEach(function(entry) { 
			sub_list.push({x: entry[0],
				       y: entry[1]+1
				       }); });
		stacked_data.push({data : sub_list,
		    		   color: get_color(index),
		                   name: data.content[index].property
				   });
	}
	this.tick_values = tick_values;
	this.tick_list = tick_list;
	return stacked_data;
    };
    
    ScatterPlot.process_edges_k_p = function(data) {
	/* Flip only generated when the previous values are completed so we can use tick names */
	var stacked_data = [];
	var tick_list = [];
	var tick_map ={};
	var pos = 0;
	var tick_values = [];
	var country_name = this.tick_list;
	var get_color = d3.scale.category20();
	var group_count = data.content.length;
	for (var index = 0; index < country_name.length; index ++) {
	    cur_country = country_name[index];
	    sub_list = []
	    for (var group_index = 0; group_index < group_count; group_index ++) {
		/* Only in first run populate the tick entries*/
		if(index == 0) {
		    tick_values.push(group_index);
		    tick_list.push(data.content[group_index]["property"]);
		}
		var country_year_val = data["content"][group_index]["bar_data"][cur_country];
		if (country_year_val == undefined) {
		    sub_list.push({x: group_index,
				   y: 0});
		} else {
		    sub_list.push({x: group_index,
				   y: country_year_val});
		}
	    }
	    stacked_data.push({data: sub_list,
			       color: get_color(index),
			       name: cur_country});
	}
	this.tick_values = tick_values;
	this.tick_list = tick_list;
	return stacked_data;
    };

    ScatterPlot.render_layout = function(stacked_data) {
	var width = this.width;
	var height = this.height;
	var canvas = this.canvas;
	var legend_canvas = this.legend_canvas;
	var graph_canvas = this.graph_canvas;
	var xaxis_canvas = this.xaxis_canvas;
	var tick_values = this.tick_values;
	var tick_list = this.tick_list;
	Rickshaw.Series.zeroFill(stacked_data)
	var graph = new Rickshaw.Graph({
	        element: document.getElementById('scatterPlotGraph'),
	    	renderer: 'scatterplot',
	        width: width-30, 
	        height: height - 30,
	        series: stacked_data
	});
	 
	var legend = new Rickshaw.Graph.Legend({
	    	graph: graph,
	    	element: document.getElementById('scatterPlotLegend')
	});
	var x_ticks = new Rickshaw.Graph.Axis.X({
	        graph: graph,
	    	orientation: 'bottom',
	    	element: document.getElementById('scatterPlotXaxis'),
		tickValues: tick_values,
		tickSpacing: 1,
		tickFormat: function(x) {return tick_list[x];}
	});
        /*	
	var hoverDetail = new Rickshaw.Graph.HoverDetail( {
	graph: graph,

	});*/
	
	var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
	graph: graph,
	legend: legend
	});

	graph.render();
    };

    ScatterPlot.clean_container = function () {
	$('#scatterPlotLegend').empty()
			       .attr('class', 'roundedCornerContainer');
	$('#scatterPlotGraph').empty('')
	    		      .attr('class', '');
	$('#scatterPlotXaxis').empty('')
	    		      .attr('class', '');
    }
    ScatterPlot.refreash_layout = function (){
	d3.select(this.container).html('');
    	this.create_layout();
	this.add_checkbox();
    }

    ScatterPlot.add_checkbox = function () {
	var flip_div = d3.select('#scatterPlotk_p_checkbox');
	var parent_obj = this;
	var flip_function = function() {
	    // Some Activity So need to check if 
	    // if its flipped
	    var selection_state = d3.select('#scatterPlotk_p_checkboxElement').property('checked');
	    parent_obj.clean_container();
	    var stacked_data = undefined;
	    if (selection_state) {
	    	stacked_data = parent_obj.process_edges_k_p(parent_obj.data);
	    } else {
	    	stacked_data = parent_obj.process_edges(parent_obj.data);
	    }
	    parent_obj.render_layout(stacked_data)
	}
	flip_div.append('input')
	    .attr('type', 'checkbox')
	    .attr('id', 'scatterPlotk_p_checkboxElement')
	    .attr("name", "k_p_checkbox")
	    .on('click', flip_function);
	flip_div.append('label')
		.attr('for', 'k_p_checkbox')
		.attr('id', 'scatterPlotk_p_checkboxLabel')
		.text('Flip Dimensions');
    }
   
    ScatterPlot.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	d3.select(this.container).html('');
	this.data = data;
	this.create_layout();
	this.add_checkbox();
	stacked_data = this.process_edges(data);
	this.render_layout(stacked_data);
    };

    ScatterPlot.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
	// Clean Container before drawing
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return ScatterPlot;
}
