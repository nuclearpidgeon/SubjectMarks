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

var viewModel = {
	sampleData: sampleData,
	removeDatum: function(el) {
		sampleData.remove(el);
	},
	groupByEarntLostMode: ko.observable(false)
}

var makeEarntLostData = function(subjectData) {
	var markChunks = [];
	var totalEarnt = 0;
	var totalLost = 0;

	for (var i = 0; i < subjectData.length; i++) {
		var subject = subjectData[i];

		totalEarnt += subject.score;
		totalLost += subject.max - subject.score;

		var percentageEarnt = ((subject.score / subject.max) * subject.weighting);
		var percentageLost = (((subject.max - subject.score) / subject.max) * subject.weighting);

		markChunks.push({
			"subjectIdx": i,
			"color": subject.color,
			"isEarntMarks": true,
			"value": percentageEarnt,
			"weighting": subject.weighting
		});
		markChunks.push({
			"subjectIdx": i,
			"color": subject.color,
			"isEarntMarks": false,
			"value": percentageLost,
			"weighting": subject.weighting
		});
	}
	return {
		markChunks: markChunks,
		totalEarnt: totalEarnt,
		totalLost: totalLost
	};
}

function d3test(identifier) {
	var weightingArc = function(){
		return d3.svg.arc() 
		.innerRadius(110) 
		.outerRadius(150)
	}
	var scoresArc = function(){
		return d3.svg.arc() 
		.innerRadius(150) 
		.outerRadius(165) 
	}
	// pseudo-arc for centering labels correctly
	var labelsArc = function(){
		return d3.svg.arc() 
			.innerRadius(110)
			.outerRadius(165)
}
	var myScale = d3.scale.linear().domain([0, 100]).range([0, 2 * Math.PI]);

	var vis = d3.select("#"+identifier);
	var chart = vis.select(".chart")
	var currentSubjectData = sampleData();
	var currentEarntLostData = makeEarntLostData(currentSubjectData);
	var groupingByEarntLost = viewModel.groupByEarntLostMode()

	var markChunksContainer = chart.select(".mark-chunks");

	// the mark chunk pie layout lays out two elements/values for each subject
	// - one for marks earnt and one for marks lost

	var markChunkPie = d3.layout.pie()
	markChunkPie.value(function(d) {
		// Use the amount of marks earnt or lost as the value for each wedge
		// in the pie
		return d.value
	});
	if (groupingByEarntLost) {
		// sort the data such that all the earnt marks come first
		markChunkPie.sort(function(a, b) {
			if (a.isEarntMarks) {
				if (b.isEarntMarks) {
					// order by index
					return a.subjectIdx - b.subjectIdx
				}
				else {
					// a should be first because it is earnt
					return -1;
				}
			}
			else {
				if (b.isEarntMarks) {
					// b should be first because it is earnt
					return 1;
				}
				else {
					// order by index
					return a.subjectIdx - b.subjectIdx
				}
			}
		});
	}
	else {
		// don't sort, show in subject order
		markChunkPie.sort(null)
	}


	var markChunkArcGroups = markChunksContainer.selectAll("g.mark-chunk")
		.data(markChunkPie(currentEarntLostData.markChunks));

	// define logic for new/'entering' data points
	// ===========================================

	var newMarkChunkGroups = markChunkArcGroups.enter()

	// set up top-level SVG group element
	var newMarkChunkGroup = newMarkChunkGroups.append("g")
		.attr("class", "mark-chunk");

	newMarkChunkGroup.append("path")
		.attr("class", "weighting-arc");
	newMarkChunkGroup.append("path")
		.attr("class", "score-arc");

	// update all arcs
	markChunkArcGroups
		.select("path.weighting-arc")
			.attr("fill", function(d, i) {
			        return d.data.color;
			    })
			.attr("d", weightingArc());
	markChunkArcGroups
		.select("path.score-arc")
			.attr("fill", function(d, i) {
					return d.data.isEarntMarks ? colors["success"] : colors["danger"];
				})
		    .attr("d", scoresArc());

    // delete
    markChunkArcGroups
    	.exit()
		.remove();
		
	// full (non-split) weightings

	var weightingsContainer = chart.select(".weightings");
	weightingsContainer.attr("display", groupingByEarntLost ? 'none' : null)

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
	var weightingArcGroups = weightingsContainer.selectAll("g.weighting-arc")
		.data(weightingPie(currentSubjectData));

	// define logic for new/'entering' data points
	// ===========================================

	var newWeightingGroups = weightingArcGroups.enter()

	// set up top-level SVG group element
	var newWeightingGroup = newWeightingGroups.append("g")
		.attr("class", "weighting-arc");

	newWeightingGroup.append("path");
	newWeightingGroup.append("text");

	// update all arcs
	weightingArcGroups
		.select("path")
			.attr("fill", function(d, i) {
			        return d.data.color;
			    })
		    .attr("d", weightingArc());
    weightingArcGroups
    	.select("text")
			.text(function(d, i) { return "#" + (i+1) + " worth " + d.data.weighting + "%"; })
			.attr("transform", function(d, i) {
				return "translate(" + labelsArc().centroid(d) + ")";
				})
			.attr("dy", "0.35em");

    // delete
    weightingArcGroups
    	.exit()
    	.remove();


	// scores

	var scoreTotalsContainer = chart.select(".score-totals");
	scoreTotalsContainer.attr("display", groupingByEarntLost ? null : 'none')

	var scoreTotalsPie = d3.layout.pie();
	scoreTotalsPie.value(function(d) {
		return d.value
	})
	scoreTotalsPie.sort(null); // don't sort

	var scoresArcGroups = scoreTotalsContainer.selectAll("g.score-arc")
		.data(scoreTotalsPie(
			[{
				value: currentEarntLostData.totalEarnt,
				isEarntMarks: true
			}, {
				value: currentEarntLostData.totalLost,
				isEarntMarks: false
			}]
		));

	var newScoreGroup = scoresArcGroups.enter()

	var newScoreGroup = newScoreGroup.append("g")
		.attr("class", "score-arc");

	newScoreGroup.append("path");

	// update all scores
	scoresArcGroups
		.select("path")
			.attr("fill", function(d, i) {
			        return d.data.isEarntMarks ? colors["success"] : colors["danger"];
			    })
			// .attr("stroke", "black")
			// .attr("stroke-width", "1")
			.attr("d", scoresArc());

    // delete
    scoresArcGroups
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
	ko.applyBindings(viewModel);
	var updateGraph = function() {
		d3test('svg_donut');
	};
	sampleData.subscribe(updateGraph);
	viewModel.groupByEarntLostMode.subscribe(updateGraph);
	
	updateGraph();
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