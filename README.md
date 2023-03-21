# jsRealB - A JavaScript Bilingual Text Realizer for Web Development

*Version 4.6.1 - March 2023*

**This version is a major code reorganization of the system with JavaScript classes and modules.** This simplifies the internal organization of the code, but the syntactic formalism stays the same, possibly incurring a slight modification in the initial setup.

Natural Language Generation (NLG) is a field of artificial intelligence that focuses on the development of systems that produce text for different applications, for example the textual description of massive datasets or the automation of routine text creation.

The web is constantly growing and its content, getting progressively more dynamic, is well-suited to automation by a realizer. However existing realizers are not designed with the web in mind and their integration in a web environment requires much knowledge, complicating their use.

**jsRealB is a text realizer designed specifically for the web**, easy to learn and to use. This realizer allows its user to build a variety of French and English expressions and sentences, to add HTML tags to them and to easily integrate them into web pages.

**jsRealB can also be used in Javascript application** by means of a `node.js` module available also as `npm` package. It also accepts an input specification in JSON. 

The documentation can be accessed [here](http://rali.iro.umontreal.ca/JSrealB/current/documentation/user.html). You can switch between English and French in the upper right corner of the page. The specification of the JSON input format is described [here](http://rali.iro.umontreal.ca/JSrealB/current/data/jsRealB-jsonInput.html).

The _companion_ project [pyrealb](https://github.com/lapalme/pyrealb) implements in Python a text realizer using the same notation for syntactic elements as `jsRealB`.

`jsRealB` can be used out of the box (the GitHub in fact!) in a web page by using `jsRealB.js` in the [`dist`](dist/) directory.

**Caution**
* [`node.js`](https://nodejs.org/) is necessary for the Javascript application examples.
* The current build process relies on the availability of [webpack](https://webpack.js.org).


## Directories
* [`Architecture`](Architecture/):
    * `README.md` : Description of the architecture of the system; the second section goes into details of the organization of the source files and describes the main methods.
* [`data`](data/):  lexicographic information that is bundled with the `dist/jsRealB.js`
    * `lexicon-en.json` : a *comprehensive* English lexicon (33926 entries) in JSON format 
    * `lexicon-fr.json` : a *comprehensive* French lexicon (52512 entries) in JSON format
    * `rule-en.js` : English conjugation and declension tables 
    * `rule-fr.js` : French conjugation and declension tables 
* [`demos`] : see next section
* [`dist`](dist/): pre-built JavaScript files ready for production use, they already include the English and French lexicons and the English and French rule tables
    * `jsRealB.js`: packages all .js files of the `build` directory as a module and exports only main functions and constants
        * For use in a web page : `<script src="/path/to/dist/jsRealB.js"></script>`
        * For use as a node.js module : `import jsRealB from  "/path/to/dist/jsRealB.js"`
    * `jsRealB-filter.mjs`: example of use of the node.js module to create a Unix filter for `jsRealB`
    * `jsRealB-server.mjs`: example of use of the node.js module to start a web server that realizes sentences
    * `testServer.py`: Python script using the `jsRealB` server
    * `package.json`: necessary for publishing the `jsrealb` *npm* package.
    * `README.md` : short presentation and example of use of the *npm* package displayed at `https://www.npmjs.com/package/jsrealb` 
    When a new version is to be put on `npm`, in principle, it should be enough to issue the two following commands from within the `dist` directory (after a npm login):  
      `npm version {major|minor|patch}`  ideally the resulting version number should the same as `jsRealB_version` in `jsRealB.js`
      `npm publish`  
    Because of the `.npmignore` hidden file in this directory, only `jsRealB.js` is published.
* [`documentation`](documentation/): in both English and French. The examples are generated on the fly by embedding `jsRealB` in the page. [*Consult the documentation*](http://rali.iro.umontreal.ca/JSrealB/current/documentation/user.html)
    * `jsRealBfromPython.html`: documentation for creating the JSON input format in Python
    * `user.html`: HTML of the core of the page (`div[id]` correspond to variables in `user-infos.js`)
    * `style.css`: style sheet
    * `user-infos.js`: definitions of variables containing the examples
    * `user.js`  : JavaScript helper script.
* [`Examples`](Examples): Examples of integration of jsRealB into web pages or node.js applications. See [index.html](Examples/index.html) for use cases.
* [`IDE`](IDE/) : An Integrated Development Environment built upon the `Node.js` *read-eval-print loop* that includes `jsRealB` to easily get the realization of an expression, to consult the lexicon, the conjugation and declination tables. It is also possible to get a *lemmatization*: i.e. the `jsRealB` expression corresponding to a form. See the [`README.html`](IDE/README.html) file to see how to use it.
* [`node-modules`](node-modules/) : used for transpiling with webpack
* [`src`](src/): sources to create the JavaScript library; more details in the [document on the architecture of the system](Architecture/README.md) 
    * `jsdoc`: documentation directory of the source files of `jsRealB.js`. [Consult the documentation](src/jsdoc/index.html).  
    Build this directory by running `jsdoc -d jsdoc *.js` in the `src` directory. For the moment, ignore warning about _unable to parse .../Lexicon.js_
    * `Constituent.js`: *Constituent* is the top class for methods shared between *Phrase*s and *Terminal*s 
    * `Dependent.js` : subclass of *Constituent* for creating complex phrases using the *dependency notation* 
    * `JSON-tools.js` : functions for dealing with the JSON input format
    * `jsRealB.js` : _main_ module that gathers all exported symbols from other classes and exports them in a single list. It also defines other utility functions and constants
    * `Lexicon.js` : English and French lexicons with their associated functions  
    * `NonTerminal.js` : functions and constants that are shared between `Dependent.js` and `Phrase.js`
    * `Number.js` : utility functions for number formatting
    * `Phrase.js` : subclass of *Constituent* for creating complex phrases using the _constituent notation_
    * `Terminal.js` : subclass of *Constituent* for creating a single unit (most often a single word)
    * `Warnings.js` : list of functions to generate warnings in case of erroneous specifications using jsRealB itself
* [`Tests`](Tests/) : unit tests (using [QUnit](https://qunitjs.com "QUnit")) of jsRealB in both French and English.
    * `testAll.html` : load this file in a browser to run all tests.  
    In _Visual Studio Code_, the launch configuration takes for granted that a local web server has been launched in the `jsRealB` directory (e.g. with `http-server -c-1`) 
* [jsRealB **Tutorial**](Tutorial/). [*Read the tutorial*](http://rali.iro.umontreal.ca/JSrealB/current/Tutorial/tutorial.html)
* *Files in the current directory*:
    * `README.md` : this file
    * `package.json` : file with parameters for building `jsRealB` using `npm` using  
                       `npm run build-dev` or  `npm run build-prod` 
    * `test-demos.sh`: launch all web demos in Safari and the jsRealB server with the Weather Python demo
    * `test-node.js`: import the jsRealB package installed with `npm` and realize a simple English sentence
    * `tests-dev.js` : `node.js` application that loads `jsRealB.js` from the `dist` directory. It also has functions with many examples that were useful during the development.
    * `web-dev.html` : load the current `dist/jsRealB.js` webpack module in a web page, thus allowing interactive testing. 
    * `webpack.config.cjs` : configuration file for building the `jsRealB.js` package in the `dist` directory
    * `.vscode` : hidden directory containing configuration for Visual Studio Code 


## Demos
### Simple examples on a single sentence
* Evaluate a `jsRealB` expression and display its realization in a web page in either English or French.
    * [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/Evaluation/index.html)
* Show the use of loops in Javascript to create repetitive texts
    * English: [99 bottles of beer](demos/99BottlesOfBeer). [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/99BottlesOfBeer/index.html)
    * French: [1 km à pied](demos/KilometresAPied). [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/KilometresAPied/index.html)
* Tests of specific features
    * French and English sentences modified with time, number and conjugation: [Date generation](demos/date) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/date/index.html)
    * Type a French or English sentence that will be realized with all possible sentence modifiers [Sentence variants](demos/VariantesDePhrases) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/VariantesDePhrases/index.html)
    * French or English conjugation and declension of a word [Conjugation and declension](demos/inflection) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/inflection/index.html)
    * Generate a table (both in English and French) showing the different forms of pronouns
         * using the original specification 
         * using the tonic and clitic options  
         
      This table is now part of the documentation
* User interface to create a simple sentence with options. The system shows the `jsRealB` expression and its realization. It is also possible to ask for a random sentence using words of the lexicon.
    * [*RandomGeneration*](demos/randomGeneration/) 
      [*Execute in English*](http://rali.iro.umontreal.ca/JSrealB/current/demos/randomGeneration/english.html) 
      [*Execute in French*](http://rali.iro.umontreal.ca/JSrealB/current/demos/randomGeneration/french.html)
* Generate spelling and grammar exercises from a simple sentence structure in both English and French.
    * [*ExercicesOrthographe*](demos/ExercicesOrthographe/) 
      [*Execute in English*](http://rali.iro.umontreal.ca/JSrealB/current/demos/ExercicesOrthographe/index-en.html) 
      [*Execute in French*](http://rali.iro.umontreal.ca/JSrealB/current/demos/ExercicesOrthographe/index-fr.html)
* `jsRealB` is also available an an `npm` package:
    * `use-npm.js` is a simple example of its use (after it is *install*ed on the system)

### Text realization
* Create an [Exercise in Style](https://en.wikipedia.org/wiki/Exercises_in_Style) which creates the structure of the original story of Raymond Queneau in both French and English. Using menus, some elements of the text can be modified and the modifications are highlighted in the web page. [Exercises in style](demos/ExercicesDeStyle) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/ExercicesDeStyle/index.html)
* Generate a text in French for asking a pay raise following a flowchart as originally described by George Perec. Using menus, some elements of the text can be modified. The path in the flowchart is displayed in the web page and it is possible to highlight a step in the flowchart with the corresponding text. [L'Augmentation](demos/Augmentation) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/Augmentation/Augmentation.html)
* Regenerate a sentences from the information contained in its Universal Dependencies structure:
    * in English : [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/UDregenerator/UDregenerator-en.html)
    * in French  : [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/UDregenerator/UDregenerator-fr.html)
    * [Paper describing the approach](http://rali.iro.umontreal.ca/JSrealB/current/demos/UDregenerator/UDregenerator.pdf)
* Reproduce a classical fairy tale in which hovering over a sentence, shows the underlying `jsRealB` expression 
    * in French : *Le petit chaperon rouge*   [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/PetitChaperonRouge/PetitChaperonRouge.html)
    * in English : *Little Red Riding Hood*  [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/PetitChaperonRouge/LittleRedRidingHood.html)

###  Data to Text applications
* **`jsRealB` for the [E2E Challenge](http://www.macs.hw.ac.uk/InteractionLab/E2E/ "E2E NLG Challenge")** : browser for the datasets (training, development and test) used in the *End to End Generation Challenge* (2017-2018). The page also shows the English and French output produced by a "rule-based" generator using `jsRealB` for a selection of feature values. There is also a short description of the implementation of the realizer. [Execute](http://rali.iro.umontreal.ca/JSrealB/current/demos/e2eChallenge/index.html)
* **_Personalized_ descriptions of restaurants** : how _**jsRealB**_ can be used for varying the linguistic style of the generated text according to a user profile defined as one of the [Big Five](https://en.wikipedia.org/wiki/Big_Five_personality_traits) model of personality. [Execute](http://rali.iro.umontreal.ca/JSrealB/current/demos/Personage/index.html)
* **Description (in French) of a list of events** and associated informations given as a json file [Événements](demos/Evenements) [Execute](http://rali.iro.umontreal.ca/JSrealB/current/demos/Evenements/index.html)
* **Description of list of steps for the building of a house**, given information about tasks, the duration and the precedence relations between them. 

    <!-- ![Screen copy of the application](demos/Data2Text/building-small.jpg "Construction of a building") -->
    <img src="demos/Data2Text/building-small.jpg" width="800">
    
  The system first computes the critical path to find the start and end times of each task. It then creates a graphic for displaying the PERT diagram and an accompanying text to explain the steps to follow. It is possible to interactively change the start date and to explore the graphic with the mouse which also uses jsRealB to generate the text of the tooltips. 
    * [English](demos/Data2Text/building.html) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/Data2Text/building.html)
    * [French](demos/Data2Text/batiment.html) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/Data2Text/batiment.html)
* **Itinerary description in an *optimistic* Montréal Métro network**. The system shows an interactive map of the Montréal Métro station with a new line. When a user clicks two stations, the systems realizes a text describing the itinerary to go from the first station to the second. 

    <!-- ![Screen copy of the application](Tutorial/metro.jpg "Finding a path in the metro") -->
    <img src="demos/ItineraryDescription/metro.jpg" width="800"/>
    
    The language of the web page and of the realization can be changed interactively by clicking in the top right of the page. [Metro](demos/ItineraryDescription/metro.html) [*Execute*](http://rali.iro.umontreal.ca/JSrealB/current/demos/ItineraryDescription/metro.html)
* **Weather bulletin generation in English and French**. An example of use of the Python API for **jsRealB**. Taking weather information in JSON, it generates bulletin in both English and French. [This tutorial describes the organization of the system](http://rali.iro.umontreal.ca/JSrealB/current/demos/Weather/Bulletin-generation.html) which shows how **jsRealB** can be used in a real-life situation in conjunction with Python for data manipulation.


### Interactive use with *Observable*
* Two [Observable](https://observablehq.com) notebooks are available for trying `jsRealB` expressions and seeing their realizations.
    * [English](https://observablehq.com/@lapalme/exprimenting-with-jsrealb "Experimenting with jsRealB / Guy Lapalme / Observable")
    * [Français](https://observablehq.com/@lapalme/nouvelles-experiences-avec-jsrealb "Nouvelles exp&#xE9;riences avec jsRealB / Guy Lapalme / Observable")

## Design of the system
The current version (4.5) is a redesign and reimplementation of the previous version while keeping intact the external interface, i.e. same name of functions for building constituents, for option names and for global functions. This means that applications using only the external interface of `jsRealB` can be run unchanged. Version 4.0 added the dependency notation.

[This document](Architecture/README.md) first describes the transformation steps within the realizer using a few examples. It then gives an overview of the implementation explaining the role of the main classes and methods.

## Authors
jsRealB was updated, developed and brought to its current version by [Guy Lapalme](http://www.iro.umontreal.ca/~lapalme) building on the work of:

1. [Francis Gauthier](http://www-etud.iro.umontreal.ca/~gauthif) as part of his summer internship at RALI in 2016; 
2. [Paul Molins](http://paul-molins.fr/) as part of an internship from INSA Lyon spent at RALI, University of Montreal in 2015;
3. [Nicolas Daoust](mailto:n@daou.st) developed the original concept in the _JSreal_ realizer for French only in 2013.

For more information, contact [Guy Lapalme](http://rali.iro.umontreal.ca/lapalme).      
