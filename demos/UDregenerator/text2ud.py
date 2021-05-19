#!/usr/bin/env python3

##  Python 3 program from transforming an English or French sentence (on a single line) 
##   language is specified as the first argument (en|fr)
##   the file of sentences (f.txt) to be parsed is given as second arg
##  it writes on f.conllu the corresponding UDs in conllu format
##    
##   This calls the Stanza parser (https://stanfordnlp.github.io/stanza/)
##   which must first be installed with "pip3 install stanza"
##   and the English/French modules must have been preloaded once 
##   with "stanza.download('en')" or "stanza.download('fr')"

import sys,os,re,datetime
import stanza
from stanza.utils.conll import CoNLL

# transforms a "text" (here most often a single sentence) into CoNNL format
def text2ud(id,nlp,text):
    res=[]
    doc=nlp(text)
    sentences=doc.sentences    
    for i,ud in enumerate(CoNLL.convert_dict(doc.to_dict())):
        res.append("# sent_id = %s.%d"%(id,i))
        res.append("# text = %s"%sentences[i].text)
        for l in ud:
            l[9]="_"    # ignore last field (start_char,end_char)
            res.append("\t".join(l))
        res.append("")
    return res

##  process file.txt to create file.conllu
def processFile(txtFileName,lang="en"):
    txtF=open(txtFileName,"r",encoding="utf-8")
    conlluFileName=re.sub(".txt$",".conllu",txtFileName)
    processors='tokenize,pos,lemma,depparse'
    if lang=="fr":processors+=',mwt'
    nlp = stanza.Pipeline(lang,processors=processors,verbose=False)
    conlluF=open(conlluFileName,"w",encoding="utf-8")
    no=1
    for line in txtF:
        conlluF.write("\n".join(text2ud(no,nlp,line)))
        conlluF.write("\n")
        no+=1
    conlluF.close()

def main():
    if len(sys.argv)>2:
        lang=sys.argv[1]
        if lang!='en' and lang!='fr':
            print('only en and fr supported')
            sys.exit(1)
        processFile(sys.argv[2])
        sys.exit()
    else:
        print("missing input file")

if __name__ == '__main__':
    main()