'''
Created on 6 sept. 2021

@author: lapalme

    access to the weather information
'''
import sys
from datetime import datetime
from ppJson import ppJson

periods = {
    "05:00":{"today":(5,18),"tonight":(18,30),"tomorrow":(30,42)},
    "11:30":{"today":(12,18),"tonight":(18,30),"tomorrow":(30,42)},
    "15:45":{"tonight":(16,30),"tomorrow":(30,42),"tomorrow_night":(42,54)}
}


class WeatherInfo:

    def __init__(self, json):
        '''
        Keep info about the Meteocode and provide methods to query it
        on top of the "administrative information", 
        weather info encoded into fields
        a field is a fieldname associated with a list of terms
        a term is a list of values 
           the first value is the beginHour
           the second value is the endHour
           other values depending of the field kind
           can be terminated by a possible embedded list which describes an "exception".
        
        '''
        self.data=json
        if "header" in json:
            hdr=json["header"]
        else:
            print("strange json")
            ppJson(sys.stdout,json)
            sys.exit()
        self.issue_date=datetime(hdr[1],hdr[2],hdr[3],hour=hdr[4],minute=hdr[5])
        self.next_issue_date=datetime(hdr[7],hdr[8],hdr[9],hour=hdr[10],minute=hdr[11]) 
    
    def get_header(self):
        return self.data["header"]

    def get_region_names(self,lang):
        return self.data["names-"+lang]
    
    def get_issue_date(self):
        return self.issue_date
    
    def get_next_issue_date(self):
        return self.next_issue_date
    
    def get_periods(self):
        periodKey=f"{self.issue_date.hour:02d}:{self.issue_date.minute:02d}"
        return periods[periodKey].keys()
        
    def get_time_interval(self,period):
        periodKey=f"{self.issue_date.hour:02d}:{self.issue_date.minute:02d}"
        return periods[periodKey][period]
        
    ### show all info for a given period
    ###    times (ending with h) are shown in local time 
    ignoredFields=set(["header","names-en","names-fr","regions","en","fr","id"])
    def show_data(self,period):
        def hour(h): ##  hour string in more readable manner suffixed with "h"
            if h<24: return str(h)+"h" # negative numbers are output as is
            h24=h//24 # output with a prefix indicating the day
            return (["","+","⧺","⧻"][h24] if h24<4 else "%d*"%h24)+str(h%24)+"h"
        def show_terms(terms):
            return ", ".join(["(%4s,%4s):[%s]"%(hour(term[0]),hour(term[1])," ".join(map(str,term[2:]))) for term in terms])
            
        periodKey=f"{self.issue_date.hour:02d}:{self.issue_date.minute:02d}"
        (beginHour,endHour)=periods[periodKey][period]
        print("%s (%4s,%4s) :: %s :: %s"%(
                period,hour(beginHour),hour(endHour), self.data["id"],self.issue_date))
        for field in self.data:
            if field not in self.ignoredFields:
                terms=self.extract_terms(period,field)
                if terms!=None:
                    print("%-11s : %s"%(field,show_terms(terms)))
        print("----")
            
    ### query information
    
    def extract_terms(self,period, field):
        (beginHour,endHour)=self.get_time_interval(period)
        if field not in self.data: return None
        terms=self.data[field]
        nb=len(terms)
        i=0
        while i<nb and terms[i][1] <= beginHour:i+=1
        startI=i
        while i<nb and terms[i][0] < endHour:
            i+=1
        if startI==i:return None ## no line found
        terms=terms[startI:i]
        return terms
    

    ## expand value given at idx in tuples for each hour for all hours within a range
    def expand_range(self,tuples,idx,beginHour,endHour):
        if len(tuples)==1: # all in the first tuple
            return [tuples[0][idx]]*(endHour-beginHour)
        res=[tuples[0][idx]]*(tuples[0][1]-beginHour)
        i=1
        while i<len(tuples)-1:
            res.extend([tuples[i][idx]]*(tuples[i][1]-tuples[i][0]))
            i+=1
        res.extend([tuples[i][idx]]*(endHour-tuples[i][0]))
        return res
         
    def build_table(self,period,field,col):
        (beginHour,endHour)=self.get_time_interval(period)
        if field not in self.data: return None
        terms=self.extract_terms(period, field)
        nb=len(terms)
        if nb==0: return None
        if nb==1:
            return [terms[0][col]]*(endHour-beginHour)
        res=[terms[0][col]]*(terms[0][1]-beginHour)
        i=1
        while i<nb-1:
            res.extend([terms[i][col]]*(terms[i][1]-terms[i][0]))
            i+=1
        res.extend([terms[i][col]]*(endHour-terms[i][0]))
        return res
        
    def get_climatology(self,period):
        return self.extract(period,"climatology")
    
    def get_precipitation(self,period):
        return self.extract_terms(period, "pcpn")

    def get_precipitation_probabilities(self,period):
        return self.extract_terms(period, "pcpn_prob")
    
    def get_precipitation_accumulation(self,period):
        return self.extract_terms(period,"pcpn_accum")
    
    def get_temperature(self,period):
        return self.extract_terms(period,"temp")
        
    def get_temperature_values(self,period):
        return self.build_table(period,"temp",3)
                
    def get_sky_cover(self,period):
        return self.extract_terms(period,"sky_cover")
    
    def get_wind(self,period):
        return self.extract_terms(period, "wind")
    
    def get_uv_index(self,period):
        return self.extract_terms(period,"uv_index")
       