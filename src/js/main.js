// Assessment class
function Assessment(assName, score, total, weighting) {
    this.assName = assName;
    this.score = score;
    this.total = total;
    this.weighting = weighting;
    this.percentage = (this.score/this.total)*100;
}

Assessment.prototype.toHTML = function() {
    var html = $('<div class="list-group-item"><a class="badge">&times;</a><h3 class="list-group-item-heading">'+this.assName+' <small>'+this.weighting+'% weight</small></h3></div>');
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
        data: this.weighting
    };
};

Assessment.prototype.remove = function() {
    assessments.remove(this);
};

var assessments = []; // global list of all assessments

var chartPadding = {label:"None",data:100,color:"grey"};

var chartData = [chartPadding];

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

    var scoreInput = $('input#newAssessmentScore');
    var newScore = parseFloat(scoreInput.val()); //may need to change this
    if (isNaN(newScore)) {
        //invalid input
        errors=true;
        errorlist.push("Please enter a valid assessment score");
        scoreInput.parent().addClass("has-error");
    } else {
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

    var weightingInput = $('input#newAssessmentWeighting');
    var newWeighting = parseInt(weightingInput.val());
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
        var newAssessment = new Assessment(newName,newScore,newTotal,newWeighting);
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
        assessments.push(newAssessment);
        chartData.push(newAssessment.toFlotData());
        $("#assessmentList").append(newAssessment.toHTML().hide().fadeIn(500));
        plotChart();
    }
};

var loadNoAssessments = function() {
    $("#assessmentPanelBody").empty().append('<div class="alert alert-warning" id="emptyAlert">No assessments added yet!</div>');
};

var addChartData = function(newData) {
    chartData.push(newData);
    var arrlen = chartData.length;
    var total = 0;
    for (var i = 0;i<arrlen;i++) {
        total += chartData[i].data;
    }
    chartPadding.data = 100-total;
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
        if (assessments.length === 0) {
            $("#emptyAlert").remove();
            $("#assessmentPanelBody").append('<div class="list-group" id="assessmentList"></div>');
        }
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
    
    plotChart();
    
});
