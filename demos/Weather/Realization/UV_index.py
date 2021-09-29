'''
Created on 14 sept. 2021

@author: lapalme
'''

from jsRealBclass import jsRealB, N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,PP,CP
from Realization.common import realize, jsrDayPeriod, jsrHour, get_max_term, get_min_term, get_term_at


#### UV_index values: info taken from
#  https://www.canada.ca/en/environment-climate-change/services/weather-health/uv-index-sun-safety/about.html
#      Low (0-2), Moderate (3-5), High (6-7), Very High (8-10), and Extreme (11+)
uv_ranges= [(2,   {"en":A("low"),                     "fr":A("bas")}), 
            (5,   {"en":A("moderate"),                "fr":A("modéré")}), 
            (7,   {"en":A("high"),                    "fr":A("élevé")}), 
            (10,  {"en":AP(Adv("very"), A("high")),   "fr":AP(Adv("très"),A("élevé"))}), 
            (1000,{"en":A("extreme"),                 "fr":A("extrême")})
           ]

def uv_index(wInfo,period,lang):
    if period in ["tonight","tomorrow_night"]: # no UV index in the night
        return None
    uvi_terms=wInfo.get_uv_index(period)
    if uvi_terms==None:return None 
    uvVal=uvi_terms[0].infos[0] # consider only the first uvi_term
    if uvVal<1: return None  ## too low
    uvVal=round(uvVal)
    if uvVal==0:return None
    for high,expr in uv_ranges:
        if uvVal<=high:
            if lang=="en": 
                return realize(NP(Q("UV"),N("index"),NO(uvVal),C("or"),expr[lang]),lang)
            else:
                return realize(NP(N("indice"),Q("UV"),NO(uvVal),C("ou"),expr[lang]),lang)
    return None


if __name__ == '__main__':
    def showEnFr(jsrExprEN,jsrExprFR):
        print(f" %s\n %s\n"%(realize(jsrExprEN,"en",False),realize(jsrExprFR,"fr",False)))
## exercise all kinds of uv_ranges
    for i in range(0,len(uv_ranges)):
        (val,jsrEnFr)=uv_ranges[i]
        showEnFr(NP(Q("UV"),N("index"),NO(val),C("or"),jsrEnFr["en"]),
                 NP(N("indice"),Q("UV"),NO(val),C("ou"),jsrEnFr["fr"]))
        