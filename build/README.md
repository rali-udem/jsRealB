# File organisation for building jsRealB

A basic jsRealB instance (for use in a web page) is the concatenation of

* `core.js`
*  `rule-(en|fr).js`,  themselves concatenations of `rule-var-(en|fr).js` and `rule-(en|fr).json`
* `lexicon-(dme|en|fr).js`,  themselves concatenations of `lexicon-var-(en|fr).js` and `lexicon-(dme|en|fr).json`

`*.json` files are created by the "ressource generation" process in the master.

`node-module.js` : added to create a node module

`makefile`: commands for creating different instances 

``lexicon-fr.js``  : French lexicon (the same as for SimpleNLG-EnFr)
``lexicon-en.js``  : English lexicon (the same as for SimpleNLG-EnFr)
``lexicon-dme.js`` : English lexicon containing all the words in the DME (English morphological lexicon developed at RALI) created by ``dm2lexicon.py``

Additions and corrections to these lexicons are in ``addLexicon-(dme|en|fr).js``

`jsRealB-(dme|en|fr).js`  : concatenation of the appropriate files and additions
`jsRealB-(dme|en|fr)-node.js`  : concatenation of the appropriate files and additions as a node module
`jsRealB-(dme|en|fr).min.js ` : minified concatenation of the appropriate files and additions
`jsRealB-(dme|en|fr)-node.min.js` : minified concatenation of the appropriate files and additions as a node module

`filter-(dme|en).js` : node module useful as a "filter", takes a jsReal expression on a single line and produces the English realisation

`server-(dme|en).js` : node module that creates a webserver ([http://127.0.0.1:8081/](http://127.0.0.1:8081/)). Accepts URLs of the form `http://127.0.0.1:8081/?lang=en&exp=S(NP(D("the"),N("man")),VP(V("love")))`.
