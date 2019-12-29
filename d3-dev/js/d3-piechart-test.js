var colors = { // bootstrap colors (http://getbootstrap.com/customize/#colors)
	"danger" : "#d9534f",
	"info"   : "#5bc0de",
	"success": "#5cb85c",
	"primary": "#428bca",
	"warning": "#f0ad4e"
};

var idGenerator = (function() {
	var internalId = 0;
	var external = function() {
		return ++internalId;
	}
	Object.defineProperty(external, 'currentVal', { get: function() { return internalId; } });
	return external
})()

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

// start out with the sample data for testing with
for(var i = 0; i < sampleData.length; i++) {
	var datum = sampleData[i]
	datum.id = idGenerator()
	subjectData.push(datum)
}

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

		// XXX: it might be worth making these objects more definedly typed by
		// giving them a prototype at some point, but plain objects are used
		// for now
		markChunks.push({
			"subjectId": subject.id,
			"subjectIndex": i,
			"color": subject.color,
			"isEarntMarks": true,
			"value": percentageEarnt,
			"weighting": subject.weighting
		});
		markChunks.push({
			"subjectId": subject.id,
			"subjectIndex": i,
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

// comparator function for earnt/lost mark chunks that groups all the earnt and
// lost chunks together
function earntLostGroupingMarkChunkComparator(a, b) {
	if (a.isEarntMarks) {
		if (b.isEarntMarks) {
			// order by index
			return a.subjectIndex - b.subjectIndex
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
			return a.subjectIndex - b.subjectIndex
		}
	}
}

// XXX: this might be worth moving into a prototype on the mark chunk objects at some point
function earntLostMarkChunkId(markChunk) {
	// use ID field combined with earnt/lost type as a unique identifier
	return markChunk.subjectId.toString() + (markChunk.isEarntMarks ? '+' : '-')
}

// define arc drawing functions

var weightingArc = function() {
	return d3.svg.arc()
		.innerRadius(110)
		.outerRadius(150)
}
weightingArc.newArc = function() {
	return d3.svg.arc()
		.innerRadius(165)
		.outerRadius(205)
}
var scoresArc = function() {
	return d3.svg.arc()
		.innerRadius(150)
		.outerRadius(165)
}
scoresArc.newArc = function() {
	return d3.svg.arc()
		.innerRadius(205)
		.outerRadius(220)
}
// pseudo-arc for centering labels correctly
var labelsArc = function() {
	return d3.svg.arc()
		.innerRadius(110)
		.outerRadius(165)
}

// define tween for animating arcs
// lovingly stolen and modified from http://bl.ocks.org/mbostock/5100636
function makeArcAngleChangeTween(oldStartAngle, oldEndAngle, newStartAngle, newEndAngle, arcFunc) {
	// The actual tween is a function invoked per-datum
	return function(d) {
		// Setup interpolators for the start and end angles
		var interpolateStartAngle = d3.interpolate(oldStartAngle, newStartAngle);
		var interpolateEndAngle = d3.interpolate(oldEndAngle, newEndAngle);

		// Surprise: the tween itself also returns a function that's actually
		// an interpolator for the tween. This function returns the new
		// version of the datum for each timestep t ∈ (0, 1)
		return function(t) {
			d.startAngle = interpolateStartAngle(t);
			d.endAngle = interpolateEndAngle(t);

			return arcFunc(d);
		};
	};
}
function makeArcRadiusChangeTween(oldInnerRadius, oldOuterRadius, newInnerRadius, newOuterRadius, arcFunc) {
	return function(d) {
		// Setup interpolators for the start and end radius
		var interpolateInnerRadius = d3.interpolate(oldInnerRadius, newInnerRadius);
		var interpolateOuterRadius = d3.interpolate(oldOuterRadius, newOuterRadius);

		return function(t) {
			d.innerRadius = interpolateInnerRadius(t);
			d.outerRadius = interpolateOuterRadius(t);

			return arcFunc(d);
		};
	};
}

function subjectDataDoublePieChart(identifier) {
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
		markChunkPieLayout.sort(earntLostGroupingMarkChunkComparator);
	}
	else {
		// don't sort, show in subject order
		markChunkPieLayout.sort(null)
	}

	// snapshot the current data for transition calculations
	var priorArcGroupData = markChunksContainer.selectAll("g.mark-chunk")
		.data()
	// calculate the new data for binding + transition calculations
	var newArcGroupData = markChunkPieLayout(currentEarntLostData.markChunks);
	// bind an SVG group element to each slice of the mark chunk pie
	var markChunkArcGroups = markChunksContainer.selectAll("g.mark-chunk")
		.data(newArcGroupData, function(d, i) {
			return earntLostMarkChunkId(d.data)
		});

	var entryMarkChunkArcGroups = markChunkArcGroups.enter()
	var exitingMarkChunkArcGroups = markChunkArcGroups.exit();

	function insertEntryElements() {
		// define setup of new elements for new data
		var newMarkChunkGroups = entryMarkChunkArcGroups.append("g")
			.attr("class", "mark-chunk")
			.style("opacity", 0);
		newMarkChunkGroups.append("path")
			.attr("class", "weighting-arc")
			.attr("d", weightingArc.newArc());
		newMarkChunkGroups.append("path")
			.attr("class", "score-arc")
			.attr("d", scoresArc.newArc());

		var actualNewGroups = newMarkChunkGroups[0].filter(function(e) { return (e !== null) })
		console.log("insertion triggered, " + actualNewGroups.length + " mark chunk groups added", actualNewGroups)
		// return the groups so they can be used for selection
		return newMarkChunkGroups;
	}

	function defineUpdateTransitions(parentTransition) {
		parentTransition.each(function() {
			var updateTransitions = markChunkArcGroups.transition()
			updateTransitions
				.each(function(d, i) {
					// TODO: need to be able to match between subjects using a
					// better unique identifier than array index!

					// Only existing chunks in the graph should be angle
					// tweened - i.e. NOT chunks from the entry selection.
					//
					// At this point, appending to the entry selection has
					// (most likely) occurred, so the chunks that should only
					// be updated have to be found again, because
					// .entry().append() in d3 v3 causes the new appended
					// elements to get merged back into its original/parent
					// selection (see 'Removing the magic of enter.append in
					// this article: https://medium.com/@mbostock/what-makes-software-good-943557f8a488)

					var currentChunkId = earntLostMarkChunkId(d.data);
					var priorArcDatum = undefined;

					for (var i = 0; i < priorArcGroupData.length; i++) {
						if (currentChunkId == earntLostMarkChunkId(priorArcGroupData[i].data)) {
							priorArcDatum = priorArcGroupData[i]
						}
					}

					if (priorArcDatum !== undefined) {
						// This point is supposed to represent handling of
						// an 'update' element - i.e. one that already
						// existed before the current data change
						var arcGroup = d3.select(this)
						arcGroup
							.select("path.weighting-arc")
							.transition()
								.attrTween("d", makeArcAngleChangeTween(
									priorArcDatum.startAngle, priorArcDatum.endAngle,
									d.startAngle, d.endAngle,
									weightingArc()
								))
						arcGroup
							.select("path.score-arc")
							.transition()
								.attrTween("d", makeArcAngleChangeTween(
									priorArcDatum.startAngle, priorArcDatum.endAngle,
									d.startAngle, d.endAngle,
									scoresArc()
								))
					}
					else {
						// wat do here?? need to test if this case is safe to
						// ignore and expect to be caught by .entry() elsewhere
						console.log("no prior arc datum found for mark chunk at idx " + i, this)
					}
				})
		})
	}

	function defineInsertFadeInTransitions(parentTransition, newElements) {
		parentTransition.each(function() {
			var insertFadeInTransitions = newElements.transition()
			insertFadeInTransitions
				.style("opacity", 0.5)
		})
	}

	function defineInsertSlotInTransitions(parentTransition, newElements) {
		parentTransition.each(function() {
			var insertSlotInTransitions = newElements.transition()
			insertSlotInTransitions
				.style("opacity", 1)
			insertSlotInTransitions
				.select("path.weighting-arc")
					.attrTween("d", makeArcRadiusChangeTween(165, 205, 110, 150, d3.svg.arc()));
			insertSlotInTransitions
				.select("path.score-arc")
					.attrTween("d", makeArcRadiusChangeTween(205, 220, 150, 165, d3.svg.arc()));
		})
	}

	if (!exitingMarkChunkArcGroups.empty()) {
		// elements need to be removed. do the removal first as a separate
		// transition before beginning the update/add process
		var exitTransition = markChunksContainer
			.transition()
			.duration(750)
		exitTransition.each(function() {
			var exitTransitions = exitingMarkChunkArcGroups.transition()
			exitTransitions
				.select("path.weighting-arc")
					.attrTween("d", makeArcRadiusChangeTween(110, 150, 0, 40, d3.svg.arc()))
					.style("opacity", 0)
			exitTransitions
				.select("path.score-arc")
					.attrTween("d", makeArcRadiusChangeTween(150, 165, 40, 55, d3.svg.arc()))
					.style("opacity", 0)
			// remove the groups at the end to clean up all the elements
			exitTransitions
				.remove()
		})

		exitTransition.each('end', function(){
			var newMarkChunkGroups = insertEntryElements()

			// update transition is step 2 and this should follow exit transition
			var updateTransition = markChunksContainer
				.transition()
				.duration(750)

			// update cases are to be handled/setup first
			//
			// doing .append() for new nodes causes them to be merged into the
			// update selection
			//
			// with any luck, the selection used at this point will properly grab
			// only update nodes because it is being invoked ahead of the
			// transitions actually executing...
			defineUpdateTransitions(updateTransition)
			defineInsertFadeInTransitions(updateTransition, newMarkChunkGroups)

			var slotInTransition = updateTransition
				.transition()
				.duration(750)
			defineInsertSlotInTransitions(slotInTransition, newMarkChunkGroups)
		})
	}
	else {
		// nothing to remove - just do the entry cases
		var newMarkChunkGroups = insertEntryElements()

		var updateTransition = markChunksContainer
			.transition()
			.duration(750)
		defineUpdateTransitions(updateTransition)
		defineInsertFadeInTransitions(updateTransition, newMarkChunkGroups)

		var slotInTransition = updateTransition
			.transition()
			.duration(750)
		defineInsertSlotInTransitions(slotInTransition, newMarkChunkGroups)
	}

	// update all arcs with attributes based off data
	markChunkArcGroups
		.select("path.weighting-arc")
			.attr("fill", function(d, i) {
			        return d.data.color;
			    })
			// .attr("d", weightingArc());
	markChunkArcGroups
		.select("path.score-arc")
			.attr("fill", function(d, i) {
					return d.data.isEarntMarks ? colors["success"] : colors["danger"];
				})
		    // .attr("d", scoresArc());



	// Second set of data-driven elements: Weightings (full/unsplit)
	//
	// When viewing in group-by-subject mode, the earnt and lost mark chunks
	// within a given subject appear with a tiny gap between them. Keeping a
	// set of full arcs for each weighting on hand to display in this mode
	// (when not animating) makes the graph look nicer and allows for having
	// more consistent per-subject UI elements

	var weightingsContainer = chart.select(".weightings");

	// Only show any of the full weightings when grouping by weighting
	// weightingsContainer.attr("display", groupingByEarntLost ? 'none' : null)
	weightingsContainer.attr("display", 'none')

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
		"id": idGenerator(),
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
