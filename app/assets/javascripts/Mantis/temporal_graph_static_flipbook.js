function TemporalGraphStaticFlipbook() {
    var TemporalGraphStaticFlipbook = new mantis.ViewBase("FlipBoard", "graph_list");
    
    TemporalGraphStaticFlipbook.create_layout = function () {
	
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
    
    TemporalGraphStaticFlipbook.render_legend = function(color_map, fill_function) {
	    var base = this.canvas;
	    var pos = 30;
	    var legend_table = base.append('svg:g');
	    var parent_obj = this;
	    var box_size = 15;
	    legend_table.selectAll('rect')
		.data(color_map)
		.enter()
		.append('rect')
		.attr('class', 'TemporalGraphStaticFlipbookLegend')
		.attr('width', '15')
		.attr('height', '15')
		.attr('x', '15')
		.attr('y', function (d) { pos = pos+box_size; return pos-box_size;})
		.attr('fill', function(d) { return fill_function(d.dimension);})
		.attr('stroke', "#D4D4D4")
		.attr('stroke-width',"1px")
		.style('cursor', 'hand')
		.style('cursor', 'pointer')
		.on('click', function(d) {
		    parent_obj.steps.forEach(function (step) {
			if (step.dimension == d.dimension) {
			    parent_obj.render_step(step);
			}
		    });
		});

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
    TemporalGraphStaticFlipbook.render_step = function(step) {
	d3.selectAll(".TemporalGraphStaticFlipbooklink")
	  .style("display", function (d) {
	      				if (d.dimension == step.dimension) {
	  					return 'block'; } else {
	  					return "none"; }
						});
    }


    TemporalGraphStaticFlipbook.render_layout = function (data) {
	var nodes = data.nodes;
	var width = this.width;
	var height = this.height;
	var canvas = this.canvas;
	var fill_color = d3.scale.category10();
	var steps = [];
	this.current_step = -1;

	/*
	 * Currently we are laying out the graphs as though they are a single forest later we will
	 * split them into different layouts
	 * and attach colour based on id
	 */
	 
	// Parse Nodes and create graphs
	var id_node_map = {};
	var nodes = data.nodes;
	var base_node = undefined;
	var legend_map = [];
	data.nodes.forEach(function(entry) {
	    if (entry.color) {
		legend_map.push({"name": entry.name, "dimension": entry.color});
		entry.dimension = entry.color;
	    }
	    id_node_map[entry["id"]] = entry;
	    if (entry["id"] == 1) {
		entry.x = width/2;
		entry.y = height/2;
	    }
	});
	
	var links_list = [];
	var group_count  = data.graphs.length;
	for (var index = 0; index < group_count; index ++) {
	    var sub_graph_set = data.graphs[index];
	    var dimension = sub_graph_set.property;
	    sub_graph_set.edges.forEach(function (edge) {
		var src_node =  id_node_map[edge.src];
		var dest_node = id_node_map[edge.dest];
		if (src_node.dimension == undefined) {
		    src_node.dimension = index;
		}
		if (dest_node.dimension == undefined) {
		    dest_node.dimension = index;
		}
		links_list.push({source: src_node,
		    	           target: dest_node,
		    		   weight: edge.weight,
				   dimension: index});
			    	   
	    });
	    legend_map.push({'name': dimension, 'dimension': index});
	    steps.push({'name': dimension, 'dimension': index });
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

	                
	var link = canvas.selectAll(".TemporalGraphStaticFlipbooklink")
	    		 .data(force_layout.links())
	    		 .enter().append("line")
	    		 .attr("class", function(d) {return "TemporalGraphStaticFlipbooklink connects" + d.source.id + " connects" + d.target.id;})
			 .style('display', 'none')
			 .attr("time_dimension", function(d) {return d.dimension;});

	var node = canvas.selectAll(".TemporalGraphStaticFlipbooknode")
			 .data(force_layout.nodes())
			 .enter().append("g")
			 .attr("class", function (d) { return "TemporalGraphStaticFlipbooknode"})
			 .attr("node_id", function(d) { if (d.id == 1) {
			     					d.fixed = true;
			     				}
			 				return d.id;})
			 .on("mouseover", mouseover)
			 .on("mouseout", mouseout)
			 .attr("time_dimension", function(d) { return d.dimension;})
			 .call(force_layout.drag);

	node.append("circle")
	    .attr("r", 8)
            .style('fill', function (d) { return fill_color(d.dimension);})
            .style('stroke', function (d) { return d3.rgb(fill_color(d.dimension)).darker(2);});
	

	node.append("text")
	    .attr("x", 12)
	    .attr("dy", ".35em")
	    .text(function(d) { return d.name; })
	    .style("display", "none");
	
	function tick() {
	  link
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

	   node.attr("transform", function(d) { if (!d.fixed) {
		  			          d.x = Math.max(20, Math.min(width - 20, d.x));
		  				  d.y = Math.max(20, Math.min(height - 20, d.y));
						 }
		  				return "translate(" + d.x + "," + d.y + ")"; });
	}

	function mouseover() {
	      var element = d3.select(this)
	      var node_id = element.attr('node_id');
	      canvas.selectAll('.connects' + node_id)
		    .style('opacity', '0.7');
		  	      
	      element.select('circle')
		     .transition()
		     .duration(750)
		     .attr("r", 20);
	      element.select('text')
		     .style("display", "block");
	      		
	};
    
	function mouseout() {
	      var element = d3.select(this)
	      var node_id = element.attr('node_id');
	      d3.selectAll('.connects' + node_id)
		    .style('opacity', '0.2');
	      
	      element.select('circle')
		     .transition()
		     .duration(750)
		     .attr("r", 8);
	      element.select('text')
		     .style("display", "none");
	};

	/* Rendering the legend */
	this.render_legend(legend_map, fill_color);
	this.steps = steps;
    };

    TemporalGraphStaticFlipbook.go_to_next_step = function () {
	this.current_step += 1;
	var current_step = this.current_step % this.steps.length;
	var step_contraints = this.steps[current_step];
	this.render_step(step_contraints);
	return step_contraints;
    };

    TemporalGraphStaticFlipbook.next_step = function () {
	return this.steps[(this.current_step + 1) % this.steps.length];
    }

    TemporalGraphStaticFlipbook.create_stepper = function() {
	var canvas = this.canvas;
	var width = this.width;
	var height = this.height;
	var parent_obj = this;
	var button_group = canvas.append("g");
	button_group.append("rect")
	      .attr('x', width-240)
	      .attr('y', 20)
	      .attr('rx', 5)
	      .attr('rx', 5)
	      .attr('width', 120)
	      .attr('height', 30)
	      .style('fill', '#659EC7')
	      .style('cursor', 'hand')
	      .style('cursor', 'pointer')
	      .on('click', function(d) {
		  var step = parent_obj.go_to_next_step();
		  button_group.select('text')
		    	      .text('Next Step-' + parent_obj.next_step().name);
	      });

	button_group.append('text')
	    	    .attr('x', width-240)
		    .attr('y', 40)
		    .style('cursor', 'hand')
		    .style('cursor', 'pointer')
		    .on('click', function(d) {
		        var step = parent_obj.go_to_next_step();
		        button_group.select('text')
		      	      .text('Next Step-' + parent_obj.next_step().name);
		    })
		    .text('Next Step-' + parent_obj.next_step().name);
    }

    TemporalGraphStaticFlipbook.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	// Clean Container before drawing
	d3.select(this.container).html('');
	this.create_layout();
	this.render_layout(data);
	this.create_stepper();
    };

    TemporalGraphStaticFlipbook.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return TemporalGraphStaticFlipbook;
}
