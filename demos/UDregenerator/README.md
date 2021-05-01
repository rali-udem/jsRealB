# Universal Dependencies regenerator

## Use as a web page

* **English** : visit `UDregenerator-en.html`
* **French** : visit `UDregenerator-fr.html`

When testing in local mode, start a web server (e.g. `python3 -m http.server`) at the root of `jsRealB` directory. This is needed to load the *big* English or French lexicons.

## Use a `node.js` module

`node UDregenerator-node.js` *lang* *conllu-file* *options*  

* *lang*: `en` or `fr`
* *conllu-file* : file to process
* *options* : 
   * *empty* : process all sentences
   * `diff` : show only sentences that are regenerated differently than the original
   * `option` : show also output of the regenerated sentence to which this option (e.g. `neg:true`) is added to the overall sentence.
   
## Files

### sources

* `drawDependencies.js` : create dependency and tree diagrams in SVG
* `JSR.js` : JavaScript representation of jsRealB trees
* `levenshtein.js` : compute edit distance between two strings; show differences in HTML and on the console using SGR 
* `README.md` : this file
* `sampleConnll.js` : create the sample files (use with `node`)
* `testAll.sh` : launch `UDregenerator-node.js` on all files in a given language
* `testOne.sh` : launch `UDregenerator-node.js` on a single file in a given language
* `Tokenizer.js` : create a tree representation from the jsRealB expression (useful for building the constituency tree diagram)
* `UD.js` : JavaScript representation of the whole UD structure
* `UD2jsr.js` : Mapping between UD features and jsRealB options
* `UDnode-en.js` : English specific transformation 
* `UDnode-fr.js` : French specific transformation
* `UDnode.js` : JavaScript class for create a node of the UD tree (language independent)
* `UDregenerator-en.html` : web page for using UDgenerator in English
* `UDregenerator-en.js` : code for interacting with the UDgenerator in English (dictionary loading)
* `UDregenerator-fr.html` : web page for using UDgenerator in French
* `UDregenerator-fr.js` : code for interacting with the UDgenerator in French (dictionary loading)
* `UDregenerator-node.js` : `node.js` module
* `UDregenerator.css` : style file for the web page
* `UDregenerator.js` : main file which starts the program or the web page
* `UDregenerator.pdf` : paper describing the system with results from experiments
* `utils.js` : utility functions

### data
* `UD-2.7/en` : directory containing a copy of the English UD corpora
* `UD-2.7/fr` : directory containing a copy of the French UD corpora
* `UD-2.7/en-sample-10.conllu` : English sample 
* `UD-2.7/en-sample-10.conllu.out` : Output of processing the English sample with the node.js module
* `UD-2.7/en-sample-10.conllux` : English sample with the corresponding jsRealB expression, and comments starting "# gl ="
* `UD-2.7/fr-sample-10.conllu` : French sample
* `UD-2.7/fr-sample-10.conllu.out` : Output of processing the French sample with the node.js module
* `UD-2.7/fr-sample-10.conllux` : French sample with the corresponding jsRealB expression and comments starting by "# gl ="

### pdf
* `UDregenerator.pdf` : paper describing the approach