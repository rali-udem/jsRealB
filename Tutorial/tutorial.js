$(document).ready(function() {
    loadEn();
    $(".js").html(function(){
        return ""+eval($(this).text());
    });
    $("#newSent").click(function(){
        $("#genSent").html(""+S(np(),vp()));
    });

});
