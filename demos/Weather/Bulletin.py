'''
Created on 6 sept. 2021

@author: lapalme
'''

## the jsRealB server should be launched from the jsRealB directory with
##    node dist/jsRealB-server.js demos/Weather/weatherLexicon.js

import textwrap,json
from WeatherInfo import WeatherInfo
from forecast import forecast_period,show_all_sky_conditions

## each of these function return a string corresponding to a paragraph

def communication_header(wInfo,lang):
    return None

def title_block(wInfo,lang):
    return None

def forecast_regions(wInfo,lang):
    return forecast_period(wInfo,"today",lang)

def forecast_text(wInfo,lang):
    return None

def end_statement(lang):
    return None

def generate_bulletin(wInfo,lang):
    text=[
        communication_header(wInfo,lang),
        title_block(wInfo,lang),
        forecast_regions(wInfo,lang),
        forecast_text(wInfo,lang),
        end_statement(lang),
     ]    
    return "\n".join([textwrap.fill(line,width=70, subsequent_indent=" ") 
                   for line in text if line!=None])
    


if __name__ == '__main__':
    show_all_sky_conditions()
    # wInfo=WeatherInfo(json.load(open("weather-data.json","r",encoding="utf-8")))
    # print(generate_bulletin(wInfo,"en"))
    # print(generate_bulletin(wInfo,"fr"))
