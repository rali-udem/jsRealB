$(document).ready(function() {
    // HACK: add global definitions used in some examples
    globalThis.cat1=NP(D("the"),N("cat"));
    globalThis.mouse1=NP(D("a"),A("grey"),N("mouse"));   
    globalThis.cat2=NP(D("the"),N("cat"));
    globalThis.mouse2=NP(D("a"),A("grey"),N("mouse"));
    globalThis.mouse3 = ()=>NP(D("a"),A("grey"),N("mouse"));

    globalThis.np = function(){
        return NP(D("a"),a(),N(oneOf("cat","mouse","dog","rabbit")).n(oneOf("s","p")));
    }
    globalThis.a=function(){
        return oneOf(
            ()=>A(oneOf("hungry","grey","nervous")),
            ()=>Q("")
        );
    }
    globalThis.vp = function(){
        return oneOf(
            ()=>VP(V(oneOf("eat","run","love")).t(oneOf("p","ps","f"))),
            ()=>VP(V(oneOf("eat","love")).t(oneOf("p","ps","f")),
                   np())
        );
    }

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
