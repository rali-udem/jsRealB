import sys
sys.path.append("../../build")
from jsRealBclass import *


periodNames = {
    "today":{"en":N("today"),"fr":N("aujourd'hui")},
    "tonight":{"en":N("tonight"),"fr":NP(D("ce"),N("soir"))},
    "tomorrow":{"en":N("tomorrow"),"fr":N("demain")},
    "tomorrow_night":{"en":NP(N("tomorrow"),N("night")),"fr":NP(N("demain"),N("soir"))}
}

### time generation
def jsrTime(dt,lang):
    return PP(P("at" if lang =="en" else "à"),
              DT(dt).dOpt({"year":False , "month": False , "date":False , "day":False , 
                           "hour":True , "minute":True , "second":False , 
                           "nat":False, "det":False, "rtime":False}))

def jsrDay(dt):
    return  DT(dt).dOpt({"year":False , "month": False , "date":False , "day":True , 
                           "hour":False , "minute":False , "second":False , 
                           "nat":False, "det":False, "rtime":False})
    
def jsrDate(dt):
    return  DT(dt).dOpt({"year":True , "month": True , "date":True , "day":False , 
                           "hour":False , "minute":False , "second":False , 
                           "nat":True, "det":True, "rtime":False})


def jsrHour(h,lang):
    if h in [0,6]:
        return PP(P("during"),NP(D("the"),N("night"))) if lang=="en" else \
               PP(P("durant"),NP(D("le"),N("nuit")))
    if h in [7,10]:
        return PP(P("in"),NP(D("the"),N("morning"))) if lang=="en" else \
               NP(D("le"),N("matin"))
    if h in [11,12,13]:
        return PP(P("around"),N("noon")) if lang=="en" else \
               PP(P("vers"),N("midi"))
    if h in [14,18]:
        return PP(P("in"),NP(D("the"),N("afternoon"))) if lang=="en"  else \
               PP(P("durant"),NP(D("le"),N("après-midi")))
    if h in [19,24]:
        return PP(P("in"),NP(D("the"),N("evening"))) if lang=="en"  else \
               PP(P("dans"),NP(D("le"),N("soirée"))) 
    
dayPeriods=[(0,5,{"en":lambda:NP(N("night")),"fr":lambda:NP(N("nuit"))}),
            (5,9,{"en":lambda:NP(Adv("early"),N("morning")),"fr":lambda:NP(N("début"),PP(P("de"),N("matinée")))}),
            (9,12,{"en":lambda:NP(N("morning")),"fr":lambda:NP(N("matin"))}),
            (12,18,{"en":lambda:NP(N("afternoon")),"fr":lambda:NP(N("après-midi"))}),
            (18,24,{"en":lambda:NP(N("tonight")),"fr":lambda:NP(N("soir"))}),
            ]

def jsrDayPeriod(data,lang,hour):
    # print("hour",hour)
    hour=hour-data.tzH;
    isTomorrow=hour>23
    for (s,e,jsrExp) in dayPeriods:
        if hour in range(s,e):
            exp=jsrExp[lang]()
            if isTomorrow:
                return exp.add(N("tomorrow" if lang=="en" else "demain"),0)
            elif s!=18:
                return exp.add(D("this" if lang=="en" else "ce"),0)

precipitationTypes = {
    "averses":{"en":N("shower").n("p"), 
               "fr":N("averse").n("p")},
    "averses_neige":{"en":N("flurry").n("p"), 
                     "fr":NP(N("averse").n("p"),PP("de",N("neige")))},
    "averses_neige_fondante":{"en":NP(A("wet"),N("flurry").n("p")), 
                              "fr":NP(N("averse").n("p"),PP("de",N("neige"),A("fondante")))},
    "blizzard":{"en":N("blizzard"), 
                "fr":N("blizzard")},
    "bourrasques_neige":{"en":NP(N("snow"),N("squall").n("p")), 
                         "fr":NP(N("bourrasque").n("p"),PP(D("de"),N("neige")))},
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
                       "fr":NP(N("neige"),N("fondante"))},
    "orages":{"en":N("thunderstorm"), 
              "fr":N("orage").n("p")},
    "pluie":{"en":N("rain"), 
             "fr":N("pluie")},
    "pluie_verglacante":{"en":NP(V("freeze").t("pr"),N("rain")), 
                         "fr":NP(N("pluie"),A("verglaçant"))},
    "poudrerie" :{"en":NP(V("blow").t("pr"),N("snow")), 
                  "fr":N("poudrerie")},
}

# e | nil | n | ne | nw | w | ely | nly | nely | nwly | wly | sly| sely | swly | sly | sely | sw | vrbl
jsrWindDirection = {
    "e":    {"en":Adv("east"),       "fr":N("est"), "deg":90},
    "n":    {"en":Adv("north"),      "fr":N("nord"),  "deg":0},
    "ne":   {"en":Adv("northeast"),  "fr":N("nord-est"), "deg":45},
    "nw":   {"en":Adv("northwest"),  "fr":N("nord-ouest"),"deg":315},
    "w":    {"en":Adv("west"),       "fr":N("ouest"),"deg":290},
    "ely":  {"en":Adv("easterly"),   "fr":NP(N("secteur"),N("est")), "deg":90},
    "nly":  {"en":Adv("northerly"),  "fr":NP(N("secteur"),N("nord")),  "deg":0},
    "nely": {"en":A("northeasterly"),"fr":NP(N("secteur"),N("nord-est")), "deg":45},
    "nwly": {"en":A("northwesterly"),"fr":NP(N("secteur"),N("nord-ouest")),"deg":315},
    "wly":  {"en":Adv("westerly"),   "fr":NP(N("secteur"),N("ouest")),"deg":270},
    "sly":  {"en":Adv("southerly"),  "fr":NP(N("secteur"),N("sud")),"deg":180},
    "sely": {"en":A("southeasterly"),"fr":NP(N("secteur"),N("sud-est")),"deg":135},
    "swly": {"en":A("southwesterly"),"fr":NP(N("secteur"),N("sud-ouest")),"deg":225},
    "sly":  {"en":Adv("southerly"),  "fr":NP(N("secteur"),N("sud")),"deg":180},
    "se":   {"en":Adv("southeast"),  "fr":N("sud-est"),"deg":135},
    "s":    {"en":Adv("south"),      "fr":N("sud"),"deg":180},
    "sw":   {"en":Adv("southwest"),  "fr":N("sud-ouest"),"deg":225},
    # "vrbl": {"en":A("variable"),     "fr":A("variable")},
}


# find the difference between compass direction differences
# adapted from https://www.mrexcel.com/board/threads/compass-direction-differences.213199
def dir_diff(dir1,dir2):
    dir1=jsrWindDirection[dir1]["deg"]
    dir2=jsrWindDirection[dir2]["deg"]
    if dir1 >180 : dir1-=180
    else: dir1+=180
    if dir2 >180 : dir2-=180
    else: dir2+=180
    return abs(dir1-dir2)


def jsrTemp(val,lang):
    if val==0: return N("zero") if lang=="en" else N("zéro")
    if val<0 : return AdvP(A("minus") if lang=="en" else Adv("moins"),NO(abs(val)))
    if val<=5 : return AP(A("plus"), NO(val)) if lang=="en" else AdvP(Adv("plus"),NO(val))
    return NO(val)
    
uv_ranges= [(2,   {"en":A("low"),                     "fr":A("bas")}), 
            (5,   {"en":A("moderate"),                "fr":A("modéré")}), 
            (7,   {"en":A("high"),                    "fr":A("élevé")}), 
            (10,  {"en":AdvP(Adv("very"),Adv("high")),"fr":AdvP(Adv("très"),A("élevé"))}), 
            (1000,{"en":A("extreme"),                 "fr":A("extrême")})
           ]


def pVal(p):    
    return "this" if p in ["today","tonight"] else "in the"

# abnormal = {
    # "night":{
        # "a":{
            # "en":lambda t,_:(f"Temperature rising to {tVal(t,'en')} by morning."),
            # "fr":lambda t,_:(f"Températures à la hausse pour atteindre {tVal(t,'fr')} en matinée.")
        # },
        # "b":{
            # "en":lambda t,u,_:(f"Low {tVal(u,'en')} with temperature rising to {tVal(t,'en')} by morning."),
            # "fr":lambda t,u,_:(f"Minimum {tVal(u,'fr')}. Températures à la hausse pour atteindre {tVal(t,'fr')} en matinée.")
        # },
        # "c":{
            # "en":lambda t,p:(f"Temperature rising to {tVal(t,'en')} {pVal(p)} evening then steady."),
            # "fr":lambda t,_:(f"Températures à la hausse pour atteindre {tVal(t,'fr')} en soirée "+
                              # f"pour ensuite demeurer stables.")
        # },
        # "d":{
            # "en":lambda t,p:(f"Temperature rising to {tVal(t,'en')} {pVal(p)} evening then rising slowly."),
            # "fr":lambda t,_:(f"Températures à la hausse pour atteindre {tVal(t,'fr')} en soirée, "+
                              # f"puis hausse graduelle.")
        # },
        # "e":{
            # "en":lambda t,p:(f"Temperature rising to {tVal(t,'en')} {pVal(p)} evening then falling."),
            # "fr":lambda t,_:(f"Températures à la hausse pour atteindre {tVal(t,'fr')} en soirée,"+
                              # f" pour ensuite être à la baisse.")
        # },
    # },
    # "day":{
        # "a":{
            # "en":lambda t,p:(f"Temperature falling to {tVal(t,'en')} {pVal(p)} afternoon."),
            # "fr":lambda t,_:(f"Températures à la baisse pour atteindre {tVal(t,'fr')} en après-midi.")
        # },
        # "b":{
            # "en":lambda t,u,p:(f"High {tVal(u,'en')} with temperature falling to {tVal(t,'en')} {pVal(p)} afternoon."),
            # "fr":lambda t,u,p:(f"Minimum {tVal(u,'fr')}. Températures à la baisse pour atteindre {tVal(t,'fr')} en après-midi.")
        # },
        # "c":{
            # "en":lambda t,p:(f"Temperature falling to {tVal(t,'en')} {pVal(p)} morning then steady."),
            # "fr":lambda t,_:(f"Températures à la baisse pour atteindre {tVal(t,'fr')} en matinée "+
                              # f"pour ensuite demeurer stables.")
        # },
        # "d":{
            # "en":lambda t,p:(f"Temperature falling to {tVal(t,'en')} {pVal(p)} evening then falling slowly."),
            # "fr":lambda t,_:(f"Températures à la hausse pour atteindre {tVal(t,'fr')} en soirée, "+
                              # f"puis baisse graduelle,")
        # },
        # "e":{
            # "en":lambda t,p:(f"Temperature falling to {tVal(t,'en')} {pVal(p)} evening then rising."),
            # "fr":lambda t,_:(f"Températures à la hausse pour atteindre {tVal(t,'fr')} en soirée,"+
                              # f" pour ensuite être à la hausse.")
        # },
    # }
# } 

def temp_trend(lang,trend,goalTemp,when):
    if lang=="en":
        S(N("temperature"),
          VP(V(trend).t("pr"),
             PP(P("to"),jsrTemp(goalTemp)),
             when))
    else:
        S(NP(N("température").n("p"),
             PP(P("à"),NP(D("le"),N(trend)))),
             PP(P("pour"),V("atteindre").t("b"),jsrTemp(goalTemp),
             when))

dayPeriods=[(0,5,{"en":lambda:NP(N("night")),"fr":lambda:NP(N("nuit"))}),
            (5,9,{"en":lambda:NP(Adv("early"),N("morning")),"fr":lambda:NP(N("début"),PP(P("de"),N("matinée")))}),
            (9,12,{"en":lambda:NP(N("morning")),"fr":lambda:NP(N("matin"))}),
            (12,18,{"en":lambda:NP(N("afternoon")),"fr":lambda:NP(N("après-midi"))}),
            (18,24,{"en":lambda:NP(N("tonight")),"fr":lambda:NP(N("soir"))}),
            ]


# jsrAbnormal = {
    # "night":{ 
        # "a":{
            # "en":lambda t:temp_trend("en","rise",t,PP(P("by"),N("morning"))),
            # "fr":lambda t:temp_trend("fr","hausse",t,PP(P("en"),N("matinée")))
        # },
        # "b":{
            # "en":lambda t:S(NP(N("low"),u,P("with"),temp_trend("en","rise",t,PP(P("by"),N("morning"))))),
            # "fr":lambda t:S(NP(N("minimum"),u),temp_trend("fr","hausse"),t,PP(P("en"),N("matinée")))
        # }
    # }
# }


## these functions return a jsrExpression to be realized

### Pubpro: section 2.3.6, 5.8
## sky condition

sky_condition_terminology = { ## row numbers in the table of section 5.8
    "c1":{"en":(A("sunny"),A("clear")),
          "fr":(A("ensoleillé"),A("dégagé"))},
    "c2":{"en":(AP(Adv("mainly"),A("sunny")),NP(Q("a"),D("few"),N("cloud").n("p"))),
          "fr":(AP(Adv("généralement"),A("ensoleillé")),NP(D("quelque"),N("nuage").n("p")))},
    "c3":{"en":(NP(D("a"),N("mix"),PP(P("of"),CP(C("and"),N("sun"),N("cloud").n("p")))),
                AP(Adv("partly"),A("cloudy"))),
          "fr":(NP(N("alternance"),CP(C("et"),PP(P("de"),N("soleil")),PP(P("de"),N("nuage").n("p")))),
                AP(Adv("partiellement"),A("couvert")))},
    "c4":{"en":(AP(Adv("mainly"),A("cloudy")),),
          "fr":(AP(Adv("généralement"),A("nuageux")),)},
    "c5":{"en":(A("cloudy"),),
          "fr":(A("nuageux"),)},
    "r6":{"en":(A("overcast"),),
          "fr":(A("couvert"),)},
    "c7":{"en":(NP(V("increase").t("pr"),N("cloudiness")),),
          "fr":(N("ennuagement"),)},
    "c8":{"en":(N("clearing"),),
          "fr":(N("dégagement"),)},
}

## exercise all sky_condition_terminology expressions
def show_all_sky_conditions():
    for c in sky_condition_terminology:
        for lang in ["en","fr"]:
            jsrExprs=sky_condition_terminology[c][lang]
            for jsrExpr in jsrExprs:
                print(jsRealB(jsrExpr.lang(lang).pp()))

def sky_condition(mc,period,lang):
    def addNoRepeat(list,newVal): # avoid generating same sentence twice
        if newVal not in list:
            list.append(newVal)
    """ Section 2.3.6 and 5.8"""
    ### ciel: start end neb-start neb-end {ceiling-height}
    sc_terms=mc.get_sky_condition(period)
    if sc_terms==None: return None
    sents=[]
    delta=mc.get_delta_with_utc()
    for sc_term in sc_terms:
        valStart=sc_term[2]
        valEnd  =sc_term[3]
        dayNight = 0 if period in ["today","tomorrow"] else 1
        if valStart==valEnd:
            if valStart in [0,1]:
                addNoRepeat(sents,sky_condition_terminology["r1"][lang][dayNight])
            if valStart in [2,3]:
                addNoRepeat(sents,sky_condition_terminology["r2"][lang][dayNight])
            if valStart in [4,5,6]:
                addNoRepeat(sents, sky_condition_terminology["r3"][lang][dayNight])
            if valStart in [7,8]:
                addNoRepeat(sents,sky_condition_terminology["r4"][lang][dayNight])
            if valStart in [9]:
                addNoRepeat(sents,sky_condition_terminology["r5"][lang][dayNight])
            if valStart in [10]:
                addNoRepeat(sents,sky_condition_terminology["r6"][lang][dayNight])
        elif valStart in [0,1,2,3] and valEnd in [7,8,9,10]:
            addNoRepeat(sents,sky_condition_terminology["r7"][lang][dayNight]+
                         " "+get_time_period_name((sc_term[0]-delta)%24, lang))
        elif (valStart in [7,8,9,10] and valEnd in [0,1,2,3]) or \
             (valStart in [5,6]      and valEnd in [0,1]):
            addNoRepeat(sents,sky_condition_terminology["r8"][lang][dayNight]+
                         " "+get_time_period_name((sc_term[0]-delta)%24, lang))
    return " ".join(make_sentence(sent) for sent in sents)
    return None

def precipitation(wInfo,period,lang):
    return None

def wind(wInfo,period,lang):
    return None

def temperature(wInfo,period,lang):
    return None

def uv_index(wInfo,period,lang):
    return None


def forecast_period(mc,period,lang):
    jsrExprs=filter(lambda l:l!=None,[
        sky_condition(mc, period, lang),
        precipitation(mc, period, lang),
        wind(mc, period, lang),
        temperature(mc, period, lang),
        uv_index(mc, period, lang)
    ])
    return "".join([jsRealB(jsrExpr.lang(lang).pp()) for jsrExpr in jsrExprs])
