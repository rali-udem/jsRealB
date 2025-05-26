export {initSUD}

const initSUD =`
# sent_id = fr-ud-dev_01485
# text = Les produits échangés sont essentiellement du sel, de l'ambre, de l'huile, des céréales, du vin et de la viande salée.
1	Les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	2	det	_	wordform=les
2	produits	produit	NOUN	_	Gender=Masc|Number=Plur	4	subj	_	_
3	échangés	échanger	VERB	_	Gender=Masc|Number=Plur|Tense=Past|VerbForm=Part	2	mod	_	_
4	sont	être	AUX	_	Mood=Ind|Number=Plur|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	_
5	essentiellement	essentiellement	ADV	_	_	4	mod	_	_
6	du	du	DET	_	Definite=Ind|Gender=Masc|Number=Sing|PronType=Art|Shared=No	7	det	_	_
7	sel	sel	NOUN	_	Gender=Masc|Number=Sing	4	comp:pred	_	SpaceAfter=No
8	,	,	PUNCT	_	_	11	punct	_	_
9	de	de	ADP	_	_	11	det	_	ExtPos=DET|Idiom=Yes
10	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	9	unk	_	InIdiom=Yes|SpaceAfter=No
11	ambre	ambre	NOUN	_	Gender=Masc|Number=Sing	7	conj	_	SpaceAfter=No
12	,	,	PUNCT	_	_	15	punct	_	_
13	de	de	ADP	_	_	15	det	_	ExtPos=DET|Idiom=Yes
14	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	13	unk	_	InIdiom=Yes|SpaceAfter=No
15	huile	huile	NOUN	_	Gender=Fem|Number=Sing	11	conj	_	SpaceAfter=No
16	,	,	PUNCT	_	_	18	punct	_	_
17	des	un	DET	_	Definite=Ind|Number=Plur|PronType=Art	18	det	_	_
18	céréales	céréale	NOUN	_	Gender=Fem|Number=Plur	15	conj	_	SpaceAfter=No
19	,	,	PUNCT	_	_	21	punct	_	_
20	du	du	DET	_	Definite=Ind|Gender=Masc|Number=Sing|PronType=Art	21	det	_	_
21	vin	vin	NOUN	_	Gender=Masc|Number=Sing	18	conj	_	_
22	et	et	CCONJ	_	_	25	cc	_	_
23	de	de	ADP	_	_	25	det	_	ExtPos=DET|Idiom=Yes
24	la	le	DET	_	Definite=Def|Gender=Fem|Number=Sing|PronType=Art	23	unk	_	InIdiom=Yes
25	viande	viande	NOUN	_	Gender=Fem|Number=Sing	21	conj	_	_
26	salée	saler	VERB	_	Gender=Fem|Number=Sing|Tense=Past|VerbForm=Part	25	mod	_	SpaceAfter=No
27	.	.	PUNCT	_	_	4	punct	_	_

# sent_id = fr-ud-test_00033
# text = Le royaume s'est amélioré, mais pas dans le sens voulu par l'UE.
1	Le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	2	det	_	wordform=le
2	royaume	royaume	NOUN	_	Gender=Masc|Number=Sing|Shared=Yes	4	subj	_	_
3	s'	se	PRON	_	Person=3|PronType=Prs|Reflex=Yes	5	comp@pass	_	SpaceAfter=No
4	est	être	AUX	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	_
5	amélioré	améliorer	VERB	_	Gender=Masc|Number=Sing|Tense=Past|VerbForm=Part	4	comp:aux@tense	_	SpaceAfter=No
6	,	,	PUNCT	_	_	9	punct	_	_
7	mais	mais	CCONJ	_	_	9	cc	_	_
8	pas	pas	ADV	_	Polarity=Neg	9	mod	_	_
9	dans	dans	ADP	_	_	4	conj	_	_
10	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	11	det	_	_
11	sens	sens	NOUN	_	Gender=Masc|Number=Sing	9	comp:obj	_	_
12	voulu	vouloir	VERB	_	Gender=Masc|Number=Sing|Tense=Past|VerbForm=Part	11	mod	_	_
13	par	par	ADP	_	_	12	comp:obl@agent	_	_
14	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	15	det	_	SpaceAfter=No
15	UE	UE	PROPN	_	Number=Sing	13	comp:obj	_	SpaceAfter=No
16	.	.	PUNCT	_	_	4	punct	_	_

# sent_id = fr-ud-test_00037
# text = Comme dans toutes les campagnes présidentielles, celui qui imprimera sa marque, fixera l'agenda, sera le probable vainqueur en mai.
1	Comme	comme	SCONJ	_	_	18	mod	_	wordform=comme
2	dans	dans	ADP	_	_	1	comp:obj	_	_
3	toutes	tout	ADJ	_	Gender=Fem|Number=Plur	5	mod	_	_
4	les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	5	det	_	_
5	campagnes	campagne	NOUN	_	Gender=Fem|Number=Plur	2	comp:obj	_	_
6	présidentielles	présidentiel	ADJ	_	Gender=Fem|Number=Plur	5	mod	_	SpaceAfter=No
7	,	,	PUNCT	_	_	1	punct	_	_
8	celui	celui	PRON	_	Gender=Masc|Number=Sing|Person=3|PronType=Dem	18	subj	_	_
9	qui	qui	PRON	_	PronType=Rel|Shared=Yes	10	subj	_	_
10	imprimera	imprimer	VERB	_	Mood=Ind|Number=Sing|Person=3|Tense=Fut|VerbForm=Fin	8	mod@relcl	_	_
11	sa	son	DET	_	Gender=Fem|Number=Sing|Number[psor]=Sing|Person[psor]=3|PronType=Prs	12	det	_	_
12	marque	marque	NOUN	_	Gender=Fem|Number=Sing	10	comp:obj	_	SpaceAfter=No
13	,	,	PUNCT	_	_	14	punct	_	_
14	fixera	fixer	VERB	_	Mood=Ind|Number=Sing|Person=3|Tense=Fut|VerbForm=Fin	10	conj	_	_
15	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	16	det	_	SpaceAfter=No
16	agenda	agenda	NOUN	_	Gender=Masc|Number=Sing	14	comp:obj	_	SpaceAfter=No
17	,	,	PUNCT	_	_	8	punct	_	_
18	sera	être	AUX	_	Mood=Ind|Number=Sing|Person=3|Tense=Fut|VerbForm=Fin	0	root	_	_
19	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	21	det	_	_
20	probable	probable	ADJ	_	Gender=Masc|Number=Sing	21	mod	_	_
21	vainqueur	vainqueur	NOUN	_	Gender=Masc|Number=Sing	18	comp:pred	_	_
22	en	en	ADP	_	_	18	mod	_	_
23	mai	mai	NOUN	_	Gender=Masc|Number=Sing	22	comp:obj	_	SpaceAfter=No
24	.	.	PUNCT	_	_	18	punct	_	_

# sent_id = fr-ud-test_00021
# text = Ce qui transparaît dans tous ces textes est l'espoir et les rêves d'un peuple et de ses enfants.
1	Ce	ce	PRON	_	Gender=Masc|Number=Sing|Person=3|PronType=Dem	8	subj	_	wordform=ce
2	qui	qui	PRON	_	PronType=Rel	3	subj	_	_
3	transparaît	transparaître	VERB	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	1	mod@relcl	_	_
4	dans	dans	ADP	_	_	3	mod	_	_
5	tous	tout	ADJ	_	Gender=Masc|Number=Plur	7	mod	_	_
6	ces	ce	DET	_	Number=Plur|PronType=Dem	7	det	_	_
7	textes	texte	NOUN	_	Gender=Masc|Number=Plur	4	comp:obj	_	_
8	est	être	AUX	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	_
9	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art|Shared=No	10	det	_	SpaceAfter=No
10	espoir	espoir	NOUN	_	Gender=Masc|Number=Sing	8	comp:pred	_	_
11	et	et	CCONJ	_	_	13	cc	_	_
12	les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	13	det	_	_
13	rêves	rêve	NOUN	_	Gender=Masc|Number=Plur	10	conj	_	_
14	d'	de	ADP	_	Shared=Yes	13	udep	_	SpaceAfter=No
15	un	un	DET	_	Definite=Ind|Gender=Masc|Number=Sing|PronType=Art	16	det	_	_
16	peuple	peuple	NOUN	_	Gender=Masc|Number=Sing	14	comp:obj	_	_
17	et	et	CCONJ	_	_	18	cc	_	_
18	de	de	ADP	_	_	14	conj	_	_
19	ses	son	DET	_	Number=Plur|Number[psor]=Sing|Person[psor]=3|Poss=Yes|PronType=Prs	20	det	_	_
20	enfants	enfant	NOUN	_	Number=Plur	18	comp:obj	_	SpaceAfter=No
21	.	.	PUNCT	_	_	8	punct	_	_

`