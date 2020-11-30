/*
   Customized node.js READ-EVAL-PRINT loop for developing jsRealB expressions
    - when the expression is a Constituent, call toString() to get its realization
    - output a string as is without enclosing quotes
    - usual util.inspect for all other types of values
    - history of previous commands is saved on a normal exit (^D) only

   example call:
      node /path/to/jsRealB-IDE/jsRealB-IDE-repl.js [en|fr|dme|dmf] (fr is the default...)
*/

// preload jsRealB module
jsRealB=require("./jsRealB-IDE.min.js");
// import constructors and other functions
for (var v in jsRealB){eval (''+v+"=jsRealB."+v)}
// select language 
var args=process.argv
console.log("** jsRealB "+jsRealB_version+" ("+jsRealB_dateCreated+") Development Environment [help() for info]**")
if (args.length>2){
    var a2=args[2];
    if (a2=="dme"){
        loadEn(true);
        updateLexicon(require("../data/lexicon-dme.json"));
        console.log("dme lexicon loaded");
        buildLemmataEn();
    } else if (a2=="dmf") {
        loadFr(true);
        updateLexicon(require("../data/lexicon-dmf.json"));
        console.log("lexique dmf chargé")
        buildLemmataFr();
    } else if (a2=="en"){
        loadEn(true);
        buildLemmataEn();
    } else if (a2=="fr"){
        loadFr(true);
        buildLemmataFr();
    } else {
        console.log("Language "+a2+" not implemented");
        loadFr(true);
        buildLemmataFr()
    }
} else {
    loadFr(true);
    buildLemmataFr();
}

// customize Read-Eval-Print loop
var repl = require('repl');
// specialized output
function myWriter(output) {
    if (isConstituent(output)) // realize the sentence
        return "=> "+output.toString();
    if (typeof output == "string") // output a string as is
        return output;
    return util.inspect(output);  // inspect other types of output
}

const replServer=repl.start({
    prompt: 'jsRealB > ',
    useGlobal: true,
    ignoreUndefined: true,
    writer:myWriter, 
    replMode: repl.REPL_MODE_STRICT
});

//  add commands for querying the linguistic resources
replServer.defineCommand('cn', {
  help: 'conjugation information for table no',
  action(no) {
    console.log(getConjugation(no));
    this.displayPrompt();
  }
});
replServer.defineCommand('ce', {
  help: 'conjugation information for table with ending',
  action(ending) {
    console.log(getConjugationEnding(ending));
    this.displayPrompt();
  }
});
replServer.defineCommand('dn', {
  help: 'declension information for table no',
  action(no) {
    console.log(getDeclension(no));
    this.displayPrompt();
  }
});
replServer.defineCommand('de', {
  help: 'declension information for table with ending',
  action(ending) {
    console.log(getDeclensionEnding(ending));
    this.displayPrompt();
  }
});
replServer.defineCommand('lm', {
  help: 'lemmatize: get jsRealB expression for form',
  action(word) {
    console.log(lemmatize(word));
    this.displayPrompt();
  }
});
replServer.defineCommand('lx', {
  help: 'get lexicon info for form',
  action(word) {
    var info=getLexiconInfo(word);
    if (info===undefined)
        console.log(word+":"+(getLanguage()=="en"?" not found":"pas trouvé"));
    else {
        for (const [key,val] of Object.entries(info)){
            console.log("%s:%s",JSON.stringify(key),JSON.stringify(val));
        }
    } 
    this.displayPrompt();
  }
});

// save the history of commands... which is not done when a custom repl is used
// adapted from https://medium.com/@tjwebb/a-custom-node-repl-with-history-is-not-as-hard-as-it-looks-3eb2ca7ec0bd

// load saved history
const historyFile=require('os').homedir()+'/.node_repl_history'

fs.statSync(historyFile)
fs.readFileSync(historyFile,"utf8").split('\n')
  .reverse()
  .filter(line => line.trim())
  .map(line => replServer.history.push(line))

// save the commands from this session on normal exit
process.on('exit', function () {
    fs.appendFileSync(historyFile, replServer.lines.join('\n'))
});