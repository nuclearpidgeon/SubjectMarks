function d3test(identifier) {
	// var identifier = "svg_donut"
	var colors = { // bootstrap colors (http://getbootstrap.com/customize/#colors)
		"danger": "#d9534f",
		"info": "#5bc0de",
		"success": "#5cb85c",
		"primary": "#428bca",
		"warning": "#f0ad4e"
	} 
	var myScale = d3.scale.linear().domain([0, 100]).range([0, 2 * Math.PI]);
	var vis = d3.select("#"+identifier);
	//var visenter = vis.enter().append(d3.svg.arc*())
	vis.data([
		{
			"score": 10,
			"max": 20
		},
		{
			"score": 15,
			"max": 20
		},
		{
			"score": 10,
			"max": 30
		}
	]);
	var innerArc = function(){
		return d3.svg.arc() 
			.innerRadius(60) 
			.outerRadius(100)
	}
	var outerArc = function(){
		return d3.svg.arc() 
			.innerRadius(110) 
			.outerRadius(150) 
	}
	var ass1arc = innerArc()
		.startAngle(myScale(0)) 
		.endAngle(myScale(75));
	var ass1succ = outerArc()
		.startAngle(myScale(0)) 
		.endAngle(myScale(60));
	var ass1fail = outerArc()
		.startAngle(myScale(60)) 
		.endAngle(myScale(75));
	var ass2arc = innerArc()
		.startAngle(myScale(75)) 
		.endAngle(myScale(100));
	var ass2succ = outerArc()
		.startAngle(myScale(75)) 
		.endAngle(myScale(90));
	var ass2fail = outerArc()
		.startAngle(myScale(90)) 
		.endAngle(myScale(100));
	vis.append("path") 
		.attr("d", ass1arc) 
		.attr("transform", "translate(250,200)")
		.attr("fill", colors["warning"]);
	vis.append("path") 
		.attr("d", ass1succ) 
		.attr("transform", "translate(250,200)")
		.attr("fill", colors["success"]);
	vis.append("path") 
		.attr("d", ass1fail) 
		.attr("transform", "translate(250,200)")
		.attr("fill", colors["danger"]);
	vis.append("path") 
		.attr("d", ass2arc) 
		.attr("transform", "translate(250,200)")
		.attr("fill", colors["info"]);
	vis.append("path") 
		.attr("d", ass2succ) 
		.attr("transform", "translate(250,200)")
		.attr("fill", colors["success"]);
	vis.append("path") 
		.attr("d", ass2fail) 
		.attr("transform", "translate(250,200)")
		.attr("fill", colors["danger"]);
}