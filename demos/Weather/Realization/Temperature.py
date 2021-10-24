import sys
from jsRealBclass import jsRealB, N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,PP,CP
from Realization.common import realize, periodNames, jsrDayPeriod, jsrHour, get_max_term, get_min_term, get_term_at

####   Temperature

def jsrTemp(val,lang):
    if val==0: return N("zero") if lang=="en" else N("zéro")
    if val<0 : return AdvP(A("minus") if lang=="en" else Adv("moins"),NO(abs(val)))
    if val<=5 : return AP(A("plus"), NO(val)) if lang=="en" else AdvP(Adv("plus"),NO(val))
    return NO(val)

def temp_trend(lang,trend,goalTemp,when):
    if lang=="en":
        return S(N("temperature"),
                VP(V(trend).t("pr"),
                   PP(P("to"),jsrTemp(goalTemp,lang)),
                   when))
    else:
        return S(NP(N("température").n("p"),
                    PP(P("à"),NP(D("le"),N(trend)))),
                    PP(P("pour"),V("atteindre").t("b"),jsrTemp(goalTemp,lang),
                    when))

jsrAbnormal = {  
    "night":{ 
        "a":{
            "en":lambda t,_:temp_trend("en","rise",t,PP(P("by"),N("morning"))),
            "fr":lambda t,_:temp_trend("fr","hausse",t,PP(P("en"),N("matinée")))
        },
        "b":{
            "en":lambda t,u:S(Adv("low"),u.a(","),P("with"),temp_trend("en","rise",t,PP(P("by"),N("morning")))),
            "fr":lambda t,u:S(N("minimum"),u.a(","),temp_trend("fr","hausse",t,PP(P("en"),N("matinée"))))
        },
        "c":{
            "en":lambda t,p:temp_trend("en","rise",t,p).add(AdvP(Adv("then"),A("steady"))),
            "fr":lambda t,p:temp_trend("fr","hausse",t,p).add(PP(P("pour"),Adv("ensuite"),
                                                                  V("demeurer").t("b"),A("stable")))
        },
        "d":{
            "en":lambda t,p:temp_trend("en","rise",t,p).add(AdvP(Adv("then"),V("rise").t("pr"),Adv("slowly"))),
            "fr":lambda t,p:temp_trend("fr","hausse",t,p).add(AdvP(Adv("puis"),NP(N("hausse"),A("graduel"))))
        },
        "e":{
            "en":lambda t,p:temp_trend("en","rise",t,p).add(AdvP(Adv("then"),V("fall").t("pr"))),
            "fr":lambda t,p:temp_trend("fr","hausse",t,p).add(PP(P("pour"),Adv("ensuite"),
                                                                  V("être").t("b"),PP(P("à"),
                                                                                      NP(D("le"),N("baisse")))))
        },
    },
    "day":{ 
        "a":{
            "en":lambda t,_:temp_trend("en","fall",t,PP(P("by"),N("afternoon"))),
            "fr":lambda t,_:temp_trend("fr","baisse",t,PP(P("en"),N("après-midi")))
        },
        "b":{
            "en":lambda t,u:S(Adv("high"),u.a(","),P("with"),temp_trend("en","fall",t,PP(P("by"),N("afternoon")))),
            "fr":lambda t,u:S(N("maximum"),u.a(","),temp_trend("fr","baisse",t,PP(P("en"),N("après-midi"))))
        },
        "c":{
            "en":lambda t,p:temp_trend("en","fall",t,p).add(AdvP(Adv("then"),A("steady"))),
            "fr":lambda t,p:temp_trend("fr","baisse",t,p).add(PP(P("pour"),Adv("ensuite"),
                                                                  V("demeurer").t("b"),A("stable")))
        },
        "d":{
            "en":lambda t,p:temp_trend("en","fall",t,p).add(AdvP(Adv("then"),V("fall").t("pr"),Adv("slowly"))),
            "fr":lambda t,p:temp_trend("fr","baisse",t,p).add(AdvP(Adv("puis"),NP(N("baisse"),A("graduel"))))
        },
        "e":{
            "en":lambda t,p:temp_trend("en","fall",t,p).add(AdvP(Adv("then"),V("rise").t("pr"))),
            "fr":lambda t,p:temp_trend("fr","baisse",t,p).add(PP(P("pour"),Adv("ensuite"),
                                                                  V("être").t("b"),PP(P("à"),
                                                                                      NP(D("le"),N("hausse")))))
        },
    }
}                

def temperature(wInfo,period,lang):
    temperature_terms=wInfo.get_temperature(period)
    if temperature_terms == None : return None
    maxTemp=get_max_term(temperature_terms,0).infos[0]
    minTemp=get_min_term(temperature_terms,0).infos[0]
    dn= "night" if period in ["tonight","tomorrow_night"] else "day"
    tempVals=wInfo.get_temperature_values(period)
    periodName=periodNames[period][lang](wInfo.get_issue_date())
    # checking for an abnormal temperature trend, either
    #     positive change of least 3°C during the night
    #     negative change of last 3°C during the day
    (t1,t2,i1)=(maxTemp,minTemp,tempVals.index(minTemp)) if dn=="night" else\
               (minTemp,maxTemp,tempVals.index(maxTemp))
    # print("dn=",dn,"t1=",t1,"t2=",t2)
    if t1 >= t2+3:                       # abnormal change time
        if i1 <=1 :
            return realize(jsrAbnormal[dn]["a"][lang](t1, periodName),lang,False)
        else:
            if i1 < 6:        # abnormality occurs during the first 6 hours of the period
                rest=tempVals[i1:]
                if all([abs(t-t1)<=2 for t in rest]):
                    # c) remains +/- 2 for the rest of the period
                    return realize(jsrAbnormal[dn]["c"][lang](t1,periodName),lang,False)
                elif any([t-t1>2 for t in rest]):
                    # d) rises more than 2 for the rest 
                    return realize(jsrAbnormal[dn]["d"][lang](t1,periodName),lang,False)
                elif any([t1-t>2 for t in rest]):
                    # e) falls more than 2 for the rest (this should never happen!!!)
                    return realize(jsrAbnormal[dn]["e"][lang](t1,periodName),lang,False)
            else:
                # b) low temperature after the beginning (but no special case)
                
                return realize(jsrAbnormal[dn]["b"][lang](t1,jsrTemp(t2,lang)),lang,False)
    # normal case 
    res=[]                             
    if lang=="en":                      # output maximum temperature   
        res.append(realize(S(Adv("high"),jsrTemp(maxTemp,"en")),"en",False))
    else:
        res.append(realize(S(N("maximum"),jsrTemp(maxTemp,"fr")),"fr",False))
    if minTemp < maxTemp-2:             # output minimum if it differs significantly from the maximum 
        if lang=="en":
            res.append(realize(S(Adv("low"),jsrTemp(minTemp,"en")),"en",False))
        else:
            res.append(realize(S(N("minimum"),jsrTemp(minTemp,"fr")),"fr",False))
    return " ".join(res)

if __name__ == '__main__':
    def showEnFr(jsrExprEN,jsrExprFR):
        print(f" %s\n %s\n"%(realize(jsrExprEN,"en",False),realize(jsrExprFR,"fr",False)))
    ## exercise all abnormal messages
    for period in ["night","day"]:
        print(period)
        for g in jsrAbnormal[period]:
            if g=="b":
                showEnFr(jsrAbnormal[period][g]["en"](3,8), jsrAbnormal[period][g]["fr"](3,8))
            else:
                showEnFr(jsrAbnormal[period][g]["en"](4,Adv("today")), 
                         jsrAbnormal[period][g]["fr"](4,Adv("aujourd'hui")))
