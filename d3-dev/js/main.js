var myScale = d3.scale.linear().domain([0, 100]).range([0, 2 * Math.PI]);
var vis = d3.select("#svg_donut");
var arc = d3.svg.arc() .innerRadius(60) .outerRadius(100) .startAngle(0) .endAngle(1.5*Math.PI);
var innerArc = d3.svg.arc() .innerRadius(100) .outerRadius(140) .startAngle(1.5*Math.PI).endAngle(2*Math.PI)

vis.append("path") .attr("d", arc) .attr("transform", "translate(300,200)");
vis.append("path") .attr("d", innerArc) .attr("transform", "translate(300,200)");