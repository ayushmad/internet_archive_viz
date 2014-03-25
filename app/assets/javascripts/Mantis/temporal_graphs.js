function TemporalGraphs() {
    var TemporalGraphs = new mantis.ViewBase("ForcedAtlas", "graph_list");
    
    TemporalGraphs.create_layout = function () {
	
	var width = d3.select(this.container).style('width').replace('px', '');
	var height = d3.select(this.container).style('height').replace('px', '');

	var canvas = d3.select(this.container)
	    		.append('svg')
			.attr("width", width)
			.attr("height", height);

	this.width = width;
	this.height = height;
	this.canvas = canvas;

    };

    function split_screen(width, height, group_count) {
	if (group_count < 1) {
	    alert('some error has ocurred in code');
	} else if (group_count > 4) {
	    console.log('This case is yet to be handled');
	} else if (group_count > 2) {
	    return [ { 'width': width/2,
		       'height': height/2,
		       'start_x': 0,
		       'start_y': 0},
	    	     { 'width': width/2,
		       'height': height/2,
		       'start_x': width/2,
		       'start_y': 0},
	    	     { 'width': width/2,
		       'height': height/2,
		       'start_x': 0,
		       'start_y': height/2},
	    	     { 'width': width/2,
		       'height': height/2,
		       'start_x': width/2,
		       'start_y': height/2}
		     ];
	} else if (group_count == 2) {
	    return [ { 'width': width/2,
		       'height': height,
		       'start_x': 0,
		       'start_y': 0},
	    	     { 'width': width/2,
		       'height': height,
		       'start_x': width/2,
		       'start_y': 0}]
	    
	} else {
	    return [ { 'width': width/2,
		       'height': height,
		       'start_x': 0,
		       'start_y': 0}]
	}
    };

    TemporalGraphs.layout_a_sub_graph = function(canvas_dimensions, nodes, links, banner) {
	var width = this.width;
	var height = this.height;
	var canvas = this.canvas;
	var canvas_group = canvas.append('g')
	    			 .attr("transform", "translate(" + canvas_dimensions.start_x + ", " + canvas_dimensions.start_y + ")");
	
	var force_layout = d3.layout.force()
	    		     .nodes(nodes)
			     .links(links_list)
			     .size([canvas_dimensions.width, canvas_dimensions.height])
			     .linkDistance(60)
			     .charge(-300)
			     .on("tick", tick)
			     .start();

	canvas_group.append("text")
	    	    .attr('class', 'TemporalGraphsbanner')
	            .attr('x', canvas_dimensions.width/2)
		    .attr('y', 30)
		    .text(banner);
	                
	
	var link = canvas_group.selectAll(".link")
	    .data(force_layout.links())
	    .enter().append("line")
	    .attr("class", "TemporalGraphslink");

	var node = canvas_group.selectAll(".node")
	    .data(force_layout.nodes())
	    .enter().append("g")
	    .attr("class", function (d) { return "TemporalGraphsnode"})
	    .attr("node_id", function(d) { return d.id;})
	    .on("mouseover", mouseover)
	    .on("mouseout", mouseout)
	    .call(force_layout.drag);

	node.append("circle")
	    .attr("r", 8);

	node.append("text")
	    .attr("x", 12)
	    .attr("dy", ".35em")
	    .style("display", "none")
	    .text(function(d) { return d.name; });
	
	function tick() {
	  link
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      
	      .attr("y2", function(d) { return d.target.y; });

	  node
	      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}

	function mouseover() {
	      var node_id = d3.select(this)
		  	      .attr('node_id');
	      function node_activate(selector) {
			selector.select("circle").transition()
		          	.duration(750)
			  	.attr("r", 20);
			selector.select("text")
			        .style("display", "block");

	      }
	      d3.selectAll($('[node_id=' + node_id + ']')).call(node_activate);
	};

	function mouseout() {
	      var node_id = d3.select(this)
		  	      .attr('node_id');
	      function node_deactivate(selector) {
			selector.select("circle").transition()
		          	.duration(750)
			  	.attr("r", 8);
			selector.select("text")
			        .style("display", "none");
	      }
	      d3.selectAll($('[node_id=' + node_id + ']')).call(node_deactivate);
	};
    };
    
    TemporalGraphs.render_layout = function (data) {
	var nodes = data.nodes;
	var width = this.width;
	var height = this.height;
	var canvas = this.canvas;

	/*
	 * Currently we are laying out the graphs as though they are a single forest later we will
	 * split them into different layouts
	 * and attach colour based on id
	 */
	 
	// Parse Nodes and create graphs
	id_node_map = {};
	data.nodes.forEach(function(entry) {
	    id_node_map[entry["id"]] = entry;
	});
	
	//
	group_count  = data.graphs.length;
	canvas_dimensions_group = split_screen(width, height, group_count);
	for (var index = 0; index < group_count; index ++) {
	    nodes_sub_group = {};
	    links_list = [];
	    nodes = [];
	    sub_graph_set = data.graphs[index];
	    sub_graph_set.edges.forEach(function (edge) {
		src_node = undefined;
		dest_node = undefined;
		if (!nodes_sub_group.hasOwnProperty(edge.src)) {
		   nodes_sub_group[edge.src] = $.extend({}, id_node_map[edge.src]);
		}
		if (!nodes_sub_group.hasOwnProperty(edge.dest)) {
		   nodes_sub_group[edge.dest] = $.extend({}, id_node_map[edge.dest]);
		}
		src_node =  nodes_sub_group[edge.src];
		dest_node = nodes_sub_group[edge.dest];
		links_list.push({source: src_node,
		    	           target: dest_node,
		    		   weight: edge.weight});
			    	   
	    });
	    for (var key in nodes_sub_group) {
		nodes.push(nodes_sub_group[key]);
	    }
	    this.layout_a_sub_graph(canvas_dimensions_group[index], nodes, links_list, sub_graph_set.property);
	}
    };
    
    TemporalGraphs.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	// Clean Container before drawing
	d3.select(this.container).html('');
	this.create_layout();
	this.render_layout(data);
    };

    TemporalGraphs.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return TemporalGraphs;
}
