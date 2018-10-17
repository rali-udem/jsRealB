# FILE ORGANIZATION OF THE jsRealB system

A basic jsRealB instance (for use in a web page) is the concatenation of

1. `core.js`
2. `rule-(en|fr).js`  themselves concatenation of 
    * `rule-var-(en|fr).js`
    * `rule-(en|fr).json`
3. `lexicon-(dme|en|fr).js`  themselves concatenation of 
    * `lexicon-var-(en|fr).js`
    * `lexicon-(dme|en|fr).json`
4. `node-module.js` : added to create a node module (no effect when used in a web page)
  
`makefile`: commands for creating different instances and for performing simple tests

`*.json` are created by the *ressource generation* process in the master.

### Lexicons
* `lexicon-fr.js`  : French lexicon (the same as for SimpleNLG-EnFr)
* `lexicon-en.js`  : English lexicon (the same as for SimpleNLG-EnFr)
* `lexicon-dme.js` : English lexicon containing all the words in the DME (English morphological lexicon developed at RALI) created by `dm2lexicon.py`

`addLexicon-(dme|en|fr).js`: additions and corrections to these lexicons

## Products 
### For use in a web page or as a node.js module
`jsRealB-(dme|en|fr).js`: concatenation of the appropriate files and additions

`dist/jsRealB-(dme|en|fr).min.js`: minified concatenation of the appropriate files and additions (needs `uglify` from `node.js` for minifying)

### Examples of use as a node.js module
`filter-(dme|en).js` : node module useful as a *filter*. It takes a jsRealB expression on a single single and produces the English realisation

`server-(dme|en).js` : node module that creates a local webserver (`http://127.0.0.1:8081/`) that accepts an url of the form  
    `http://127.0.0.1:8081/?lang=en&exp=S(NP(D("the"),N("man")),VP(V("love")))`

