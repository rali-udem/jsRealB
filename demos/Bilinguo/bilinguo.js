"use strict";
//  Demo similar to a "game" proposed by Duolingo to translate a
//  source sentence by clicking on words in the target language to build the translation.
//  Not all words are selected because some "distractors" are added to make the exercise more challenging.
//  When the user has finished, the words in the translation are compared to the expected answer
//  and the differences are highlighted.

//  Source sentences are built by selecting randomly from a small list of lemmata
//  of nouns, pronouns, adjectives and verbs. 

//  Some jsRealB bilingual features are featured:
//    - random selection of lemma, tense, number, person (for pronoun) using oneOf(...)
//    - The same sentence pattern is used for both languages, but agreement is language dependent
//    - Variants of sentences (e.g. negation, progressive, yes-or-no question, tag question) can be generated.
//      Once a variant is selected for the source, it is applied to the target for building the expected sentence.
//    

// load jsRealB symbols loaded via <script>
Object.assign(globalThis,jsRealB);
import {makeStructs,sentences,getIndices,tokenize,shuffle} from "./Sentences.js"

// initial translation direction
let src="en",tgt="fr";
let expectedTokens;
// scores
let nbTries=0,nbSuccesses=0;

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
    showExercise();
    nbSuccesses=0;
    nbTries=0;
    showResults();
}

const levels = {
    "fr":["simple","facile","compliqué",  "difficile",  "expert","diabolique"],
    "en":["simple","easy",  "complicated","challenging","expert","devilish"],
};
const tenses = {    // by level for each language
    "fr":[["p"],["p","pc"],["p","pc","f"],["p","pc","f"],["p","ps","f"],["p","ps","f","c"]],
    "en":[["p"],["p","ps"],["p","ps","f"],["p","ps","f"],["p","ps","f"],["p","ps","f","c"]],
}
const variants = [   // by level
     [{}],
     [{},{"neg":true}],
     [{},{"neg":true},{"mod":"poss"}],
     [{},{"neg":true},{"mod":"poss"},{"int":"yon"}],
     [{},{"neg":true},{"mod":"poss"},{"int":"yon"},{"int":"tag"},{"prog":true}],
     [{"neg":true,"mod":"poss","int":"yon"},
      {"neg":true,"prog":true,"int":"tag"}],
]

function addLevels(lang,selected){
    const $levels=$(`#levels-${lang}`)
    for (let i=0;i<levels[lang].length;i++){
        const $option=$(`<option value="${i}">${levels[lang][i]}</option>`);
        if (i==selected)$option.prop("selected","selected");
        $levels.append($option)
    }
}

function makeSentences(sent,src,tgt){
    const level=+$(`#levels-${src}`).val();
    const tIdx = oneOf(getIndices(tenses[src][level]));
    const typ = oneOf(variants[level])
    let res={};
    [res[src],res[tgt],res["distractors"]]=makeStructs(sent,src,tgt);
    res[src].t(tenses[src][level][tIdx]).typ(typ);
    res[tgt].t(tenses[tgt][level][tIdx]).typ(typ);
    // useful for helping understand why bad translations occur
    console.log("%c%s","font-family:monospace",res[src].toSource(0))
    console.log("%c%s","font-family:monospace",res[tgt].toSource(0))
    return res;
}


///// Display
//  insert words in #target-words that can be clicked 
function showWords(words){
    shuffle(words)
    for (let i=0;i<words.length;i++){
        $("#target-words").append($("<span/>").addClass("word").text(words[i]).click(moveWord));
        $("#target-words").append(" ");
    }
}

//  move words from to the sentence or back to the target words
function moveWord(e){
    if ($(this).parent().get(0)==$("#target-words").get(0)){ // move to sentence
        $(this).addClass("used").off("click"); // current word is grayed
        // create new word saving reference to original
        const $newWord= $("<span/>").addClass("word").text($(this).text()).click(moveWord);
        $newWord.data("original",$(this));
        $("#target-sentence").append($newWord);
        $("#target-sentence").append(" ");
    } else { // move back to original position
        const $original=$(this).data("original");
        $original.removeClass("used").click(moveWord);
        $(this).get(0).nextSibling.remove();  // remove text node (with a space) after
        $(this).remove();
    }
}

//  create new exercise
function showExercise(){
    // reset fields
    $("#verdict,#answer").html("");
    $("#source,#target-words,#target-sentence").empty();
    $("#continue-"+src).hide();
    $("#check-"+src).show();
    const level=+$(`#levels-${src}`).val();
    // create source and target sentences
    const sent = oneOf(sentences.filter(s=>s.level===undefined || s.level<=level));  // select a sentence
    const sents = makeSentences(sent,src,tgt);
    $("#source").text(sents[src].realize(src));
    const tgtSent = sents[tgt].realize(tgt);
    // tokenize target sentence
    if (tgtSent.endsWith("n'est-ce pas? ")){
        expectedTokens=tokenize(tgtSent.slice(0,-"n'est-ce pas? ".length));
        expectedTokens.push("n'est-ce pas?");
    } else
        expectedTokens = tokenize(tgtSent.trim());
    showWords(expectedTokens.concat(sents["distractors"]))
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
    addLevels("fr",1);addLevels("en",1);
    $("#levels-fr,#levels-en").on("change",showExercise)
    $("#check-en,#check-fr").click(checkTranslation);
    $("#continue-en,#continue-fr").click(showExercise).hide()
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
    })
    setSrc("fr");
    $(`#show-${src}-expl`).hide();
});
