from jsRealBclass import jsRealB, N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,SP,PP,CP
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

    

# chance of precipitation (COP) is expressed in increment of 10% when between 30% and 70% (but different than 50%...)
# when 80% or more, indicated beginning or ending
# precipitation amount is indicated if 
#          snow >= 2cm 
#          rain >= 25mm 

#### TODO:
# only one reference to COP except when
#          a 6 hour break in precipitation
#          two types of precipitation
#          more than 30% difference


def precipitation(wInfo,period,lang):
    jsrExprs=[]
    prob_terms=wInfo.get_precipitation_probabilities(period)
    type_terms=wInfo.get_precipitation_type(period)
    accum_terms=wInfo.get_precipitation_accumulation(period)
    for prob_term in prob_terms:
        prob_val=round(prob_term.infos[0]/10)*10
        type_term=get_term_at(type_terms,prob_term.start)
        if type_term!=None and prob_val>=30:     # interesting precipitation
            if prob_val <= 70 and prob_val!=50:  # show probability
                if lang=="en":
                    prob=NP(NO(prob_val),Q("percent"),N("chance"),P("of"))
                else:
                    prob=NP(NO(prob_val),Q("pour cent"),P("de"),N("probabilité"),P("de"))
                timePeriod=None
            else:                                # probability >= 80% 
                prob=None                        # indicate beginning or ending
                start=prob_term.start
                end=prob_term.end
                if wInfo.is_in_period(start,period):  
                    timePeriod=VP(V("begin" if lang=="en" else "débuter").t("pr"),jsrHour(start%24,lang))
                elif wInfo.is_in_period(end,period):
                    timePeriod=VP(V("end" if lang=="en" else "finir").t("pr"),jsrHour(end%24,lang))
                else:
                    timePeriod=None
            jsrExpr=NP(prob,precipitationTypes[type_term.infos[0]][lang],timePeriod)            
            amount_term=get_term_at(accum_terms,prob_term.start)
            if amount_term!=None:                 # check for significant amount
                pcpnType=amount_term.infos[0]
                amount=amount_term.infos[1]
                jsrAmount=None
                if pcpnType=="rain" and amount>=25:
                    jsrAmount=NP(NO(round(amount)),Q("mm"))
                elif pcpnType=="snow" and amount>=2:
                    jsrAmount=NP(NO(round(amount)),Q("cm"))
                if jsrAmount!=None:
                    if lang=="en":
                        jsrAmount.add(N("amount"),0)
                    else:
                        jsrAmount.add(N("accumulation"),0).add(P("de"),1)
                    jsrExpr=SP(jsrExpr.a(","),jsrAmount)   
            jsrExprs.append(jsrExpr)
    return " ".join(realize(jsrExpr,lang) for jsrExpr in jsrExprs)

if __name__ == '__main__':
    ## exercise all precipitationTypes expressions
    for pt in precipitationTypes:
        print("%-20s : %-20s"%(realize(precipitationTypes[pt]["en"],"en",False),
                               realize(precipitationTypes[pt]["fr"],"fr",False)))
