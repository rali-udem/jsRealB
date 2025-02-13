'''
Created on 17 sept. 2021

Convert ARPI-2021 data format to the one used in the Weather Demo


@author: lapalme
'''

import json,sys
from datetime import datetime,timedelta
from ppJson import ppJson

infileFN="arpi-2021_test-100.jsonl"
outfileFN="weather-data.jsonl"
outfile=open(outfileFN,"w",encoding="utf-8")


# taken from https://en.wikipedia.org/wiki/Daylight_saving_time_in_the_United_States
__DST2018 = (datetime(2018, 3, 11), datetime(2018, 11, 4))
__DST2019 = (datetime(2019, 3, 10), datetime(2019, 11, 3))

def getDelta(issue_date):
    is_dst = __DST2018[0] <= issue_date < __DST2018[1] or \
             __DST2019[0] <= issue_date < __DST2019[1]
    return +4 if is_dst else +5    

def shiftTZ(delta,terms):
    return [[term[0]-delta,term[1]-delta]+term[2:] for term in terms]


## normalize issue time to those in WeatherInfo.periods
##     05:00, 11:30 and 15:45 ie 10:00, 16:30, 20:45 GMT
# def convertBulletinTime(t):
#     t=t//100
#     if t in range(0,6):return [5,0]
#     elif t in range(6,15): return [11,30]
#     else: return [15,45]


def convertTerm(delta,convertDict,terms):
    res=[]
    for term in terms:
        if isinstance(term,str):
            if term in convertDict:
                res.append(convertDict[term])
        elif isinstance(term,list):            
            res.append(convertTerm(delta,convertDict,[term[0]-delta,term[1]-delta]+term[2:]))
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
    "bourrasque_neige":"snow-squalls",
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
    header[7]=header[7]//100
    issueDate=makeDate(header[4:9])
    delta=getDelta(issueDate)
    issueDate-=timedelta(hours=delta)
    header[13]=header[13]//100
    nextDate=makeDate(header[10:15])
    nextDate-=timedelta(hours=delta)
    jsonOut["header"]       = ["regular",issueDate.isoformat(),"next",nextDate.isoformat()]
    jsonOut["names-en"]     = jsonIn["names-en"]
    jsonOut["names-fr"]     = jsonIn["names-fr"]
    # if "climat_temp" in jsonIn:
    #     jsonOut["climatology"]  = shiftTZ(delta,jsonIn["climat_temp"])
    if "pcpn" in jsonIn:
        jsonOut["precipitation-type"]=[convertTerm(delta,pcpnDict,term) for term in  shiftTZ(delta,jsonIn["pcpn"])]
    if "accum" in jsonIn:   
        jsonOut["precipitation-accumulation"]=[convertTerm(delta,accumDict,term) for term in  shiftTZ(delta,jsonIn["accum"])]
    if "prob" in jsonIn:
        jsonOut["precipitation-probability"]= shiftTZ(delta,jsonIn["prob"][0][2:])
    if "ciel" in jsonIn:
        jsonOut["sky-cover"]    = [term[0:4] for term in  shiftTZ(delta,jsonIn["ciel"])]
    if "temp" in jsonIn:
        jsonOut["temperatures"] = [convertTerm(delta,{},term) for term in  shiftTZ(delta,jsonIn["temp"])]
    if "indice_uv" in jsonIn:
        jsonOut["uv-index"]     =  shiftTZ(delta,jsonIn["indice_uv"])
    if "vents" in jsonIn:
        jsonOut["wind"]         = [convertTerm(delta,ventsDict,term) for term in  shiftTZ(delta,jsonIn["vents"])]
    jsonOut["en"]           = jsonIn["en"]["orig"].replace(".."," : ")
    jsonOut["fr"]           = jsonIn["fr"]["orig"].replace(".."," : ")
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
    