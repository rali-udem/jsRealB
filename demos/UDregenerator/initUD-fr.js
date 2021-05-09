var initUD=
`# file = fr/fr_gsd-ud-test.conllu
# sent_id = fr-ud-dev_01485
# text = Les produits échangés sont essentiellement du sel, de l'ambre, de l'huile, des céréales, du vin et de la viande salée.
# gl = OK
1	Les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	2	det	_	wordform=les
2	produits	produit	NOUN	_	Gender=Masc|Number=Plur	8	nsubj	_	_
3	échangés	échanger	VERB	_	Gender=Masc|Number=Plur|Tense=Past|VerbForm=Part	2	acl	_	_
4	sont	être	AUX	_	Mood=Ind|Number=Plur|Person=3|Tense=Pres|VerbForm=Fin	8	cop	_	_
5	essentiellement	essentiellement	ADV	_	_	8	advmod	_	_
6-7	du	_	_	_	_	_	_	_	_
6	de	de	ADP	_	_	8	det	_	ExtPos=DET|PhraseType=Idiom
7	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	6	fixed	_	_
8	sel	sel	NOUN	_	Gender=Masc|Number=Sing	0	root	_	SpaceAfter=No
9	,	,	PUNCT	_	_	12	punct	_	_
10	de	de	ADP	_	_	12	det	_	ExtPos=DET|PhraseType=Idiom
11	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	10	fixed	_	SpaceAfter=No
12	ambre	ambre	NOUN	_	Gender=Masc|Number=Sing	8	conj	_	SpaceAfter=No
13	,	,	PUNCT	_	_	16	punct	_	_
14	de	de	ADP	_	_	16	det	_	ExtPos=DET|PhraseType=Idiom
15	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	14	fixed	_	SpaceAfter=No
16	huile	huile	NOUN	_	Gender=Fem|Number=Sing	8	conj	_	SpaceAfter=No
17	,	,	PUNCT	_	_	20	punct	_	_
18-19	des	_	_	_	_	_	_	_	_
18	de	de	ADP	_	_	20	det	_	ExtPos=DET|PhraseType=Idiom
19	les	le	DET	_	Definite=Def|Gender=Masc|Number=Plur|PronType=Art	18	fixed	_	_
20	céréales	céréale	NOUN	_	Gender=Fem|Number=Plur	8	conj	_	SpaceAfter=No
21	,	,	PUNCT	_	_	24	punct	_	_
22-23	du	_	_	_	_	_	_	_	_
22	de	de	ADP	_	_	24	det	_	ExtPos=DET|PhraseType=Idiom
23	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	22	fixed	_	_
24	vin	vin	NOUN	_	Gender=Masc|Number=Sing	8	conj	_	_
25	et	et	CCONJ	_	_	28	cc	_	_
26	de	de	ADP	_	_	28	det	_	ExtPos=DET|PhraseType=Idiom
27	la	le	DET	_	Definite=Def|Gender=Fem|Number=Sing|PronType=Art	26	fixed	_	_
28	viande	viande	NOUN	_	Gender=Fem|Number=Sing	8	conj	_	_
29	salée	saler	VERB	_	Gender=Fem|Number=Sing|Tense=Past|VerbForm=Part	28	acl	_	SpaceAfter=No
30	.	.	PUNCT	_	_	8	punct	_	_

# file = fr/fr_pud-ud-test.conllu
# sent_id = n01095004
# text = De notre temps, il n’y en avait aucun, et les gens sans enfants manifestaient leur propre désapprobation et, par conséquence, leur haine, des parents modernes.
# gl = ouf, à revoir car l'ordre est bizarre et Pers=1 n'a pas été pris en compte
1	De	de	ADP	IN	_	3	case	_	wordform=de
2	notre	son	DET	DTP$	Gender=Masc|Number=Sing|Number[psor]=Plur|Person=1|Poss=Yes|PronType=Prs	3	det	_	_
3	temps	temps	NOUN	NN	Gender=Masc|Number=Sing	9	obl	_	SpaceAfter=No
4	,	,	PUNCT	,	_	3	punct	_	_
5	il	il	PRON	PRP	Gender=Masc|Number=Sing|Person=3	9	expl:subj	_	_
6	n’	ne	ADV	RB	Polarity=Neg	9	advmod	_	SpaceAfter=No|wordform=n'
7	y	y	PRON	PRP	Person=3	9	obl	_	_
8	en	en	PRON	PRP	Person=3	9	iobj	_	_
9	avait	avoir	VERB	VBC	Mood=Ind|Number=Sing|Person=3|Tense=Imp|VerbForm=Fin	0	root	_	_
10	aucun	aucun	DET	_	Gender=Masc|Number=Sing|Polarity=Neg|PronType=Neg	9	obj	_	SpaceAfter=No
11	,	,	PUNCT	,	_	17	punct	_	_
12	et	et	CCONJ	CC	_	17	cc	_	_
13	les	le	DET	DT	Gender=Masc|Number=Plur	14	det	_	_
14	gens	gens	NOUN	NN	Gender=Masc|Number=Plur	17	nsubj	_	_
15	sans	sans	ADP	IN	_	16	case	_	_
16	enfants	enfant	NOUN	NN	Gender=Masc|Number=Plur	14	nmod	_	_
17	manifestaient	manifester	VERB	VBC	Mood=Ind|Number=Plur|Person=3|Tense=Imp|VerbForm=Fin	9	conj	_	_
18	leur	son	DET	DTP$	Gender=Fem|Number=Sing|Number[psor]=Plur|Person=3|Poss=Yes|PronType=Prs	20	det	_	_
19	propre	propre	ADJ	JJ	Gender=Fem|Number=Sing	20	amod	_	_
20	désapprobation	désapprobation	NOUN	NN	Gender=Fem|Number=Sing	17	obj	_	_
21	et	et	CCONJ	CC	_	27	cc	_	SpaceAfter=No
22	,	,	PUNCT	,	_	23	punct	_	_
23	par	par	ADP	IN	_	27	advmod	_	_
24	conséquence	conséquence	NOUN	NN	Gender=Fem|Number=Sing	23	fixed	_	SpaceAfter=No
25	,	,	PUNCT	,	_	23	punct	_	_
26	leur	son	DET	DTP$	Gender=Fem|Number=Sing|Number[psor]=Plur|Person=3|Poss=Yes|PronType=Prs	27	det	_	_
27	haine	haine	NOUN	NN	Gender=Fem|Number=Sing	20	conj	_	SpaceAfter=No
28	,	,	PUNCT	,	_	31	punct	_	_
29	de	de	ADP	INDT	_	31	case	_	_
30	les	le	DET	_	Gender=Masc|Number=Plur	31	det	_	_
31	parents	parent	NOUN	NN	Gender=Masc|Number=Plur	20	nmod	_	_
32	modernes	moderne	ADJ	JJ	Gender=Masc|Number=Plur	31	amod	_	SpaceAfter=No
33	.	.	PUNCT	.	_	9	punct	_	_

# file = fr/fr_sequoia-ud-test.conllu
# sent_id = frwiki_50.1000_00293
# text = Dans la pratique, la direction du G.O. (le Conseil de l'Ordre) fait passer une circulaire aux vénérables maîtres (présidents) de chaque loge de cette obédience pour leur demander de rassembler à leur niveau le plus d'informations possibles sur les officiers des garnisons de leurs villes ou départements.
# gl = à vérifier, plusieurs problèmes avec les pronoms
1	Dans	dans	ADP	_	_	3	case	_	_
2	la	le	DET	_	Definite=Def|Gender=Fem|Number=Sing|PronType=Art	3	det	_	_
3	pratique	pratique	NOUN	_	Gender=Fem|Number=Sing	18	obl:mod	_	SpaceAfter=No
4	,	,	PUNCT	_	_	18	punct	_	_
5	la	le	DET	_	Definite=Def|Gender=Fem|Number=Sing|PronType=Art	6	det	_	_
6	direction	direction	NOUN	_	Gender=Fem|Number=Sing	18	nsubj:caus	_	_
7	de	de	ADP	_	_	9	case	_	_
8	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	9	det	_	_
9	G.O.	G.O.	PROPN	_	_	6	nmod	_	_
10	(	(	PUNCT	_	_	6	punct	_	SpaceAfter=No
11	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	12	det	_	_
12	Conseil	conseil	NOUN	_	Gender=Masc|Number=Sing	6	appos	_	_
13	de	de	ADP	_	_	15	case	_	_
14	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	15	det	_	SpaceAfter=No
15	Ordre	ordre	NOUN	_	Gender=Masc|Number=Sing	12	nmod	_	SpaceAfter=No
16	)	)	PUNCT	_	_	6	punct	_	_
17	fait	faire	AUX	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	18	aux:caus	_	_
18	passer	passer	VERB	_	VerbForm=Inf	0	root	_	_
19	une	un	DET	_	Definite=Ind|Gender=Fem|Number=Sing|PronType=Art	20	det	_	_
20	circulaire	circulaire	NOUN	_	Gender=Fem|Number=Sing	18	obj	_	_
21	à	à	ADP	_	_	24	case	_	_
22	les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	24	det	_	_
23	vénérables	vénérable	ADJ	_	Number=Plur	24	amod	_	_
24	maîtres	maître	NOUN	_	Gender=Masc|Number=Plur	18	obl:arg	_	_
25	(	(	PUNCT	_	_	24	punct	_	SpaceAfter=No
26	présidents	président	NOUN	_	Gender=Masc|Number=Plur	24	appos	_	SpaceAfter=No
27	)	)	PUNCT	_	_	24	punct	_	_
28	de	de	ADP	_	_	30	case	_	_
29	chaque	chaque	DET	_	Number=Sing	30	det	_	_
30	loge	loge	NOUN	_	Gender=Fem|Number=Sing	24	nmod	_	_
31	de	de	ADP	_	_	33	case	_	_
32	cette	ce	DET	_	Gender=Fem|Number=Sing|PronType=Dem	33	det	_	_
33	obédience	obédience	NOUN	_	Gender=Fem|Number=Sing	30	nmod	_	_
34	pour	pour	ADP	_	_	36	mark	_	_
35	leur	lui	PRON	_	Number=Plur|Person=3	36	iobj	_	_
36	demander	demander	VERB	_	VerbForm=Inf	18	advcl	_	_
37	de	de	ADP	_	_	38	mark	_	_
38	rassembler	rassembler	VERB	_	VerbForm=Inf	36	xcomp	_	_
39	à	à	ADP	_	_	41	case	_	_
40	leur	son	DET	_	Number=Sing|Poss=Yes	41	det	_	_
41	niveau	niveau	NOUN	_	Gender=Masc|Number=Sing	38	obl:mod	_	_
42	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	45	det	_	_
43	plus	plus	ADV	_	_	42	advmod	_	_
44	d'	de	ADP	_	_	43	fixed	_	SpaceAfter=No
45	informations	information	NOUN	_	Gender=Fem|Number=Plur	38	obj	_	_
46	possibles	possible	ADJ	_	Number=Plur	45	amod	_	_
47	sur	sur	ADP	_	_	49	case	_	_
48	les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	49	det	_	_
49	officiers	officier	NOUN	_	Number=Plur	45	nmod	_	_
50	de	de	ADP	_	_	52	case	_	_
51	les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	52	det	_	_
52	garnisons	garnison	NOUN	_	Gender=Fem|Number=Plur	49	nmod	_	_
53	de	de	ADP	_	_	55	case	_	_
54	leurs	son	DET	_	Number=Plur|Poss=Yes	55	det	_	_
55	villes	ville	NOUN	_	Gender=Fem|Number=Plur	52	nmod	_	_
56	ou	ou	CCONJ	_	_	57	cc	_	_
57	départements	département	NOUN	_	Gender=Masc|Number=Plur	55	conj	_	SpaceAfter=No
58	.	.	PUNCT	_	_	18	punct	_	_

# file = fr/fr_pud-ud-test.conllu
# newdoc id = n02040
# sent_id = n02040023
# text = C’est parce que chaque miracle et chaque zone spécialisée occupent un domaine entier.
# text_en = That is because each and every miracle and each specialized district occupies an entire field.
1	C’	ce	PRON	PDEM	_	2	expl:subj	_	SpaceAfter=No|wordform=c'
2	est	être	VERB	VBC	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	_
3	parce	parce	ADV	IN	_	11	mark	_	_
4	que	que	SCONJ	IN	_	3	fixed	_	_
5	chaque	chaque	ADJ	JJ	Gender=Masc|Number=Sing	6	amod	_	_
6	miracle	miracle	NOUN	NN	Gender=Masc|Number=Sing	11	nsubj	_	_
7	et	et	CCONJ	CC	_	9	cc	_	_
8	chaque	chaque	ADJ	JJ	Gender=Fem|Number=Sing	9	amod	_	_
9	zone	zone	NOUN	NN	Gender=Fem|Number=Sing	6	conj	_	_
10	spécialisée	spécialisé	ADJ	JJ	Gender=Fem|Number=Sing	9	amod	_	_
11	occupent	occuper	VERB	VBC	Mood=Ind|Number=Plur|Person=3|Tense=Pres|VerbForm=Fin	2	ccomp	_	_
12	un	un	DET	DT	Gender=Masc|Number=Sing	13	det	_	_
13	domaine	domaine	NOUN	NN	Gender=Masc|Number=Sing	11	obj	_	_
14	entier	entier	ADJ	JJ	Gender=Masc|Number=Sing	13	amod	_	SpaceAfter=No
15	.	.	PUNCT	.	_	2	punct	_	_

# file = fr/fr_gsd-ud-test.conllu
# sent_id = fr-ud-test_00050
# text = Lors du dernier rapport publié par le ministère de l'écologie, il s'avère que l'état de nos cours d'eau ne soit pas si brillant que ça.
1	Lors	lors	ADV	_	_	16	advmod	_	wordform=lors
2-3	du	_	_	_	_	_	_	_	_
2	de	de	ADP	_	_	5	case	_	_
3	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	5	det	_	_
4	dernier	dernier	ADJ	_	Gender=Masc|Number=Sing	5	amod	_	_
5	rapport	rapport	NOUN	_	Gender=Masc|Number=Sing	1	obl:arg	_	_
6	publié	publier	VERB	_	Gender=Masc|Number=Sing|Tense=Past|VerbForm=Part	5	acl	_	_
7	par	par	ADP	_	_	9	case	_	_
8	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	9	det	_	_
9	ministère	ministère	NOUN	_	Gender=Masc|Number=Sing	6	obl:agent	_	_
10	de	de	ADP	_	_	12	case	_	_
11	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	12	det	_	SpaceAfter=No
12	écologie	écologie	NOUN	_	Gender=Fem|Number=Sing	9	nmod	_	SpaceAfter=No
13	,	,	PUNCT	_	_	1	punct	_	_
14	il	il	PRON	_	Gender=Masc|Number=Sing|Person=3|PronType=Prs	16	nsubj	_	_
15	s'	se	PRON	_	Person=3|PronType=Prs	16	dep:comp	_	SpaceAfter=No
16	avère	avérer	VERB	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	_
17	que	que	SCONJ	_	_	29	mark	_	_
18	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	19	det	_	SpaceAfter=No
19	état	état	NOUN	_	Gender=Masc|Number=Sing	29	nsubj	_	_
20	de	de	ADP	_	_	22	case	_	_
21	nos	son	DET	_	Number=Plur|PossNumber=Plur|PossPerson=1|PronType=Prs	22	det	_	_
22	cours	cours	NOUN	_	Gender=Masc|Number=Plur	19	nmod	_	_
23	d'	de	ADP	_	_	24	case	_	SpaceAfter=No
24	eau	eau	NOUN	_	Gender=Fem|Number=Sing	22	nmod	_	_
25	ne	ne	ADV	_	Polarity=Neg	29	advmod	_	_
26	soit	être	AUX	_	Mood=Sub|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	29	cop	_	_
27	pas	pas	ADV	_	Polarity=Neg	29	advmod	_	_
28	si	si	ADV	_	_	29	advmod	_	_
29	brillant	brillant	ADJ	_	Gender=Masc|Number=Sing	16	ccomp:obj	_	_
30	que	que	SCONJ	_	_	31	case	_	_
31	ça	ça	PRON	_	Gender=Masc|Number=Sing|Person=3|PronType=Dem	28	obj	_	SpaceAfter=No
32	.	.	PUNCT	_	_	16	punct	_	_

`;
