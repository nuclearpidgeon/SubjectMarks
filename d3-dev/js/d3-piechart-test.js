var colors = { // bootstrap colors (http://getbootstrap.com/customize/#colors)
	"danger" : "#d9534f",
	"info"   : "#5bc0de",
	"success": "#5cb85c",
	"primary": "#428bca",
	"warning": "#f0ad4e"
};

var sampleData = [
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
];

var subjectData = ko.observableArray();

// start out with sample data for testing with
ko.utils.arrayPushAll(subjectData, sampleData);

var viewModel = {
	subjectData: subjectData,
	removeDatum: function(el) {
		subjectData.remove(el);
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

function subjectDataDoublePieChart(identifier) {
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

	var vis = d3.select("#"+identifier);
	var chart = vis.select(".chart")

	var currentSubjectData = subjectData();
	var currentEarntLostData = makeEarntLostData(currentSubjectData);
	var groupingByEarntLost = viewModel.groupByEarntLostMode()

	// First set of data-driven elements: Mark Chunks
	//
	// The mark chunk pie lays out two elements/values for each subject
	// - one for marks earnt and one for marks lost
	
	var markChunksContainer = chart.select(".mark-chunks");

	var markChunkPieLayout = d3.layout.pie()
	markChunkPieLayout.value(function(d) {
		// Use the amount of marks earnt or lost as the value for each wedge
		// in the pie
		return d.value
	});
	if (groupingByEarntLost) {
		// sort the data such that all the earnt marks come first
		markChunkPieLayout.sort(function(a, b) {
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
		markChunkPieLayout.sort(null)
	}

	// bind an SVG group element to each slice of the mark chunk pie
	var markChunkArcGroups = markChunksContainer.selectAll("g.mark-chunk")
		.data(markChunkPieLayout(currentEarntLostData.markChunks));

	// define setup of new elements for new data
	var newMarkChunkGroups = markChunkArcGroups.enter()
	var newMarkChunkGroup = newMarkChunkGroups.append("g")
		.attr("class", "mark-chunk");
	newMarkChunkGroup.append("path")
		.attr("class", "weighting-arc");
	newMarkChunkGroup.append("path")
		.attr("class", "score-arc");

	// update all arcs with attributes based off data
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

    // remove elements bound to removed/exiting data
    markChunkArcGroups
    	.exit()
		.remove();
		

	// Second set of data-driven elements: Weightings (full/unsplit)
	//
	// When viewing in group-by-subject mode, the earnt and lost mark chunks
	// within a given subject appear with a tiny gap between them. Keeping a
	// set of full arcs for each weighting on hand to display in this mode
	// (when not animating) makes the graph look nicer and allows for having
	// more consistent per-subject UI elements

	var weightingsContainer = chart.select(".weightings");

	// Only show any of the full weightings when grouping by weighting
	weightingsContainer.attr("display", groupingByEarntLost ? 'none' : null)

	var weightingPieLayout = d3.layout.pie()
	weightingPieLayout.value(function(d) {
		// weighting pie expects to be bound to subject data - the size of each
		// pie slice should be determined by the subject's weighting
		return d.weighting
	});
	// don't sort the values so we can reliably get the pie slices to show up
	// in order
	weightingPieLayout.sort(null)

	// bind
	var weightingArcGroups = weightingsContainer.selectAll("g.weighting-arc")
		.data(weightingPieLayout(currentSubjectData));

	// create/setup
	var newWeightingGroups = weightingArcGroups.enter()
	var newWeightingGroup = newWeightingGroups.append("g")
		.attr("class", "weighting-arc");
	newWeightingGroup.append("path");
	newWeightingGroup.append("text");

	// update
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


	// Third set of data-driven elements: Earnt/Lost totals (full/unsplit)
	//
	// Same as full weightings but for the flip case of the earnt/lost totals
	// in group by earnt/lost mode

	var scoreTotalsContainer = chart.select(".score-totals");

	// Only show any of the full earnt/lost totals when grouping by them
	scoreTotalsContainer.attr("display", groupingByEarntLost ? null : 'none')

	var scoreTotalsPieLayout = d3.layout.pie();
	scoreTotalsPieLayout.value(function(d) {
		return d.value
	})
	// don't sort
	scoreTotalsPieLayout.sort(null);

	// bind
	var scoresArcGroups = scoreTotalsContainer.selectAll("g.score-arc")
		.data(scoreTotalsPieLayout(
			[{
				value: currentEarntLostData.totalEarnt,
				isEarntMarks: true
			}, {
				value: currentEarntLostData.totalLost,
				isEarntMarks: false
			}]
		));

	// setup
	var newScoreGroups = scoresArcGroups.enter()
	var newScoreGroup = newScoreGroups.append("g")
		.attr("class", "score-arc");
	newScoreGroup.append("path");

	// update
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
	subjectData.push(newData);
	return false;
});

$(function() {
	ko.applyBindings(viewModel);
	var updateGraph = function() {
		subjectDataDoublePieChart('svg_donut');
	};
	subjectData.subscribe(updateGraph);
	viewModel.groupByEarntLostMode.subscribe(updateGraph);
	
	updateGraph();
});
