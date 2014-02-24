function BasicTreeMap() {
    var BasicTreeMap = new mantis.ViewBase("BasicTreeMap", "hierarchical");
    BasicTreeMap.create_layout = function () {
	// Initializing some basic width
	var margin = {top: 20, right: 10, bottom: 10, left: 10};
	
	var width = d3.select(this.container).style('width').replace('px', '') - margin.left - margin.right;
	var height = d3.select(this.container).style('height').replace('px', '') - margin.top - margin.bottom;
	var color = d3.scale.category20();
	
	var treemap = d3.layout.treemap()
	    		.size([width, height])
			.sticky(true)
			.value(function(d) { return d.value;});
	
	d3.select(this.container)
	  .append('div')
	  .attr('class', 'basicTreeMap');
	var base_element = d3.select('.basicTreeMap')  		     
			     .append('div')
			     .style('position', "relative")
			     .style('width', (width + margin.right) + 'px')
			     .style('height', (height + margin.bottom) + 'px')
			     .style('left', margin.left + 'px')
			     .style('top', margin.top + 'px');

	this.width = width;
	this.height = height;
	this.color = color;
	this.treemap = treemap;
	this.canvas = base_element;
    }

    function position() {
    	this.style("left", function (d) { return d.x + "px";})
	    .style("top", function(d) {  return d.y + "px";})
	    .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
	    .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
    }

    BasicTreeMap.render_boxes = function (data) {
	var canvas = this.canvas;
	// Cleaning contents
	canvas.html('');
	var width = this.width;
	var color = this.color;
	var treemap = this.treemap;
	var node = canvas.datum(data)
	    		 .selectAll(".basicTreeMapnodes")
			 .data(treemap.nodes)
			 .enter()
			 .append('div')
			 .attr('class', 'basicTreeMapNodes')
			 .call(position)
			 .style('background', function(d) {return d.children ? color(d.name): null;})
			 .text(function(d) { return d.children ? null: d.name;})
			 .on('click' , function(d) {
			     if (d.link) {
				 window.open("http://www."+d.link);
			     }
			 });

    }
    
    BasicTreeMap.message_handler[mantis.MessageType.SOURCE_UPDATE] = function (data) {
	d3.select(this.container).html('');
	this.create_layout();
	this.render_boxes(data);
    };

    BasicTreeMap.message_handler[mantis.MessageType.VIEW_INIT] = function (data) {
	// Clean Container before drawing
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    return BasicTreeMap;
};
