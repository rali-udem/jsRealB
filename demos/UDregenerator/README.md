# Universal Dependencies regenerator and *derivatives*

Guy Lapalme. 2021. [Validation of Universal Dependencies by regeneration](https://aclanthology.org/2021.udw-1.9.pdf). In Proceedings of the Fifth Workshop on Universal Dependencies (UDW, SyntaxFest 2021), pages 109–120, Sofia, Bulgaria. Association for Computational Linguistics.

## `UDregenerator` as a web page
To regenerate a sentence from its UD and comparing it with the original. Useful for checking features and links between tokens. It also display the dependencies as links or as a tree.

* **English** : visit `UDregenerator-en.html`
* **French** : visit `UDregenerator-fr.html`

## `UDregenerator` as a `node.js` module
    node UDregenerator-node.js lang [-sud] inputFile
    where lang: en|fr
          -sud : use SUD annotation scheme instead of classical UD
          inputFile: path of CONLLU file
          
### Useful trick
To focus on the most frequent warnings such as the *missing* words in the jsRealB lexicon, the output can be *fed* into a Linux filter such as:  
 `grep 'not found in English lexicon' | sort | uniq -c | sort -r -n`  
or  
 `grep 'absent du lexique' | sort | uniq -c | sort -r -n`

 
## `UDgrep` as a web page
For searching tokens with specific characteristics in a UD file. The tokens can be filtered by regular expressions. This program is _language independent_.

* visit `UDgrep.html`

## `variationsFromText` as a `node.js` module
For creating questions or negation from an affirmative sentence. This first parses the sentence using Stanza and uses this output to create the dependency structure and the corresponding dependency tree. jsRealB then creates questions and negations from these dependencies. It can also process directly a conllu file.

    node variationsFromText.js [-l en|fr] [-q] [-n] [-h] [-t] file.{txt|conllu} 
    where -l: language (en default)
           -sud : input uses the SUD annotation scheme
           -q: generate questions (default false) 
           -n: generation negation (default false)
           -h: this message
           -t: show trees
            file.txt: text file with sentences on a single line
                      this creates "file.conllu" if it does not exist or is "older" than file.txt
            file.conllu: process directly the conllu file
            
This system was used in 
[Unsupervised multiple-choice question generation for out-of-domain Q&A fine-tuning](https://aclanthology.org/2022.acl-short.83) (Le Berre et al., ACL 2022)   

##  Create a sample of CONNLL files `sampleConnll.js`
Program used to create the files in the `UD-2.8/sample` directory. It selects randomly 10 UD structures from each file from a given directory.  

# Organization of the system

Many of the programs share classes and code as shown in the `Code-organization.txt`

## Files

### Sources

* `drawDependencies.js` : create dependency and tree diagrams in SVG
* `levenshtein.js` : compute edit distance between two strings; show differences in HTML and on the console using SGR 
* `sampleConnll.js` : create the sample files (use with `node`)
* `testAll.sh` : launch `UDregenerator-node.js` on all files in a given language
* `testOne.sh` : launch `UDregenerator-node.js` on a single file in a given language
* `text2ud.py` : Python 3 program from transforming an English or French sentence (on a single line) calling Stanza
* `UD.js` : JavaScript representation of the whole UD structure
* `UD2jsr.js` : Mapping between UD features and jsRealB options
* `UDgrep.css` : css used by `UDgrep.html`
* `UDgrep.html` : Search for tokens with specific properties using regular expressions
* `UDgrep.js` : JavaScript used by `UDgrep.html`
* `UDinit-en.js` : initial UDs in English
* `UDinit-fr.js` : initial UDs in French (contains also UDs in SUD annotation scheme)
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
* `utils.js` : utility functions
* `variationFromText.js` : node.js program to create questions and negation for a sentence

### DATA
* `variations-data` : example data to test `variationsFromText.js`
    * `paper-example-fr.connllu` : UD file corresponding to `paper-example-fr.txt`
    * `paper-example-fr.txt` : text file with the sentence used as example in the paper by Le Berre (ACL-22)
    * `selection_obqa-fr.connllu` : UD file corresponding to `selection_obqa-fr.txt`
    * `selection_obqa-fr.txt` : text file with 200 sentences used  by Le Berre (ACL-22)

* `UD-2.8/sample`
    * `en-sample-10.conllux` : English sample with the corresponding jsRealB expression, and comments starting "# gl ="
    * `en-sample-10.conllu.out` : Output of processing the English sample with the node.js module
    * `en-sample-10.stats` : sorted list of all suggested modifications or errors found in the English sample
    * `fr-sample-10.conllux` : French sample with the corresponding jsRealB expression and comments starting by "# gl ="
    * `fr-sample-10.conllu.out` : Output of processing the French sample with the node.js module
    * `fr-sample-10.stats` : sorted list of all suggested modifications or errors found in the French sample

## Documentation
* `README.md` : this file
* `UDregenerator.pdf` : paper describing the system with results from experiments (extended version of the [paper presented at UDW-21](https://aclanthology.org/2021.udw-1.9.pdf))