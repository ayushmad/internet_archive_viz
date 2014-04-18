function TemporalGraphNodeMovie() {
    /*
     * Node Movie:-
     * Algorithm
     * Based on node transitions and force layout calls
     * We start by introducing a pivot node. Each is node has an edge to the pivot.
     * There is a weak negative Charge which causes a push. 
     * Only the pivot node edge has a link strength thus causing the pull of introduced nodes
     * 1. Nodes are classified at each time step as removal and introduction nodes.
     * 2. At beginning of time step we attach the pivot edge with each introduction node colored in blue.
     *    and detach the pivot edge from each removal node colored in red.
     * 3. Then we run the force layout transition a fixed number of ticks with tick function allowing
     *    nodes to go out of screen.
     * 4. At the end of the ticks the transitions function removes all the removal nodes and colors
     *    all introduction nodes to base color[like green].
     * 5. Thats the end of transition function.
     *
     *  Implementation  Details:- 
     * Because of the beauty of d3 node joins its really cool.
     * Inputs :- 
     * 1. Nodes :- Its the list of the all the nodes which have a year in the current transition.[Note the pivot element must be present]
     * 2. Links :- Its the list of links which exist in the current year. It also contains edges 
     * 		   to the pivot element so as to show the entry links. Note the pivot edges have a 
     * 		   pe key set to true so that they are not displayed.
     *
     * Note Its is assumed that during the preprocessing the nodes are given a 
     * Transitions:- 
     * 1. Node actions:- a) Node which correspond to enter selection are classed as entering_nodes. 
     * 			    i) Since nodes corresponding to entering selection should have a undefined 
     * 			       x and y as then force layout will give them a arbitrary x near the border.
     * 			       This is important as some nodes may get reintroduced hence may have all the previous function
     * 			       attached to them.
     * 			    ii) They are also given a transition which corresponds to increasing there circle size to base size from a start size.
     * 			        They are also given a transition which corresponds to increasing there circle color to green from red.
     * 			 b) Nodes corresponding to exit selection should have a there corresponding links broken because this will cause 
     * 			    the links to move out. Also the nodes the will have a transition corresponding to reduce there circle size.
     * 			    i) Node corresponding to circle size and circle color should show the animation disappearing.
     *
     * 
     *
     *
     * */
    var TemporalGraphNodeMovie = new mantis.ViewBase("NodeMovie", "graph_list");
    TemporalGraphNodeMovie.create_layout = function () {
	var width = d3.select(this.container).style('width').replace('px', '');
	var height = d3.select(this.container).style('height').replace('px', '');
	width = parseInt(width);
	height = parseInt(height);
	var canvas = d3.select(this.container)
	    	       .append('svg')
		       .attr("width", width)
		       .attr("height", height)
		       .append('g');

	
	this.width = width;
	this.height = height;
	this.canvas = canvas;
    };
    
    TemporalGraphNodeMovie.step_layout = function () {
	var width = this.width;
	var height = this.height;
	this.current_step = 0;
	var force_layout = d3.layout.force()
	    		     .friction(0.7)
	    		     .linkDistance(120)
			     .linkStrength(0.1)
			     .charge(-20)
			     .gravity(0.005)
			     .size([width, height]);

	this.force_layout = force_layout;
	force_layout.nodes();
	force_layout.links();
    }


    TemporalGraphNodeMovie.preprocess_nodes = function (data) {
	var width = this.width;
	var height = this.height;
	var node_map_id = {};
	var node_list = [];
	var link_list = [];
	var nodes_process_hash = {};
	var current_node_map = {};
	var previous_node_map = {};
	function init_random_boundry_position(node) {
	    var side_choice = Math.random();
	    if (side_choice < 0.25) {
	   	node.x = Math.floor(Math.random()*(width-50))+25;
	   	node.y = 0;
	    } else if (side_choice < 0.5) {
	   	node.x = Math.floor(Math.random()*(width-50))+25;
	   	node.y = height;
	    } else if (side_choice < 0.75) {
	   	node.y = Math.floor(Math.random()*(height-50))+25;
	   	node.x = width;
	    } else {
	   	node.y = Math.floor(Math.random()*(height-50))+25;
	   	node.x = 0;
	    }
	}
	var node_count = 1;
	data.nodes.forEach(function(node) {
	   init_random_boundry_position(node);
	   node.px = NaN;
	   node.py = NaN;
	   node_map_id[node.id] = node;
	   node_count += 1;
	});
	var graph_list = data.graphs;
	var base_node  = {'id': 0, 
	    	 	  'name': 'pivot_node', 
			  'fixed': true, 
			  'pn': true, 
			  'x': width/2, 
			  'y': height/2};
	var pull_nodes = [{'id': node_count+1,
			   'name': 'pull_nodes',
			   'fixed': true,
			   'pn': true, 
			   'x': 0,
			   'y': 0},
	    		  {'id': node_count+2,
			   'name': 'pull_nodes',
			   'fixed': true,
			   'pn': true, 
			   'x': width+100,
			   'y': 0},
	    		  {'id': node_count+3,
			   'name': 'pull_nodes',
			   'fixed': true,
			   'pn': true, 
			   'x': 0,
			   'y': height+100},
	    		  {'id': node_count+4,
			   'name': 'pull_nodes',
			   'fixed': true,
			   'pn': true, 
			   'x': width+100,
			   'y': height+100}]
	graph_list.forEach(function(graph) {
	    node_list = [base_node];

	    pull_nodes.forEach(function(node){
		node_list.push(node);
	    });
	   

	    edge_list = [];
	    current_node_map = {};
	    graph.edges.forEach(function(edge) {
		if (edge.src == null || edge.dest == null) return;
		source_node = node_map_id[edge.src];
		dest_node = node_map_id[edge.dest];
		edge_list.push({'source': source_node,
		    		'target': dest_node});
		if (!(edge.src in current_node_map)) {
			current_node_map[edge.src] = source_node;
			node_list.push(source_node);
			edge_list.push({'source': source_node,
			    		'target': base_node,
			    		'pe': true});
		}
		if (!(edge.dest in current_node_map)) {
			current_node_map[edge.dest] = dest_node;
			node_list.push(dest_node);
			edge_list.push({'source': dest_node,
			    		'target': base_node,
			    		'pe': true});
		}
	    });
	    /* Adding Pull edges */
	    var flip_count = 0;
	    for(var node_id in previous_node_map) {
		if (!(current_node_map[node_id])) {
			edge_list.push({'source': previous_node_map[node_id],
			    		'target': pull_nodes[flip_count],
			    		'pe': true,
					'exit_link': true});
			flip_count += 1;
			if (flip_count >= pull_nodes.length-1) {
			    flip_count = 0;
			}
		}
	    }
	    previous_node_map = current_node_map;
	    nodes_process_hash[graph.property] = {'node_list' : node_list, 'edge_list': edge_list};
	});
	return nodes_process_hash;
    };

    TemporalGraphNodeMovie.transition = function(new_nodes, new_links) {
	/* Object settings */
	var pivot_node = this.pivot_node;
	var force_layout = this.force_layout;
	var width = this.width;
	var height = this.height;
	var canvas = this.canvas;
	var nodes = force_layout.nodes();
	var links = force_layout.links();
	/* Setting Animation Constants */
	var enter_nodes = '#2ca02c';
	var exit_nodes = "red";
	var update_nodes = "#1f77b4";
	var base_radius = '10px';
	var transition_step_count = '300';
	var ecevnt_stopped = false;
	var max_allowed_duration = 9000;
	var transition_time = max_allowed_duration - 1000;

	/* All Nodes are added to the list */
	/* TODO:- We are doing two merges one based on data join and the other one as this. 
	 * Hence may want to move this out.*/
	/* Step 1. Add old Nodes */
	var node_map = {};
	nodes.forEach(function(entry) {
	    entry.exit = true;
	    entry.fixed = undefined;
	    node_map[entry["id"]] = entry;
	});
	new_nodes.forEach(function(entry) {
	    if (!node_map[entry["id"]]) {
		entry.exit = false;
	    	nodes.push(entry);
	    } else {
		node_map[entry["id"]].exit = false;
		node_map[entry["id"]].fixed = true;
	    }
	});
	/* Step 2. Prune old links */
	var link_map = {};
	var old_link_map = {};
	var node_key;
	new_links.forEach(function(entry) {
	    node_key = entry.source.id + '-'  + entry.target.id;
	    link_map[node_key] = true;
	});
	/* Removing links which should not be part of the current run */
	for (var i = 0; i < links.length; i++) {
	    node_key = links[i].source.id + '-'  + links[i].target.id;
	    if (!link_map[node_key]){
		links.splice(i, 1);
	    } else {
		old_link_map[node_key] = true;
	    }
	}
	/* Adding new links */
	new_links.forEach(function(entry) {
	    node_key = entry.source.id + '-'  + entry.target.id;
	    if(!(old_link_map[node_key])) {
		links.push(entry);
	    }
	 });

	/* Step 3. Remove the links SVG elements 
	 * Uses the data joins */
	var link = canvas.selectAll('.TemporalGraphNodeMovieLinks, .TemporalGraphNodeMoviePivotLinks')
	    		  .data(new_links, function(d) {return d.source.id + "-" + d.target.id;});
	link.enter()
	    .insert('line', ".TemporalGraphNodeMovieNodes")
	    .attr('class', function(d){	if (d.pe == true) 
					{ return "TemporalGraphNodeMoviePivotLinks";}
					else { return "TemporalGraphNodeMovieLinks";}
	    				});
	link.exit().remove();
	
	
	/* Include all nodes in this selection */
	var node = canvas.selectAll('.TemporalGraphNodeMovieNodes, .TemporalGraphNodeMoviePivotNodes')
	 		 .data(nodes, function(d){return d.id;});
	
	node.enter()
	   .append('g')
	   .attr('class', function (d) {if (d.pn == true) { return 'TemporalGraphNodeMoviePivotNodes';}
					else{ return 'TemporalGraphNodeMovieNodes';}})
	   .attr('id', function(d) { return d.id;})
	   .call(force_layout.drag)
	   .filter(function(d) { if (d.pn) { return false; } else { return true;}})
	   .append('circle')
	   .style('fill', enter_nodes)
	   .attr('r', base_radius)
	   .text(function (d) { return d.text; })
	   .transition()
	   .duration(transition_time)
	   .style('fill', update_nodes);

	var exit_node = canvas.selectAll('.TemporalGraphNodeMovieNodes, .TemporalGraphNodeMoviePivotNodes')
	 		 .data(new_nodes, function(d){return d.id;})
			 .exit()
			 .select('circle')
	   		 .transition()
		         .duration(transition_time)
		         .style('fill', exit_nodes);
	


	/*Step 4. Run Force Layout on the Data set */
	force_layout.on('tick', tick)
		    .start()
		    .on('end', function () {
			/* Cleaning up and resetting stuff */
			force_layout.nodes(new_nodes);
			/* Lets Fix them so that they don't shake in next cycle */

			canvas.selectAll('.TemporalGraphNodeMovieNodes, .TemporalGraphNodeMoviePivotNodes')
	 		      .data(new_nodes, function(d){return d.id;})
			      .exit()
			      .remove();
		    });


	function tick() {
	  link.attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

	   node.attr("transform", function(d) { if (!d.exit) {
	       					  if (!d.fixed) {
		  			             d.x = Math.max(20, Math.min(width - 20, d.x));
		  				     d.y = Math.max(20, Math.min(height - 20, d.y));
						  }
	   					}
		  				return "translate(" + d.x + "," + d.y + ")"; });
	}


	/*  Also Putting a max time limit to this animation */
	setTimeout(function () {
	    force_layout.stop();
	}, max_allowed_duration);
	
    };

    TemporalGraphNodeMovie.animate = function (entry) {
	this.transition(entry["node_list"], entry["edge_list"]);
    };

    TemporalGraphNodeMovie.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	// Clean Container before drawing
	d3.select(this.container).html('');
	this.create_layout();
	this.step_layout();
	parent_obj = this;
	var node_hash = this.preprocess_nodes(data);
	if(!Object.keys) Object.keys = function(o){
	   if (o !== Object(o))
	      throw new TypeError('Object.keys called on non-object');
	   var ret=[],p;
	   for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);
	   return ret;
	}	
	var keys = Object.keys(node_hash);
	var key_count = 0;
	function run_animation() {
	    if (key_count < keys.length) {
		parent_obj.animate(node_hash[keys[key_count++]]);
		setTimeout(run_animation, 10000);
	    }
	}
	run_animation();
    };

    TemporalGraphNodeMovie.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return TemporalGraphNodeMovie;
}
