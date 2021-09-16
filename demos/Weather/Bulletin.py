'''
Created on 6 sept. 2021

@author: lapalme
'''

## the jsRealB server should be launched from the jsRealB directory with
##    node dist/jsRealB-server.js demos/Weather/weatherLexicon.js

import json,textwrap
from WeatherInfo import WeatherInfo

from Realization.common import realize, periodNames
from Realization.Title_Block import title_block

from Realization.Sky_Condition import sky_condition
from Realization.Precipitation import precipitation
from Realization.Wind import wind
from Realization.Temperature import temperature
from Realization.UV_index import uv_index

## each of these function return a string corresponding to a paragraph

def communication_header(wInfo,lang):
    if lang=="en":
        return "WEATHER BULLETIN: %s"%wInfo.get_header()[0]
    else:
        return "BULLETIN MÉTÉOROLOGIQUE: %s"%(wInfo.get_header()[0].replace("regular","régulier"))

def forecast_regions(wInfo,lang):
    return "\n".join(wInfo.get_region_names(lang))+"\n"

def forecast_period(wInfo,period,lang):
    sents=filter(lambda l:l!=None,[
        sky_condition(wInfo, period, lang),
        precipitation(wInfo, period, lang),
        wind(wInfo, period, lang),
        temperature(wInfo, period, lang),
        uv_index(wInfo, period, lang)
    ])
    return " ".join(sents)

def forecast_text(wInfo,lang):
    paragraphs=[]
    for period in wInfo.get_periods():
        if lang=="en" : wInfo.show_data(period)
        paragraphs.append(
            textwrap.fill(realize(periodNames[period][lang]().cap(True),lang)
                          +" : "+forecast_period(wInfo, period, lang),
                          width=80,subsequent_indent=" "))  
    return "\n".join(paragraphs)

def end_statement(lang):
    return "END" if lang=="en" else "FIN"

def generate_bulletin(wInfo,lang):
    text=[
        communication_header(wInfo,lang),
        title_block(wInfo,lang),
        forecast_regions(wInfo,lang),
        forecast_text(wInfo,lang),
        end_statement(lang),
    ]    
    return "\n".join(line for line in text if line!=None)
    
if __name__ == '__main__':
    for line in open("weather-data.jsonl","r",encoding="utf-8"):
        wInfo=WeatherInfo(json.loads(line))
        print(generate_bulletin(wInfo,"en"),"\n")
        print(generate_bulletin(wInfo,"fr"),"\n")
