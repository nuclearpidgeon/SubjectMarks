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

var getNewAssessment = function() {
    var nameInput = $('input#newAssessmentName');
    var newName = nameInput.val();
    nameInput.val('');

    var scoreInput = $('input#newAssessmentScore');
    var newScore = parseFloat(scoreInput.val()); //may need to change this
    scoreInput.val('');

    var scoreMaxInput = $('input#newAssessmentScoreMax');
    var newScoreMax = parseFloat(scoreMaxInput.val()); //may need to change this too
    scoreMaxInput.val('');

    // console.log("scoreMax type: "+typeof(newScoreMax));
    var percentage = (newScore/newScoreMax)*100;
    var newAssessment = $('<div class="list-group-item"><h3>' + newName + '</h3></div>');
    //using \ to escape newlines and keep this readable
    $(newAssessment).append('<div class="progress"> \
        <div class="progress-bar" style="width: '+percentage+'%"> \
            <span class="sr-only">Subject Mark: '+newScore+'/'+newScoreMax+'</span> \
            <span>'+newScore+'/'+newScoreMax+'</span> \
        </div> \
    </div>');
    return newAssessment;
}

var addAssessment = function() {
    $("#emptyAlert").remove()
    $("#assessmentList").append(getNewAssessment().hide().fadeIn(500));

}

var loadNoAssessments = function() {
    $("#assessmentList").empty().append('<div class="alert alert-warning" id="emptyAlert">No assessments added yet!</div>')
}

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
    } else if ( assessmentdata.length == 0 ) {
        // blank list
        loadNoAssessments();
    } else if ( assessmentdata.length > 0 ) {
        //there is data
    } else {
        //some error
    }
    
    // dummy data for 
    var data = [{
        label: "Assignment #1",
        data: 15,
        color: "red"
    }, {
        label: "Assignment #2",
        data: 15,
        color: "green"
    }, {
        label: "Mid-semester Test",
        data: 10,
        color: "blue"
    }, {
        label: "Exam",
        data: 60,
        color: "purple"
    }];
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
});
