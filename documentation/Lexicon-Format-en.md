Format of a *jsRealB* lexicon
===========================

The information in the lexicons of *jsRealB* was originally converted from an internal Lisp inspired format developed at RALI many years ago. The JSON lexicons were originally created using a Python script and then manually _patched_  and updated over the years with a few fields as new information became available.

The declension or conjugation information is associated with tables, defined in the files `rule-en.js` and `rule-fr.js`, that cover most English and French use cases.

We now give the [json-rnc](https://github.com/lapalme/json-rnc "GitHub - rali-udem/json-rnc: JSON validation with a RELAX-NG compact syntax")  schema used to validate the entries of the English lexicon. The [schema for the French lexicon](./Lexicon-Format-fr.md) differs slightly in some field names and values, but its overall shape is similar.

A lexicon is a single JSON object whose keys are the lemma and the value is itself another object of type `lexInfo` with information about allowed parts of speech for this lemma; at least one part of speech object must be defined.  The object associated with each part of speech list allowed values for different fields giving declension or conjugation information.

# Schema (`data/lexicon-en.jsonrnc`)


```json
start = {*:lexInfo}

lexInfo={N?:  {tab:/n(I|\d{1,3}a?)/, g?:gender, hAn?:one, cnt:/yes|no|both/,ldv?:boolean },
         A?:  {tab:/[a](I|\d{1,2})/, hAn?:one, ldv?:boolean},
         Pro?:{tab:/pn\d{1,2}(-\d[sp]?[mfn]?)?|d[35]/,ldv?:boolean},
         V?:  {tab:/v\d{1,3}/,ldv?:boolean}, 
         D?:  {tab:/d\d{1,2}/, n?:num, value?:number,ldv?:boolean},  
         Adv?:{tab:/b\d/,ldv?:boolean}, 
         P?:  {tab:/ppe?/,ldv?:boolean},
         C?:  {tab:/cs|cc/,ldv?:boolean},
         Q?:  {tab:/av/},
         Pc?: {tab:[/pc[145678]/], compl?:string},
         ldv?:boolean, 
         value?:number
    }@(minProperties=1)

one       = number@(minimum=1, maximum=1)
oneTwoThree  = number@(minimum=1, maximum=3)
gender = /m|f|x/
num = /s|p/
```

*   The `string` associated with the `tab` key must be a declension or conjugation table number in `rule-en.js` 
*   Gender (`g`) and number (`n`) can only take a limited set of values;
*   For determiner and adjective, `value` is the numerical value associated either with a cardinal or an ordinal number respectively;
*   When `hAn` is 1 for a noun or adjective, this word changes a preceding _a_ to _an_; 
*   For noun, `cnt` indicates if a noun is countable: `yes`, `no` or `both`.
*   In the case of `punct`, `compl` is the complementary punctuation sign, e.g. matching closing parenthesis or bracket.
*   An indication of a _common_ word in a lexicon either at a the level of an entry or for a given part-of-speech. The `ldv` attribute is set to `true` if the entry appears in the [_Longman American Defining Vocabulary_.](http://www2.cmp.uea.ac.uk/~jrk/conlang.dir/LongmanVocab.html)

Query lexicons using `jq`
========================

To query information from these lexicons, the easiest way is through the [IDE](../IDE/) or the [evaluation demo](../demos/Evaluation/index.html).

But it is also possible to use [jq](https://jqlang.github.io/jq/ "jq") to query these json lexicons. Here are a few examples of queries:

- Search a specific entry: here `love`

`jq 'to_entries[]|select(.key=="love")' lexicon-en.json`

- Search entries matching are regular expression: here entries starting with `love`, `-c` for a more compact output

`jq -c 'to_entries[]|select(.key|test("^love.*"))' lexicon-en.json`

- Search for a combination of properties: entries ending with `er` that can be used either as a noun, a verb or an adjective, but show only the entry; `-r` to show the entries without surrounding quotes

`jq -r 'to_entries[]|select((.key|test("er$")) and (.value|has("N")) and (.value|has("V")) and (.value|has("A")))|.key' lexicon-en.json`

# Validation

## Using the [`jsonrnc` validator](https://github.com/lapalme/json-rnc?tab=readme-ov-file#5-using-the-validator)

```swift
.../ValidateJsonRnc.py --slurp lexicon-en.jsonrnc lexicon-en.json
.../ValidateJsonRnc.py --slurp lexicon-fr.jsonrnc lexicon-fr.json
```

This also creates a standard [JSON Schema](https://json-schema.org) which can be used in other contexts.

## Use the JSON validator in Visual Studio Code

This is useful for adding new lexicon entries . Add the following to the `settings.json` configuration file. This uses the JSON Schema created by the previous validation process.

```json
"json.schemas": [
        {"fileMatch": ["/Users/lapalme/Documents/GitHub/jsRealB/data/lexicon-en.json"],
         "url": "./data/lexicon-en.jsonrnc.json"},
         {"fileMatch": ["/Users/lapalme/Documents/GitHub/jsRealB/data/lexicon-fr.json"],
         "url": "./data/lexicon-fr.jsonrnc.json"}
   ]
```

Contact: [Guy Lapalme](mailto:lapalme@iro.umontreal.ca) [RALI](http://rali.iro.umontreal.ca), Université de Montréal, 2024.