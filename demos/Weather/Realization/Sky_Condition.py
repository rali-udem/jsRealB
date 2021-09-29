'''
Created on 14 sept. 2021

@author: lapalme
'''
from jsRealBclass import N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,PP,CP
from Realization.common import realize, jsrDayPeriod


## these functions return a jsrExpression to be realized

### Pubpro: section 2.3.6, 5.8
## sky condition

sky_condition_terminology = { ## row numbers in the table of section 5.8
    "c1":{"en":(AP(A("sunny")),AP(A("clear"))),
          "fr":(AP(A("ensoleillé")),AP(A("dégagé")))},
    "c2":{"en":(AP(Adv("mainly"),A("sunny")),NP(Q("a"),D("few"),N("cloud").n("p"))),
          "fr":(AP(Adv("généralement"),A("ensoleillé")),NP(D("quelque"),N("nuage").n("p")))},
    "c3":{"en":(NP(D("a"),N("mix"),PP(P("of"),CP(C("and"),N("sun"),N("cloud").n("p")))),
                AP(Adv("partly"),A("cloudy"))),
          "fr":(NP(N("alternance"),CP(C("et"),PP(P("de"),N("soleil")),PP(P("de"),N("nuage").n("p")))),
                AP(Adv("partiellement"),A("couvert")))},
    "c4":{"en":(AP(Adv("mainly"),A("cloudy")),),
          "fr":(AP(Adv("généralement"),A("nuageux")),)},
    "c5":{"en":(AP(A("cloudy")),),
          "fr":(AP(A("nuageux")),)},
    "c6":{"en":(AP(A("overcast")),),
          "fr":(AP(A("couvert")),)},
    "c7":{"en":(NP(V("increase").t("pr"),N("cloudiness")),),
          "fr":(NP(N("ennuagement")),)},
    "c8":{"en":(NP(N("clearing")),),
          "fr":(NP(N("dégagement")),)},
}

def sky_condition(mc,period,lang):
    previous_conditions=[]
    jsrExprs=[]

    def addNoRepeat(c,dn,period=None): # avoid generating same sentence twice
        if c not in previous_conditions:
            if len(sky_condition_terminology[c][lang])==1:dn=0
            jsrExpr=sky_condition_terminology[c][lang][dn]
            if period!=None:jsrExpr.add(period)
            jsrExprs.append(jsrExpr)
            previous_conditions.append(c)
            
    """ Section 2.3.6 and 5.8"""
    ### ciel: start end neb-start neb-end {ceiling-height}
    sc_terms=mc.get_sky_cover(period)
    if sc_terms==None: return None
    for sc_term in sc_terms:
        valStart=sc_term.infos[0]
        valEnd  =sc_term.infos[1]
        dayNight = 0 if period in ["today","tomorrow"] else 1
        if valStart==valEnd:
            if valStart in [0,1]:
                addNoRepeat("c1",dayNight)
            if valStart in [2,3]:
                addNoRepeat("c2",dayNight)
            if valStart in [4,5,6]:
                addNoRepeat("c3",dayNight)
            if valStart in [7,8]:
                addNoRepeat("c4",dayNight)
            if valStart in [9]:
                addNoRepeat("c5",dayNight)
            if valStart in [10]:
                addNoRepeat("c6",dayNight)
        elif valStart in [0,1,2,3] and valEnd in [7,8,9,10]:
            addNoRepeat("c7",dayNight,jsrDayPeriod(sc_term.start,lang))
        elif (valStart in [7,8,9,10] and valEnd in [0,1,2,3]) or \
             (valStart in [5,6]      and valEnd in [0,1]):
            addNoRepeat("c8",dayNight,jsrDayPeriod(sc_term.start,lang))
    return " ".join(realize(jsrExpr,lang) for jsrExpr in jsrExprs)


if __name__ == '__main__':
    ## exercise all sky_condition_terminology expressions
    for c in sky_condition_terminology:
        for lang in ["en","fr"]:
            jsrExprs=sky_condition_terminology[c][lang]
            for jsrExpr in jsrExprs:
                print(realize(jsrExpr,lang))
