var colors = { // bootstrap colors (http://getbootstrap.com/customize/#colors)
	"danger" : "#d9534f",
	"info"   : "#5bc0de",
	"success": "#5cb85c",
	"primary": "#428bca",
	"warning": "#f0ad4e"
};

var sampleData = ko.observableArray([
	{
		"score": 15,
		"max": 20,
		"weighting": 10,
		"color": colors["info"]
	},
	{
		"score": 10,
		"max": 30,
		"weighting": 10,
		"color": colors["primary"]
	},
	{
		"score": 20,
		"max": 30,
		"weighting": 30,
		"color": colors["warning"]
	},
	{
		"score": 85,
		"max": 100,
		"weighting": 50,
		"color": "#911"
	}
]);

var getEarntLostArray = function() {
	var currentData = sampleData();
	var output = [];
	for (var i = 0; i < currentData.length; i++) {
		var subject = currentData[i];
		var percentageEarnt = ((subject.score / subject.max) * subject.weighting);
		var percentageLost = (((subject.max - subject.score) / subject.max) * subject.weighting);

		output.push({
			"color": colors["success"],
			"value": percentageEarnt
		});
		output.push({
			"color": colors["danger"],
			"value": percentageLost
		});
	}
	return output;
}

function d3test(identifier) {
	var weightingArc = function(){
		return d3.svg.arc() 
			.innerRadius(70) 
			.outerRadius(110)
	}
	var scoresArc = function(){
		return d3.svg.arc() 
			.innerRadius(110) 
			.outerRadius(125) 
	}
	var myScale = d3.scale.linear().domain([0, 100]).range([0, 2 * Math.PI]);

	var vis = d3.select("#"+identifier);
	var chart = vis.select(".chart")

	var weightingsGroup = chart.select(".weightings");

	var weightingPie = d3.layout.pie()
	weightingPie.value(function(d) {
		// the size of each pie slice should be determined
		// by the amount each assessment item contributes to
		// the overall score
		//
		// for this test example just use the 'max' and assume
		// each assessment item is weighted equally
		return d.weighting
	});
	weightingPie.sort(null) // don't sort the values so we can reliably get the scores to show up in line
	var weightingArcs = weightingsGroup.selectAll("g.weighting-arc")
		.data(weightingPie(sampleData()));

	// define logic for new/'entering' data points
	// ===========================================

	var weightingEnterGroup = weightingArcs.enter()

	// set up top-level SVG group element
	var newWeightingGroup = weightingEnterGroup.append("g")
		.attr("class", "weighting-arc");

	newWeightingGroup.append("path");
	newWeightingGroup.append("text");

	// update all arcs
	weightingArcs
		.select("path")
			.attr("fill", function(d, i) {
			        return d.data.color;
			    })
		    .attr("d", weightingArc());
    weightingArcs
    	.select("text")
			.text(function(d, i) { return "#" + i + " worth " + d.data.weighting + "%"; })
			.attr("transform", function(d, i) {
				return "translate(" + weightingArc().centroid(d) + ")";
				})
			.attr("dy", "0.35em");

    // delete
    weightingArcs
    	.exit()
    	.remove();

	// scores

	var scoresGroup = chart.select(".scores");
	var scoresPie = d3.layout.pie();
	scoresPie.value(function(d) {
		return d.value
	})
	scoresPie.sort(null); // don't sort the scores as their order is important
	var scoresArcs = scoresGroup.selectAll("g.score-arc")
		.data(scoresPie(getEarntLostArray()));

	var scoresEnterGroup = scoresArcs.enter()

	var newScoreGroup = scoresEnterGroup.append("g")
		.attr("class", "score-arc");

	newScoreGroup.append("path");
	newScoreGroup.append("text");

	// update all scores
	scoresArcs
		.select("path")
			.attr("fill", function(d, i) {
			        return d.data.color;
			    })
			// .attr("stroke", "black")
			// .attr("stroke-width", "1")
		    .attr("d", scoresArc());
    scoresArcs
    	// .select("text")
		// 	.text(function(d, i) { return i + "(" + d.value + ")"; })
		// 	.attr("transform", function(d, i) {
		// 		return "translate(" + scoresArc().centroid(d) + ")";
		// 		})
		// 	.attr("dy", "0.35em");

    // delete
    scoresArcs
    	.exit()
    	.remove();
}

$('#addData').on('click', function() {
	var form = $(this).closest('form');
	var newData = {
		"score": form.find('.new-score input').val(),
		"max"  : form.find('.new-max input').val(),
		"color": form.find('.new-color input').val(),
		"weighting": form.find('.new-weighting input').val()
	}
	sampleData.push(newData);
	return false;
});

$(function() {
	ko.applyBindings(sampleData);
	sampleData.subscribe(function() {
		d3test('svg_donut');
	});
	d3test('svg_donut');
});

d3.layout.scorePie = function() {
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