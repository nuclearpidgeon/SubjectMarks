var colors = { // bootstrap colors (http://getbootstrap.com/customize/#colors)
	"danger" : "#d9534f",
	"info"   : "#5bc0de",
	"success": "#5cb85c",
	"primary": "#428bca",
	"warning": "#f0ad4e"
};

var sampleData = [
		{
			"score": 10,
			"max": 20,
			"color": colors["danger"]
		},
		{
			"score": 15,
			"max": 20,
			"color": colors["info"]
		},
		{
			"score": 10,
			"max": 30,
			"color": colors["success"]
		},
		{
			"score": 10,
			"max": 30,
			"color": colors["primary"]
		},
		{
			"score": 10,
			"max": 30,
			"color": colors["warning"]
		},
		{
			"score": 10,
			"max": 30,
			"color": "#911"
		}

	];

function d3test(identifier) {
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

	var myScale = d3.scale.linear().domain([0, 100]).range([0, 2 * Math.PI]);
	var vis = d3.select("#"+identifier);

	var chart = vis.append("g")
		.attr("transform", "translate(250,200)");
	
	var weightings = chart.append("g")
		.attr("class", "weightings");
	var weightingPie = d3.layout.pie()
		.value(function(d) { return d.max }); // object accessor
	var weightingArcs = weightings.selectAll("g.weighting-arc")
		.data(weightingPie(sampleData));
	// create
	var enterGroup = weightingArcs.enter().append("g").attr("class", "weighting-arc");
	enterGroup.append("text")
		.text(function(d, i) { return i + "(" + d.data.max + ")"; })
		.attr("transform", function(d, i) {
			var theta = d.startAngle + (d.endAngle - d.startAngle)/2;
			return "translate(" + Math.sin(theta)*150 + "," + -Math.cos(theta)*150 + ")";
			});
	enterGroup.append("path")
		.attr("fill", function(d, i) {
				console.log(d);
		        return d.data.color;
		    });
	// update
	weightingArcs
		.selectAll("path")
	    .attr("d", innerArc());
    // delete
    weightingArcs
    	.exit()
    	.remove();

	var scores = chart.append("g")
		.attr("class", "scores");
	// var scoreArcs = scores.selectAll("g.score-arc")
	//     .data(scorePie(sampleData));

}

d3.layout.pie2 = function() {
	var value      = Number,
	    sort       = d3_layout_pieSortByValue,
	    startAngle = 0,
	    endAngle   = τ;
	function pie(data) {
		var values = data.map(function(d, i) {
			return +value.call(pie, d, i);
		});
		var a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle);
		var k = ((typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a) / d3.sum(values);
		var index = d3.range(data.length);
		if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
			return values[j] - values[i];
		} : function(i, j) {
			return sort(data[i], data[j]);
		});
		var arcs = [];
		index.forEach(function(i) {
			var d;
			arcs[i] = {
				data: data[i],
				value: d = values[i],
				startAngle: a,
				endAngle: a += d * k
			};
		});
		return arcs;
	}
	pie.value = function(x) {
		if (!arguments.length) return value;
		value = x;
		return pie;
	};
	pie.sort = function(x) {
		if (!arguments.length) return sort;
		sort = x;
		return pie;
	};
	pie.startAngle = function(x) {
		if (!arguments.length) return startAngle;
		startAngle = x;
		return pie;
	};
	pie.endAngle = function(x) {
		if (!arguments.length) return endAngle;
		endAngle = x;
		return pie;
	};
	return pie;
};