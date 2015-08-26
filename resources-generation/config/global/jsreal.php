<?php

return array(
    'lexicon' => array(
        'simple_nlg' => array(
            'xml' => array(
                'en' => 'english-lexicon.xml',
                'fr' => 'french-lexicon.xml'
            ),
            'xsl' => 'lexicon.xsl',
            'patch' => array(
                'en' => 'english-lexicon-patch.json',
                'fr' => 'french-lexicon-patch.json'
            ),
            'extension' => array(
                'en' => 'english-lexicon-extension.json',
                'fr' => 'french-lexicon-extension.json'
            )
        ),
        'dm' => array(
            'dictionary' => 'dm-dictionary.php',
            'file' => array(
                'en' => 'dme-lex.txt',
                'fr' => 'dmf-lex.txt'
            )
        ),
        'public' => array(
            'uncompressed' => array(
                'en' => 'lex-en.json',
                'fr' => 'lex-fr.json'
            ),
            'compressed' => array(
                'en' => 'lex-en.min.json',
                'fr' => 'lex-fr.min.json'
            )
        )
    ),
    'verb' => array(
        'dictionary' => array(
            'xml' => array(
                'fr' => 'french-verb.xml'
            ),
            'xsl' => array(
                'fr' => 'french-verb.xsl'
            )
        ),
        'conjugation' => array(
            'xml' => array(
                'fr' => 'french-verb-conjugation.xml'
            ),
            'xsl' => array(
                'fr' => 'french-verb-conjugation.xsl'
            )
        )
    ),
    'test' => array(
        // Verbes deja conjugues pour les tests automatiques
        'conjugation' => array(
            'xml' => array(
                'fr' => 'french-lexicon.xml'
            ),
            'xsl' => array(
                'fr' => 'automatic-testing-conjugation.xsl'
            )
        ),
        // Noun/adjective declension
//        'declension' => array(
//            'xml' => array(
//                'fr' => 'french-lexicon.xml'
//            ),
//            'xsl' => array(
//                'fr' => 'automatic-testing-declension.xsl'
//            )
//        ),
        'public' => array(
            'uncompressed' => array(
                'en' => 'test-en.json',
                'fr' => 'test-fr.json'
            ),
            'compressed' => array(
                'en' => 'test-en.min.json',
                'fr' => 'test-fr.min.json'
            )
        )
    ),
    /**
     * Grammar, Conjugation...
     */
    'rule' => array(
        'public' => array(
            'uncompressed' => array(
                'en' => 'rule-en.json',
                'fr' => 'rule-fr.json'
            ),
            'compressed' => array(
                'en' => 'rule-en.min.json',
                'fr' => 'rule-fr.min.json'
            )
        )
    ),
    /**
     * Feature Info
     */
    'feature_info' => array(
        'file' => array(
            'uncompressed' => 'feature.json',
            'compressed' => 'feature.min.json'
        )
    ),
    /**
     * Feature Name
     */
    'feature' => array(
        'category' => array(
            'alias' => 'c',
            'word' => array(
                'noun' => 'N',
                'verb' => 'V',
                'determiner' => 'D',
                'pronoun' => 'Pro',
                'adjective' => 'A',
                'adverb' => 'Adv',
                'preposition' => 'P',
                'conjunction' => 'C',
                'complementizer' => 'Com',
                'punctuation' => 'Pc'
            ),
            'phrase' => array(
                'noun' => 'NP',
                'verb' => 'VP',
                'adjective' => 'AP',
                'adverb' => 'AdvP',
                'prepositional' => 'PP',
                'propositional' => 'SP', // subordinate
                'coordinated' => 'CP',
                'sentence' => 'S'
            )
        ),
        'tense' => array(
            'alias' => 't',
            'base' => 'b',
            'gerund' => 'g',
            'indicative' => array(
                'present' => 'p',
                'imperfect' => 'i',
                'past' => 'ps', // English only
                'simple_past' => 'ps',
                'compound_past' => 'pc',
                'pluperfect' => 'pq',
//                pa	passé antérieur
                'simple_future' => 'f'
//                fa	futur antérieur
//                fp	futur du passé
//                fap	futur antérieur du passé
            ),
            'imperative' => array(
                'present' => 'ip',
                'past' => 'ipa'
            ),
            'conditional' => array(
                'present' => 'c',
                'past' => 'cp',
            ),
            'subjunctive' => array(
                'present' => 's',
                'imperfect' => 'si',
                'past' => 'spa',
                'pluperfect' => 'spq'
            ),
            'infinitive' => array(
                'present' => 'npr',
                'past' => 'npa',
                'future' => 'nf'
            ),
            'participle' => array(
                'present' => 'pr',
                'past' => 'pp',
                'future' => 'pf'
            )
        ),
        'type' => array(
            'verb' => array(
                'alias' => 'vt'
            ),
            'noun' => array(
                'alias' => 'nt'
            ),
            'pronoun' => array(
                'alias' => 'pt',
                'personnal' => 'p',
                'reflexive' => 'rx',
                'demonstrative' => 'd',
                'indefinite' => 'i',
                'relative' => 'r',
                'interrogative' => 'in',
                'existential' => 'ex',
                'possessive' => 'po',
                'adverbial' => 'a'
            )
        ),
        'person' => array(
            'alias' => 'pe',
            'unapplicable' => null,
            'unspecified' => 'x',
            'p1' => 1,
            'p2' => 2,
            'p3' => 3
        ),
        'gender' => array(
            'alias' => 'g',
            'unapplicable' => null,
            'unspecified' => 'x',
            'masculine' => 'm',
            'feminine' => 'f',
            'neuter' => 'n',
            'either' => 'x'
        ),
        'number' => array(
            'alias' => 'n',
            'unapplicable' => null,
            'unspecified' => 'x',
            'singular' => 's',
            'plural' => 'p',
            'either' => 'x'
        ),
        'owner' => array(
            'alias' => 'own',
            'singular' => 's',
            'plural' => 'p',
            'either' => 'x'
        ),
        'form' => array(
            'alias' => 'f',
            'comparative' => 'co',
            'superlative' => 'su'
        ),
        'typography' => array(
            'alias' => 'typo',
            'ucfist' => 'ucf',  // upper-case first letter
            'before' => 'b',
            'after' => 'a',
            'surround' => 'sur',
            'position' => array(
                'alias' => 'pos',
                'left' => 'l',      // open
                'right' => 'r'     // close
            ),
            'complementary' => 'compl'
        ),
        'html' => array(
            'alias' => 'html',
            'element' => 'elt',
            'attribute' => 'attr'
        ),
        'phonetic' => array(
            'alias' => 'phon',
            'elision' => 'ev'
        ),
        'date' => array(
            'alias' => 'DT'
        ),
        'numerical' => array(
            'alias' => 'NO'
        ),
        'display_option' => array(
            'alias' => 'dOpt',
            'raw' => 'raw',
            'max_precision' => 'mprecision',
            'natural' => 'nat',
            'year' => 'year',
            'month' => 'month',
            'date' => 'date',
            'day' => 'day',
            'hour' => 'hour',
            'minute' => 'minute',
            'second' => 'second',
            'relative_time' => 'rtime',
            'determiner' => 'det'
        )
//        'punctuation' => array(
//            'alias' => 'pc',
//            'full_stop' => 'st',
//            'exclamation_mark' => 'em',
//            'question_mark' => 'qm',
//            'full_stop' => 'st',
//            'comma' => 'cm',
//            'semicolon' => 'sc',
//            'colon' => 'col',
//            'dots' => 'dd',
//            'slash' => 'sl',
//            'left_parenthesis' => 'lp',
//            'right_parenthesis' => 'rp',
//            'left_square_bracket' => 'lsb',
//            'right_square_bracket' => 'rsb',
//            'left_brace' => 'lb',
//            'right_brace' => 'rb',
//            'hyphen' => 'hy',
//            'left_quote' => 'lq',
//            'right_quote' => 'rq'
//        )
    )
);