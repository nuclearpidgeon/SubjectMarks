// Assessment class
function Assessment(assName, score, total, weighting, graded) {
    this.assName = assName;
    this.score = score;
    this.total = total;
    this.weighting = weighting;
    this.graded = graded;
    this.percentage = Math.round((this.score/this.total)*100);
}

Assessment.prototype.toHTML = function() {
    //<a class="badge">&times;</a>
    var html = $('<div class="list-group-item"></div>');
    html.append('<h3 class="list-group-item-heading">'+this.assName+' <small>'+this.weighting+'% weight</small></h3>');
    if (this.graded) {
        html.addClass("list-group-item-dull");
        html.append("<small>Graded</small>");
    } else {
        //html.addClass("list-group-item-info");
        html.append("<small>Not yet graded</small>");
    }
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
    var newGraded=true;
    if (isNaN(newScore)&&(scoreInput.val()!=="")) {
        //invalid input (blank is valid for this field)
        errors=true;
        errorlist.push("Please enter a valid assessment score");
        scoreInput.parent().addClass("has-error");
    } else {
        if (scoreInput.val()==="") {
            newGraded=false;
            newScore=0; //Could maybe instead set to 50%?
        }
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
        assessments.push(newAssessment);
        addChartData(newAssessment.toFlotData());
        $("#assessmentList").append(newAssessment.toHTML().hide().fadeIn(500));
        plotChart();
        updateOverview();
    }
};

var loadNoAssessments = function() {
    $("#assessmentPanelBody").empty().append('<div class="alert alert-warning" id="emptyAlert">No assessments added yet!</div>');
};

var addChartData = function(newData) {
    chartData.push(newData);
    var arrlen = chartData.length;
    var total = 0;
    for (var i = 1;i<arrlen;i++) {
        total += chartData[i].data;
    }
    chartPadding.data = 100-total;
};

var updateOverview = function() {
    var earnt=0;
    var lost=0;
    var numOfAssessments = assessments.length;
    if (assessments.length) {
        for (var i=0;i<numOfAssessments;i++) {
            earnt+=assessments[i].percentage*assessments[i].weighting/100;
            lost+=(100-assessments[i].percentage)*assessments[i].weighting/100;
        }
    }
    $('#overviewEarnt').text(earnt.toString()+"% earnt").css("width",earnt.toString()+"%");
    $('#overviewPending').text((100-earnt-lost).toString()+"% pending").css("width",(100-earnt-lost).toString()+"%");
    $('#overviewLost').text(lost.toString()+"% lost").css("width",lost.toString()+"%");
    return (100-earnt-lost).toString();
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
