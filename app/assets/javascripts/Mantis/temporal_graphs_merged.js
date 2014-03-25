function TemporalGraphsMerged() {
    var TemporalGraphsMerged = new mantis.ViewBase("MergedAtlas", "graph_list");
    
    TemporalGraphsMerged.create_layout = function () {
	
	var width = d3.select(this.container).style('width').replace('px', '');
	var height = d3.select(this.container).style('height').replace('px', '');

	var canvas = d3.select(this.container)
	    		.append('svg')
			.attr("width", width)
			.attr("height", height)
			.append('g');

	this.width = width;
	this.height = height;
	this.canvas = canvas;

    };
    
    TemporalGraphsMerged.render_legend = function(color_map, fill_function) {
	    var base = this.canvas;
	    var pos = 30;
	    var legend_table = base.append('svg:g');
	    box_size = 15;
	    //legend_table.selectAll('.TemporalGraphsMergedLegend')
	    legend_table.selectAll('rect')
		.data(color_map)
		.enter()
		.append('rect')
		.attr('class', 'TemporalGraphsMergedLegend')
		.attr('width', '15')
		.attr('height', '15')
		.attr('x', '15')
		.attr('y', function (d) { pos = pos+box_size; return pos-box_size;})
		.attr('fill', function(d) { return fill_function(d.dimension);})
		.attr('stroke', "#D4D4D4")
		.attr('stroke-width',"1px");
	    pos = 30;
	    legend_table.selectAll('text')
		.data(color_map)
		.enter()
		.append('text')
		.attr('x', '30')
		.attr('y', function (d) {pos = pos+box_size; return pos-(box_size/2);})
		.attr("dy", ".35em")
		.text(function(d) { return d.name});
		
    };

    TemporalGraphsMerged.render_layout = function (data) {
	var nodes = data.nodes;
	var width = this.width;
	var height = this.height;
	var canvas = this.canvas;
	var fill_color = d3.scale.category10();

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
	
	links_list = [];
	nodes = [];
	group_count  = data.graphs.length;
	base_node =  $.extend({dimension: group_count, node_type: 'fixed', x: width/2, y: height/2}, id_node_map[1]);
	legend_map = [{'name': base_node.name, 'dimension': base_node.dimension}];
	for (var index = 0; index < group_count; index ++) {
	    nodes_sub_group = {1:base_node};
	    sub_graph_set = data.graphs[index];
	    dimension = sub_graph_set.property;
	    sub_graph_set.edges.forEach(function (edge) {
		src_node = undefined;
		dest_node = undefined;
		if (!nodes_sub_group.hasOwnProperty(edge.src)) {
		   nodes_sub_group[edge.src] = $.extend({'dimension': index}, id_node_map[edge.src]);
		}
		if (!nodes_sub_group.hasOwnProperty(edge.dest)) {
		   nodes_sub_group[edge.dest] = $.extend({'dimension': index}, id_node_map[edge.dest]);
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
	    legend_map.push({'name': dimension, 'dimension': index});
	}
	
	var force_layout = d3.layout.force()
	    		     .nodes(nodes)
			     .links(links_list)
			     .size([width, height])
			     .linkDistance(60)
			     .charge(-40)
			     .gravity(0)
			     .on("tick", tick)
			     .start();

	                
	var link = canvas.selectAll(".link")
	    		 .data(force_layout.links())
	    		 .enter().append("line")
	    		 .attr("class", "TemporalGraphsMergedlink");

	var node = canvas.selectAll(".node")
			 .data(force_layout.nodes())
			 .enter().append("g")
			 .attr("class", function (d) { return "TemporalGraphsMergednode"})
			 .attr("node_id", function(d) { return d.id;})
			 .on("mouseover", mouseover)
			 .on("mouseout", mouseout)
			 .call(force_layout.drag);

	node.append("circle")
	    .attr("r", 8)
            .style('fill', function (d) { return fill_color(d.dimension);})
            .style('stroke', function (d) { return d3.rgb(fill_color(d.dimension)).darker(2);});
	

	node.append("text")
	    .attr("x", 12)
	    .attr("dy", ".35em")
	    .style("display", "none")
	    .text(function(d) { return d.name; });
	
	function tick(e) {
	  link
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

  // Push different nodes in different directions for clustering.
  		var k = 6 * e.alpha;
  		nodes.forEach(function(o) {
		    	if (o.node_type == 'fixed') {
			    return;
			}
    			o.y += (o.dimension) & 1 ? k : -k;
    			o.x += (o.dimension) & 2 ? k : -k;
  		});

	      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
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

	/* Rendering the legend */
	this.render_legend(legend_map, fill_color);
    };
    
    TemporalGraphsMerged.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	// Clean Container before drawing
	d3.select(this.container).html('');
	this.create_layout();
	this.render_layout(data);
    };

    TemporalGraphsMerged.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return TemporalGraphsMerged;
}
