#!/usr/bin/env python3

##  Python 3 filter from transforming an English or French sentence (on a single line) 
##   given as stdin to a UD in conllu format returned on stdout
##   it uses the Stanza parser (https://stanfordnlp.github.io/stanza/)
##   which must first be installed with "pip3 stanza"
##   and the English/French modules must have been  preloaded 
##   with "stanza.download('en')" or "stanza.download('fr')"
##  the single argument to the program indicates the language en|fr (default en)

import sys
import stanza
from stanza.utils.conll import CoNLL

lang="en"
if (len(sys.argv)>1):
    lang=sys.argv[1]
    if lang!='en' and lang!='fr':
        print("only en and fr supported")
        sys.exit(1)

processors='tokenize,pos,lemma,depparse'
if lang=="fr":processors+=',mwt'
nlp = stanza.Pipeline(lang,processors=processors,verbose=False)

def lang2ud(id,sentence):
    res=[]
    doc=nlp(sentence)
    for ud in CoNLL.convert_dict(doc.to_dict()):
        res.append("# id = %s"%id)
        res.append("# text = %s"%sentence)
        for l in ud:
            l[9]="_"    # ignore last field (start_char,end_char)
            res.append("\t".join(l))
        res.append("")
    return res

def showUD(id,sentence):
    print("\n".join(lang2ud(id,sentence)))

# showUD("test-1","Barack Obama was born in Hawaii.")
# showUD("test-2","He was elected president in 2008.")

### process stdin
no=0
for line in sys.stdin:
    no+=1
    showUD("id-%s"%no,line.strip())
