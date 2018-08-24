FILE ORGANIZATION OF THE jsRealB system

A basic jsRealB instance (for use in a web page) is the concatenation of
  core.js
  rule-(en|fr).js  themselves concatenation of rule-var-(en|fr).js and rule-(en|fr).json
  lexicon-(dme|en|fr).js  themselves concatenation of lexicon-var-(en|fr).js and lexicon-(dme|en|fr).json
  
*.json are created by the "ressource generation" process in the master.

node-module.js : added to create a node module

makefile: commands for creating different instances 

lexicon-fr.js  : French lexicon (the same as for SimpleNLG-EnFr)
lexicon-en.js  : English lexicon (the same as for SimpleNLG-EnFr)
lexicon-dme.js : English lexicon containing all the words in the DME (English morphological lexicon developed at RALI)
                 created by dm2lexicon.py

additions and corrections to these lexicons are in 
addLexicon-(dme|en|fr).js

jsRealB-(dme|en|fr).js          : concatenation of the appropriate files and additions
jsRealB-(dme|en|fr)-node.js     : concatenation of the appropriate files and additions as a node module
jsRealB-(dme|en|fr).min.js      : minified concatenation of the appropriate files and additions
jsRealB-(dme|en|fr)-node.min.js : minified concatenation of the appropriate files and additions as a node module

filter-(dme|en).js : node module useful as a "filter" 
                     takes a jsReal expression on a single single and produces the English realisation
server-(dme|en).js : node module that creates a webserver (http://127.0.0.1:8081/)
                     accepts url of the form
                     http://127.0.0.1:8081/?lang=en&exp=S(NP(D("the"),N("man")),VP(V("love")))


Directories
- documentation : new version of the documentation (up to date and in both English and French)
                  the examples are generated on the fly by embedding jsRealB in the page
    style-new.css: style sheet
    user-infos.js: definitions of variables containing the examples
    user-new.html: HTML of the core of the page (div[id] correspond to variables in user-infos.js)
    user-new.js  : Javascript
- IDE : Development Environment that embeds jsRealB 
        it is slightly modified from previous version to take into account the new way of loading lexicons