# `jsRealB` Interactive Development Environment (IDE)

One way of testing and developing `jsRealB` expressions is by using the Javascript console in a browser. But we found it much more convenient to use a command line environment built on top of the `node.js` *Read-Eval-Print Loop*.

The system is started by typing

    node jsRealB-IDE-repl.js en

which displays a prompt indicating the version and the date the system was compiled, it also loads a default language lexicon and rule set. The second parameter is either `en` or `fr` (the default) which indicates the initial realization language. 
 
     ** jsRealB 2.0 (2019-11-25 21:17) Development Environment [help() for info]**
     English lexicon and rules loaded
     jsRealB > 


The *read-eval-print* loop allows the evaluation of any Javascript expression. If the result of the evaluation is an *object* whose prototype chain contains `Constituent` (i.e. *object* `instanceof Constituent` returns `true`), then it calls `toString()` on this value in order to show the realized sentence. If the result is a String, it is displayed without enclosing quotes. Otherwise, the value is shown as it would be in the standard *read-eval-print loop* using `util.inspect(...)`.

This allows the use of `jsRealB` functions such as `loadEn()` or `loadFr()` for setting the realization language for the following expressions. 

The IDE also adds a few commands (i.e. expressions starting with a period) for querying the current lexicon and rule tables. This is useful to find the appropriate information when adding new words with `addToLexicon(lemma,information)`. 

These commands also accept a regular expression in place of a specific value, in which case they will return the result for each form that matches the regular expression.

* `.ce` *ending* : conjugation information for tables with a given *ending*.  
    For example, to show the conjugation information for verbs ending with `ve`:
    
        jsRealB > .ce ve
        v83:
        { ending: 've',
          t:
           { b: 've',
             ps: 'd',
             pr: 'ving',
             pp: 'd',
             p: [ 've', 've', 's', 've', 've', 've' ] } }
    
* `.cn` *no* : conjugation information for table *no*.  
    For example, to show the content of table `v2`:
    
        jsRealB > .cn v2
        { ending: '',
          t:
           { b: '',
             ps: 'ed',
             pr: 'ing',
             pp: 'ed',
             p: [ '', '', 'es', '', '', '' ] } }
        
  
* `.de` *ending* : declension information for table with a given *ending*.  
    For example, to show the declension information for words ending by `ouse`
    
        jsRealB > .de ouse
        n16:
        { ending: 'ouse',
          declension: [ { val: 'ouse', n: 's' }, { val: 'ice', n: 'p' } ] }
        
* `.dn` *no* : declension information for table *no*.  
    For example, to show the declension information for table `n1`
    
        jsRealB > .dn n1
        { ending: '',
          declension: [ { val: '', n: 's' }, { val: 's', n: 'p' } ] }
        
* `.lx` *lemma* : dictionary information for lemma in a format that can be used as input for `addToLexicon()`; this is useful for adding a new lemma that is conjugated or declensed similarly to a word already in the lexicon.  
    For example, to show the lexicon information for the word `love`
    
        jsRealB > .lx love
        { N: { tab: [ 'n1' ] }, V: { tab: 'v3' } }

* `.lm` *form* : find jsRealB expressions that can realize this form.  
    For example, to find how to realize `his`
    
        jsRealB > .lm his
        Pro("mine").g("m").ow("s")
        D("my").g("m").ow("s")
        
    to find to how to realize all forms matching the pattern `l.ve`
    
        jsRealB > .lm l.ve
        live: A("live"); V("live").t("b"); V("live").pe(1); V("live").pe(2); V("live").pe(1).n("p"); V("live").pe(2).n("p"); V("live").n("p")
        love: N("love"); V("love").t("b"); V("love").pe(1); V("love").pe(2); V("love").pe(1).n("p"); V("love").pe(2).n("p"); V("love").n("p")
        
        

