// Subject class
function Subject() {
    var self = this;
    self.assessments = ko.observableArray([]);

    self.addAssessment = function(assessment) {
        self.assessments.push(assessment);
    };
    self.removeAssessment = function(assessment) {
        self.assessments.remove(assessment);
    };
    self.editAssessment = function(assessment) {
        assessment.editing(true);
    };
    self.closeEdit = function(assessment) {
        assessment.editing(false);
    };
    
    self.marksOverview = ko.computed(function() {
        var marksEarnt = 0;
        var marksLost = 0;
        for (var i = 0; i < self.assessments().length; i++) {
            marksEarnt += self.assessments()[i].earntAmount();
            marksLost += self.assessments()[i].lostAmount();
        }
        return {
            "earnt": parseFloat(marksEarnt.toFixed(2)),
            "lost": parseFloat(marksLost.toFixed(2)),
            "pending": parseFloat((100 - marksEarnt - marksLost).toFixed(2))
        };
    });
    self.weightingOverview = ko.computed(function() {
        var data = [];
        var weightingTotal = 0;
        for (var i = 0; i < self.assessments().length; i++) {
            var newData = self.assessments()[i].toFlotData();
            data.push(newData);
            weightingTotal += parseFloat(self.assessments()[i].weighting());
            // sometimes the weighting becomes a string on page change...
        }
        if (weightingTotal < 100 ) {
            data.push({label:"Not yet added",data:(100-weightingTotal),color:"grey"});
        }
        return data;
    });
}

// Assessment class
function Assessment(assName, score, total, weighting, graded) {
    var self = this;
    self.assName = ko.observable(assName);
    self.score = ko.observable(score);
    self.total = ko.observable(total);
    self.weighting = ko.observable(weighting);
    self.graded = ko.observable(graded);
    self.editing = ko.observable(false);

    self.niceWeighting = ko.computed(function() {
        return self.weighting().toString() + "% weight";
    });
    self.percentage = ko.computed(function() {
        return ((self.score()/(self.total()))*100).toFixed(2);
    });
    self.earntAmount = ko.computed(function() {
        return self.percentage()*self.weighting()/100;
    });
    self.lostAmount = ko.computed(function() {
        return ((100-self.percentage())*self.weighting())/100;
    });
}
// Assessment methods
Assessment.prototype.toFlotData = function() {
    return {
        label: this.assName(),
        data: this.weighting()
    };
};

var updateErrorList = function(errorlist) {
    var errorlistString = '<div class="alert alert-danger" id="addAssessmentErrorList"><p><strong>Error!</strong></p>';
    var errorlistLength = errorlist.length;
    for (var i=0;i<errorlistLength;i++) {
        errorlistString += "<p>"+errorlist[i]+"</p>";
    }
    errorlistString += "</div>";
    // try find error list
    var errorListOnPage = $('#addAssessmentErrorList');
    if (errorListOnPage.length) {
        errorListOnPage.replaceWith(errorlistString);
    } else {
        $('#addAssessment').before(errorlistString);    
    }
};

// Validates then loads a new assessment from the page
var getNewAssessment = function() {
    var errors = false;
    var errorlist = [];
    
    var nameInput = $('input#newAssessmentName');
    var newName = nameInput.val();
    if (newName === '') {
        //invalid input
        errors=true;
        errorlist.push("Please enter an assessment name");
        nameInput.parent().addClass("has-error");
    } else {
        nameInput.parent().removeClass("has-error");
    }

    // this loads graded value from the page, but will add this later
    // var newGraded=$('input#newAssessmentGraded').prop('checked');
    var newGraded = true;

    var scoreInput = $('input#newAssessmentScore');
    var newScore = parseFloat(scoreInput.val()); //may need to change this
    if (isNaN(newScore)&&(newGraded||((!newGraded)&&scoreInput.val()!==""))) {
        //non-numeric input
        errors=true;
        errorlist.push("Please enter a valid assessment score");
        scoreInput.parent().addClass("has-error");
    } else {
        if(!newGraded&&(scoreInput.val()==="")) newScore=0; //Could maybe instead set to 50%?
        scoreInput.parent().removeClass("has-error");
    }

    var totalInput = $('input#newAssessmentScoreMax');
    var newTotal = parseFloat(totalInput.val()); //may need to change this too
    if (isNaN(newTotal)){
        //invalid input
        errors=true;
        errorlist.push("Please enter a valid assessment total");
        totalInput.parent().addClass("has-error");
    } else {
        totalInput.parent().removeClass("has-error");
    }

    //extra error-check case
    if (newTotal<newScore) {
        errors=true;
        errorlist.push("You can't have a score greater than the total");
    }

    var weightingInput = $('input#newAssessmentWeighting');
    var newWeighting = parseFloat(weightingInput.val());
    if (isNaN(newWeighting)){
        //invalid input
        errors=true;
        errorlist.push("Please enter a valid weighting");
        // need to use different function because of input-group
        weightingInput.closest(".form-group").addClass("has-error");
    } else {
        weightingInput.closest(".form-group").removeClass("has-error");
    }



    if (errors) {
        updateErrorList(errorlist);
        return null;
    } else {
        var newAssessment = new Assessment(newName,newScore,newTotal,newWeighting,newGraded);
        nameInput.val('');
        scoreInput.val('');
        totalInput.val('');
        weightingInput.val('');
        $('#addAssessmentErrorList').remove();
        return newAssessment;
    }
};

var addAssessment = function() {
    var newAssessment = getNewAssessment();
    if (newAssessment!==null) {
        subject.addAssessment(newAssessment);
        // var newPageAssessment = $("#assessmentList").append(newAssessment.toHTML().hide().fadeIn(500));
        // if (!newAssessment.graded) {
        //     newPageAssessment.find('input.slider').slider();
        // }
    }
};

var loadNoAssessments = function() {
    // $("#assessmentPanelBody").empty().append('<div class="alert alert-warning" id="emptyAlert">No assessments added yet!</div>');
};

var plotChart = function(data) {
    //alert(data);
    $.plot('#pieChart', data, {
        series: {
            pie: {
                show: true
            }
        },
        legend: {
            show: false
        }
    });
};

var saveState = function() {
    localStorage.setItem('SubjectMarksAssessments',ko.toJSON(subject.assessments));
};

var clearState = function() {
    localStorage.clearItem('SubjectMarksAssessments');
};

// global variables

var subject = new Subject(); // global list of all assessments

var chartPadding = {label:"Not yet added",data:100,color:"grey"};

var chartData = [chartPadding];

// document ready
$(function() {
    $("button#addAssessment").click(function(evt) {
        addAssessment();
    });
    $("button#editAssessment").on('click',function() {
        $(this).toggleClass('disabled');
    });

    // TODO - this will be data loading when it works
    var assessmentdata = []; 

    var localAssessments = JSON.parse(localStorage.getItem('SubjectMarksAssessments'));
    var mappedAssessments = $.map(localAssessments, function(ass) { return new Assessment(ass.assName, ass.score, ass.total, ass.weighting, ass.graded); });
    subject.assessments(mappedAssessments);

    // prepare document
    // if ( typeof assessmentdata == 'undefined' ) {
    //     // no data
    //     loadNoAssessments();
    // } else if ( assessmentdata.length === 0 ) {
    //     // blank list
    //     loadNoAssessments();
    // } else if ( assessmentdata.length > 0 ) {
    //     //there is data
    // } else {
    //     //some error
    // }
    
    ko.applyBindings(subject);
    subject.weightingOverview.subscribe(function(newValue){plotChart(newValue);});
    //subject;
    plotChart(subject.weightingOverview());
    
});

var d3Stuff = function(){
    var $container = $('#pieChart'),
        tau = 2 * Math.PI,
        width = $container.width(),
        height = $container.height(),
        outerRadius = Math.min(width,height)/2,
        innerRadius = (outerRadius/5)*4,
        fontSize = (Math.min(width,height)/4);
    
    var arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(0);

    var svg = d3.select('#pieChart').append("svg")
        .attr("width", '70%')
        .attr("height", '70%')
        .attr('viewBox','0 0 '+Math.min(width,height) +' '+Math.min(width,height) )
        .attr('preserveAspectRatio','xMinYMin')
        .append("g")
        .attr("transform", "translate(" + Math.min(width,height) / 2 + "," + Math.min(width,height) / 2 + ")");

    var text = svg.append("text")
        .text('0%')
        .attr("text-anchor", "middle")
        .style("font-size",fontSize+'px')
        .attr("dy",fontSize/3)
        .attr("dx",2);
    
    var background = svg.append("path")
        .datum({endAngle: tau})
        .style("fill", "#7cc35f")
        .attr("d", arc);

    var foreground = svg.append("path")
        .datum({endAngle: 0 * tau})
        .style("fill", "#57893e")
        .attr("d", arc);

    // setInterval(function() {
    //     var dist = Math.random() * tau;
    //     foreground.transition()
    //         .duration(500)
    //         .call(arcTween, dist);
    // }, 2000);


    function arcTween(transition, newAngle) {

        transition.attrTween("d", function(d) {
    
            var interpolate = d3.interpolate(d.endAngle, newAngle);
            
            return function(t) {
                
                d.endAngle = interpolate(t);
                
                text.text(Math.round((d.endAngle/tau)*100)+'%');
                
                return arc(d);
            };
        });
    }
};