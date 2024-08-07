from jsRealBclass import jsRealB, N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,PP,CP
from Realization.common import realize, jsrDayPeriod, jsrHour, get_max_term, get_min_term, get_term_at

### Pubpro sec 2.3.4
## vents : start end direction modif? speed value exception?
# e | nil | n | ne | nw | w | ely | nly | nely | nwly | wly | sly| sely | swly | sly | sely | sw | vrbl
jsrWindDirection = {
    "e":    {"en":Adv("east"),       "fr":NP(D("le"),N("est")),                    "deg":90},
    "n":    {"en":Adv("north"),      "fr":NP(D("le"),N("nord")),                   "deg":0},
    "ne":   {"en":Adv("northeast"),  "fr":NP(D("le"),N("nord-est")),               "deg":45},
    "nw":   {"en":Adv("northwest"),  "fr":NP(D("le"),N("nord-ouest")),             "deg":315},
    "w":    {"en":Adv("west"),       "fr":NP(D("le"),N("ouest")),                  "deg":290},
    "ely":  {"en":Adv("easterly"),   "fr":NP(D("le"),N("secteur"),N("est")),       "deg":90},
    "nly":  {"en":Adv("northerly"),  "fr":NP(D("le"),N("secteur"),N("nord")),      "deg":0},
    "nely": {"en":A("northeasterly"),"fr":NP(D("le"),N("secteur"),N("nord-est")),  "deg":45},
    "nwly": {"en":A("northwesterly"),"fr":NP(D("le"),N("secteur"),N("nord-ouest")),"deg":315},
    "wly":  {"en":Adv("westerly"),   "fr":NP(D("le"),N("secteur"),N("ouest")),     "deg":270},
    "sly":  {"en":Adv("southerly"),  "fr":NP(D("le"),N("secteur"),N("sud")),       "deg":180},
    "sely": {"en":A("southeasterly"),"fr":NP(D("le"),N("secteur"),N("sud-est")),   "deg":135},
    "swly": {"en":A("southwesterly"),"fr":NP(D("le"),N("secteur"),N("sud-ouest")), "deg":225},
    "sly":  {"en":Adv("southerly"),  "fr":NP(D("le"),N("secteur"),N("sud")),       "deg":180},
    "se":   {"en":Adv("southeast"),  "fr":NP(D("le"),N("sud-est")),                "deg":135},
    "s":    {"en":Adv("south"),      "fr":NP(D("le"),N("sud")),                    "deg":180},
    "sw":   {"en":Adv("southwest"),  "fr":NP(D("le"),N("sud-ouest")),              "deg":225},
    # "vrbl": {"en":A("variable"),     "fr":A("variable")},
}


# find the difference between compass directions 
# adapted from https://www.mrexcel.com/board/threads/compass-direction-differences.213199
def dir_diff(dir1,dir2):
    dir1=jsrWindDirection[dir1]["deg"]
    dir2=jsrWindDirection[dir2]["deg"]
    if dir1 >180 : dir1-=180
    else: dir1+=180
    if dir2 >180 : dir2-=180
    else: dir2+=180
    return abs(dir1-dir2)

def wind(wInfo,period,lang):
    wind_terms=wInfo.get_wind(period)
    if wind_terms==None:return None
    lastSpeed=None 
    lastDir=None
    jsrExprs=[]
    for wind_term in wind_terms:
        wSpeed = wind_term.infos[2]
        wDir= wind_term.infos[0]
        jsrExpr=S()                                           # current expression
        if wSpeed>=15 and wDir in jsrWindDirection:
            if lastSpeed!=None and abs(wSpeed-lastSpeed)>=20: # significant speed change
                lastSpeed=wSpeed
                if lang=="en":
                    jsrExpr.add(VP(V("increase").t("pr"),PP(P("to"),NO(wSpeed))))
                else:
                    jsrExpr.add(VP(V("augmenter").t("pr"),PP(P("à"),NO(wSpeed))))    
            elif lastDir!=None and dir_diff(wDir, lastDir):  # significant direction change
                if lang=="en":
                    jsrExpr.add(VP(V("become").t("pr"),jsrWindDirection[wDir][lang]))
                else:
                    jsrExpr.add(VP(V("devenir").t("pr"),PP(P("de"),jsrWindDirection[wDir][lang])))
                lastDir=wDir
            else:                                            # realize wind and direction
                lastSpeed=wSpeed
                lastDir=wDir
                if lang=="en":
                    jsrExpr.add(NP(N("wind"),jsrWindDirection[wDir][lang],NO(wSpeed),Q("km/h")))
                else:
                    jsrExpr.add(NP(N("vent").n("p"),
                                   PP(P("de"),jsrWindDirection[wDir][lang]),
                                   PP(P("de"),NO(wSpeed),Q("km/h"))))
            if len(wind_term.infos)>3:                       # add gusting information
                gust=wind_term.infos[3]
                if gust.infos[0]=='gust':
                    if lang=="en":
                        jsrExpr.add(VP(V("gust").t("pr"),PP(P("to"),NO(gust.infos[1]))))
                    else:
                        jsrExpr.add(PP(P("avec"),NP(N("rafale").n("p"),P("à"),NO(gust.infos[1]))))
            else:                                           # add time information
                jsrExpr.add(jsrHour(wind_term.start,lang))
            jsrExprs.append(jsrExpr)                        # add current expression to the list
    return " ".join(realize(jsrExpr,lang,False) for jsrExpr in jsrExprs)


if __name__ == '__main__':
    def showEnFr(jsrExprEN,jsrExprFR):
        print(f" %-30s %s"%(realize(jsrExprEN,"en",False),realize(jsrExprFR,"fr",False)))
    for wd in jsrWindDirection:
        showEnFr(NP(N("wind"),jsrWindDirection[wd]["en"]),
                 NP(N("vent").n("p"),PP(P("de"),jsrWindDirection[wd]["fr"])))
        