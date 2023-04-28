// load jsRealB symbols
Object.assign(globalThis,jsRealB);

let $source, $targetWords, $targetSentence, $answer;
let src="en",tgt="fr";

// taken from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function setSrc(lang){
    if (lang=="en"){
        src="en"; tgt="fr";
        $("[lang=en]").show(); $("[lang=fr]").hide();
    } else {
        src="fr"; tgt="en";
        $("[lang=fr]").show(); $("[lang=en]").hide();        
    }
    if ($("#explanation").is(":visible")){
        $(`#show-${src}-expl`).hide();
    } else {
        $(`#hide-${src}-expl`).hide();
    }
    rightWords=showExercises();
}

function makePros(src,tgt,pronounIndices,case_){
    const res={};
    const proIdx=pronounIndices.shift();
    const pe = tonicPronouns["pe"][proIdx];
    const n = tonicPronouns["n"][proIdx];
    load(src);
    res[src] = Pro(tonicPronouns[src][proIdx]).pe(pe).n(n).c(case_)
    load(tgt);
    res[tgt] = Pro(tonicPronouns[tgt][proIdx]).pe(pe).n(n).c(case_)
    return res;
}

function makeNPs(src,tgt,nounIndices,adjIndices){
    const res = {}    
    const nIdx=nounIndices.shift()
    const dets = oneOf(determiners);
    const n = oneOf(numbers);
    load(src);
    res[src] = NP(D(dets[src]),N(nouns[src][nIdx])).n(n);
    load(tgt);
    res[tgt] = NP(D(dets[tgt]),N(nouns[tgt][nIdx])).n(n);
    if (Math.random()<0.25){
        const aIdx=adjIndices.shift()
        load(src);
        res[src].add(A(adjectives[src][aIdx]));
        load(tgt);
        res[tgt].add(A(adjectives[tgt][aIdx]));
    }
    return res;
}

function load(lang){
    if (lang=="en") loadEn(); else loadFr();
}

function makeSentences(src,tgt){
    // HACK: the word selection is done by shuffling a new list of indices (so that the corresponding src and tgt words are selected)
    //       and taking (shifting) the first indices of this list when needed either for a word or a distractor 
    let nounIndices=shuffle(Array.from(Array(nouns[src].length).keys()));
    let pronounIndices=shuffle(Array.from(Array(tonicPronouns[src].length).keys()));
    let adjIndices=shuffle(Array.from(Array(adjectives[src].length).keys()));
    let verbIndices = shuffle(Array.from(Array(verbs[src].length).keys()));

    const subject = Math.random()<0.80 ? makeNPs(src,tgt,nounIndices,adjIndices)
                                       : makePros(src,tgt,pronounIndices,"nom");
    const complement = Math.random()<0.80 ? makeNPs(src,tgt,nounIndices,adjIndices)
                                          : makePros(src,tgt,pronounIndices,"acc");
    const vIdx = verbIndices.shift();
    const t=oneOf(["p","ps","f"]);
    const typ=oneOf([{},{neg:false},{"int":"yon"}]);
    let res = {};
    load(src);
    res[src] = S(subject[src],VP(V(verbs[src][vIdx]).t(t),complement[src])).typ(typ).cap(false);
    load(tgt);
    res[tgt] = S(subject[tgt],VP(V(verbs[tgt][vIdx]).t(t),complement[tgt])).typ(typ).cap(false);
    let distractors=[];
    distractors.push(nouns[tgt][nounIndices.shift()]);
    distractors.push(nouns[tgt][nounIndices.shift()]);
    distractors.push(adjectives[tgt][adjIndices.shift()]);
    distractors.push(verbs[tgt][verbIndices.shift()]);
    distractors.push(tonicPronouns[tgt][pronounIndices.shift()])
    res["distractors"]=distractors;
    return res;
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
        $targetWords.append($(this));
        $(this).css("position","absolute");
        $(this).data("inWords",true);
    }
}


function showExercises(){
    $("#verdict,#answer").html("");
    $("#source,#target-words,#target-sentence").empty();
    $("#continue-"+src).hide();
    $("#check-"+src).show();
    const sents = makeSentences(src,tgt);
    load(src);
    // console.log(sents[src].toSource());
    $source.text(sents[src].realize());
    load(tgt);
    // console.log(sents[tgt].toSource());
    const tgtSent = sents[tgt].realize();
    const tgtWords = tgtSent.split(/([^-a-zA-Zà-üÀ-Ü]+)/).filter(e=>e.trim().length>0);
    showWords(tgtWords.concat(sents["distractors"]))
    return tgtWords;
}

let rightWords;

function checkTranslation(e){
    const myId=$(e.target).attr('id');
    let ok=$targetSentence.children().length==rightWords.length;
    $targetSentence.children().each(function(i,e){
        if ($(this).text()!=rightWords[i])ok=false;
    })
    if (ok){
        $verdict.html("<b style='color:green'>Bravo!</b>")
    } else {

        $verdict.html(src=="fr" ? "<b style='color:red'>Raté</b>: voici la bonne réponse" 
                                : "<b style='color:red'>Missed</b>: here is the right answer" );
        $answer.html(rightWords.map(w=>`<span class="word">${w}</span>`).join(""))
    }
    $("#"+myId).hide();
    $("#"+myId.replace("check","continue")).show()
}

$(document).ready(function() {
    $source=$("#source");
    $targetWords=$("#target-words");
    $targetSentence=$("#target-sentence");
    $answer=$("#answer");
    $verdict=$("#verdict");
    $("#check-en,#check-fr").click(checkTranslation);
    $("#continue-en,#continue-fr").click(function(){
        rightWords=showExercises();
    }).hide()
    $("#changeLang").click(function(){setSrc(tgt)});
    $("#hide-show-explanation").click(function(){
        $("#explanation").toggle();
        if ($("#explanation").is(":visible")){
            $(`#show-${src}-expl`).hide();
            $(`#hide-${src}-expl`).show();
        } else {
            $(`#show-${src}-expl`).show();
            $(`#hide-${src}-expl`).hide();
        }
        rightWords=showExercises();
    })
    setSrc("fr");
    $(`#show-${src}-expl`).hide();
});
