'''
Created on 17 sept. 2021

Convert ARPI-2021 data format to the one used in the Weather Demo


@author: lapalme
'''

import json,sys
from ppJson import ppJson
from nltk.parse.bllip import _ensure_ascii

infileFN="arpi-2021_test-100.jsonl"
outfileFN="weather-data.jsonl"
outfile=open(outfileFN,"w",encoding="utf-8")

def shiftTZ(vals):
    return [vals[0]+5,vals[1]+5]+vals[2:]

## normalize issue time to those in WeatherInfo.periods
##     05:00, 11:30 and 15:45
def convertBulletinTime(t):
    t=t//100
    if t in range(0,9):return [5,0]
    elif t in range(9,15): return [11,30]
    else: return [15,45]

def convert(jsonIn):
    jsonOut={}
    
    header=jsonIn["header"]
    jsonOut["header"]       = ["regular"]+header[4:6]  +convertBulletinTime(header[7])+\
                              ["next"]   +header[10:12]+[header[13]//100,header[13]%100]
    jsonOut["names-en"]     = jsonIn["names-en"]
    jsonOut["names-fr"]     = jsonIn["names-fr"]
    jsonOut["climatology"]  = [shiftTZ(l) for l in jsonIn["climat_temp"]]
    jsonOut["precipitation"]= {
        "type"        : [shiftTZ(l) for l in jsonIn["pcpn"]],
        "accumulation": [shiftTZ(l) for l in jsonIn["accum"]],
        "probability" : [shiftTZ(l) for l in jsonIn["prob"][0][2:]],
    }
    jsonOut["sky-cover"]    = [shiftTZ(l) for l in jsonIn["ciel"]]
    jsonOut["temperatures"] = [shiftTZ(l) for l in jsonIn["temp"]]
    jsonOut["uv_index"]     = [shiftTZ(l) for l in jsonIn["indice_uv"]]
    jsonOut["wind"]         = [shiftTZ(l) for l in jsonIn["vents"]]
    jsonOut["en"]           = jsonIn["en"]["orig"]
    jsonOut["fr"]           = jsonIn["fr"]["orig"]
    return jsonOut

if __name__ == '__main__':
    for line in open(infileFN,"r",encoding="utf-8"):
        inJson=json.loads(line)
        print("** inJson")
        ppJson(sys.stdout,inJson)
        outJson=convert(inJson)
        print("outJson")
        ppJson(sys.stdout,outJson)
        outfile.write(json.dumps(outJson,ensure_ascii=False))
        outfile.write("\n")
        break
    