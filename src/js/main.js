// Assessment class
function Assessment(assName, score, total) {
    this.assName = assName;
    this.score = score;
    this.total = total;
    this.percentage = (this.score/this.total)*100;
}

Assessment.prototype.toHTML = function() {
    var html = $("<div><h3>"+this.assName+"</h3><div>");
    $(html).append('<div class="progress"> \
        <div class="progress-bar" style="width: '+this.percentage+'%"> \
            <span class="sr-only">Subject Mark: '+this.score+'/'+this.total+'</span> \
            <span>'+this.score+'/'+this.total+'</span> \
        </div> \
    </div>');
    return html;
};

Assessment.prototype.toFlotData = function() {
    return {
        label: this.assName,
        data: this.percentage
    };
};

var assessments = []; // global list of all assessments

var chartData = [];

var getNewAssessment = function() {
    var nameInput = $('input#newAssessmentName');
    var newName = nameInput.val();
    nameInput.val('');

    var scoreInput = $('input#newAssessmentScore');
    var newScore = parseFloat(scoreInput.val()); //may need to change this
    scoreInput.val('');

    var totalInput = $('input#newAssessmentScoreMax');
    var newTotal = parseFloat(totalInput.val()); //may need to change this too
    totalInput.val('');

    var newAssessment = new Assessment(newName,newScore,newTotal);
    return newAssessment;
};

var addAssessment = function() {
    var newAssessment = getNewAssessment();
    assessments.push(newAssessment);
    chartData.push(newAssessment.toFlotData());
    $("#emptyAlert").remove();
    $("#assessmentList").append(newAssessment.toHTML().hide().fadeIn(500));
    plotChart();
};

var loadNoAssessments = function() {
    $("#assessmentList").empty().append('<div class="alert alert-warning" id="emptyAlert">No assessments added yet!</div>');
};

var plotChart = function() {
    $.plot('#pieChart', chartData, {
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

//document ready
$(function() {
    $("button#addAssessment").click(function(evt) {
        addAssessment();
    });
    // TODO - this will be data loading when it works
    var assessmentdata = []; 

    // prepare document
    if ( typeof assessmentdata == 'undefined' ) {
        // no data
        loadNoAssessments();
    } else if ( assessmentdata.length === 0 ) {
        // blank list
        loadNoAssessments();
    } else if ( assessmentdata.length > 0 ) {
        //there is data
    } else {
        //some error
    }
    
    // dummy data for flot
    // var data = [{
    //     label: "Assignment #1",
    //     data: 15
    // }, {
    //     label: "Assignment #2",
    //     data: 15
    // }, {
    //     label: "Mid-semester Test",
    //     data: 10
    // }, {
    //     label: "Exam",
    //     data: 60
    // }];
});
