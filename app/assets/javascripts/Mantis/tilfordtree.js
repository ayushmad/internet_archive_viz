function TilfordTree() {
    var TilfordTree = new mantis.ViewBase("TilfordTree", "hierarchical");
    
    TilfordTree.create_layout = function () {
	
	var width = d3.select(this.container).style('width').replace('px', '');
	var height = d3.select(this.container).style('height').replace('px', '');
	var diameter = Math.min(width, height) -10;
	var tree = d3.layout.tree()
	    	     .size([360, diameter/2 -120])
		     .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });
	
	var diagonal = d3.svg.diagonal.radial()
	    		     .projection(function(d) { return [d.y, d.x/180 * Math.PI];});
	
	var canvas = d3.select(this.container)
	    		.append('svg')
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate("+diameter/2 + "," + diameter/2 + ")");
	this.diameter = diameter;
	this.tree  = tree;
	this.diagonal = diagonal;
	this.canvas = canvas;
    };
    
    TilfordTree.render_layout = function (data) {
	var diameter = this.diameter;
	var diagonal = this.diagonal;
	var canvas = this.canvas;
	var tree = this.tree;
	var radius = 4.5;
	
	var nodes = tree.nodes(data);
	var links = tree.links(nodes);

	var link = canvas.selectAll(".tilfordTreeLink")
	    		 .data(links)
			 .enter().append("path")
			 .attr('class', "tilfordTreeLink")
			 .attr("d", diagonal);

	var node = canvas.selectAll(".tilfordTreeNode")
	    		 .data(nodes)
			 .enter().append("g")
			 .attr("class", "tilfordTreeNode")
			 .attr("transform", function(d) { return "rotate(" + (d.x - 90) +")translate(" + d.y + ")";});

	node.append("circle")
	    .attr("r", function() { return radius;});

	node.append("text")
	    .attr("dy", ".31em")
	    .attr("text-anchor", function(d) { return d.x < 180 ? "start": "end";})
	    .attr("transform", function(d) { return d.x < 180 ? "translate(8)": "rotate(180)translate(-8)";})
	    .text(function(d) {  return d.name;});
    };
    
    TilfordTree.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	d3.select(this.container).html('');
	this.create_layout();
	this.render_layout(data);
    };

    TilfordTree.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
	// Clean Container before drawing
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return TilfordTree;
}
