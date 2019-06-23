// jsRealB lemmatizer: given a word, show all possible way to realize it in jsRealB
//    was also useful for "debugging" the lexicon entries and language rules
//    we can also check that jsRealB regenerates the appropriate string

//    usage: lemmatize (fr|en|dme) true?
//    if second argument then check ambiguities

if (typeof module !== 'undefined' && module.exports) {    
    var fs = require('fs');
    var jsRealBDir="/Users/lapalme/Documents/GitHub/jsRealB/"
    var buildDir=jsRealBDir+"build/"

    var lexiconName="fr"
    if (process.argv.length>2)lexiconName=process.argv[2]

    var lemmataLang;
    if (lexiconName=="fr"){
        lemmataLang="fr"
    } else if (lexiconName == "en" || lexiconName == "dme"){
        lemmataLang="en"
    } else {
        console.log("unknown language:"+lexiconName)
        console.log("usage: lemmatize (en|dme|fr)? checkAmbiguities?");
        lexiconName="fr";
        lemmataLang="fr";
        console.log("defaulting to "+lexiconName);
    }

    var rules = JSON.parse(fs.readFileSync(buildDir+"rule-"+(lexiconName=='dme'?"en":lexiconName)+".json")); 
    var lexicon=JSON.parse(fs.readFileSync(buildDir+"lexicon-"+lexiconName+".json"));

    // load jsRealB
    var jsRealB=require(jsRealBDir+"dist/jsRealB-"+lexiconName+".min.js");
    for (var v in jsRealB)
        eval("var "+v+"=jsRealB."+v);
    if (process.argv.length>3)jsRealB.checkAmbiguities=true;
}


if (typeof module !== 'undefined' && module.exports) {    
    function showAmbiguities(lemmata){
        // build a table of all jsR expression with their realisations 
        var inv=new Map();
        var keys = Object.keys(lemmata);
        for (var j=0;j<keys.length;j++){
            var lemma=keys[j];
            jsrRexps=jsRealB.lemma2jsRexps(lemmata[lemma]);
            for (var i = 0; i < jsRexps.length; i++) {
                var jsRexp=jsRexps[i];
                var l=inv.get(jsRexp);
                if (l===undefined)inv.set(jsRexp,l=[]);
                l.push(lemma);
            }
        }
        // inverse the table and check for expressions that can generate more than one string
        var ambiguous=[];
        keys=Object.keys(inv);
        for (var i = 0; i < keys.length; i++) {
            var jsrExp=keys[i];
            var lemmas=inv[jsrExp];
            if (lemmas.length>1){
                ambiguous.push([jsrExp,lemmas])
            }
        }
        if (ambiguous.length==0){
            console.log("no ambiguity found");
            return
        }
        console.log("%d ambiguities",ambiguous.length);
        ambiguous.sort(function(keyval1,keyval2){
            return keyval1[0]<keyval2[0]?-1:(keyval1[0]==keyval2[0]?0:1)
        });
        for (var i=0;i<ambiguous.length;i++){
            var amb=ambiguous[i];
            console.log(amb[0]+':'+amb[1]);
        }
    }


    var lemmata=jsRealB.buildLemmata(lemmataLang,lexicon,rules);
    // jsRealB.showLemmata(lemmata);
    console.log("Lexicon %s:%d entries => %d forms, %d lemma",
                lexiconName,Object.values(lexicon).length,nbForms,lemmata.size);
    if(jsRealB.checkAmbiguities)
        showAmbiguities(lemmata);
    
    /// command line interface for node.js
    /// adapted from  https://nodejs.org/api/readline.html#readline_example_tiny_cli
    var readline = require('readline');
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'word or constructor > '
    });
    
    var i;
    rl.prompt();
    rl.on('line', function(line){
        var line=line.trim();
        if (line.length>0){
            if (line.indexOf("(")>=0){ // word contains (, so it must be a jsR constructor
                try {
                    console.log(eval(line).toString());
                } catch (e){
                    console.log("Error in realizing: "+line);
                    console.log(e.toString());
                }
            } else if (i=line.indexOf("!")>=0){ // pos!word for getting the lemma for a given pos
                console.log(jsRealB.form2lemma(lemmata,line.substring(i+1),
                                               line.substring(0,i).toUpperCase()))
            } else if (lemmata.has(line)){
                var exps=jsRealB.lemma2jsRexps(lemmata.get(line));
                for (var i = 0; i < exps.length; i++) {
                    console.log(exps[i]);
                }
            } else {
                console.log("%s not found",line)
            }
        }
      rl.prompt();
    }).on('close', function(){
        console.log("")
        process.exit(0);
    });
}