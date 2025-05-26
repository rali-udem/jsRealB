export {initUD}

const initUD =
// UD version
`
# text = Je vais lui prêter tes livres quand tu seras prêt.
# sent_id = 5
1	Je	moi	PRON	_	Emph=No|Number=Sing|Person=1|PronType=Prs	2	nsubj	_	start_char=0|end_char=2
2	vais	aller	VERB	_	Mood=Ind|Number=Sing|Person=1|Tense=Pres|VerbForm=Fin	0	root	_	start_char=3|end_char=7
3	lui	lui	PRON	_	Emph=No|Gender=Masc|Number=Sing|Person=3|PronType=Prs	4	iobj	_	start_char=8|end_char=11
4	prêter	prêter	VERB	_	VerbForm=Inf	2	xcomp	_	start_char=12|end_char=18
5	tes	son	DET	_	Number=Plur|Number[psor]=Sing|Person[psor]=2|Poss=Yes|PronType=Prs	6	det	_	start_char=19|end_char=22
6	livres	livre	NOUN	_	Gender=Masc|Number=Plur	4	obj	_	start_char=23|end_char=29
7	quand	quand	SCONJ	_	_	10	mark	_	start_char=30|end_char=35
8	tu	toi	PRON	_	Emph=No|Number=Sing|Person=2|PronType=Prs	10	nsubj	_	start_char=36|end_char=38
9	seras	être	AUX	_	Mood=Ind|Number=Sing|Person=2|Tense=Fut|VerbForm=Fin	10	cop	_	start_char=39|end_char=44
10	prêt	prêt	ADJ	_	Gender=Masc|Number=Sing	4	advcl	_	start_char=45|end_char=49|SpaceAfter=No
11	.	.	PUNCT	_	_	2	punct	_	start_char=49|end_char=50|SpacesAfter=\n

# text = Les souris n’ont pas de bras, elles ont des pattes.
# sent_id = 94
1	Les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	2	det	_	start_char=0|end_char=3
2	souris	souris	NOUN	_	Gender=Fem|Number=Plur	4	nsubj	_	start_char=4|end_char=10
3	n’	ne	ADV	_	Polarity=Neg	4	advmod	_	start_char=11|end_char=13
4	ont	avoir	VERB	_	Mood=Ind|Number=Plur|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	start_char=13|end_char=16
5	pas	pas	ADV	_	Polarity=Neg	4	advmod	_	start_char=17|end_char=20
6	de	un	DET	_	Definite=Ind|Number=Sing|PronType=Art	7	det	_	start_char=21|end_char=23
7	bras	bras	NOUN	_	Gender=Masc|Number=Sing	4	obj	_	start_char=24|end_char=28
8	,	,	PUNCT	_	_	10	punct	_	start_char=28|end_char=29
9	elles	il	PRON	_	Gender=Fem|Number=Plur|Person=3|PronType=Prs	10	nsubj	_	start_char=30|end_char=35
10	ont	avoir	VERB	_	Mood=Ind|Number=Plur|Person=3|Tense=Pres|VerbForm=Fin	4	conj	_	start_char=36|end_char=39
11	des	un	DET	_	Definite=Ind|Number=Plur|PronType=Art	12	det	_	start_char=40|end_char=43
12	pattes	patte	NOUN	_	Gender=Fem|Number=Plur	10	obj	_	start_char=44|end_char=50
13	.	.	PUNCT	_	_	4	punct	_	start_char=50|end_char=51

# sent_id = fr-ud-test_00001
# text = Je sens qu'entre ça et les films de médecins et scientifiques fous que nous avons déjà vus, nous pourrions emprunter un autre chemin pour l'origine.
1	Je	moi	PRON	_	Emph=No|Number=Sing|Person=1|PronType=Prs	2	nsubj	_	wordform=je
2	sens	sentir	VERB	_	Mood=Ind|Number=Sing|Person=1|Tense=Pres|VerbForm=Fin	0	root	_	_
3	qu'	que	SCONJ	_	_	21	mark	_	SpaceAfter=No
4	entre	entre	ADP	_	_	5	case	_	_
5	ça	ça	PRON	_	Gender=Masc|Number=Sing|Person=3|PronType=Dem	21	obl:mod	_	_
6	et	et	CCONJ	_	_	8	cc	_	_
7	les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	8	det	_	_
8	films	film	NOUN	_	Gender=Masc|Number=Plur	5	conj	_	_
9	de	de	ADP	_	_	10	case	_	_
10	médecins	médecin	NOUN	_	Gender=Masc|Number=Plur	8	nmod	_	_
11	et	et	CCONJ	_	_	12	cc	_	_
12	scientifiques	scientifique	NOUN	_	Gender=Masc|Number=Plur	10	conj	_	_
13	fous	fou	ADJ	_	Gender=Masc|Number=Plur	12	amod	_	_
14	que	que	PRON	_	PronType=Rel	18	obj	_	_
15	nous	nous	PRON	_	Emph=No|Number=Plur|Person=1|PronType=Prs	18	nsubj	_	_
16	avons	avoir	AUX	_	Mood=Ind|Number=Plur|Person=1|Tense=Pres|VerbForm=Fin	18	aux:tense	_	_
17	déjà	déjà	ADV	_	_	18	advmod	_	_
18	vus	voir	VERB	_	Gender=Masc|Number=Plur|Tense=Past|VerbForm=Part|Voice=Act	8	acl:relcl	_	SpaceAfter=No
19	,	,	PUNCT	_	_	5	punct	_	_
20	nous	nous	PRON	_	Emph=No|Number=Plur|Person=1|PronType=Prs	21	nsubj	_	_
21	pourrions	pouvoir	VERB	_	Mood=Cnd|Number=Plur|Person=1|Tense=Pres|VerbForm=Fin	2	ccomp	_	_
22	emprunter	emprunter	VERB	_	VerbForm=Inf	21	xcomp	_	Subject=SubjRaising
23	un	un	DET	_	Definite=Ind|Gender=Masc|Number=Sing|PronType=Art	25	det	_	_
24	autre	autre	ADJ	_	Gender=Masc|Number=Sing	25	amod	_	_
25	chemin	chemin	NOUN	_	Gender=Masc|Number=Sing	22	obj	_	_
26	pour	pour	ADP	_	_	28	case	_	_
27	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	28	det	_	SpaceAfter=No
28	origine	origine	NOUN	_	Gender=Fem|Number=Sing	22	obl:mod	_	SpaceAfter=No
29	.	.	PUNCT	_	_	2	punct	_	_

# sent_id = Europar.550_00063
# text = Il est essentiel de considérer les intérêts de toutes les parties.
1	Il	lui	PRON	_	Gender=Masc|Number=Sing|Person=3|PronType=Prs	3	expl:subj	_	_
2	est	être	AUX	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	3	cop	_	_
3	essentiel	essentiel	ADJ	_	Gender=Masc|Number=Sing	0	root	_	_
4	de	de	ADP	_	_	5	mark	_	_
5	considérer	considérer	VERB	_	VerbForm=Inf	3	csubj	_	Subject=Generic
6	les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	7	det	_	_
7	intérêts	intérêt	NOUN	_	Gender=Masc|Number=Plur	5	obj	_	_
8	de	de	ADP	_	_	11	case	_	_
9	toutes	tout	ADJ	_	Gender=Fem|Number=Plur	11	amod	_	_
10	les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	11	det	_	_
11	parties	partie	NOUN	_	Gender=Fem|Number=Plur	7	nmod	_	SpaceAfter=No
12	.	.	PUNCT	_	_	3	punct	_	_

# text = L'été, je ne suis pas à l'école.
# sent_id = 146
1	L'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	2	det	_	start_char=0|end_char=2
2	été	été	NOUN	_	Gender=Masc|Number=Sing	10	obl:mod	_	start_char=2|end_char=5
3	,	,	PUNCT	_	_	2	punct	_	start_char=5|end_char=6
4	je	il	PRON	_	Number=Sing|Person=1|PronType=Prs	10	nsubj	_	start_char=7|end_char=9
5	ne	ne	ADV	_	Polarity=Neg	10	advmod	_	start_char=10|end_char=12
6	suis	être	AUX	_	Mood=Ind|Number=Sing|Person=1|Tense=Pres|VerbForm=Fin	10	cop	_	start_char=13|end_char=17
7	pas	pas	ADV	_	Polarity=Neg	10	advmod	_	start_char=18|end_char=21
8	à	à	ADP	_	_	10	case	_	start_char=22|end_char=23
9	l'	le	DET	_	Definite=Def|Number=Sing|PronType=Art	10	det	_	start_char=24|end_char=26
10	école	école	NOUN	_	Gender=Fem|Number=Sing	0	root	_	start_char=26|end_char=31
11	.	.	PUNCT	_	_	10	punct	_	start_char=31|end_char=32

# text = Il te regarde t’ouvrir à la joie de lire.
# sent_id = 145
1	Il	il	PRON	_	Gender=Masc|Number=Sing|Person=3|PronType=Prs	3	nsubj	_	start_char=0|end_char=2
2	te	lui	PRON	_	Number=Sing|Person=2|PronType=Prs	3	iobj	_	start_char=3|end_char=5
3	regarde	regarder	VERB	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	start_char=6|end_char=13
4	t’	lui	PRON	_	Number=Sing|Person=2|PronType=Prs	5	iobj	_	start_char=14|end_char=16
5	ouvrir	ouvrir	VERB	_	VerbForm=Inf	3	xcomp	_	start_char=16|end_char=22
6	à	à	ADP	_	_	8	case	_	start_char=23|end_char=24
7	la	le	DET	_	Definite=Def|Gender=Fem|Number=Sing|PronType=Art	8	det	_	start_char=25|end_char=27
8	joie	joie	NOUN	_	Gender=Fem|Number=Sing	5	obl:arg	_	start_char=28|end_char=32
9	de	de	ADP	_	_	10	mark	_	start_char=33|end_char=35
10	lire	lire	VERB	_	VerbForm=Inf	8	acl	_	start_char=36|end_char=40
11	.	.	PUNCT	_	_	3	punct	_	start_char=40|end_char=41

# text = Les élèves ont vite levé la main pour dire oui.
# sent_id = 158
1	Les	le	DET	_	Definite=Def|Number=Plur|PronType=Art	2	det	_	start_char=0|end_char=3
2	élèves	élève	NOUN	_	Gender=Masc|Number=Plur	5	nsubj	_	start_char=4|end_char=10
3	ont	avoir	AUX	_	Mood=Ind|Number=Plur|Person=3|Tense=Pres|VerbForm=Fin	5	aux:tense	_	start_char=11|end_char=14
4	vite	vite	ADV	_	_	5	advmod	_	start_char=15|end_char=19
5	levé	lever	VERB	_	Gender=Masc|Number=Sing|Tense=Past|VerbForm=Part	0	root	_	start_char=20|end_char=24
6	la	le	DET	_	Definite=Def|Gender=Fem|Number=Sing|PronType=Art	7	det	_	start_char=25|end_char=27
7	main	main	NOUN	_	Gender=Fem|Number=Sing	5	obj	_	start_char=28|end_char=32
8	pour	pour	ADP	_	_	9	mark	_	start_char=33|end_char=37
9	dire	dire	VERB	_	VerbForm=Inf	5	advcl	_	start_char=38|end_char=42
10	oui	oui	INTJ	_	_	9	obj	_	start_char=43|end_char=46
11	.	.	PUNCT	_	_	5	punct	_	start_char=46|end_char=47

# text = Elle m’a vu jouer au ballon.
# sent_id = 142
1	Elle	il	PRON	_	Gender=Fem|Number=Sing|Person=3|PronType=Prs	4	nsubj	_	start_char=0|end_char=4
2	m’	lui	PRON	_	Number=Sing|Person=1|PronType=Prs	4	iobj	_	start_char=5|end_char=7
3	a	avoir	AUX	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	4	aux:tense	_	start_char=7|end_char=8
4	vu	voir	VERB	_	Gender=Masc|Number=Sing|Tense=Past|VerbForm=Part	0	root	_	start_char=9|end_char=11
5	jouer	jouer	VERB	_	VerbForm=Inf	4	xcomp	_	start_char=12|end_char=17
6-7	au	_	_	_	_	_	_	_	start_char=18|end_char=20
6	à	à	ADP	_	_	8	case	_	_
7	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	8	det	_	_
8	ballon	ballon	NOUN	_	Gender=Masc|Number=Sing	5	obl:arg	_	start_char=21|end_char=27
9	.	.	PUNCT	_	_	4	punct	_	start_char=27|end_char=28

# text = Vous avez été là où j'ai grandi.
# sent_id = 177
1	Vous	il	PRON	_	Number=Plur|Person=2|PronType=Prs	4	nsubj	_	start_char=0|end_char=4
2	avez	avoir	AUX	_	Mood=Ind|Number=Plur|Person=2|Tense=Pres|VerbForm=Fin	4	aux:tense	_	start_char=5|end_char=9
3	été	être	AUX	_	Gender=Masc|Number=Sing|Tense=Past|VerbForm=Part	4	cop	_	start_char=10|end_char=13
4	là	là	ADV	_	_	0	root	_	start_char=14|end_char=16
5	où	où	ADV	_	PronType=Rel	8	advmod	_	start_char=17|end_char=19
6	j'	il	PRON	_	Number=Sing|Person=1|PronType=Prs	8	nsubj	_	start_char=20|end_char=22
7	ai	avoir	AUX	_	Mood=Ind|Number=Sing|Person=1|Tense=Pres|VerbForm=Fin	8	aux:tense	_	start_char=22|end_char=24
8	grandi	grandir	VERB	_	Gender=Masc|Number=Sing|Tense=Past|VerbForm=Part	4	acl:relcl	_	start_char=25|end_char=31
9	.	.	PUNCT	_	_	4	punct	_	start_char=31|end_char=32

# text = Mon ami m'a donné un coup de pied au cou.
# sent_id = 102
1	Mon	son	DET	_	Number=Sing|Number[psor]=Sing|Person[psor]=1|Poss=Yes|PronType=Prs	2	det	_	start_char=0|end_char=3
2	ami	ami	NOUN	_	Gender=Masc|Number=Sing	5	nsubj	_	start_char=4|end_char=7
3	m'	lui	PRON	_	Number=Sing|Person=1|PronType=Prs	5	iobj	_	start_char=8|end_char=10
4	a	avoir	AUX	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	5	aux:tense	_	start_char=10|end_char=11
5	donné	donner	VERB	_	Gender=Masc|Number=Sing|Tense=Past|VerbForm=Part	0	root	_	start_char=12|end_char=17
6	un	un	DET	_	Definite=Ind|Gender=Masc|Number=Sing|PronType=Art	7	det	_	start_char=18|end_char=20
7	coup	coup	NOUN	_	Gender=Masc|Number=Sing	5	obj	_	start_char=21|end_char=25
8	de	de	ADP	_	_	9	case	_	start_char=26|end_char=28
9	pied	pied	NOUN	_	Gender=Masc|Number=Sing	7	nmod	_	start_char=29|end_char=33
10-11	au	_	_	_	_	_	_	_	start_char=34|end_char=36
10	à	à	ADP	_	_	12	case	_	_
11	le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	12	det	_	_
12	cou	cou	NOUN	_	Gender=Masc|Number=Sing	5	obl:mod	_	start_char=37|end_char=40
13	.	.	PUNCT	_	_	5	punct	_	start_char=40|end_char=41

# text = Le loup n’est pas un chien.
# sent_id = 87
1	Le	le	DET	_	Definite=Def|Gender=Masc|Number=Sing|PronType=Art	2	det	_	start_char=0|end_char=2
2	loup	loup	NOUN	_	Gender=Masc|Number=Sing	7	nsubj	_	start_char=3|end_char=7
3	n’	ne	ADV	_	Polarity=Neg	7	advmod	_	start_char=8|end_char=10
4	est	être	AUX	_	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	7	cop	_	start_char=10|end_char=13
5	pas	pas	ADV	_	Polarity=Neg	7	advmod	_	start_char=14|end_char=17
6	un	un	DET	_	Definite=Ind|Gender=Masc|Number=Sing|PronType=Art	7	det	_	start_char=18|end_char=20
7	chien	chien	NOUN	_	Gender=Masc|Number=Sing	0	root	_	start_char=21|end_char=26
8	.	.	PUNCT	_	_	7	punct	_	start_char=26|end_char=27

# file = fr/fr_gsd-ud-test.conllu
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
29-30	des	_	_	_	_	_	_	_	_
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
7-8	du	_	_	_	_	_	_	_	_
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
21-22	aux	_	_	_	_	_	_	_	_
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
50-51	des	_	_	_	_	_	_	_	_
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
