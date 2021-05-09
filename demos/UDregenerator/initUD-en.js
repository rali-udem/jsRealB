var initUD =`
# file = en/en_gum-ud-test.conllu
# sent_id = GUM_voyage_oakland-21
# text = Many of the neighborhoods are commercial centers and absolute heaven for foodies or those who seek quieter surroundings than the hustle and bustle of Downtown and Chinatown.
1	Many	many	ADJ	JJ	Degree=Pos	7	nsubj	_	Discourse=elaboration:43->41|Entity=(place-103
2	of	of	ADP	IN	_	4	case	_	_
3	the	the	DET	DT	Definite=Def|PronType=Art	4	det	_	Entity=(place-104
4	neighborhoods	neighbourhood	NOUN	NNS	Number=Plur	1	obl	_	Entity=place-103)place-104)
5	are	be	AUX	VBP	Mood=Ind|Tense=Pres|VerbForm=Fin	7	cop	_	_
6	commercial	commercial	ADJ	JJ	Degree=Pos	7	amod	_	Entity=(place-103
7	centers	centre	NOUN	NNS	Number=Plur	0	root	_	Entity=place-103)
8	and	and	CCONJ	CC	_	10	cc	_	_
9	absolute	absolute	ADJ	JJ	Degree=Pos	10	amod	_	Entity=(place-103
10	heaven	heaven	NOUN	NN	Number=Sing	7	conj	_	_
11	for	for	ADP	IN	_	12	case	_	_
12	foodies	foodies	PROPN	NNS	Number=Plur	7	nmod	_	Entity=(person-105)
13	or	or	CCONJ	CC	_	14	cc	_	_
14	those	that	PRON	DT	Number=Plur|PronType=Dem	12	conj	_	Entity=(person-106
15	who	who	PRON	WP	PronType=Rel	16	nsubj	_	Discourse=elaboration:44->43
16	seek	seek	VERB	VBP	Mood=Ind|Tense=Pres|VerbForm=Fin|Number=Plur	14	acl:relcl	_	_
17	quieter	quiet	ADJ	JJR	Degree=Cmp	18	amod	_	Entity=(place-107
18	surroundings	surroundings	NOUN	NNS	Number=Plur	16	obj	_	_
19	than	than	ADP	IN	_	21	case	_	_
20	the	the	DET	DT	Definite=Def|PronType=Art	21	det	_	Entity=(abstract-108
21	hustle	hustle	NOUN	NN	Number=Sing	16	obl	_	_
22	and	and	CCONJ	CC	_	23	cc	_	_
23	bustle	bustle	NOUN	NN	Number=Sing	21	conj	_	_
24	of	of	ADP	IN	_	25	case	_	_
25	Downtown	Downtown	PROPN	NN	Number=Sing	21	nmod	_	Entity=(place-3)
26	and	and	CCONJ	CC	_	27	cc	_	_
27	Chinatown	Chinatown	PROPN	NNP	Number=Sing	25	conj	_	Entity=(place-54)place-103)person-106)place-107)abstract-108)|SpaceAfter=No
28	.	.	PUNCT	.	_	7	punct	_	_

# newdoc id = reviews-048644
# newpar id = reviews-048644-p0001
# sent_id = reviews-048644-0001
# text = Don't judge a book by its cover
1-2	Don't	_	_	_	_	_	_	_	_
1	Do	do	AUX	VB	Mood=Imp|VerbForm=Fin	3	aux	3:aux	_
2	n't	not	PART	RB	_	3	advmod	3:advmod	_
3	judge	judge	VERB	VB	Mood=Imp|VerbForm=Fin	0	root	0:root	_
4	a	a	DET	DT	Definite=Ind|PronType=Art	5	det	5:det	_
5	book	book	NOUN	NN	Number=Sing	3	obj	3:obj	_
6	by	by	ADP	IN	_	8	case	8:case	_
7	its	its	PRON	PRP$	Gender=Neut|Number=Sing|Person=3|Poss=Yes|PronType=Prs	8	nmod:poss	8:nmod:poss	_
8	cover	cover	NOUN	NN	Number=Sing	3	obl	3:obl:by	_

# sent_id = weblog-blogspot.com_gettingpolitical_20030906235000_ENG_20030906_235000-0004
# newpar id = weblog-blogspot.com_gettingpolitical_20030906235000_ENG_20030906_235000-p0002
# text = Nervous people make mistakes, so I suppose there will be a wave of succesfull arab attacks.
1	Nervous	nervous	ADJ	JJ	Degree=Pos	2	amod	2:amod	_
2	people	people	NOUN	NNS	Number=Plur	3	nsubj	3:nsubj	_
3	make	make	VERB	VBP	Mood=Ind|Tense=Pres|VerbForm=Fin	0	root	0:root	_
4	mistakes	mistake	NOUN	NNS	Number=Plur	3	obj	3:obj	SpaceAfter=No
5	,	,	PUNCT	,	_	3	punct	3:punct	_
6	so	so	ADV	RB	_	8	advmod	8:advmod	_
7	I	I	PRON	PRP	Case=Nom|Number=Sing|Person=1|PronType=Prs	8	nsubj	8:nsubj	_
8	suppose	suppose	VERB	VBP	Mood=Ind|Tense=Pres|VerbForm=Fin	3	parataxis	3:parataxis	_
9	there	there	PRON	EX	_	11	expl	11:expl	_
10	will	will	AUX	MD	VerbForm=Fin	11	aux	11:aux	_
11	be	be	VERB	VB	VerbForm=Inf	8	ccomp	8:ccomp	_
12	a	a	DET	DT	Definite=Ind|PronType=Art	13	det	13:det	_
13	wave	wave	NOUN	NN	Number=Sing	11	nsubj	11:nsubj	_
14	of	of	ADP	IN	_	17	case	17:case	_
15	succesfull	succesfull	ADJ	JJ	Degree=Pos	17	amod	17:amod	_
16	arab	arab	ADJ	JJ	Degree=Pos	17	amod	17:amod	_
17	attacks	attack	NOUN	NNS	Number=Plur	13	nmod	13:nmod:of	SpaceAfter=No
18	.	.	PUNCT	.	_	3	punct	3:punct	_

# sent_id = weblog-blogspot.com_thelameduck_20041119192207_ENG_20041119_192207-0003
# text = For the last few years there have been tensions with Iran’s nuclear program with word coming this week that a deal was reached through the European Union that meets with the approval of the International Atomic Energy Agency.
1	For	for	ADP	IN	_	5	case	5:case	_
2	the	the	DET	DT	Definite=Def|PronType=Art	5	det	5:det	_
3	last	last	ADJ	JJ	Degree=Pos	5	amod	5:amod	_
4	few	few	ADJ	JJ	Degree=Pos	5	amod	5:amod	_
5	years	year	NOUN	NNS	Number=Plur	8	obl	8:obl:for	_
6	there	there	PRON	EX	_	8	expl	8:expl	_
7	have	have	AUX	VBP	Mood=Ind|Tense=Pres|VerbForm=Fin	8	aux	8:aux	_
8	been	be	VERB	VBN	Tense=Past|VerbForm=Part	0	root	0:root	_
9	tensions	tension	NOUN	NNS	Number=Plur	8	nsubj	8:nsubj	_
10	with	with	ADP	IN	_	14	case	14:case	_
11-12	Iran’s	_	_	_	_	_	_	_	_
11	Iran	Iran	PROPN	NNP	Number=Sing	14	nmod:poss	14:nmod:poss	_
12	’s	's	PART	POS	_	11	case	11:case	_
13	nuclear	nuclear	ADJ	JJ	Degree=Pos	14	amod	14:amod	_
14	program	program	NOUN	NN	Number=Sing	9	nmod	9:nmod:with	_
15	with	with	ADP	IN	_	16	case	16:case	_
16	word	word	NOUN	NN	Number=Sing	8	obl	8:obl:with|24:mark	_
17	coming	come	VERB	VBG	VerbForm=Ger	16	acl	16:acl	_
18	this	this	DET	DT	Number=Sing|PronType=Dem	19	det	19:det	_
19	week	week	NOUN	NN	Number=Sing	17	obl:tmod	17:obl:tmod	_
20	that	that	SCONJ	IN	_	24	mark	16:ref	_
21	a	a	DET	DT	Definite=Ind|PronType=Art	22	det	22:det	_
22	deal	deal	NOUN	NN	Number=Sing	24	nsubj:pass	24:nsubj:pass|30:nsubj	_
23	was	be	AUX	VBD	Mood=Ind|Number=Sing|Person=3|Tense=Past|VerbForm=Fin	24	aux:pass	24:aux:pass	_
24	reached	reach	VERB	VBN	Tense=Past|VerbForm=Part	16	acl:relcl	16:acl:relcl	_
25	through	through	ADP	IN	_	28	case	28:case	_
26	the	the	DET	DT	Definite=Def|PronType=Art	28	det	28:det	_
27	European	European	PROPN	NNP	Number=Sing	28	compound	28:compound	_
28	Union	Union	PROPN	NNP	Number=Sing	24	obl	24:obl:through	_
29	that	that	PRON	WDT	PronType=Rel	30	nsubj	22:ref	_
30	meets	meet	VERB	VBZ	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	22	acl:relcl	22:acl:relcl	_
31	with	with	ADP	IN	_	33	case	33:case	_
32	the	the	DET	DT	Definite=Def|PronType=Art	33	det	33:det	_
33	approval	approval	NOUN	NN	Number=Sing	30	obl	30:obl:with	_
34	of	of	ADP	IN	_	39	case	39:case	_
35	the	the	DET	DT	Definite=Def|PronType=Art	39	det	39:det	_
36	International	International	PROPN	NNP	Number=Sing	39	compound	39:compound	_
37	Atomic	Atomic	PROPN	NNP	Number=Sing	38	compound	38:compound	_
38	Energy	Energy	PROPN	NNP	Number=Sing	39	compound	39:compound	_
39	Agency	Agency	PROPN	NNP	Number=Sing	33	nmod	33:nmod:of	SpaceAfter=No
40	.	.	PUNCT	.	_	8	punct	8:punct	_

`;
