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

    console.log("scoreMax type: "+typeof(newScoreMax));
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

//document ready
$(function() {
    $("button#addAssessment").click(function(evt) {
        $("#assessmentList").append(getNewAssessment().hide().fadeIn(500));
    });
    //$.plot($("#pieChart"),[ [[0, 0], [1, 1]] ], { yaxis: { max: 1 } });
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
