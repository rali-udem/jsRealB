'''
Created on 17 sept. 2021

Convert ARPI-2021 data format to the one used in the Weather Demo


@author: lapalme
'''

import json,sys
from datetime import datetime
from ppJson import ppJson

infileFN="arpi-2021_test-100.jsonl"
outfileFN="weather-data.jsonl"
outfile=open(outfileFN,"w",encoding="utf-8")


# taken from https://en.wikipedia.org/wiki/Daylight_saving_time_in_the_United_States
__DST2018 = (datetime(2018, 3, 11), datetime(2018, 11, 4))
__DST2019 = (datetime(2019, 3, 10), datetime(2019, 11, 3))

def shiftTZ(issue_date,terms):
    is_dst = __DST2018[0] <= issue_date < __DST2018[1] or \
             __DST2019[0] <= issue_date < __DST2019[1]
    delta=+4 if is_dst else +5    
    return [[term[0]+delta,term[1]+delta]+term[2:] for term in terms]

## normalize issue time to those in WeatherInfo.periods
##     05:00, 11:30 and 15:45
def convertBulletinTime(t):
    t=t//100
    if t in range(0,9):return [5,0]
    elif t in range(9,15): return [11,30]
    else: return [15,45]


def convertTerm(convertDict,terms):
    res=[]
    for term in terms:
        if isinstance(term,str):
            if term in convertDict:
                res.append(convertDict[term])
        elif isinstance(term,list):
            res.append(convertTerm(convertDict,term))
        else:
            res.append(term)
    return res

accumDict={
    "gresil":"ice-pellets",
    "neige" : "snow",
    "pluie" : "rain",
    "pluie_verglacante": "freezing-rain",
}

pcpnDict={
    "averses":"showers",
    "averses_neige":"flurries",
    "averses_neige_fondante":"wet-flurries",
    "blizzard":"blizzard",
    "bourrasques_neige":"snow-squalls",
    "bruine":"drizzle",
    "bruine_verglacante":"freezing-drizzle",
    "cristaux_glace":"ice-crystals",
    "grele":"hail",
    "gresil":"ice-pellets",
    "neige":"snow",
    "neige_fondante":"wet-snow",
    "orages":"thunderstorm",
    "pluie":"rain",
    "pluie_verglacante":"freezing-rain",
    "poudrerie":"blowing-snow",
}

ventsDict ={
    "e":"e",
    "nil":"nil",
    "n":"n",
    "ne":"ne",
    "nw":"nw",
    "w":"w",
    "ely":"ely",
    "nly":"nly",
    "nely":"nely",
    "nwly":"nwly",
    "wly":"wly",
    "sly":"sly",
    "sely":"sely",
    "swly":"swly",
    "s":"s",
    "se":"se",
    "sw":"sw",
    "vitesse":"speed",
    "rafales":"gust",
    "bourrasques":"squall",
}

def makeDate(hs):
    return datetime(hs[0],hs[1],hs[2],hour=hs[3],minute=hs[4])

def convert(jsonIn):
    jsonOut={}
    
    header=jsonIn["header"]
    header[7:9]=convertBulletinTime(header[7])
    issueDate=makeDate(header[4:9])
    header[13]=header[13]//100
    jsonOut["header"]       = ["regular",issueDate.isoformat(),"next",makeDate(header[10:15]).isoformat()]
    jsonOut["names-en"]     = jsonIn["names-en"]
    jsonOut["names-fr"]     = jsonIn["names-fr"]
    if "climat_temp" in jsonIn:
        jsonOut["climatology"]  = shiftTZ(issueDate,jsonIn["climat_temp"])
    jsonOut["precipitation"]= {}
    if "pcpn" in jsonIn:
        jsonOut["precipitation"]["type"]=[convertTerm(pcpnDict,term) for term in  shiftTZ(issueDate,jsonIn["pcpn"])]
    if "accum" in jsonIn:   
        jsonOut["precipitation"]["accumulation"]=[convertTerm(accumDict,term) for term in  shiftTZ(issueDate,jsonIn["accum"])]
    if "prob" in jsonIn:
        jsonOut["precipitation"]["probability"]= shiftTZ(issueDate,jsonIn["prob"][0][2:])
    if "ciel" in jsonIn:
        jsonOut["sky-cover"]    = [term[0:4] for term in  shiftTZ(issueDate,jsonIn["ciel"])]
    if "temp" in jsonIn:
        jsonOut["temperatures"] = [convertTerm({},term) for term in  shiftTZ(issueDate,jsonIn["temp"])]
    if "indice_uv" in jsonIn:
        jsonOut["uv-index"]     =  shiftTZ(issueDate,jsonIn["indice_uv"])
    if "vents" in jsonIn:
        jsonOut["wind"]         = [convertTerm(ventsDict,term) for term in  shiftTZ(issueDate,jsonIn["vents"])]
    jsonOut["en"]           = jsonIn["en"]["orig"]
    jsonOut["fr"]           = jsonIn["fr"]["orig"]
    jsonOut["id"]           = jsonIn["id"]
    return jsonOut

if __name__ == '__main__':
    for line in open(infileFN,"r",encoding="utf-8"):
        inJson=json.loads(line)
        # print("** inJson")
        # ppJson(sys.stdout,inJson)
        outJson=convert(inJson)
        # print("outJson")
        # ppJson(sys.stdout,outJson)
        outfile.write(json.dumps(outJson,ensure_ascii=False))
        outfile.write("\n")
        # break
    print(outfileFN,"written")
    