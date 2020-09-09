### Python Classes for creating data structures that can be serialized a JSON structure suitable for jsRealB input
### that will realize it in either French or English 
###    It allows
###    the "usual" jsRealB constructors and method names to create the structure
###       .add(..) to add a Constituent to an existing Phrase
###       .lang("en"|"fr") to set the current language
###    the structure can be shown as string using
###       str(S) [i.e. .__str__()] to display the JSON structure
###       .pp()  to display a pretty-printed JSON structure
###       .show() to display a pretty-printed jsRealB functional representation that can be sent to jsRealB

### HACK: some constructors and methods are defined dynamically using "exec" and "setattr".
import json,re

## auxiliary functions for pp
def q(s):return '"'+s+'"'   # quote
def kv(k,v):                # key-value pair
    if v==None:return q(k)+":null"
    if v==False: return q(k)+":false"
    if v==True: return q(k)+":true"
    if isinstance(v,(list,str)):
        return q(k)+':'+q(v)
    if isinstance(v,dict):
        return q(k)+":{"+','.join([kv(k0,v[k0]) for k0 in v])+"}"
    return q(k)+":"+str(v) 

class Constituent():
    def __init__(self,type,name):
        setattr(self,type,name)
        self.props={}
    
    def __str__(self):
        # HACK for traversing all levels of the structure
        # found at https://medium.com/@yzhong.cs/serialize-and-deserialize-complex-json-in-python-205ecc636caa
        # change separators to get more compact result
        return json.dumps(self.__dict__,default=lambda o:o.__dict__, separators=(',', ':'))
    
    ## using the standard Python pp which is too long and difficult to follow 
    def pp0(self):
      return json.dumps(self.__dict__,default=lambda o:o.__dict__, indent=3)
    
    # so we define a prettier-print of JSON 
    #   which is a more compact ad-hoc version ignoring empty props
    #   output properties (not called by subclasses when no props are defined)    
    def pp(self,n=0):
        return q("props")+':{'+','.join([kv(k,v) for (k,v) in self.props.items()])+'}'
    
    def show(self): # show properties in jsRealB like format 
        return "".join([f".{k}({json.dumps(v)})" for (k,v) in self.props.items()])
                        
    def __eq__(self,that):
        if that==None: return False
        return self.__dict__==that.__dict__
    
    def lang(self,enfr):
        self.lang=enfr
        return self

## add Constituent methods for setting properties 
## adapted from https://stackoverflow.com/questions/8276733/dynamically-add-methods-to-a-class-in-python-3-0
def make_method(name):
    def _method(self,value):
        self.props[name]=value
        return self
    return _method

for name in ('g', 'n', 'pe','t','a','f','dOpt','cap','typ','c','tag'):
    setattr(Constituent, name, make_method(name))

## Constituent subclasses

class Terminal(Constituent):
    def __init__(self,name,lemma):
        super().__init__("terminal",name)
        self.lemma=lemma
        
    # show a jsRealB like indented expression    
    def show(self,n=0):
        return f"{self.terminal}(\"{self.lemma}\")"+super().show()
    
    # prettier-print of JSON
    def pp(self,n=0):
        res='{'+kv("terminal",self.terminal)+','+kv("lemma",self.lemma)
        if len(self.props)>0:
            res+=','+super().pp(n)+'}'
        return res+'}'
        
class Phrase(Constituent):
    def __init__(self,name,elements):
        super().__init__("phrase",name)
        if (len(elements)==0): # check for an empty list that can be added to 
            self.elements=[]
        elif isinstance(elements[0],list):
            self.elements=elements[0]
        else:
            ## transform the tuple received as star args into a list that can be modified 
            self.elements=list(elements)

    # show a jsRealB like indented expression
    def show(self,n=0):
        n+=len(self.phrase)+1
        indent=',\n'+n*' '
        return f"{self.phrase}({indent.join([e.show(n) for e in self.elements])})"+super().show()
    
    # prettier-print of JSON
    def pp(self,n=0):
        res='{'+kv("phrase",self.phrase)+','
        if (len(self.props)>0):
            res+=super().pp(n)+','
        res+='\n'+((n+1)*" ")+q("elements")+':[' +\
             (",\n"+" "*(n+13)).join([element.pp(n+13) for element in self.elements]) +']'
        return res+"}"
        
    # add a new element or a list of elements at a given index, at the end when not specified 
    def add(self,elements,ix=None):
        if ix==None:ix=len(self.elements)
        if not isinstance(elements,list):
            elements=[elements]
        self.elements[ix:ix]=elements
        return self

## create Terminal subclasses
terminalDefString ='''
class {0}(Terminal):
    def __init__(self, lemma):
        super().__init__("{0}",lemma)
'''
for t in ["N","A","Pro","D","Adv","V","P","C","DT","NO","Q"]:
    exec(terminalDefString.format(t))

## create Phrase subclasses
phraseDefString='''
class {0}(Phrase):
    def __init__(self, *elems):
        super().__init__("{0}",elems)
'''
for p in ["NP","AP","AdvP","VP","PP","CP","S","SP"]:
    exec(phraseDefString.format(p))

## call to jsRealB server
##    started as another process with 
##           node ...jsRealB/dist/jsRealB-server.js
##    or
##           node ...jsRealBdist/jsRealB-server-dme.js

from urllib.parse import urlencode
from urllib.request import urlopen
def jsRealB(exp,show=False,json=False,lang="en"):
    if show: print(exp if json else exp.show())
    if json:
        # use json input format for jsRealB
        params=urlencode({"lang":lang,"exp":str(exp)})
    else:
        # use jsRealB like output without newlines and indentation
        params=urlencode({"lang":lang,"exp":re.sub(r'\n\s*','',exp.show())})
    return urlopen('http://127.0.0.1:8081?'+params).read().decode()

## some unit tests
if __name__ == '__main__':
    print(NP().pp())
    the=D("the")
    cat=N("cat").n("p")
    thecat=NP(the,cat).lang("en")
    print(thecat)
    print(thecat.pp())
    print(thecat.show())
    print(thecat==NP(D("the"),N("cat").n("p")).lang("en"))
    print("---")
    sent=S(thecat,VP(V("eat"),NP(D("a"),N("mouse")))).typ({"pas":True})
    print(sent)
    print(sent.pp())
    # print(sent.pp0())
    print(sent.show())
    print("---")
    print(CP([the,cat]))
    print(CP([the,cat]).pp())
    print(CP([the,cat]).show())
    print("---")
    np=NP(N("cat"))
    np.add(D("a"),0)
    np.add([A("grey"),A("black")],1)
    print(np)
    print(np.pp())
    print(np.show())
    sent = S(                 # Sentence
      Pro("him").c("nom"),    # Pronoun (citation form), nominative case
      VP(V("eat"),            # Verb at present tense by default
         NP(D("a"),           # Noun Phrase, Determiner
            N("apple").n("p") # Noun plural
           ).tag("em")        # add an <em> tag around the NP
        )
     )
    print(sent.pp())
    print(sent.show())
    exemple = S(Q("Alan Shepard"),
       VP(V("be").t("ps"),
          V("born").t("pp"),
          PP(P("on"),
             DT("1923-11-18")),
          PP(P("in"),
             Q("New Hampshire"))))
    print(exemple.show())
    print(exemple.pp())
    ## test server call
    print(jsRealB(sent,False,True))
    print(jsRealB(exemple,True))
    print(jsRealB(exemple,True,True))
    
    
