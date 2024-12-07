let lemmataEn,lemmataFr,lemmataLang;
let rulesEn,rulesFr;

function lemmatize(query,lang){
    function removeAccent(s){
        return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }
    lang=lang||getLanguage()
    const lemmata = lang=="en" ? lemmataEn : lemmataFr;
    if (lemmata.has(query)) // check for verbatim
        return lemmata.get(query).map(e=>e.toSource()).join("\n")
    // try to match with a regular expression
    const re=new RegExp("^"+query+"$");
    let res=[];
    for (let key of lemmata.keys()){
        if (re.test(key))res.push(key+": "+lemmata.get(key).map(e=>e.toSource()).join("; "));
    }
    if (res.length==0){
        return query+" : "+(getLanguage()=="en"?"cannot be lemmatized":"ne peut être lemmatisé");
    } else {
        // sort without accent to get more usual dictionary order
        res.sort((a,b)=>a==b?0:removeAccent(a)<removeAccent(b)?-1:1);
        return res.join("\n");
    }
}

/////////// Resource query

function getNo(no,table,errorMessage){
    if (no in table)
        return ppJSON(table[no]);
    // try to match with a regular expression
    const re=new RegExp("^"+no+"$");
    let res=[];
    for (var key of Object.keys(table)){
        if (re.test(key))res.push(key+":"+ppJSON(table[key],key.length+1));
    }
    if (res.length==0)
        return no+":"+errorMessage;
    return res.join("\n")
}

function getEnding(ending,table,errorMessage){
    const re=new RegExp("^"+ending+"$");
    let res=[];
    for (var key of Object.keys(table)){
        if (re.test(table[key].ending))res.push(key+":"+ppJSON(table[key],key.length+1));
    }
    // if (res.length==0)
    //     return ending+":"+errorMessage
    return res.join("\n")
}

function getConjugation(no,lang){
    lang=lang||getLanguage()
    if (lang=="en")
        return getNo(no,rulesEn.conjugation,"no conjugation found");
    return getNo(no,rulesFr.conjugation,"pas de conjugaison trouvée");
}

function getConjugationEnding(ending,lang){
    lang=lang||getLanguage()
    if (lang=="en")
        return getEnding(ending,rulesEn.conjugation,"no conjugation found");
    return getEnding(ending,rulesFr.conjugation,"pas de conjugaison trouvée");
}

function getDeclension(no,lang){
    lang=lang||getLanguage()
    if (lang=="en")
        return getNo(no,rulesEn.declension,"no declension found");
    return getNo(no,rulesFr.declension,"pas de déclinaison trouvée");
}

function getDeclensionEnding(ending,lang){
    lang=lang||getLanguage()
    if (lang=="en")
        return getEnding(ending,rulesEn.declension,"no declension found");
    return getEnding(ending,rulesFr.declension,"pas de déclinaison trouvée");
}

function getLexiconInfo(word,lang){
    lang=lang||getLanguage()
    var lexicon=getLexicon();
    if (word in lexicon)
        return {[word]:lexicon[word]};
    // try with a regular expression
    var res={}
    var regex=new RegExp("^"+word+"$",'i')
    for (let w in lexicon){
        if (regex.exec(w))res[w]=lexicon[w];
    }
    if (Object.keys(res).length==0)
        return word+(lang=="en"? ": not in English lexicon" : ": absent du lexique français")
    else return res;
    
}
