// View Object
// ====================================================================
// ============================= View Objects =========================
// ====================================================================
// ====================================================================
// ====================================================================
// TODO :-  constructor should wrap callbacks so error does not flow through
// Using Factory on durable Constructor 


function MapShader () {
    var MapShader = new mantis.ViewBase("ColouredMap", "map");
    var color_scheme = ['grey', 'orange', 'yellow', 'brown', 'range'];
	
     function create_color_range(pos, step, start, end){
    	return color_scheme;
	};

    MapShader.fill_color = function (color_scheme) {
       var base_colour = this.base_colour;
       var colour_range = create_color_range(1, 8, 180, 0);
       
       var colorScale = d3.scale.linear()
                          .domain([0, 500])
                          .range(colour_range);

       this.canvas.selectAll('path')
         	  .transition()
                  .attr('fill', function(){ 
		      		var country = d3.select(this).attr("id");
                                if (country in color_scheme){
                                    return colorScale(parseInt(color_scheme[country]));
                                }
                                else {
                                    return base_colour;
                                }
                })
		
    };

    MapShader.add_legend = function() {
	var base = this.canvas;
	var pos = 0;
	base.append('svg:g')
	    .selectAll('.mapShaderLegend')
	    .data(color_scheme)
	    .enter(color_scheme)
	    .append('rect')
	    .attr('class', 'mapShaderLegend')
	    .attr('width', '15')
	    .attr('height', '15')
	    .attr('y', '15')
	    .attr('x', function (d) { pos = pos+15; return pos-15;})
	    .attr('fill', function(d) { return d;})
	    .attr('stroke', "#D4D4D4")
	    .attr('stroke-width',"1px");
    }

    MapShader.create_map = function(map_features) {
	var width = d3.select(this.container).style('width').replace('px', '');
	var height = d3.select(this.container).style('height').replace('px', '');
	var map_width_scale = 6.33;
	var map_height_scale = 2.91;
	var map_scale = Math.min((width/map_width_scale), height/map_height_scale); 
	var base_colour = 'white';

	var projection = d3.geo.equirectangular()
	    			.scale(map_scale)
				.translate([width/2, height/2])
				.precision(0.1);
	var path = d3.geo.path().projection(projection);

	this.canvas = d3.select(this.container).append("svg")
	    		.attr('height', height)
			.attr('width', width);
	
	this.countries = this.canvas.append("svg:g")
	    		       	    .attr('id', 'countries')
	
	this.countries.selectAll('path')
		      .data(map_features)
		      .enter()
		      .append('path')
		      .attr('d', path)
		      .attr('id', function(d){ return d.id;})
		      .attr('fill', base_colour)
		      .attr('stroke', 'black')
		      .attr('stroke-width', 1);
	
	this.base_colour = base_colour;

    };

    MapShader.message_handler[mantis.MessageType.SOURCE_UPDATE] = function ( data) {
	    d3.select(this.container).html('');
      	    this.create_map(data.map.features);
	    this.fill_color(data.color_scheme);
	    this.add_legend();
    };

    MapShader.message_handler[mantis.MessageType.VIEW_INIT] = function ( data) {
        this.message_handler[mantis.MessageType.SOURCE_UPDATE].call(this, data);
    };
    
    return MapShader;
}
