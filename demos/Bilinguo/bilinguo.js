
let $source, $targetWords, $targetSentence, $answer;
Object.assign(globalThis,jsRealB);

// let exercises = [
//     {"fr":()=>S(NP(D("le") ,N("élève")),  VP(V("manger"),NP(D("un"),N("fromage")).n("p"))),
//      "fr-dist":["chien","viande","la"],
//      "en":()=>S(NP(D("the"),N("student")),VP(V("eat"),   NP(D("a"), N("cheese") ).n("p"))),
//      "en-dist":["dog","meat","a"],
//     },
// ]

let exercises =[
    {"fr":["élève","manger","fromage"],"fr-dist":["chien","viande","la"],
     "en":["student","eat","cheese"],"en-dist":["dog","meat","a"],
    },
    {"fr":["garçon","aime","chocolat"],"fr-dist":["élève","orange","fourchette"],
     "en":["boy","like","chocolate"],"en-dist":["student","orange","fork"],
    },
]

// taken from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function makeNPs(){

}

function makeSentences(){
    let nounIndexes=shuffle(Array.from(Array(nouns.length)));
    

}

function showWords(words){
    shuffle(words)
    wordStarts=[]
    let currentPos=10;
    const wordSpacing=15;
    const top=$targetWords.offset().top;
    for (let i=0;i<words.length;i++){
        const word=words[i];
        const $span = $("<span>",{"class":"word"}).text(word)
        $span.click(moveWord);
        $span.data("originalPos",currentPos);
        $span.data("inWords",true);
        $span.css({"top":top,"left":currentPos,"position":"absolute"})
        $targetWords.append($span);
        const wordWidth=$span.width()
        currentPos+=wordWidth+wordSpacing;
    }
}

function moveWord(e){
    // console.log("moveWord",e,$(this))
    if ($(this).data("inWords")){ // move to sentence
        $(this).css("position","static");
        $targetSentence.append($(this));
        $(this).data("inWords",false)
    } else { // move back to original position
        $(this).css("position","absolute")
        $(this).data("inWords",true)
    }
}

function showExercises(exercise){
    const numbers=["s","p"]
    const dets = [["un","a"],["le","the"]];
    const n1=oneOf(numbers);
    const dets1=oneOf(dets);
    const n2=oneOf(numbers);
    const dets2=oneOf(dets);
    const t=oneOf(["p","ps","f"]);
    const typ=oneOf([{neg:true},{neg:false},{pas:true},{"int":"yon"}]);
    loadFr();
    const fr=exercise["fr"];
    const frSent=S(NP(D(dets1[0]),N(fr[0])),
                   VP(V(fr[1]).t(t),
                   NP(D(dets2[0]),N(fr[2])))).typ(typ).realize();
    $source.text(frSent);
    loadEn();
    const en=exercise["en"];
    const enSent=S(NP(D(dets1[1]),N(en[0])),
                   VP(V(en[1]).t(t),
                      NP(D(dets2[1]),N(en[2])))).typ(typ).realize();
    const enWords = enSent.split(/[^a-zA-Zà-üÀ-Ü]+/).filter(e=>e.length>0);
    showWords(enWords.concat(exercise["en-dist"]))
    return enWords;  
}

let rightWords;

function checkTranslation(){
    let ok=true;
    $targetSentence.children().each(function(i,e){
        if ($(this).text()!=rightWords[i])ok=false;
    })
    if (ok){
        $answer.html("<b>Bravo!</b>")
    } else {
        $answer.html("<b>Raté</b> cela aurait dû être: "+rightWords.map(w=>`<span class="word">${w}</span>`).join(""))
    }
}

$(document).ready(function() {
    $source=$("#source");
    $targetWords=$("#target-words");
    $targetSentence=$("#target-sentence");
    $answer=$("#answer")
    $("#check").click(checkTranslation);
    rightWords=showExercises(oneOf(exercises))
});
