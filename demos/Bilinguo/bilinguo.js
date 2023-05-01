"use strict";

// load jsRealB symbols
Object.assign(globalThis,jsRealB);

//  Demo similar to a "game" proposed by Duolingo to translate a
//  source sentence by clicking on words in the target language to build the translation.
//  Not all words are selected because some "distractors" are added to make the exercise more challenging.
//  When the user has finished, the words in the translation are compared to the expected answer
//  and the differences are highlighted.

//  Source sentences are built by selecting randomly from a small list of lemmata
//  of nouns, pronouns, adjectives and verbs. 
//  All sentences are of the form: S(NP(...),VP(V(..),NP(...)))  [NP(...) can be also be Pro(...)]

//  Some jsRealB bilingual features are featured:
//    - random selection of lemma, tense, number, person (for pronoun) using oneOf(...)
//    - The same sentence pattern is used for both languages, but agreement is language dependent
//    - Variants of sentences (e.g. negation, passive, yes-or-no question, tag question) can be generated.
//      Once a variant is selected for the source, it is applied to the target for building the expected sentence.
//    - care is taken to select "distractors" for words of the same category with their proper inflection
//    

// translation direction
let src="en",tgt="fr";
let expectedTokens;
// scores
let nbTries=0,nbSuccesses=0;

// taken from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// call the appropriate jsReal load functions
function load(lang){
    if (lang=="en") loadEn(); else loadFr();
}

// set the source language
function setSrc(lang){
    src=lang;
    tgt=src=="en"?"fr":"en";
    // show elements with the src language and hide one in tgt language
    $(`[lang=${src}]`).show();
    $(`[lang=${tgt}]`).hide();
    if ($("#explanation").is(":visible")){
        $(`#show-${src}-expl`).hide();
    } else {
        $(`#hide-${src}-expl`).hide();
    }
    // initialize everything
    expectedTokens=showExercise();
    nbSuccesses=0;
    nbTries=0;
    showResults();
}

// return a Pro with a distractor of the same type
function makePros(src,tgt,pronounIndices,case_){
    const res={};
    const proIdx=pronounIndices.shift();
    const pe = tonicPronouns["pe"][proIdx];
    const n = tonicPronouns["n"][proIdx];
    load(src);
    res[src] = Pro(tonicPronouns[src][proIdx]).pe(pe).n(n).c(case_)
    load(tgt);
    res[tgt] = Pro(tonicPronouns[tgt][proIdx]).pe(pe).n(n).c(case_)
    const distractors=[Pro(tonicPronouns[tgt][pronounIndices.shift()]).pe(pe).n(n).c(case_)]
    return [res,distractors];
}

// return an adverb with a distractor of the same type
function makeAdverb(src,tgt,adverbIndices){
    const res={};
    const advIdx = adverbIndices.shift();
    load(src);
    res[src]=Adv(adverbs[src][advIdx]);
    load(tgt);
    res[tgt]=Adv(adverbs[tgt][advIdx]);
    const distractors = [Adv(adverbs[tgt][adverbIndices.shift()])]
    return [res,distractors]
}

// return a NP with a list of distractors of the same type
function makeNPs(src,tgt,nounIndices,adjIndices){
    const res = {}    
    const nIdx=nounIndices.shift()
    const dets = oneOf(determiners);
    const n = oneOf(numbers);
    load(src);
    res[src] = NP(D(dets[src]),N(nouns[src][nIdx])).n(n);
    load(tgt);
    res[tgt] = NP(D(dets[tgt]),N(nouns[tgt][nIdx])).n(n);
    const distractors=[N(nouns[tgt][nounIndices.shift()]).n(n).realize()];
    if (Math.random()<0.25){
        const aIdx=adjIndices.shift()
        load(src);
        res[src].add(A(adjectives[src][aIdx]));
        load(tgt);
        res[tgt].add(A(adjectives[tgt][aIdx]));
        distractors.push(A(adjectives[tgt][adjIndices.shift()]).n(n).realize())
    }
    return [res,distractors];
}

// return a list of shuffled indices for a "src" list
function getIndices(list){
    return shuffle(Array.from(Array(list[src].length).keys()));
}

//  create a random jsReal structure in "src" language with the corresponding jsReal structure in the "tgt" language
//  combined with a distractor list
function makeSentences(src,tgt){
    // HACK: the word selection is done by shuffling a new list of indices (so that the corresponding src and tgt words are selected)
    //       and taking (shifting) the first indices of this list when needed either for a word or a distractor 
    let nounIndices=getIndices(nouns);
    let pronounIndices=getIndices(tonicPronouns);
    let adjIndices=getIndices(adjectives);
    // select subject
    const [subject,subjDistractors] = 
        Math.random()<0.80 ? makeNPs(src,tgt,nounIndices,adjIndices)
                           : makePros(src,tgt,pronounIndices,"nom");
    let verbSrc, verbTgt, verbIndices, complement, compDistractors;
    // select transitive verb with direct object or intransitive verb with adverb
    if (Math.random()< 0.75){
        verbIndices = getIndices(verbs);
        const vIdx = verbIndices.shift();
        verbSrc = verbs[src][vIdx];
        verbTgt = verbs[tgt][vIdx];
        [complement,compDistractors] = 
            Math.random()<0.80 ? makeNPs(src,tgt,nounIndices,adjIndices)
                               : makePros(src,tgt,pronounIndices,"acc");
    } else {
        verbIndices = getIndices(intransitiveVerbs);
        const vIdx = verbIndices.shift();
        verbSrc = intransitiveVerbs[src][vIdx];
        verbTgt = intransitiveVerbs[tgt][vIdx];
        let adverbIndices = getIndices(adverbs);
        [complement,compDistractors] = makeAdverb(src,tgt,adverbIndices)
    }
    // get values of selected exercises from the checkboxes (defaulting to present and affirmative)
    let t     = oneOf($(`span[lang=${src}] .tense:checked`).map((i,e)=>$(e).val()).get()) || "p";
    const typ = oneOf($(`span[lang=${src}] .typ:checked`).map((i,e)=>eval("({"+$(e).val()+"})")).get()) || {};
    let res = {};
    load(src);
    res[src] = S(subject[src],VP(V(verbSrc).t(t),complement[src])).typ(typ);
    load(tgt);
    res[tgt] = S(subject[tgt],VP(V(verbTgt).t(t),complement[tgt])).typ(typ);
    let distractors=subjDistractors.concat(compDistractors);
    if (tgt=="en" && t=="f")t="p"; // HACK: avoid adding auxiliary "will" to the English verb distractor
    distractors.push(V(verbs[tgt][verbIndices.shift()]).t(t));
    if (Math.random()<0.5) // sometimes add another distractor ...
        distractors.push(N(nouns[tgt][nounIndices.shift()]))
    res["distractors"]=distractors;
    return res;
}

///// Display
//  insert words in #target-words that can be clicked 
function showWords(words){
    shuffle(words)
    for (let i=0;i<words.length;i++){
        const $span = $("<span/>").addClass("word").text(words[i])
        $span.click(moveWord);
        $("#target-words").append($span);
    }
}

//  move words from to the sentence or back to the target words
function moveWord(e){
    if ($(this).parent().get(0)==$("#target-words").get(0)){ // move to sentence
        $("#target-sentence").append($(this));
    } else { // move back to original position
        $("#target-words").append($(this));
    }
}

//  create new exercise
function showExercise(){
    // reset fields
    $("#verdict,#answer").html("");
    $("#source,#target-words,#target-sentence").empty();
    $("#continue-"+src).hide();
    $("#check-"+src).show();
    // create source and target sentences
    const sents = makeSentences(src,tgt);
    // realize source
    load(src);
    $("#source").text(sents[src].realize());
    // realize target
    load(tgt);
    const tgtSent = sents[tgt].realize();
    // tokenize target sentence
    const tgtTokens = tgtSent.split(/([^a-zA-Zà-üÀ-Ü]+)/).filter(e=>e.trim().length>0);
    showWords(tgtTokens.concat(sents["distractors"]))
    return tgtTokens;
}

// indicate as bad, span elements having element id as parent
//      only elements with index between start and end are selected
function showAsBad(id,start,end){
    for (let k=start; k<=end; k++){
        $(`${id} span:nth-child(${k+1})`).addClass("bad")
    }
}

// display statistics 
function showResults(){
    $("#tries .value").text(nbTries); 
    $("#successes .value").text(nbSuccesses);
    $("#percent").text(nbTries>0 ? Math.round(nbSuccesses*100/nbTries)+"%" : "")
}

//  check the produced translation with the expected one
//  compute differences and if there are any, display them
function checkTranslation(e){
    const myId=$(e.target).attr('id');
    const userTokens = $("#target-sentence").children().map((i,e)=>$(e).text()).get();
    // compute edit distance and operations
    const [edits,nbEdits] = levenshtein(userTokens,expectedTokens);
    nbTries++;
    if (nbEdits==0){
        $("#verdict").html("<b style='color:green'>Bravo!</b>")
        nbSuccesses++;
    } else {
        $("#verdict").html(src=="fr" ? "<b style='color:red'>Raté</b>: voici la bonne réponse" 
                                : "<b style='color:red'>Missed</b>: here is the right answer" );
        $("#answer").html(expectedTokens.map(w=>`<span class="word">${w}</span>`).join(""))
        // display edit operations
        for (let [op,start1,end1,start2,end2] of edits){
            if (op=="DEL"){
                showAsBad("#target-sentence",start1,end1);
            } else if (op=="REP"){
                showAsBad("#target-sentence",start1,end1);
                showAsBad("#answer",start2,end2);
            } else {// op=="INS"
                showAsBad("#answer",start1,end1)
            }
        }
    }
    $("#"+myId).hide();
    $("#"+myId.replace("check","continue")).show()
    showResults()
}

//   set callback functions
$(document).ready(function() {
    $("#check-en,#check-fr").click(checkTranslation);
    $("#continue-en,#continue-fr").click(function(){
        expectedTokens=showExercise();
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
        // expectedTokens=showExercise();
    })
    setSrc("fr");
    $(`#show-${src}-expl`).hide();
});
