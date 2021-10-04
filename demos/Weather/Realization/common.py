'''
Created on 14 sept. 2021

@author: lapalme
'''
from jsRealBclass import jsRealB, N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,PP,CP

## the jsRealB server should be launched from the jsRealB directory with
##    node dist/jsRealB-server.js demos/Weather/weatherLexicon.js

def realize(jsrExpr,lang,addS=True):
    if addS and not isinstance(jsrExpr,S):
        jsrExpr=S(jsrExpr)
    return jsRealB(jsrExpr.set_lang(lang).pp())

dayPeriods=[(0,5,{"en":lambda:NP(N("night")),"fr":lambda:NP(N("nuit"))}),
            (5,9,{"en":lambda:NP(Adv("early"),N("morning")),"fr":lambda:NP(N("début"),PP(P("de"),N("matinée")))}),
            (9,12,{"en":lambda:NP(N("morning")),"fr":lambda:NP(N("matin"))}),
            (12,18,{"en":lambda:NP(N("afternoon")),"fr":lambda:NP(N("après-midi"))}),
            (18,24,{"en":lambda:NP(N("tonight")),"fr":lambda:NP(N("soir"))}),
            ]

def jsrDayPeriod(hour,lang):
    isTomorrow=hour>23
    hour=hour%24
    for (s,e,jsrExp) in dayPeriods:
        if hour in range(s,e):
            exp=jsrExp[lang]()
            if isTomorrow:
                return exp.add(N("tomorrow" if lang=="en" else "demain"),0)
            elif s!=18:
                return exp.add(D("this" if lang=="en" else "ce"),0)

dayOnly={"day":True,"year": False, "month": False, "date": False,"hour":False,"minute":False, "second": False,"det":False}
periodNames = {
    "today":{"en":lambda _:N("today"),"fr":lambda _:Adv("aujourd'hui")},
    "tonight":{"en":lambda _:N("tonight"),"fr":lambda _:CP(C("et"),NP(D("ce"),N("soir")),NP(D("ce"),N("nuit")))},
    "tomorrow":{"en":lambda d:DT(d).dOpt(dayOnly),"fr":lambda d:DT(d).dOpt(dayOnly)},
    "tomorrow_night":{"en":lambda d:NP(DT(d).dOpt(dayOnly),N("night")),"fr":lambda d:NP(DT(d).dOpt(dayOnly),N("soir"))}
}

### time generation

def jsrHour(h,lang):
    if h in range(0,6):
        return PP(P("during"),NP(D("the"),N("night"))) if lang=="en" else \
               PP(P("durant"),NP(D("le"),N("nuit")))
    if h in range(6,11):
        return PP(P("in"),NP(D("the"),N("morning"))) if lang=="en" else \
               NP(D("le"),N("matin"))
    if h in range(11,14):
        return PP(P("around"),N("noon")) if lang=="en" else \
               PP(P("vers"),N("midi"))
    if h in range(14,18):
        return PP(P("in"),NP(D("the"),N("afternoon"))) if lang=="en"  else \
               PP(P("durant"),NP(D("le"),N("après-midi")))
    if h in range(18,24):
        return PP(P("in"),NP(D("the"),N("evening"))) if lang=="en"  else \
               PP(P("dans"),NP(D("le"),N("soirée"))) 
    
def get_term_at(terms,hour):
    if terms==None or len(terms)==0:return None  
    for term in terms:
        if hour<=term.end:
            return term
    return None
    # print("should never happen: get_value_at(%d) not found\n%s"%(hour,terms))
    # tb = sys.exc_info()[2]
    # raise IndexError().with_traceback(tb)
        
def get_fn_term(terms,idx,cmp):
    if terms==None or len(terms)==0 :return None 
    maxTerm=terms[0]
    for i in range(1,len(terms)):
        if cmp(terms[i].infos[idx],maxTerm.infos[idx]):
            maxTerm=terms[i]
    return maxTerm

def get_max_term(terms,idx):
    return get_fn_term(terms,idx,lambda x,y:x>y)

def get_min_term(terms,idx):
    return get_fn_term(terms,idx,lambda x,y:x<y)

if __name__ == '__main__':
    for lang in ["en","fr"]:
        print(lang)
        for h in range(0,24,2):
            print(" %2d : %s"%(h,realize(jsrHour(h,lang),lang)))