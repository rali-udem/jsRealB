%%
%%        jsRealB JSON structure creation and output in SWI-Prolog
%%
:- use_module(library(http/json)).

%% examples of representation:
%%    N("cat").n("p") == 
%%      json([terminal="N", lemma="cat", props=json([n=p])])
%%    can be created with: makeTerminal("N","cat",n=p,N)
%%
%%    NP(D("a"),N("cat").n("p")).cap() == 
%%      json([phrase="NP", 
%%            elements=[json([terminal="D", lemma="a", props=json([])]), 
%%                      json([terminal="N", lemma="cat", props=json([n=p])])], 
%%            props=json([cap=""])]) 
%%    can be created with:
%%       makeTerminal("D","a",D),makeTerminal("N","cat",N),makePhrase("NP",[D,N],cap="",NP)

%%% Creation of JSON structures

%% create a Phrase
makePhrase(Type,Elements,Phrase)    :-makePhrase(Type,Elements,[],Phrase).
makePhrase(Type,Elements,Prop,json([phrase=Type,elements=ElementsL,props=json(PropL)])):-
    ensureList(Elements,ElementsL),
    ensureList(Prop,PropL).
%% create a Terminal
makeTerminal(Type,Lemma,Terminal):-makeTerminal(Type,Lemma,[],Terminal).
makeTerminal(Type,Lemma,Prop, json([terminal=Type,lemma=Lemma,props=json(PropL)])):-
    ensureList(Prop,PropL).

%% access to components
getPhrase(json(Pairs),Phrase)    :-member(phrase=Phrase,Pairs).
getTerminal(json(Pairs),Terminal):-member(terminal=Terminal,Pairs).
getLemma(json(Pairs),Lemma)      :-member(lemma=Lemma,Pairs).
getElements(json(Pairs),Elements):-member(elements=Elements,Pairs).
getProps(json(Pairs),Props)      :-member(props=json(Props),Pairs).

ensureList(List,List):-is_list(List).
ensureList(Elem,[Elem]).    

%% add a new props field
addProp(null,JSON,JSON).
addProp(NewProp,json(Elements),json(Elements1)):-
    select(props=json(Props),Elements,ElementsNoprops),
    append(ElementsNoprops,[props=json([NewProp|Props])],Elements1).
%% change the props field
setProps(NewProps,json(Elements),json(Elements1)):-
    select(props=_,Elements,ElementsNoProps),
    append(ElementsNoProps,[props=json(NewProps)],Elements1).
%% init the props field
initProps(JSONin,JSONout):-
    setProps([],JSONin,JSONout).

%% add a new sentence type
addSentenceType(Types,json(JSElemsIn),json(JSElemsOut)):-
    ensureList(Types,TypesL),
    select(props=json(Props),JSElemsIn,JSElems1),
    (select(typ=json(OldTypes),Props,RestProps)-> %% check if typ is already there
        append(OldTypes,TypesL,NewTypes);
        (NewTypes=TypesL,RestProps=Props)),
    append(RestProps,[typ=json(NewTypes)],NewProps),
    append(JSElems1,[props=json(NewProps)],JSElemsOut).
%% add a list of sentence types
addSentenceTypes(Types,JSONin,JSONout):-
    foldl(addSentenceType,Types,JSONin,JSONout).

%% add new element before the ones already there
addElementBefore(NewElem,json([phrase=Type,elements=Elements,props=Props]),
                 json([phrase=Type,elements=AllElements,props=Props])):-
    ensureList(NewElem,NewElemL),
    append(NewElemL,Elements,AllElements).
%% add a new element at the end of the ones already there
addElementAfter(NewElem,json([phrase=Type,elements=Elements, props=Props]),
                json([phrase=Type,elements=AllElements,props=Props])):-
    ensureList(NewElem,NewElemL),
    append(Elements,NewElemL,AllElements).

%%%  Output of JSON structures

%% show JSON using the standard printing, with option for proper output of JSON constants
showJSON(JSON)  :- json_write(current_output,JSON,[true(true),false(false),null(null)]),nl.
showJSON0(JSON) :- json_write(current_output,JSON,[true(true),false(false),null(null),width(0)]).
% %% examples
% ?- makeTerminal("D","a",D),makeTerminal("N","cat",N),makePhrase("NP",[D,N],cap="",NP),showJSON(NP).
% {
%   "phrase":"NP",
%   "elements": [
%     {"terminal":"D", "lemma":"a", "props": {}},
%     {"terminal":"N", "lemma":"cat", "props": {}}
%   ],
%   "props": {"cap":""}
% }
% ?- makeTerminal("D","a",D),makeTerminal("N","cat",N),makePhrase("NP",[D,N],cap="",NP),showJSON0(NP).
% {"phrase":"NP", "elements": [ {"terminal":"D", "lemma":"a", "props": {}},  {"terminal":"N", "lemma":"cat", "props": {}} ], "props": {"cap":""}}

%% pretty-print of JSON structures

% create an atom of N spaces... must force evaluation of N which format does not do...
indent(-1)--> [','].
indent(N) --> {N1 is N,format(atom(S),',\n~*+~w',[N1,''])},[S].
% output a quoted term
quote(T) --> {with_output_to(atom(QT),writeq(T))},[QT].

%% DCG for pretty-printing a JSON
ppJSON(Json)  :-phrase(ppJSON(Json,0),PP),atomic_list_concat(PP,S),writeln(S).

ppJSON(json([]),_)    --> [].
ppJSON(json(Elems),N) --> !,['{'],ppJSONList(Elems,false,N+1),['}'].
ppJSON(C,_)           --> {memberchk(C,[true,false,null])},!,[C].
ppJSON(T,_)           --> {atomic(T)},!,quote(T).
ppJSON(X=Y,N)         --> !,['"'],quote(X),['"'],[":"],{write_length(X,L,[quoted(true)]),N1 is N+L+3},
                          ppJSON(Y,N1).
ppJSON({X},N)         --> !,['{'],ppJSON(X,N+1),['}'].
ppJSON(X,N)           --> ['['],ppJSONList(X,false,N+1),[']'].
ppJSON(X,_)           --> {writeln("strange JSON":X)}.

ppJSONList([],_,_)              --> [].
ppJSONList([_=json([])],_,_)    --> [].
ppJSONList([Arg|Args],Indent,N) -->({Indent}->indent(N);[]),ppJSON(Arg,N),ppJSONList(Args,true,N).
%% example
% ?- makeTerminal("D","a",D),makeTerminal("N","cat",N),makePhrase("NP",[D,N],cap="",NP),ppJSON(NP).
% {"phrase":"NP",
%  "elements":[{"terminal":"D",
%               "lemma":"a"},
%              {"terminal":"N",
%               "lemma":"cat"}],
%  "props":{"cap":""}}
%

%%  more compact printing of JSON Syntactic Representations
ppSyntR(SyntR) :- 
    phrase(ppSyntR(SyntR,0),Tokens),
    atomic_list_concat(Tokens,S),
    writeln(S).

ppSyntR(json([phrase=Phrase,elements=Elements,props=Props]),N) --> !,
    ['{'],ppSyntRList([phrase=Phrase,props=Props],-1),
          indent(N+1),['"elements":['],ppSyntRList(Elements,N+13),[']'],
    ['}'].
ppSyntR(json(Terminal),_) --> ['{'],ppSyntRList(Terminal,-1),['}'].
ppSyntR(X=Y,_)            --> ['"'],ppJSON(X,_),['":'],ppSyntR(Y,-1).
ppSyntR(X,N)              --> ppJSON(X,N).

ppSyntRList([],_)           --> [].
ppSyntRList([Pair],N)       --> ppSyntR(Pair,N).
ppSyntRList([Pair|Pairs],N) --> ppSyntR(Pair,N),indent(N),ppSyntRList(Pairs,N).
%% example 
% ?- makeTerminal("D","a",D),makeTerminal("N","cat",N),makePhrase("NP",[D,N],cap="",NP),ppSyntR(NP).
% {"phrase":"NP","props":{"cap":""},
%  "elements":[{"terminal":"D","lemma":"a","props":{}},
%              {"terminal":"N","lemma":"cat","props":{}}]}

%% show an indented jsRealB constituent expression string from a JSON structure
%%   this is done using a DCG 
fromJSON(Json):-phrase(fromJSON(Json,0),PP),atomic_list_concat(PP,S),writeln(S).

fromJSON(json([phrase=Phrase,elements=Elements,props=json(Props)]),N) -->
    [Phrase,'('],{write_length(Phrase,L,[]),N1 is N+L+1},fromJSON(Elements,N1),[')'],props(Props).
fromJSON(json([terminal=Terminal,lemma=Lemma,props=json(Props)]),_N)  -->
    [Terminal,'("',Lemma,'")'],props(Props).
fromJSON([Elem],N)       --> fromJSON(Elem,N).
fromJSON([Elem|Elems],N) --> fromJSON(Elem,N),indent(N),fromJSON(Elems,N).

props([])                     --> [].
props([(K="")|Ps])            --> ['.',K,'()'],props(Ps).
props([(K=json(KeyVals))|Ps]) --> ['.',K,'({'],keyVals(KeyVals),['})'],props(Ps).
props([(K=Vs)|Ps])            --> {is_list(Vs)}, propList(K,Vs),props(Ps).
props([(K=V)|Ps])             --> ['.',K,'("',V,'")'],props(Ps).

keyVals([K=V])       --> [K,':'],showVal(V).
keyVals([(K=V)|KVs]) --> [K,':'],showVal(V),[','], keyVals(KVs).

propList(_K,[]) --> [].
propList(K,[V|Vs]) --> ['.',K,'('],showVal(V),[')'],propList(K,Vs).

showVal(true) --> ['true'].
showVal(false)--> ['false'].
showVal(null) --> ['null'].
showVal(Val)  --> ['"',Val,'"'].
%% example
% ?- makeTerminal("D","a",D),makeTerminal("N","cat",N),makePhrase("NP",[D,N],cap="",NP),fromJSON(NP).
% NP(D("a"),
%    N("cat")).cap()

% call the jsRealServer to write the realization
% server should previously be launched with
%  node ...jsRealB/dist/server-dme.js
:- use_module(library(http/http_open)).

jsRealB(SyntR,Sent):-
    with_output_to(string(JSON),showJSON0(SyntR)),
    uri_encoded(query_value, JSON, JSONEncoded),
    atom_concat('http://127.0.0.1:8081/?lang=en&exp=', JSONEncoded, URL),
    http_open(URL, In, []),
    set_stream(In,encoding(utf8)),
    read_string(In, "\n", "\r", _, Sent),
    close(In).

%% example
% ?- makeTerminal("D","a",D),makeTerminal("N","cat",N),makePhrase("NP",[D,N],cap="",NP),jsRealB(NP,Sent).
% D = json([terminal="D", lemma="a", props=json([])]),
% N = json([terminal="N", lemma="cat", props=json([])]),
% NP = json([phrase="NP", elements=[json([terminal="D", lemma="a", ... = ...]), json([terminal="N", ... = ...|...])], props=json([cap=""])]),
% Sent = "A cat" .
