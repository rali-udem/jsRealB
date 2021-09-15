'''
Created on 14 sept. 2021

@author: lapalme
'''

from jsRealBclass import jsRealB, N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,PP,CP
from Realization.common import realize, jsrDayPeriod, jsrHour, get_max_term, get_min_term, get_term_at


precipitationTypes = {
    "averses":{"en":N("shower").n("p"), 
               "fr":N("averse").n("p")},
    "averses_neige":{"en":N("flurry").n("p"), 
                     "fr":NP(N("averse").n("p"),PP(P("de"),N("neige")))},
    "averses_neige_fondante":{"en":NP(A("wet"),N("flurry").n("p")), 
                              "fr":NP(N("averse").n("p"),PP(P("de"),N("neige"),A("fondant")))},
    "blizzard":{"en":N("blizzard"), 
                "fr":N("blizzard")},
    "bourrasques_neige":{"en":NP(N("snow"),N("squall").n("p")), 
                         "fr":NP(N("bourrasque").n("p"),PP(P("de"),N("neige")))},
    "bruine":{"en":N("drizzle"), 
              "fr":N("bruine")},
    "bruine_verglacante" :{"en":NP(V("freeze").t("pr"),N("drizzle")), 
                           "fr":NP(N("bruine"),A("verglaçant"))},
    "cristaux_glace" :{"en":NP(N("ice"),N("crystal").n("p")), 
                       "fr":NP(N("cristal").n("p"),PP(P("de"),N("glace")))},
    "grele":{"en":N("hail"), 
             "fr":N("grêle")},
    "gresil":{"en":NP(N("ice"),N("pellet").n("p")), 
              "fr":N("grésil")},
    "neige":{"en":N("snow"), 
             "fr":N("neige")},
    "neige_fondante" :{"en":NP(A("wet"),N("snow")), 
                       "fr":NP(N("neige"),N("fondant"))},
    "orages":{"en":N("thunderstorm"), 
              "fr":N("orage").n("p")},
    "pluie":{"en":N("rain"), 
             "fr":N("pluie")},
    "pluie_verglacante":{"en":NP(V("freeze").t("pr"),N("rain")), 
                         "fr":NP(N("pluie"),A("verglaçant"))},
    "poudrerie" :{"en":NP(V("blow").t("pr"),N("snow")), 
                  "fr":N("poudrerie")},
}

def precipitation_at(prob,pcpn_term,amount_terms,lang):
    jsrExprs=[]
    pCode=pcpn_term[3]
    pType=pcpn_term[4]
    amount_term=None
    timePeriod=None
    if pCode.startswith("debut"):
        tp=jsrHour(pcpn_term[0]%24,lang)
        if tp!=None:
            if lang=="en":
                timePeriod=VP(V("begin").t("pr"),tp)
            else:
                timePeriod=VP(V("débuter").t("pr"),tp)
            amount_term=get_term_at(amount_terms,pcpn_term[0])
    elif pCode=="fin":
        tp=jsrHour(pcpn_term[1]%24,lang)
        if tp!=None:
            if lang=="en":
                timePeriod=VP(V("end").t("pr"),tp)
            else:
                timePeriod=VP(V("finir").t("pr"),tp)
            amount_term=get_term_at(amount_terms,pcpn_term[0])
    if pType in precipitationTypes:
        jsrExprs.append(NP(prob,precipitationTypes[pType][lang],timePeriod))
    else:
        jsrExprs.append(Q("[["+pType+"]]."))
    ## add amount
    if amount_term!=None:
        pcpnType=amount_term[2]
        if pcpnType=="pluie":
            if amount_term[5]>20:
                if lang=="en":
                    jsrExprs.append(NP(N("amount"),NO(round(amount_term[5])),Q("mm")))
                else:
                    jsrExprs.append(NP(N("accumulation"),P("de"),NO(round(amount_term[5])),Q("mm")))
        elif pcpnType=="neige":
            if amount_term[5]>2:
                if lang=="en":
                    jsrExprs.append(NP(N("amount"),NO(round(amount_term[5])),Q("cm")))
                else:
                    jsrExprs.append(NP(N("accumulation"),P("de"),NO(round(amount_term[5])),Q("cm")))
    return " ".join(realize(jsrExpr,lang) for jsrExpr in jsrExprs)
    

def precipitation(wInfo,period,lang):
    pcpn_terms=wInfo.get_precipitation(period)
    if pcpn_terms==None: return None
    prob_terms=wInfo.get_precipitation_probabilities(period)
    maxProbTerm=get_max_term(prob_terms,2)
    if maxProbTerm!=None and maxProbTerm[2]<=10:
        maxProbTerm=None
    amount_terms=wInfo.get_precipitation_accumulation(period)
    if maxProbTerm != None:
        ## output information associated with maxProb
        maxProbVal=maxProbTerm[2]
        if maxProbVal < 100:
            if lang=="en":
                prob=NP(NO(maxProbVal),Q("percent"),N("chance"),P("of"))
            else:
                prob=NP(NO(maxProbVal),Q("pour cent"),P("de"),N("probabilité"),P("de"))
        else:
            prob=None
        pcpn_term=get_term_at(pcpn_terms, maxProbTerm[0])
        return precipitation_at(prob,pcpn_term,amount_terms,lang)
    else:
        ## show information associated with all precipitation values
        strings=[]
        for pcpn_term in pcpn_terms:
            strings.append(precipitation_at(None,pcpn_term,amount_terms,lang))
    return " ".join(strings)


if __name__ == '__main__':
    ## exercise all precipitationTypes expressions
    for pt in precipitationTypes:
        print("%-20s : %-20s"%(realize(precipitationTypes[pt]["en"],"en",False),
                               realize(precipitationTypes[pt]["fr"],"fr",False)))
