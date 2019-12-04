// caution: some of the code depends on déclaration done in randomgen.js

$(document).ready(function() {
    $(".js").each(function(){
        var codeId=$(this).attr("code-id")
        if (codeId !==undefined){
            $(this).text(eval($(codeId).text()));
            return
        }
        // only evaluate code
        eval($(this).text());
    });

    $(".jsh").each(function(){
        var codeId=$(this).attr("code-id")
        if (codeId !==undefined){
            $(this).html(eval($(codeId).text()).toString());
            return
        }
        // only evaluate code
        eval($(this).text());
    });
    
    $("#newSent").click(function(){
        $("#genSent").html(""+S(np(),vp()));
    });

});
