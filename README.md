# jsRealB - A JavaScript Bilingual Text Realizer for Web Development

**Natural language generation**, a part of artificial intelligence, studies the development of systems that produce text for different applications, for example the textual description of massive datasets or the automation of routine text creation.

The web is constantly growing and its content, getting progressively more dynamic, is well-suited to automation by a realizer. However, existing realizers are not designed with the web in mind and their operation requires much knowledge, complicating their use.

**jsRealB is a text realizer designed specifically for the web**, easy to learn and to use. This realizer allows its user to build a variety of French and English expressions and sentences, to add HTML tags to them and to easily integrate them into web pages.

**jsRealB can also be used in Javascript application** by means of a `node.js` module.

The documentation can be accessed [here](https://rawgit.com/rali-udem/JSrealB/master/documentation/user.html). You can switch language in the upper right corner of the page.

There are a number of resources written in English available [on our website](http://rali.iro.umontreal.ca/rali/?q=en/jsrealb-bilingual-text-realiser), including
live demos.

**Caution**

* Although `jsRealB` can be used in a web page using only one of the generated javascript files in the [`dist`](dist/) directory, [`node.js`](https://nodejs.org/en/) is necessary for the Javascript applications and for minifying the javascript using `uglifyjs`.
* The current build process relies on the availability of some unix tools such as `makefile`, `cat` and output redirection (`>`).
* Windows users (and others) will therefore want to use the pre-built files in the [`dist`](dist/) directory.

## Directories
* [`build`](build/): build system to create the JavaScript library. Additional README in this directory.
* [`dist`](dist/): pre-built JavaScript files ready for production use.
* [`documentation`](documentation/)`: new version of the documentation (up to date and in both English and French). The examples are generated on the fly by embedding jsRealB in the page.
    * [`user.html`](https://rawgit.com/rali-udem/JSrealB/master/documentation/user.html): HTML of the core of the page (`div[id]` correspond to variables in `user-infos.js`)
    * ``style-new.css``: style sheet
    * ``user-infos.js``: definitions of variables containing the examples
    * ``user-new.js``  : JavaScript helper script.
* [`IDE`](IDE/) : An Integrated Development Environment that embeds jsRealB. [Try it here](https://rawgit.com/rali-udem/JSrealB/master/IDE/index.html). It is slightly modified from previous versions to take into account the new way of loading lexicons.

## Demos

* [Random English text generation](https://rawgit.com/rali-udem/JSrealB/master/demos/randomGeneration/english.html) [[JavaScript code](demos/randomGeneration/english.js)]
* [Random French text generation](https://rawgit.com/rali-udem/JSrealB/master/demos/randomGeneration/french.html) [[JavaScript code](demos/randomGeneration/french.js)]
* [Conjugation and declension](https://rawgit.com/rali-udem/JSrealB/master/demos/inflection/index.html) [[JavaScript code](demos/inflection/inflection.js)] 
* [99 bottles of beer: a repetitive text in English](https://rawgit.com/rali-udem/JSrealB/master/demos/99BottlesOfBeer/index.html)
* [1 km à pied: a repetitive text in French](https://rawgit.com/rali-udem/JSrealB/master/demos/KilometresAPied/index.html)
* [Date generation](https://rawgit.com/rali-udem/JSrealB/master/demos/date/index.html)
* [Elision: tests for the French elision module](https://rawgit.com/rali-udem/JSrealB/master/demos/elision/index.html)
* [French text generation of a list of events fiound in a json file](https://rawgit.com/rali-udem/JSrealB/master/demos/Evenements/index.html)
* [Sentence variants by try all types](https://rawgit.com/rali-udem/JSrealB/master/demos/VariantesDePhrases/index.html)
* [Exercises in style à la Raymond Queneau](http://rawgit.com/rali-udem/JSrealB/master/demos/ExercicesDeStyle/index.html) [[JavaScript code](demos/ExercicesDeStyle/ExerciceDeStyle.js)] [[The Exercises on Wikipedia](https://en.wikipedia.org/wiki/Exercises_in_Style)]


## Authors
jsRealB was updated, developed and brought to its current version by [Guy Lapalme](http://www.iro.umontreal.ca/~lapalme) building on the works of:

1. [Francis Gauthier](http://www-etud.iro.umontreal.ca/~gauthif) as part of his summer internship at RALI in 2016; 
2. [Paul Molins](http://paul-molins.fr/) as part of an internship from INSA Lyon spent at RALI, University of Montreal in 2015;   
3. [Nicolas Daoust](mailto:n@daou.st) built the JSreal realizer (French only).

For more information, contact [Guy Lapalme](http://rali.iro.umontreal.ca/lapalme).      
