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
###               if show is called with a negative number, no indentation is performed
###    
###    It is possible to get information about the Constituent with the following 
###       .props : dictionary of option keys and values
###       .lemma : the lemma of a Terminal
###       .elements : the list of children constituents of a Phrase
###       .lang : the language of the constituent
###
### HACK: some constructors and methods are defined dynamically using "exec" and "setattr".
import json

## example import
# from jsRealBclass import N,A,Pro,D,Adv,V,C,P,DT,NO,Q,  NP,AP,AdvP,VP,CP,PP,S,SP,  Constituent, Terminal, Phrase

## auxiliary functions for pretty-printing
def q(s):return '"'+s+'"'   # quote
def kv(k,v):
    def val(v):
        if v==None:  return "null"
        if v==False: return "false"
        if v==True:  return "true"
        if isinstance(v,str): return q(v)
        if isinstance(v,list): 
            return '['+','.join([val(v0) for v0 in v])+']'
        if isinstance(v,dict):
            return "{"+','.join([kv(k0,v[k0]) for k0 in v])+"}"
        return str(v)
    return q(k)+':'+val(v)

optionMethods = ('pe','n','g','t','aux','f','tn','c','pos',"pro",'ow','cap','lier','dOpt','nat','typ')
optionListMethods = ('a','b','ba','en')

class Constituent():
    def __init__(self):
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
    def pp(self):
        langProp=f'"lang":"{self.lang}",' if "lang" in self.__dict__ else ""        
        return langProp+q("props")+':{'+','.join([kv(k,v) for (k,v) in self.props.items()])+'}'
    
    def show(self): # show properties in jsRealB like format
        def showAttrs(attrs):
            return "" if attrs==None else  ","+json.dumps(attrs)           
        def showProp(k,v):
            if k=="tag":
                return "".join([f'.tag({q(tag)+showAttrs(attrs)})' for (tag,attrs) in v])
            if k in optionListMethods:
                return "".join([f'.{k}("{v0}")' for v0 in v])
            return f".{k}({'' if v==None else json.dumps(v)})"
        return "".join([showProp(k,v) for (k,v) in self.props.items()])
                        
    def __eq__(self,that):
        if that==None: return False
        return self.__dict__==that.__dict__
    
    def lang(self,enfr):
        self.lang=enfr
        return self
    
    def tag(self,tagName,attrs=None):
        if "tag" not in self.props:
            self.props["tag"]=[]
        self.props["tag"].append([tagName,attrs])
        return self

## add Constituent methods for setting properties 
## adapted from https://stackoverflow.com/questions/8276733/dynamically-add-methods-to-a-class-in-python-3-0
def makeOptionMethod(name):
    def _method(self,value=None):
        self.props[name]=value
        return self
    return _method

for name in optionMethods:
    setattr(Constituent, name, makeOptionMethod(name))

def makeOptionListMethod(name):
    def _method(self,value):
        if name not in self.props:self.props[name]=[]
        self.props[name].append(value)
        return self
    return _method

for name in optionListMethods:
    setattr(Constituent,name,makeOptionListMethod(name))
    
## Constituent subclasses

class Terminal(Constituent):
    def __init__(self,name,lemma):
        super().__init__()
        self.terminal=name
        self.lemma=lemma
        
    # show a jsRealB like indented expression    
    def show(self,n=0):
        return f"{self.terminal}(\"{self.lemma}\")"+super().show()
    
    # prettier-print of JSON
    def pp(self,n=0):
        res='{'+kv("terminal",self.terminal)+','+kv("lemma",self.lemma)
        if len(self.props)>0:
            res+=','+super().pp()
        return res+'}'
        
class Phrase(Constituent):
    def __init__(self,name,elements):
        super().__init__()
        self.phrase=name
        if (len(elements)==0): # check for an empty list that can be added to 
            self.elements=[]
        elif isinstance(elements[0],list):
            self.elements=elements[0]
        else:
            ## transform the tuple received as star args into a list that can be modified 
            self.elements=list(elements)

    def indent(self,n): # return indentation string when >=0
        return "," if n<0 else (',\n'+n*" ")

    # show a jsRealB like indented expression
    def show(self,n=0):
        if n>=0: n+=len(self.phrase)+1
        indent=self.indent(n)
        return f"{self.phrase}({indent.join([e.show(n) for e in self.elements])})"+super().show()
    
    # prettier-print of JSON
    def pp(self,n=0):
        res='{'+kv("phrase",self.phrase)
        if (len(self.props)>0):
            res+=super().pp()
        res+=self.indent(n+1)+q("elements")+':[' +\
             self.indent(n+13).join([element.pp(n+13) for element in self.elements]) +']'
        return res+"}"
        
    # add a new element or a list of elements at a given index, at the end when not specified 
    def add(self,elements,ix=None):
        if ix==None:ix=len(self.elements)
        if not isinstance(elements,list):
            elements=[elements]
        self.elements[ix:ix]=elements
        return self

    def getChild(self,t):
        ts = filter(lambda e:isinstance(e,t), self.elements)
        return None if len(ts)==0 else ts[0]

## create Terminal subclasses
#  which could be done using the following exec
# terminalDefString ='''
# class {0}(Terminal):
#     def __init__(self, lemma):
#         super().__init__("{0}",lemma)
# '''
# for t in ["N","A","Pro","D","Adv","V","P","C","DT","NO","Q"]:
#     exec(terminalDefString.format(t))
#
# but we use the following in-line expansion of the above to avoid annoying error messages in Eclipse
class N(Terminal):
    def __init__(self, lemma):
        super().__init__("N",lemma)
class A(Terminal):
    def __init__(self, lemma):
        super().__init__("A",lemma)
class Pro(Terminal):
    def __init__(self, lemma):
        super().__init__("Pro",lemma)
class D(Terminal):
    def __init__(self, lemma):
        super().__init__("D",lemma)
class Adv(Terminal):
    def __init__(self, lemma):
        super().__init__("Adv",lemma)
class V(Terminal):
    def __init__(self, lemma):
        super().__init__("V",lemma)
class P(Terminal):
    def __init__(self, lemma):
        super().__init__("P",lemma)
class C(Terminal):
    def __init__(self, lemma):
        super().__init__("C",lemma)
class DT(Terminal):
    def __init__(self, lemma):
        super().__init__("DT",lemma)
class NO(Terminal):
    def __init__(self, lemma):
        super().__init__("NO",lemma)
class Q(Terminal):
    def __init__(self, lemma):
        super().__init__("Q",lemma)

## create Phrase subclasses
#  which could be done using the following exec
# phraseDefString='''
# class {0}(Phrase):
#     def __init__(self, *elems):
#         super().__init__("{0}",elems)
# '''
# for p in ["NP","AP","AdvP","VP","PP","CP","S","SP"]:
#     exec(phraseDefString.format(p))
#
#  but we use in-line expansion of the above to avoid annoying error messages in Eclipse
class NP(Phrase):
    def __init__(self, *elems):
        super().__init__("NP",elems)
class AP(Phrase):
    def __init__(self, *elems):
        super().__init__("AP",elems)
class AdvP(Phrase):
    def __init__(self, *elems):
        super().__init__("AdvP",elems)
class VP(Phrase):
    def __init__(self, *elems):
        super().__init__("VP",elems)
class PP(Phrase):
    def __init__(self, *elems):
        super().__init__("PP",elems)
class CP(Phrase):
    def __init__(self, *elems):
        super().__init__("CP",elems)
class S(Phrase):
    def __init__(self, *elems):
        super().__init__("S",elems)
class SP(Phrase):
    def __init__(self, *elems):
        super().__init__("SP",elems)


## call to jsRealB server at `serverURL`
##    started as another process with 
##           node ...jsRealB/dist/jsRealB-server.js
##    or
##           node ...jsRealBdist/jsRealB-server-dme.js

from urllib.parse import urlencode
from urllib.request import urlopen

serverURL="http://127.0.0.1:8081"

def jsRealB(exp,lang="en"):
    params=urlencode({"lang":lang,"exp":exp})
    return urlopen(serverURL+'?'+params).read().decode()

## some unit tests
if __name__ == '__main__':
    def printEval(exp,json=False,lang="en"):
        print("**str()\n"+str(exp))
        print("**pp()\n"+exp.pp())
#         print("**pp0()\n"+exp.pp0())
        print("**show()\n"+exp.show())
        print("**jsReal\n"+jsRealB(exp if json else exp.show(-1),lang=lang))
        print("---")
    
    the=D("the")
    cat=N("cat")
    the3cats=NP(the,NO(3).dOpt({"nat":True}),cat).lang("en")
    printEval(the3cats)
        
    printEval(S(the3cats,VP(V("eat"),NP(D("a"),N("mouse")))).typ({"pas":True,"neg":True}))
    printEval(CP([C("and"),N("dog"),cat]))
    
    np=NP(N("cat").tag("a",{"href":"http://wikipedia/cat", "class":"important"}).ba("*").ba("/"))
    np.add(D("a"),0)
    np.add([A("grey"),A("black")],1)
    printEval(np)

    printEval(
    S(                        # Sentence
      Pro("him").c("nom"),    # Pronoun (citation form), nominative case
      VP(V("eat"),            # Verb at present tense by default
         NP(D("a"),           # Noun Phrase, Determiner
            N("apple").n("p") # Noun plural
           ).tag("em")        # add an <em> tag around the NP
        ))
    )

    printEval(
    S(Q("Alan Shepard"),
       VP(V("be").t("ps"),
          V("born").t("pp"),
          PP(P("on"),
             DT("1923-11-18")),
          PP(P("in"),
             Q("New Hampshire"))))
    )

    # test copy with lambda
    n=lambda:N("cat")
    printEval(CP(C("or"),
                 n().n("p"),
                 n()))
    
    # a few French examples (must use json to set the language) because 
    # currently the server is set to English
    printEval(
    S(Pro("lui").c("nom"),
      VP(V("donner").t("pc"),
         NP(D("un"),N("pomme")).pro())
            ).typ({"neg":True}).lang("fr"),
    json=True)
    
