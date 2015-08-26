<?php

return array(
    'c' => array( // main POS category:
	'Verb' => Config::get('jsreal.feature.category.word.verb'),   // verb
	'NomC' => Config::get('jsreal.feature.category.word.noun'),   // common noun
	'NomP' => Config::get('jsreal.feature.category.word.noun'),   // proper noun
	'AdjQ' => Config::get('jsreal.feature.category.word.adjective'),   // adjective
	'Pron' => Config::get('jsreal.feature.category.word.pronoun'),   // pronoun
	'Dete' => Config::get('jsreal.feature.category.word.determiner'),   // determiner
	'Ordi' => '',   // ordinal
	'Quan' => '',   // quantifier
	'Prep' => Config::get('jsreal.feature.category.word.preposition'),   // preposition
	'Punc' => '',   // punctuation
	'Adve' => Config::get('jsreal.feature.category.word.adverb'),   // adverb
	'ConC' => Config::get('jsreal.feature.category.word.conjunction'),   // coordinate conjunction
	'ConS' => Config::get('jsreal.feature.category.word.conjunction'),   // subordinate conjuntion
	'Inte' => '',   // interjection
	'Affi' => '',   // affix
	'Post' => '',   // post-head particule
	'PreH' => '',   // pre-head particle (not yet implemented.'For "miss", etc),
	'Disc' => '',   // Discourse markers (NB, PS, etc),
	'Ltre' => '',   // alphabet,
        'Bind' => ''   // binding element '-'
    ),
//    'PostType' => array(   // post-head particle type
//	'time' => '',   // follows a construction time headed (eg GMT),
//	'degr' => '',   // follows a type "unit" construction (eg 34 degree Fahrenheit),
//	'orgn' => ''   // follows a type "organisim" construction (eg Pepe et fils inc.),
//    ),
//    'VerbType' => array( // verb type
//        // EN
//        'lex' => '',   // lexical verb
//        // FR
//	'sens' => '',   // full meaning (aimer, construire),
//	'copu' => '',   // copula (sembler, paraître),
//	'auxt' => '',   // tense auxiliaries (avoir, être),
//	'saux' => '',   // tense, mode, aspect semi-auxiliaries (aller, venir de),
//	'moda' => '',   // modal (pouvoir, devoir),
//	'vopé' => '',   // operator verb (faire),
//    ),
//    'VerbSubType' => array( // /!\ a verb can have several VerbSubType
//        'tdir' => '',   // direct transitive verb (abaisser),
//        'tind' => '',   // indirect transitive verb (déroger),
//        'intr' => '',   // intransitive verb (déraper),
//        'réfl' => '',   // variable pronomial (reflexive), verb (s'exclamer),
//        'psen' => '',   // pronomial verb with "S'EN" particle (s'en aller),
//        'pinv' => '',   // invariable pronomial verb (se déplaire),
//        'paoa' => '',   // pronomial verb which accords with its object (se disputer),
//        'impe' => ''    // impersonal verb (neiger),
//    ),
//    'NomPType' => array(   // proper noun type
//        // EN
//        'pgeo' => '',   //geographical (Canada),
//        'phum' => '',   // personal names (John, Crosbie),
//        'porg' => '',   // organizations (Globe and Mail),
//        // FR
//	'nodt' => '',   // without a determiner (Montréal),
//	'wtdt' => ''    // with a determiner (la France),
//    ),
//    'NomPSubType' => array(   // proper noun subtypes
//        'pgeo' => '',   // geographical without determiner (Montréal),
//        'fam' => '',   // last name or middle name (Trudeau, etc),
//        'phum' => '',   // prénoms humains (Marie),
//        'mdle' => '',   // middle name (>>Elliott<< Trudeau),
//        'enti' => ''   // entitie (Globe and Mail),
//    ),
//    'DeteType' => array(   // determiner type
//        'dart' => '',   // article (a, an, the),
//        'dpos' => '',   // possessive deter (her, his, its, my, our, their, thy, your),
//        'ddem' => '',   // demonstrative determiner (that, these, this, those),
//        'dwdt' => ''   // WH-word (what, whate'er, whatever),
//    ),
//    'DeteStype' => array(   // determiner Sub-type
//        'détX' => '',   // unapplicable
//        'détI' => '',   // unspecified
//        'ddef' => '',   // definite (le, au, du),
//        'dind' => '',   // indefinite (un),
//        'dpps' => '',   // possessive singular (mon, ton, son),
//        'dppp' => '',   // possessive plural (notre, votre, leur),
//        'drel' => '',   // relative (quel),
//        'dint' => ''    // interrogative (quel),
//    ),
    Config::get('jsreal.feature.type.pronoun.alias') => array(   // pronoun type
        'prp' => Config::get('jsreal.feature.type.pronoun.personnal'),   // personal pronoun (he, her, hers),
        'prfl' => Config::get('jsreal.feature.type.pronoun.reflexive'),   // reflexive pronoun (herself, himself),
        'pdm' => Config::get('jsreal.feature.type.pronoun.demonstrative'),   // demonstrative pronoun (that, these this, those),
        'pid' => Config::get('jsreal.feature.type.pronoun.indefinite'),   // indefinite pronoun (another, anybody),
        'pwhr' => Config::get('jsreal.feature.type.pronoun.relative'),   // relative pronoun (that, when),
        'pwhi' => Config::get('jsreal.feature.type.pronoun.interrogative'),   // interrogative pronoun (how, what),
        'pex' => Config::get('jsreal.feature.type.pronoun.existential'),   // existential pronoun (there),
        'ppos' => Config::get('jsreal.feature.type.pronoun.possessive'),   // possessive pronoun
        'padv' => Config::get('jsreal.feature.type.pronoun.adverbial')       // adverbial pronoun
    ),
//    'PronStype' => array(   // pronoun type
//        'prnX' => '',   // unapplicable
//        'prnI' => '',   // unspecified
//        'psuj' => '',   // personal, subject (je, tu, il),
//        'poda' => '',   // personal, direct object, weak (me, te, le),
//        'poia' => '',   // personal, indirect object, weak (me, te, lui),
//        'poit' => '',   // personal, dir/ind object, strong (moi, toi, lui),
//        'prea' => '',   // personal, reflexive, weak (me, te, se),
//        'pret' => '',   // personal, reflexive, strong (moi, toi, soi),
//        'prcd' => '',   // personal, reflexive, compound, determinate (moi-même),
//        'prci' => '',   // personal, reflexive, compound, indeterminate (soi-même),
//        'ppps' => '',   // possessive, singular (mien, tien, sien),
//        'pppp' => '',   // possessive, plural (nôtre, vôtre, leur),
//        'pdem' => '',   // demonstrative (ce, celui),
//        'pdci' => '',   // demonstrative, compound, near (ceci, celui-ci),
//        'pdlà' => '',   // demonstrative, compound, far (ça, cela, celui-là),
//        'prsu' => '',   // relative, subject (qui),
//        'prod' => '',   // relative, direct object (que),
//        'proi' => '',   // relative, indirect object (qui, dont),
//        'prco' => '',   // relative, compound (lequel, auquel),
//        'prqi' => '',   // relative, question, indirect (où, quand, quoi),
//        'pisu' => '',   // interrogative, subject (qui),
//        'piod' => '',   // interrogative, direct object (que),
//        'pioi' => '',   // interrogative, indirect object (qui),
//        'pico' => '',   // interrogative, compound (lequel, auquel),
//        'piqi' => ''   // interrogative, question, dir/ind (comment, combien),
//    ),
//    'QuanCla' => array(   // quantifier class
//        'num' => '',   // numerals (two, four),
//        'frc' => '',   // fractions (one-half),
//        'cmp' => '',   // comparative (more, less),	???
//        'sup' => '',   // superlative (most, least),	??? VS Forme(Compar, Super),.
//        'ndg' => '',   // number degree (all, some),
//        'pos' => ''   // positive degree (few, many),
//    ),
//    'PrepType' => array(   // preposition type
//        'TO' => '',   // "to" infinitive
//        'RP' => ''   // adverbial particule
//    ),
//    'AdveType' => array(  // adverb type
//        'XNOT' => '',   // negation (not),
//        'nomi' => '',   // (downstairs),
//        'part' => ''   // particule (back),
//    ),
//    'ConCType' => array(   // preposition type
//        'Dble' => ''  // (both..and, either..or),
//    ),
//    'AbbrCla' => array(   // abbreviation Class
//        'MD' => '',   // discourse particle (NB, eg),
//        'PT' => ''   // problematic word (Celsius, BC),
//    ),
//    'Typo' => array(   // typography
//        'cap' => ''   // begin by a capital letter
//    ),
//    'PuncType' => array(   // punctuation mark:
//        'pcst' => '',   // full-stop (.),
//        'pccm' => '',   // comma (,),
//        'pcsc' => '',   // semicolon',   //),
//        'pcco' => '',   // colon (:),
//        'pcql' => '',   // left quote (``),
//        'pcqr' => '',   // right quote ''),
//        'pcpl' => '',   // left paren [(]
//        'pcpr' => '',   // right paren [),]
//        'pcda' => '',   // dash (-),
//        'pcdd' => '',   // dots (...),
//        'pcsl' => ''   // slash (/),
//    ),
    Config::get('jsreal.feature.tense.alias') => array(  // verb tense
        // EN
        'BSE' => Config::get('jsreal.feature.tense.base'),   // base form
        'PAST' => Config::get('jsreal.feature.tense.indicative.past'),   // past form
        'PRES' => Config::get('jsreal.feature.tense.indicative.present'),   // present form
        'PRP' => Config::get('jsreal.feature.tense.participle.present'),   // present participle
        'PSP' => Config::get('jsreal.feature.tense.participle.past'),   // past participle
        // FR
	'TempsX' => '',   // unapplicable
	'TempsI' => '',   // unspecified
	'InfPré' => '',   // infinitive present (aimer),
	'IndPré' => Config::get('jsreal.feature.tense.indicative.present'),   // indicative present (j'aime),
	'IndImp' => Config::get('jsreal.feature.tense.indicative.imperfect'),   // indicative imperfect (j'aimais),
	'IndPas' => Config::get('jsreal.feature.tense.indicative.simple_past'),   // indicative simple past (j'aimai),
	'IndFut' => Config::get('jsreal.feature.tense.indicative.simple_future'),   // indicative simple future (j'aimerai),
	'SubPré' => '',   // subjuntive present (que j'aime),
	'SubImp' => '',   // subjunctive imperfect (que j'aimasse),
	'ImpPré' => '',   // imperative present (aime),
	'ConPré' => '',   // conditional present (j'aimerais),
	'ParPré' => '',   // present participle (aimant),
	'AdjVer' => '',   // verbal adjective (aimant, aimante),
	'ParPas' => '',   // past participle (aimé, aimée),
	'IndPac' => '',   // indicative compound past (j'ai aimé),
	'IndPqp' => '',   // indicative perfect (j'avais aimé),
	'IndPaa' => '',   // indicative anterior past (j'eus aimé),
	'IndFua' => '',   // indicative anterior future (j'aurai aimé),
	'SubPas' => '',   // subjunctive past que (j'aie aimé),
	'SubPqp' => '',   // subjunctive perfect que (j'eusse aimé),
	'ImpPas' => '',   // imperative past (aie aimé),
	'ConPa1' => '',   // conditional past, form 1'(j'aurais aimé),
	'ConPa2' => '',   // conditional past, form 2 (j'eusse aimé),
	'InfPas' => '',   // infinitive past (avoir aimé),
	'ParPac' => ''   // compound past participle (ayant aimé),
    ),
//    'VerbAux' => array(   // verb compound tense auxiliaries
//        'ax' => '',   // unapplicable (bienvenir),
//        'ai' => '',   // unspecified
//        'av' => '',   // takes avoir (admirer),
//        'êt' => '',   // takes être (advenir),
//        'aê' => ''   // takes both avoir and être (échouer),
//    ),
    Config::get('jsreal.feature.gender.alias') => array(   // grammatical gender
	'genX' => Config::get('jsreal.feature.gender.unapplicable'),   // unapplicable (quoi),
	'genI' => Config::get('jsreal.feature.gender.unspecified'),   // unspecified
	'masc' => Config::get('jsreal.feature.gender.masculine'),   // masculine (homme),
	'femi' => Config::get('jsreal.feature.gender.feminine'),   // feminine (table),
        'neut' => Config::get('jsreal.feature.gender.neuter'),   // neuter
        'gmfn' => Config::get('jsreal.feature.gender.either'),   // masculine, feminine or masculine
        'mafe' => Config::get('jsreal.feature.gender.either')   // masculine or feminine
    ),
    Config::get('jsreal.feature.number.alias') => array(   // grammatical number
        'nomX' => Config::get('jsreal.feature.number.unapplicable'),   // unapplicable (aimer),
        'nomI' => Config::get('jsreal.feature.number.unspecified'),   // unspecified
        'sing' => Config::get('jsreal.feature.number.singular'),   // singular (homme) (he),
        'plur' => Config::get('jsreal.feature.number.plural'),  // plural (alentours) (they),
        'sgpl' => Config::get('jsreal.feature.number.either')   // singular or plural
    ),
    Config::get('jsreal.feature.person.alias') => array(   // person
	'pX' => Config::get('jsreal.feature.person.unapplicable'),   // unapplicable (celui-ci),
	'pI' => Config::get('jsreal.feature.person.unspecified'),   // unspecified
	'p1' => Config::get('jsreal.feature.person.p1'),   // 1st (je, mon) / 1st (we, my),
	'p2' => Config::get('jsreal.feature.person.p2'),   // 2nd (vous, ton) / 2nd (you, your),
	'p3' => Config::get('jsreal.feature.person.p3')   // 3rd (elles, son) / 3rd (they, its),
    ),
//    'QuanType' => array(   // quantifier type
//	'qdef' => '',   // definite (dix, dix-sept),
//	'qind' => ''   // indefinite (certain, plusieurs),
//    ),
//    'QuanPos' => array(   // quantifier position
//        'SAhn' => '',   // QT after head-noun (Construction "Dete Head-Noun Q") / After Head-Noun ( NomC QT ),
//        'SPdt' => '',   // pre-determiner (Q pre-mod un Qdef "Q Det N") / QT Pre-DeTerminer (QT Dete NomC),
//        'SPhn' => '',   // pre head-noun (Q comparatif pre-mod Nom) / QT-comparatif Pre-modifiant un Head-Noun
//        'SPjr' => '',   // pre-adjectival-adverbial (Q comparatif pre-mod Adj | Adv) / QT Pre-modifiant un [AdjQ | Adve | Quan] comparatif
//        'SPqt' => '',   // pre-quantifier (Q pre-mod un Q | Adj | Adv comparatif) / QT-comparatif Pre-modifiant un [AdjQ | Adve]
//        'Sprn' => '',   // pronoun (Q sujet ou objet du Verbe) / QT PRoNoun position
//        'Sdet' => '',   // determiner (Q plutot qu'un Art def) / QT DETerminer ( QT au-lieu-de Dete_dart_def ),
//        'Sh_n' => '',   // head-noun-de (Construction "Q de X" et "Dete Q") / QT Head-Noun position
//        'Sord' => ''   // ordinal (Qind plutot qu'un ordinal) / QT ORDdinal (QT au-lieu-de Ordi),
//    ),
//    'Cas' => array(   // case
//        'cno' => '',   // nominative or objective
//        'gen' => '',   // genitive
//        'ngo' => '',   // nominative, objective or genitive
//        'nom' => '',   // nominative
//        'obj' => ''   // objective
//    ),
//    'posi' => array(   // adjective distribution
//        'posU' => '',   // position unknown
//        'attr' => '',   // attributive
//        'pred' => '',   // predicative
//        'atpr' => ''   // attributive or predicative
//    ),
    Config::get('jsreal.feature.form.alias') => array(   // 
        'Compar' => Config::get('jsreal.feature.form.comparative'),   // comparative form
        'Super' => Config::get('jsreal.feature.form.superlative')   // superlative form
    ),
//    'Typ' => array(   // type
//        'def' => '',   // definite
//        'ind' => ''   // indefinite
//    ),
//    'Str' => array(   // string
//        'car' => ''   // caracter (four, fifth),
//    ),
//    'Join' => array(   // join by
//        'hyphen' => ''   // an hyphen
//    ),
//    'cnt' => array(   // count
//        'yes' => '',   // yes
//        'no' => '',   // no
//        'both' => ''  // both yes and no
//    ),
    Config::get('jsreal.feature.owner.alias') => array(   // owner
        'osp' => Config::get('jsreal.feature.owner.either'),   // singular or plural
        'plu' => Config::get('jsreal.feature.owner.plural'),   // plural
        'sng' => Config::get('jsreal.feature.owner.singular')   // singular
    ),
//    'arg' => array(   // syntactical argument
//        'ArgX' => '',    // unapplicable
//        'intr' => '',    // intransitive
//        'trans' => '',   // transitive
//        'trin' => ''     // transitive and intransitive
//    ),
//    'Ref' => array(   // refer to
//        'bh' => '',   // somebody or something
//        'rb' => '',   // adverbial (time, maner, cause),
//        'sb' => '',   // somebody
//        'sh' => ''    // something
//    ),
//    'Nbc' => array(   // combines with a noun which is
//        'c+u' => '',   // count or uncount
//        'cnt' => '',   // count
//        'unc' => ''    // uncount
//    ),
//    'ElisionType' => array(   // elision category
//	'éliX' => '',   // unapplicable
//	'éliI' => '',   // unspecified
//	'étee' => '',   // e' -> '''(l'homme, s'abstenir),
//	'étce' => '',   // ce'-> cet'(cet homme, ce garçon),
//	'étsi' => '',   // si'-> s'' (s'il pense, si je pense),
//	'étla' => '',   // la'-> l'' (l'amie, il l'approuve),
//	'étma' => '',   // ma'-> mon'(ma bouche, mon oreille),
//	'éeau' => '',   // eau -> el' (un nouvel amour),
//	'éeux' => '',   // eux -> eil'(un vieil homme),
//	'étou' => ''    // ou'-> ol' (un fol espoir),
//    ),
//    'Elider' => array(   // word which causes elision (homme),
//        'méd' => ''
//    ),
//    'Elidee' => array(   // word in which elision has occurred (l'),
//	'mér' => ''
//    ),
//    'Contraction' => array(  // pronoun/determiner contraction class
//            'conX' => '',   // unapplicable (lesquels),
//            'conI' => '',   // unspecified
//            'coau' => '',   // au contraction (auxquels),
//            'codu' => '',   // du contraction (desquels),
//    ),
//    'Allograph' => array(   // words with alternate spellings (bizut, bizuth),
//            'all' => ''
//    ),
//    'Expression	' => array(   // expressions (chemin de fer),
//            'loc' => ''
//    ),
//    'Composite' => array(   // composite words (abat-jour),
//            'com' => ''
//    ),
//    'GraphType' => array(   // abbreviation type
//            'abbr' => '',   // abbreviation
//            'init' => '',   // initial (Piere >>E.<< Trudeau),
//            'acro' => '',   // acronym
//            'mltw' => '',   // multi-word (Amnesty International, Globe and Mail, etc),
//            'lbl' => ''     // non alphabetical post noun weirdos (Bill >>C-123<<),
//    )
);