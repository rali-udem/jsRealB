export {initSUD}

const initSUD =`
# sent_id = weblog-typepad.com_ripples_20040407125600_ENG_20040407_125600-0063
# newpar id = weblog-typepad.com_ripples_20040407125600_ENG_20040407_125600-p0005
# text = I'm sorry to say Elena's story has been revealed to be a fake.
1-2	I'm	_	_	_	_	_	_	_	_
1	I	I	PRON	PRP	Case=Nom|Number=Sing|Person=1|PronType=Prs	2	subj	_	_
2	'm	be	AUX	VBP	Mood=Ind|Number=Sing|Person=1|Tense=Pres|VerbForm=Fin	0	root	_	_
3	sorry	sorry	ADJ	JJ	Degree=Pos	2	comp:pred	_	_
4	to	to	PART	TO	_	3	comp:obl@x	_	_
5	say	say	VERB	VB	VerbForm=Inf	4	comp:obj	_	_
6-7	Elena's	_	_	_	_	_	_	_	_
6	Elena	Elena	PROPN	NNP	Number=Sing	7	comp:obj	_	_
7	's	's	PART	POS	_	8	udep@poss	_	_
8	story	story	NOUN	NN	Number=Sing	9	subj@pass	_	_
9	has	have	AUX	VBZ	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	5	comp:obj	_	_
10	been	be	AUX	VBN	Tense=Past|VerbForm=Part	9	comp:aux	_	_
11	revealed	reveal	VERB	VBN	Tense=Past|VerbForm=Part|Voice=Pass	10	comp:aux@pass	_	_
12	to	to	PART	TO	_	11	comp:obj@x	_	_
13	be	be	AUX	VB	VerbForm=Inf	12	comp:obj	_	_
14	a	a	DET	DT	Definite=Ind|PronType=Art	15	det	_	_
15	fake	fake	NOUN	NN	Number=Sing	13	comp:pred	_	SpaceAfter=No
16	.	.	PUNCT	.	_	2	punct	_	_

# sent_id = weblog-juancole.com_juancole_20051126063000_ENG_20051126_063000-0028
# text = This item is a small one and easily missed.
1	This	this	DET	DT	Number=Sing|PronType=Dem	2	det	_	_
2	item	item	NOUN	NN	Number=Sing|Shared=Yes	3	subj	_	_
3	is	be	AUX	VBZ	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	_
4	a	a	DET	DT	Definite=Ind|PronType=Art	6	det	_	_
5	small	small	ADJ	JJ	Degree=Pos	6	mod	_	_
6	one	one	NOUN	NN	Number=Sing	3	comp:pred	_	_
7	and	and	CCONJ	CC	_	9	cc	_	_
8	easily	easily	ADV	RB	_	9	mod	_	_
9	missed	miss	VERB	VBN	Tense=Past|VerbForm=Part	3	conj	_	SpaceAfter=No
10	.	.	PUNCT	.	_	3	punct	_	_

# sent_id = weblog-typepad.com_ripples_20040407125600_ENG_20040407_125600-0016
# newpar id = weblog-typepad.com_ripples_20040407125600_ENG_20040407_125600-p0003
# text = The dramatic increase in radiation-induced thyroid cancers in children and adolescents in Belarus, Russia, and Ukraine, which have been observed since 1991, continues to this day.
1	The	the	DET	DT	Definite=Def|PronType=Art	3	det	_	_
2	dramatic	dramatic	ADJ	JJ	Degree=Pos	3	mod	_	_
3	increase	increase	NOUN	NN	Number=Sing	29	subj	_	_
4	in	in	ADP	IN	_	3	udep	_	_
5	radiation	radiation	NOUN	NN	Number=Sing	7	compound	_	SpaceAfter=No
6	-	-	PUNCT	HYPH	_	7	punct	_	SpaceAfter=No
7	induced	induce	VERB	VBN	Tense=Past|VerbForm=Part	9	mod	_	_
8	thyroid	thyroid	NOUN	NN	Number=Sing	9	compound	_	_
9	cancers	cancer	NOUN	NNS	Number=Plur	4	comp:obj	_	_
10	in	in	ADP	IN	_	3	udep	_	_
11	children	child	NOUN	NNS	Number=Plur	10	comp:obj	_	_
12	and	and	CCONJ	CC	_	13	cc	_	_
13	adolescents	adolescent	NOUN	NNS	Number=Plur	11	conj	_	_
14	in	in	ADP	IN	_	3	udep	_	_
15	Belarus	Belarus	PROPN	NNP	Number=Sing	14	comp:obj	_	SpaceAfter=No
16	,	,	PUNCT	,	_	17	punct	_	_
17	Russia	Russia	PROPN	NNP	Number=Sing	15	conj	_	SpaceAfter=No
18	,	,	PUNCT	,	_	20	punct	_	_
19	and	and	CCONJ	CC	_	20	cc	_	_
20	Ukraine	Ukraine	PROPN	NNP	Number=Sing	17	conj	_	SpaceAfter=No
21	,	,	PUNCT	,	_	3	punct	_	_
22	which	which	PRON	WDT	PronType=Rel	23	subj@pass	_	_
23	have	have	AUX	VBP	Mood=Ind|Number=Plur|Person=3|Tense=Pres|VerbForm=Fin	3	mod@relcl	_	_
24	been	be	AUX	VBN	Tense=Past|VerbForm=Part	23	comp:aux	_	_
25	observed	observe	VERB	VBN	Tense=Past|VerbForm=Part|Voice=Pass	24	comp:aux@pass	_	_
26	since	since	ADP	IN	_	25	udep	_	_
27	1991	1991	NUM	CD	NumType=Card	26	comp:obj	_	SpaceAfter=No
28	,	,	PUNCT	,	_	29	punct	_	_
29	continues	continue	VERB	VBZ	Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin	0	root	_	_
30	to	to	ADP	IN	_	29	udep	_	_
31	this	this	DET	DT	Number=Sing|PronType=Dem	32	det	_	_
32	day	day	NOUN	NN	Number=Sing	30	comp:obj	_	SpaceAfter=No
33	.	.	PUNCT	.	_	29	punct	_	_
`
