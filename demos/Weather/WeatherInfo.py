import sys
from datetime import datetime
from ppJson import ppJson

issue_time_to_periods = {
    "morning":{"today":(5,18),"tonight":(18,30),"tomorrow":(30,42)},
    "midday":{"today":(12,18),"tonight":(18,30),"tomorrow":(30,42)},
    "evening":{"tonight":(16,30),"tomorrow":(30,42),"tomorrow_night":(42,54)},
}

def hour(h): ##  hour string in more readable manner suffixed with "h"
    if h<24: return str(h)+"h" # negative numbers are output as is
    h24=h//24 # output with a prefix indicating the day
    return (["","+","⧺","⧻"][h24] if h24<4 else "%d*"%h24)+str(h%24)+"h"


class WeatherTerm:
    def __init__(self,vals):
        self.start=vals[0]
        self.end=vals[1]
        self.infos=[(WeatherTerm(val) if isinstance(val,list) else val) for val in vals[2:]]
    
    def __str__(self):
        return "[%s,%s):[%s]"%(hour(self.start),hour(self.end),", ".join(map(str,self.infos)))
                                                                           
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
        hdr=json["header"]
        isoFormat="%Y-%m-%dT%H:%M:%S"
        self.issue_date=datetime.strptime(hdr[1],isoFormat)
        self.next_issue_date=datetime.strptime(hdr[3],isoFormat)
    
    def get_header(self):
        return self.data["header"]

    def get_region_names(self,lang):
        return self.data["names-"+lang]
    
    def get_issue_date(self):
        return self.issue_date
    
    def get_next_issue_date(self):
        return self.next_issue_date
    
    def get_issue_type(self):
        hour=self.issue_date.hour
        return "morning" if hour<=5 else "midday" if hour<=11 else "evening"
    
    def get_periods(self):    
        return issue_time_to_periods[self.get_issue_type()].keys()
        
    def get_time_interval(self,period):
        return issue_time_to_periods[self.get_issue_type()][period]
        
    def is_in_period(self,hour,period):
        (start,end)=self.get_time_interval(period)
        return start<=hour<end
        
    ### show all info for a given period
    ###    times (ending with h) are shown in local time 
    ignoredFields=set(["header","names-en","names-fr","regions","en","fr","id"])
    def show_data(self,period):
        def show_terms(terms):
            return ", ".join([str(term) for term in terms])
            
        (beginHour,endHour)=self.get_time_interval(period)
        print("%s (%4s,%4s) :: %s :: %s"%(
                period,hour(beginHour),hour(endHour), self.data["id"],self.issue_date))
        for field in self.data:
            if field not in self.ignoredFields and  field in self.data:
                terms=self.select_terms(period,self.data[field])
                if terms!=None:
                    print("%-25s : %s"%(field,show_terms(terms)))
        print("----")
            
    ### query information
    
    def select_terms(self,period, terms):
        (beginHour,endHour)=self.get_time_interval(period)
        nb=len(terms)
        i=0
        while i<nb and terms[i][1] <= beginHour:i+=1
        startI=i
        while i<nb and terms[i][0] < endHour:
            i+=1
        if startI==i:return None ## no line found
        terms=terms[startI:i]
        return [WeatherTerm(term) for term in terms]
    
    ## merge consecutive terms with same info by adjusting the end time
    def merge_terms(self,terms):
        if terms==None or len(terms)==1:return terms
        res=[terms[0]]
        for i in range(1,len(terms)):
            if terms[i].infos==res[-1].infos and terms[i].start==res[-1].end:
                res[-1].end=terms[i].end
            else:
                res.append(terms[i])
        return res
            
    
    # ## expand value given at idx in tuples for each hour for all hours within a range
    # def expand_range(self,tuples,idx,beginHour,endHour):
    #     if len(tuples)==1: # all in the first tuple
    #         return [tuples[0][idx]]*(endHour-beginHour)
    #     res=[tuples[0][idx]]*(tuples[0][1]-beginHour)
    #     i=1
    #     while i<len(tuples)-1:
    #         res.extend([tuples[i][idx]]*(tuples[i][1]-tuples[i][0]))
    #         i+=1
    #     res.extend([tuples[i][idx]]*(endHour-tuples[i][0]))
    #     return res
         
    def build_table(self,period,field,col):
        (beginHour,endHour)=self.get_time_interval(period)
        if field not in self.data: return None
        terms=self.select_terms(period, self.data[field])
        nb=len(terms)
        if nb==0: return None
        if nb==1:
            return [terms[0].infos[col]]*(endHour-beginHour)
        res=[terms[0].infos[col]]*(terms[0].end-beginHour)
        i=1
        while i<nb-1:
            res.extend([terms[i].infos[col]]*(terms[i].end-terms[i].start))
            i+=1
        res.extend([terms[i].infos[col]]*(endHour-terms[i].start))
        return res
        
    def get_climatology(self,period):
        if "climatology" not in self.data:
            return None
        return self.select_terms(period,self.data["climatology"])
    
    def get_precipitation_type(self,period):
        if "precipitation-type" not in self.data:
            return None
        pcpn_terms=self.select_terms(period, self.data["precipitation-type"])
        return self.merge_terms(pcpn_terms)

    def get_precipitation_probabilities(self,period):
        if "precipitation-probability" not in self.data:
            return None
        return self.select_terms(period, self.data["precipitation-probability"])
    
    def get_precipitation_accumulation(self,period):
        if "precipitation-accumulation" not in self.data:
            return None
        return self.select_terms(period, self.data["precipitation-accumulation"])
    
    def get_sky_cover(self,period):
        if "sky-cover" not in self.data:
            return None
        return self.select_terms(period,self.data["sky-cover"])
    
    def get_temperature(self,period):
        if "temperatures" not in self.data:
            return None
        return self.select_terms(period,self.data["temperatures"])
        
    def get_temperature_values(self,period):
        return self.build_table(period,"temperatures",0)
                
    def get_uv_index(self,period):
        if "uv-index" not in self.data:
            return None
        return self.select_terms(period,self.data["uv-index"])

    def get_wind(self,period):
        if "wind" not in self.data:
            return None
        return self.select_terms(period,self.data["wind"])
    
    def get_ref_bulletin(self,lang):
        return self.data[lang]
