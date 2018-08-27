# JSrealB - A JavaScript Bilingual Text Realizer for Web Development

**Natural language generation**, a part of artificial intelligence, studies the development of systems that produce text for different applications, for example the textual description of massive datasets or the automation of routine text creation.

The web is constantly growing and its content, getting progressively more dynamic, is well-suited to automation by a realizer. However, existing realizers are not designed with the web in mind and their operation requires much knowledge, complicating their use.

**JSrealB is a text realizer designed specifically for the web**, easy to learn and use. This realizer allows its user to build a variety of French and English expressions and sentences, to add HTML tags to them and to easily integrate them into web pages.

The documentation can be accessed [here](https://rawgit.com/rali-udem/JSrealB/master/documentation/user-new.html). You can switch language in the upper right of the page.

Additional information can be found [on our website](http://rali.iro.umontreal.ca/rali/?q=en/jsrealb-bilingual-text-realiser), including
live demos.

## Directories
* ``build``: build system to create the JavaScript library
* ``dist``: pre-built JavaScript files ready for use.
* ``documentation``: new version of the documentation (up to date and in both English and French). The examples are generated on the fly by embedding jsRealB in the page.
    * ``style-new.css``: style sheet
    * ``user-infos.js``: definitions of variables containing the examples
    * ``user-new.html``: HTML of the core of the page (div[id] correspond to variables in user-infos.js)
    * ``user-new.js``  : JavaScript helper script.
* ``IDE`` : An Integrated Development Environment that embeds jsRealB. [Try it here](https://rawgit.com/rali-udem/JSrealB/master/IDE/IDE.html). It is slightly modified from previous versions to take into account the new way of loading lexicons.

## Demos

* [Random English text generation](https://rawgit.com/rali-udem/JSrealB/master/test/manual_test/randomGeneration/english.html) [[JavaScript code](test/manual_test/randomGeneration/english.js)]
* [Random French text generation](https://rawgit.com/rali-udem/JSrealB/master/test/manual_test/randomGeneration/french.html) [[JavaScript code](test/manual_test/randomGeneration/french.js)]
* [Conjugation and declension](https://rawgit.com/rali-udem/JSrealB/master/test/manual_test/inflection/index.html) [[JavaScript code](test/manual_test/inflection/inflection.js)] 
* [99 bottles of beer: a repetitive text in English](https://rawgit.com/rali-udem/JSrealB/master/test/manual_test/99BottlesOfBeer/index.html) [The JavaScript code is inline in the HTML]
* [1 km à pied: a repetitive text in French](https://rawgit.com/rali-udem/JSrealB/master/test/manual_test/KilometresAPied/index.html)
* [Date generation](https://rawgit.com/rali-udem/JSrealB/master/test/manual_test/date/index.html)
* [Exercises in style à la Raymond Queneau](http://rawgit.com/rali-udem/JSrealB/master/test/manual_test/ExercicesDeStyle/ExerciceDeStyle.html) [[JavaScript code](test/manual_test/ExercicesDeStyle/ExercicesDeStyle.js)] [[The Exercices on Wikipedia](https://en.wikipedia.org/wiki/Exercises_in_Style)]

## IDE

[An IDE](https://rawgit.com/rali-udem/JSrealB/master/IDE.html) is available to test and develop with JSrealB.

## Credits

JSrealB was developed at the University of Montreal, in 2015, by [Paul Molins](http://paul-molins.fr/) as part of an internship from INSA Lyon spent at RALI, University of Montreal. He built on the
JSreal realizer created by [Nicolas Daoust](mailto:n@daou.st). In 2016, Francis Gauthier improved the library. In 2017, Guy Lapalme reworked the code and patched a few bugs.

For more information, contact [Guy Lapalme](http://rali.iro.umontreal.ca/lapalme).      
