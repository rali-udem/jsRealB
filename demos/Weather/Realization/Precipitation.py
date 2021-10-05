from jsRealBclass import jsRealB, N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,PP,CP
from Realization.common import realize, jsrDayPeriod, jsrHour, get_max_term, get_min_term, get_term_at

precipitationTypes = {
    "showers":{"en":N("shower").n("p"), 
               "fr":N("averse").n("p")},
    "flurries":{"en":N("flurry").n("p"), 
                     "fr":NP(N("averse").n("p"),PP(P("de"),N("neige")))},
    "wet-flurries":{"en":NP(A("wet"),N("flurry").n("p")), 
                              "fr":NP(N("averse").n("p"),PP(P("de"),N("neige"),A("fondant")))},
    "blizzard":{"en":N("blizzard"), 
                "fr":N("blizzard")},
    "snow-squalls":{"en":NP(N("snow"),N("squall").n("p")), 
                         "fr":NP(N("bourrasque").n("p"),PP(P("de"),N("neige")))},
    "drizzle":{"en":N("drizzle"), 
              "fr":N("bruine")},
    "freezing-drizzle" :{"en":NP(V("freeze").t("pr"),N("drizzle")), 
                           "fr":NP(N("bruine"),A("verglaçant"))},
    "ice-crystals" :{"en":NP(N("ice"),N("crystal").n("p")), 
                       "fr":NP(N("cristal").n("p"),PP(P("de"),N("glace")))},
    "hail":{"en":N("hail"), 
             "fr":N("grêle")},
    "ice-pellets":{"en":NP(N("ice"),N("pellet").n("p")), 
              "fr":N("grésil")},
    "snow":{"en":N("snow"), 
             "fr":N("neige")},
    "wet-snow" :{"en":NP(A("wet"),N("snow")), 
                       "fr":NP(N("neige"),N("fondant"))},
    "thunderstorm":{"en":N("thunderstorm"), 
              "fr":N("orage").n("p")},
    "rain":{"en":N("rain"), 
             "fr":N("pluie")},
    "freezing-rain":{"en":NP(V("freeze").t("pr"),N("rain")), 
                         "fr":NP(N("pluie"),A("verglaçant"))},
    "blowing-snow" :{"en":NP(V("blow").t("pr"),N("snow")), 
                  "fr":N("poudrerie")},
}

def precipitation_at(prob,pcpn_term,amount_terms,lang):
    jsrExprs=[]
    pType=pcpn_term.infos[0]
    amount_term=None
    timePeriod=None
    tp=jsrHour(pcpn_term.start%24,lang)
    if tp!=None:
        if lang=="en":
            timePeriod=VP(V("begin").t("pr"),tp)
        else:
            timePeriod=VP(V("débuter").t("pr"),tp)
        amount_term=get_term_at(amount_terms,pcpn_term.start)
    tp=jsrHour(pcpn_term.end%24,lang)
    if tp!=None:
        if lang=="en":
            timePeriod=VP(V("end").t("pr"),tp)
        else:
            timePeriod=VP(V("finir").t("pr"),tp)
        amount_term=get_term_at(amount_terms,pcpn_term.start)
    if pType in precipitationTypes:
        jsrExprs.append(NP(prob,precipitationTypes[pType][lang],timePeriod))
    else:
        jsrExprs.append(Q("[["+pType+"]]."))
    ## add amount
    if amount_term!=None:
        pcpnType=amount_term.infos[0]
        amount=amount_term.infos[1]
        if pcpnType=="rain":
            if amount>=25:
                if lang=="en":
                    jsrExprs.append(NP(N("amount"),NO(round(amount)),Q("mm")))
                else:
                    jsrExprs.append(NP(N("accumulation"),P("de"),NO(round(amount)),Q("mm")))
        elif pcpnType=="snow":
            if amount>=2:
                if lang=="en":
                    jsrExprs.append(NP(N("amount"),NO(round(amount)),Q("cm")))
                else:
                    jsrExprs.append(NP(N("accumulation"),P("de"),NO(round(amount)),Q("cm")))
    return " ".join(realize(jsrExpr,lang) for jsrExpr in jsrExprs)
    

# chance of precipitation (COP) is expressed in increment of 10% when between 30% and 70% (but different than 50%...)
# when 80% or more, indicated beginning or ending
# only one reference to COP except when
#          a 6 hour break in precipitation
#          two types of precipitation
#          more than 30% difference

# precipitation amount is indicated if 
#          snow >= 2cm 
#          rain >= 25mm 


def precipitation(wInfo,period,lang):
    last_cop=None
    last_time=None
    jsrExprs=[]
    prob_terms=wInfo.get_precipitation_probabilities(period)
    type_terms=wInfo.get_precipitation_type(period)
    accum_terms=wInfo.get_precipitation_accumulation(period)
    for prob_term in prob_terms:
        prob_val=round(prob_term.infos[0]/10)*10
        if prob_val>=30:
            if prob_val <= 70 and prob_val!=50:
                if lang=="en":
                    prob=NP(NO(prob_val),Q("percent"),N("chance"),P("of"))
                else:
                    prob=NP(NO(prob_val),Q("pour cent"),P("de"),N("probabilité"),P("de"))
                timePeriod=None
            else:
                # check the time of
                start=prob_term.start
                end=prob_term.end
                if wInfo.is_in_period(start,period):
                    time=get_term_at(type_terms,start)
                    if lang=="en":
                        timePeriod=VP(V("begin").t("pr"),jsrHour(start%24,lang))
                    else:
                        timePeriod=VP(V("débuter").t("pr"),jsrHour(start%24,lang))
                elif wInfo.is_in_period(end,period):
                    time=get_term_at(type_terms,end)
                    if lang=="en":
                        timePeriod=VP(V("end").t("pr"),jsrHour(end%24,lang))
                    else:
                        timePeriod=VP(V("finir").t("pr"),jsrHour(end%24,lang))
                else:
                    timePeriod=None
                    
        amount_term=get_term_at(amount_terms,pcpn_term.start)

        else:
            prob=None
            time=None
            
           
            
            
            
            
    
    
    pcpn_terms=wInfo.get_precipitation_type(period)
    if pcpn_terms==None: return None
    maxProbTerm=get_max_term(prob_terms,0)
    if maxProbTerm!=None and maxProbTerm.infos[0]<=10:
        maxProbTerm=None
    amount_terms=wInfo.get_precipitation_accumulation(period)
    if maxProbTerm != None:
        ## output information associated with maxProb
        maxProbVal=maxProbTerm.infos[0]
        if maxProbVal < 100:
            if lang=="en":
                prob=NP(NO(maxProbVal),Q("percent"),N("chance"),P("of"))
            else:
                prob=NP(NO(maxProbVal),Q("pour cent"),P("de"),N("probabilité"),P("de"))
        else:
            prob=None
        pcpn_term=get_term_at(pcpn_terms, maxProbTerm.start)
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
