#!/usr/bin/env python3.10

##  Python 3 program from transforming an English or French sentence (on a single line) 
##   language is specified as the first argument (en|fr)
##   the file of sentences (f.txt) to be parsed is given as second arg
##  it writes on f.conllu the corresponding UDs in conllu format
##    
##   This calls the Stanza parser (https://stanfordnlp.github.io/stanza/)
##   which must first be installed with "pip3 install stanza"
##   and the English/French modules must have been preloaded once 
##   with "stanza.download('en')" or "stanza.download('fr')"

##   This "new" version that uses a recent feature of Stanza to create directly a CONLL file from a doc

import sys,os,re,datetime
import stanza
from stanza.utils.conll import CoNLL

##  process file.txt to create file.conllu
def processFile(txtFileName,lang="en"):
    txtF=open(txtFileName,"r",encoding="utf-8")
    conlluFileName=re.sub(".txt$",".conllu",txtFileName)
    try: # remove any existing conllu file...
        os.remove(conlluFileName)
    except OSError:
        pass
    processors='tokenize,pos,lemma,depparse'
    if lang=="fr":processors+=',mwt'
    nlp = stanza.Pipeline(lang,processors=processors,verbose=False)
    conlluF=open(conlluFileName,"a",encoding="utf-8")
    no=1
    for line in txtF:
        doc = nlp(line)
        doc.sentences[0].sent_id=no
        if no%50==1:print(no,line,end="")
        conlluF.write("{:C}\n\n".format(doc))
        no+=1
    print(no)
    conlluF.close()

def main():
    if len(sys.argv)>2:
        lang=sys.argv[1]
        if lang!='en' and lang!='fr':
            print('only en and fr supported')
            sys.exit(1)
        processFile(sys.argv[2],lang)
        sys.exit()
    else:
        print("missing input file")

if __name__ == '__main__':
    main()