Format of *jsRealB* Lexicons
===========================

The content of the lexicons of *jsRealB* is derived from lexicons developed at RALI many years ago. The initial JSON format of these lexicons was created using a Python script based on the original version, and then further refined and expanded by hand with new entries and attributes as they were added.

The rules for declension and conjugation are also included in the JSON, which covers most English and French use cases.  The structure of each lexicon is similar: a single object, where the keys represent the base forms, and the values are objects containing information about conjugation and declension for each part of speech.

The contents of the dictionaries linked to [json-inc schemas](https://github.com/lapalme/json-rnc) serve not only as a basis for validation, but also as a resource for describing the structure of the data.

## Schema for the English lexicon

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

*   The `string` associated with the `tab` key must be a declension or conjugation table number in `rule-en.js`.
*   Gender (`g`) and number (`n`) can only take a limited set of values;
*   For the determiner and adjective, `value` is the numerical value associated either with a cardinal or an ordinal number respectively;
*   When `hAn` is 1, this word changes a preceding _a_ to _an_; `cnt` indicates if an English noun is countable: `yes`, `no` or `both`.
*   In the case of `punct`, `compl` is the complementary punctuation sign, e.g., matching closing parenthesis or bracket.
The `ldv` attribute is set to `true` for any term that appears in the _Longman American Defining Vocabulary_. This denotes a term as being commonly used in a lexicon, either for an entire entry or for a specific part of speech. This data can be helpful for creating sentences with everyday words. There are approximately 2,100 entries that are identified as such.



Schema of the French lexicon
-------

```json
start = {*:lexInfo}

lexInfo={N?:  {tab:/n(I|\d{1,3}a?)/, g?:gender, h?:one,  niveau?:niv },
         A?:  {tab:/[an](I|\d{1,3}a?)/,  h?:one, pos?:/pre|post/,niveau?:niv},
         Pro?:{tab:/pn\d{1,2}(-[123][sp]?[mfn]?)?|n27|n28|n75|n76|d[1345]|nI/, 
               g?:gender, n?:num, pe?:oneTwoThree, niveau?:niv},
         V?:  {tab:/v\d{1,3}/, aux?:/av|êt|aê/, h?:one, pat?:[/tdir|tind|intr|réfl|impe/], niveau?:niv}, 
         D?:  {tab:/d\d{1,2}(-\d)?|n(I|23|25|27|28|48|75|76)/, n?:num, value?:number, niveau?:niv},  
         Adv?:{tab:/av|b\d/,h?:one, niveau?:niv}, 
         P?:  {tab:/ppe?/,h?:one, niveau?:niv},
         C?:  {tab:/cj|cje|cji/, niveau?:niv},
         Q?:  {tab:/av/},
         Pc?: {tab:[/pc\d{1,2}/], compl?:string},
         value?:number
    }@(minProperties=1)

one       = number@(minimum=1, maximum=1)
oneTwoThree  = number@(minimum=1, maximum=3)
niv  = number@(minimum=1,maximum=6)
gender = /m|f|x/
num = /s|p/
```

The `string` associated with the `tab` key must be a number corresponding to a declension or conjugation table in the `rule-fr.js` file.

* Gender (`g`) and number (`n`) can only take a limited set of values;

For the determiner and adjective, `value` is the numerical representation associated with either a cardinal or an ordinal number.

* Verbal argument patterns can be defined using a list of permitted structures (`pat`).
  
    *   `tdir`: transitive direct
    *   `tind`: intransitive direct
    *   `intr`: intransitive
    *   `réfl`: reflexive
    *   `impe`: impersonal
    
    If the only pattern is `réfl`, then the verb is _essentiellement réfléchi_, meaning that it is always followed by a reflexive pronoun when conjugated.
    
* The letter “h” represents a French “h aspiré”, meaning that it does not undergo elision with the previous word.

* In the case of `punct`, `compl` represents the complementary punctuation symbol, such as the matching closing parenthesis or bracket.

The `niveau` field is an integer between 1 and 6, which corresponds to the school grade indicated by the _Année scolaire_ field in the [Liste orthographique of the Québec Education Ministry](https://www.education.gouv.qc.ca/fileadmin/site_web/documents/education/jeunes/pfeq/Liste-orthographique-document-reference.pdf). This indicates a _common_ word in a lexicon for a given part of speech. This data can help create sentences using everyday language. About 2,600 entries are marked in this way.

# Lexicon validation

The lexicons can be validated using the [json-rnc validator](https://github.com/lapalme/json-rnc#5-using-the-validator) in the following way:

```swift
./ValidateJsonRnc.py --slurp lexicon-en.jsonrnc lexicon-en.json
./ValidateJsonRnc.py --slurp lexicon-fr.jsonrnc lexicon-fr.json
```

This validation process creates a standard JSON Schema](https://json-schema.org) file that can be used for on-the-fly validation and suggestion in Visual Studio Code by adding the following in the settings (modulo appropriate paths).

```json
"json.schemas": [
    {"fileMatch": ["./data/lexicon-en.json"],
     "url": "./data/lexicon-en.jsonrnc.json"},
     {"fileMatch": ["./data/lexicon-fr.json"],
     "url": "./data/lexicon-fr.jsonrnc.json"}
]
```

Query a lexicon using `jq`
========================

* To query information from these lexicons, the easiest way is through the [IDE](../IDE/) or the [evaluation demo](../demos/Evaluation/index.html).

* Additionally, you can use [jq](https://jqlang.github.io/jq/) to query these JSON lexicons. Here are a few examples of queries:
  
    \- Search a specific entry: here `love`
    
    `jq 'to_entries|.[]|select(.key=="love")' lexicon-en.json`
    
    —Search for entries matching a regular expression. Here, entries starting with `love` or `-c` for a more compact output.
    
    `jq -c 'to_entries|.[]|select(.key|test("^love.*"))' lexicon-en.json`
    
    Search for a combination of properties: entries ending in `er` that can be used as nouns, verbs or adjectives, but only show the entry; `-r` to show the entries without surrounding quotes.
    
    `jq -r 'to_entries|.[]|select((.key|test("er$")) and (.value|has("N")) and   (.value|has("V")) and (.value|has("A")))|.key' lexicon-en.json`



**Contact**: [Guy Lapalme](mailto:lapalme@iro.umontreal.ca) [RALI](http://rali.iro.umontreal.ca), Université de Montréal, 2024.