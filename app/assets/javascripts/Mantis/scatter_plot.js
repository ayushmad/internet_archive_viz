function ScatterPlot() {
    var ScatterPlot = new mantis.ViewBase("ScatterPlot", "bar_data");
    
    ScatterPlot.render_layout = function (data) {
	var container = this.container;
	var width = d3.select(this.container).style('width').replace('px', '');
	var height = d3.select(this.container).style('height').replace('px', '');
	var get_color = d3.scale.category10();

	var canvas = d3.select(container)
	  		.append('div')
			.attr('id', 'barGraphBaseDiv')
			.attr('width', width)
			.attr('height', height);
	var legend_canvas = canvas.append('div')
				  .attr('id', 'scatterPlotLegend')
				  .style('height', '75px');
	
	var graph_canvas = canvas.append('div')
				 .attr('id', 'scatterPlotGraph');
	
	var xaxis_canvas = canvas.append('div')
				 .attr('id', 'scatterPlotXaxis')
				 .style('top', (height-20) + 'px');
				
				 

	
	var stacked_data = [];
	var tick_list = [];
	var tick_map ={};
	var pos = 0;
	var tick_values = [];
	var group_count = data.content.length;
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
	Rickshaw.Series.zeroFill(stacked_data)
	var graph = new Rickshaw.Graph({
	        element: document.getElementById('scatterPlotGraph'),
	    	renderer: 'scatterplot',
	        width: width-30, 
	        height: height - 20,
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

	graph.render();

    };
   
    ScatterPlot.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	d3.select(this.container).html('');
	this.render_layout(data);
    };

    ScatterPlot.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
	// Clean Container before drawing
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return ScatterPlot;
}
