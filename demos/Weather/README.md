# Generation weather bulletins in French and English

## Context of the application

The input of the application is set of meteorological information (e.g precipitations, temperature, wind, UV index,...) provided by [Environment and Climate Change Canada](https://www.canada.ca/en/environment-climate-change.html "Environment and Climate Change Canada - Canada.ca") (ECCC). Unlike usual data-to-text applications, this information is machine generated: it is created by a numerical weather model which outputs data for ranges of hours after the time the bulletin is expected to be issued. ECCC emits three *regular* bulletins each day (morning, midday and evening) for each of the NNN regions of Canada. A bulletin gives the predictions for the current day or evening and the next day. These bulletins are generated in both English and French.

For the purpose of this demo, we extracted a subset of the global information for regions of Ontario and Québec for 2018 and 2019 which is nevertheless illustrative of the natural language generation problems encountered in this context.  We converted the Meteocode, an internal data format of ECCC, to [JSON](https://www.json.org/json-en.html "JSON") in which all time indications are *shifted*, so that they appear in local time while, in the original, they were in UTC. 

This demonstration program does not try to reproduce verbatim the output of the system used by ECCC because it is highly simplified. The goal is to illustrate a use of the **jsRealB** realizer in an interesting context, in fact [weather information is one of the most successful application of Natural Language Generation (NLG)](https://ehudreiter.com/2017/05/09/weathergov/ "You Need to Understand your Corpora! The Weathergov Example &#8211; Ehud Reiter&#039;s Blog"). 

This document outlines the organization of the system and should be read in conjunction with the source code.  Only excerpts are shown here to emphasize some of the aspects of the text generation system that seem to us more challenging.

## Data organization

We now outline the JSON data organization in terms of Python data structures:

* administrative information:
    * `header` : issue `datetime`, next-issue `datetime` 
    * `names-en`: list of English region names to which the forecast applies
    * `names-fr`: list of French region names to which the forecast applies
* weather information : list of values of which the first two are the *starting hour* and *ending hour*  relative to 0h of the issue datetime, when they are negative, they refer to historical data; the other values (described below depend on the type of information). For `precipitation-type` and `wind`, a value can be a list of values which describes an exceptional phenomenon (e.g. gust within a wind period) that occurs during this period.
    * `climatology` : values over the past years: type (e.g. min or max) value
    * `precipitation-type`: e.g. rain, snow, ...
    * `precipitation-accumulation` : type (e.g. rain, snow), amount (in cm for `snow` or mm for `rain`) 
    * `precipitation-probability` : type (e.g. rain, snow), value of prob in percentage
    * `sky-cover` : sky cover between 0 (no cover) and 10 (full cover) 
    * `temperatures`: values of temperature in Celsius
    * `uv-index` : value between 0 and 10 of UV index
    * `wind` : speed of the wind

* auxiliary information for the purpose of the demo
    * `en` : original bulletin in English to ease comparison of generated text with the issued forecast
    * `fr` : original bulletin in French to ease comparison of generated text with the issued forecast
    * `id` : id of the original data, to ease debugging of the data conversion program.

## Bulletin generation
This demonstration program is a data-to-text application that generates bilingual (English and French) weather bulletins. The core of the data manipulation and text organization is in Python and the final text realization is performed by **jsRealB**.

A weather bulletin is composed of standardized block of informations some of which are created using simple format statements (`communication_header`,`forecast_regions` and `end_statement`), but others (`title_block` and `forecast_text`) must be generated as they use natural language text. All these functions return a string that forms a single line or `None` in which case it is ignored.

    def generate_bulletin(wInfo,lang):
        text=[
            communication_header(wInfo,lang),
            title_block(wInfo,lang),
            forecast_regions(wInfo,lang),
            forecast_text(wInfo,lang),
            end_statement(lang),
        ]    
        return "\n".join(line for line in text if line!=None)

To illustrate interesting NLG issues, we decribe`forecast_text` which creates 3 paragraphs for each forecasting period.
A paragraph starts with the name of the period (which will be explained later) and then the text realized by `forecast_period`. The string is formatted similarly to the original bulletin to ease comparison.

    def forecast_text(wInfo,lang):
        paragraphs=[]
        for period in wInfo.get_periods():
            if lang=="en" : wInfo.show_data(period)
            paragraphs.append(
                textwrap.fill(
                    realize(periodNames[period][lang](wInfo.get_issue_date()+timedelta(days=1)).cap(True),lang,False)
                              +" : "+forecast_period(wInfo, period, lang)
                            ,width=70,subsequent_indent=" ")
                )  
        return "\n".join(paragraphs)

A period is described a list of sentences dealing with different weather aspects when they are relevant according to the data for the given period: conditions of the sky (clear, cloudy, etc.), precipitations (quantity of snow or rain), wind (direction and speed), temperature (levels, variations within the period) and the value of the UV index. When the data is not *interesting* for the period, these functions return `None` which is ignored.

    def forecast_period(wInfo,period,lang):
        sents=filter(lambda l:l!=None,[
            sky_condition(wInfo, period, lang),
            precipitation(wInfo, period, lang),
            wind(wInfo, period, lang),
            temperature(wInfo, period, lang),
            uv_index(wInfo, period, lang)
        ])
        return " ".join(sents)

For realization, these functions use **jsRealB** templates for each type of information. The templates are defined using the [Python API for **jaRealB**](http://rali.iro.umontreal.ca/JSrealB/current/documentation/jsRealBfromPython.html "Using jsRealB from Python"). We now give a detailed example of such generation template and how it is used for realizing a a string in either French or English.

### Bilingual patterns generation

The Python data structure that will be serialized into JSON for realization by the **jsRealB** server is built using class constructors such for `Phrase` (e.g `NP`, `PP`, `S`...) or `Terminal` (e.g. `N`, `P`, `Adv`) using a notation that is very similar to the one used in Javascript although the internal mechanism is quite different.

As modifications to a data structure are permanent, it is important to create a new data structure at each use. The simplest way to achieve this is to create a function (e.g. a `lambda` in Python) that returns a new structure at each call. The following shows a `dict` to realize in English and French a period of the day depending on the hour (e.g. `morning` or `matinée` when the hour is between 9 and 12 excluded). 

    dayPeriods=[(0,5, {"en":lambda:NP(N("night")),
                       "fr":lambda:NP(N("nuit"))}),
                (5,9, {"en":lambda:NP(Adv("early"),N("morning")),
                       "fr":lambda:NP(N("début"),PP(P("de"),N("matinée")))}),
                (9,12, {"en":lambda:NP(N("morning")),
                        "fr":lambda:NP(N("matin"))}),
                (12,18,{"en":lambda:NP(N("afternoon")),
                        "fr":lambda:NP(N("après-midi"))}),
                (18,24,{"en":lambda:NP(N("tonight")),
                        "fr":lambda:NP(N("soir"))})]

This `dict` is used in the following function (in `Realization.common`)

    def jsrDayPeriod(hour,lang):
        isTomorrow=hour>23
        hour=hour%24
        for (s,e,jsrExp) in dayPeriods:
            if hour in range(s,e):
                exp=jsrExp[lang]()
                if isTomorrow:
                    return exp.add(N("tomorrow" if lang=="en" else "demain"),0)
                elif s!=18:
                    return exp.add(D("this" if lang=="en" else "ce"),0)

which searches the appropriate period to create the corresponding expression a `NP` in this case to which is added `tomorrow` (`demain` in French) when the hour is greater than 23  or `this` (`ce` in French) for the current day. This results in `NP(D("this"),N("morning"))` which is realized as `this morning`. This organization is quite typical for generating bilingual templates.

An alternative way of expressing time with a day is the following which returns a new expression at each call:

    def jsrHour(h,lang):
        if h in range(0,6):
            return PP(P("during"),NP(D("the"),N("night"))) if lang=="en" else \
                   PP(P("durant"),NP(D("le"),N("nuit")))
        if h in range(6,11):
            return PP(P("in"),NP(D("the"),N("morning"))) if lang=="en" else \
                   NP(D("le"),N("matin"))
        if h in range(11,14):
            return PP(P("around"),N("noon")) if lang=="en" else \
                   PP(P("vers"),N("midi"))
        if h in range(14,18):
            return PP(P("in"),NP(D("the"),N("afternoon"))) if lang=="en"  else \
                   PP(P("durant"),NP(D("le"),N("après-midi")))
        if h in range(18,24):
            return PP(P("in"),NP(D("the"),N("evening"))) if lang=="en"  else \
                   PP(P("dans"),NP(D("le"),N("soirée"))) 

A **jsRealB** expression is realized using the following function which specifies the realization language and if it should be wrapped in a `S` to be considered as a complete sentence which will ensure proper capitalization and a full stop at the end.

    def realize(jsrExpr,lang,addS=True):
        if addS and not isinstance(jsrExpr,S):
            jsrExpr=S(jsrExpr)
        return jsRealB(jsrExpr.set_lang(lang).pp())

The last line sets the realization language and `pp()` creates a string in JSON that is given to the `jsRealB` function which calls the **jsRealB** server and returns the realized string.

### Access to the weather information

The `WeatherInfo` class gives access to the content of the JSON file. Its constructor reads the JSON file from which is extracted a list of `WeatherTerm` instances having three fields: `start` hour, `end` hour and `infos` a  list of values. The list of terms only contains terms that intersect the appropriate period according to the following table: 

    issue_time_to_periods = {
        "morning":{"today":(5,18),"tonight":(18,30),"tomorrow":(30,42)},
        "midday":{"today":(12,18),"tonight":(18,30),"tomorrow":(30,42)},
        "evening":{"tonight":(16,30),"tomorrow":(30,42),"tomorrow_night":(42,54)},
    }

For example, for the `tonight` period of the `midday` bulletin, only terms that have a ending time greater than 18 and a starting time less than 30 are returned. If a given information is not found or if not values intersect the given range, `None` is returned.

Access to the information is performed with functions such as these:

    def get_climatology(self,period):
        if "climatology" not in self.data: return None
        return self.select_terms(period,self.data["climatology"])
    
    def get_precipitation_probabilities(self,period):
        if "precipitation-probability" not in self.data: return None
        return self.select_terms(period, self.data["precipitation-probability"])
    


### Sky condition

Different ways of realizing sky conditions are given in the following table: condition is associated with a pair whose first component expresses this condition during the day and the second during the night. For example, no cover will correspond to `sunny` during the day, but `clear` during the night. If only one value is given for the tuple, then the first value is always used; e.g. `cloudy` is used for both the day and the night. As these expressions are never modified, there is no need to enclose them in a `lambda`.

    sky_condition_terminology = { ## types of sky conditions
        "c1":{"en":(AP(A("sunny")),AP(A("clear"))),
              "fr":(AP(A("ensoleillé")),AP(A("dégagé")))},
        ...
        "c5":{"en":(AP(A("cloudy")),),
              "fr":(AP(A("nuageux")),)},
        ...
        "c8":{"en":(NP(N("clearing")),),
              "fr":(NP(N("dégagement")),)},
    }

This table is used in the context of the following function which loops over the *sky cover terms* and depending on the values of the sky covering at the start and end of the period, determine the appropriate expression to use. Some care is taken not to repeat the same expression for different terms. All **jsRealB** expression are added to a list whose elements are realized and concatenated. If the name of the `period` is `today` or `tomorrow`, the first element of the tuple is chosen otherwise the second is used.

    def sky_condition(mc,period,lang):
        previous_conditions=[]
        jsrExprs=[]

        def addNoRepeat(c,dn,period=None): # avoid generating same sentence twice
            if c not in previous_conditions:
                if len(sky_condition_terminology[c][lang])==1:dn=0
                jsrExpr=sky_condition_terminology[c][lang][dn]
                if period!=None:jsrExpr.add(period)
                jsrExprs.append(jsrExpr)
                previous_conditions.append(c)
            
        sc_terms=mc.get_sky_cover(period)
        if sc_terms==None: return None
        for sc_term in sc_terms:
            valStart=sc_term.infos[0]
            valEnd  =sc_term.infos[1]
            dayNight = 0 if period in ["today","tomorrow"] else 1
            if valStart==valEnd:
                if valStart in [0,1]:
                    addNoRepeat("c1",dayNight)
                    ...
            elif valStart in [0,1,2,3] and valEnd in [7,8,9,10]:
                addNoRepeat("c7",dayNight,jsrDayPeriod(sc_term.start,lang))
            ...
        return " ".join(realize(jsrExpr,lang) for jsrExpr in jsrExprs)


## Precipitation

The French and English realizations of the many precipitation types are given in a table.

    precipitationTypes = {
        "showers":{"en":N("shower").n("p"), 
                   "fr":N("averse").n("p")},
        "flurries":{"en":N("flurry").n("p"), 
                    "fr":NP(N("averse").n("p"),PP(P("de"),N("neige")))},
        ...
        "blowing-snow" :{"en":NP(V("blow").t("pr"),N("snow")), 
                         "fr":N("poudrerie")},
    }

For precipitation, we focus on the event with the maximum probability if it greater than 10% by building an expression that gives its value. This term is then added in front the realization of the type and amount of accumulation in the call to `precipitation_at`. When no significant probability is found, then all precipitation terms are output as different sentences.

    def precipitation(wInfo,period,lang):
        pcpn_terms=wInfo.get_precipitation_type(period)
        if pcpn_terms==None: return None
        prob_terms=wInfo.get_precipitation_probabilities(period)
        maxProbTerm=get_max_term(prob_terms,0)
        if maxProbTerm!=None and maxProbTerm.infos[0]<=10:
            maxProbTerm=None
        amount_terms=wInfo.get_precipitation_accumulation(period)
        if maxProbTerm != None:
            ## output information associated with maxProb
            maxProbVal=maxProbTerm.infos[0]
            if maxProbVal < 100:
                if lang=="en":
                    prob=NP(NO(maxProbVal),Q("percent"),N("chance"),P("of"))
                else:
                    prob=NP(NO(maxProbVal),Q("pour cent"),P("de"),N("probabilité"),P("de"))
            else:
                prob=None
            pcpn_term=get_term_at(pcpn_terms, maxProbTerm.start)
            return precipitation_at(prob,pcpn_term,amount_terms,lang)
        else:
            ## show information associated with all precipitation values
            strings=[]
            for pcpn_term in pcpn_terms:
                strings.append(precipitation_at(None,pcpn_term,amount_terms,lang))
        return " ".join(strings)

To realize the precipitation information for a given term, the start and end time are first determined...
 %%% à réorganiser %%% 

    def precipitation_at(prob,pcpn_term,amount_terms,lang):
        jsrExprs=[]
        pType=pcpn_term.infos[0]
        amount_term=None
        timePeriod=None
        tp=jsrHour(pcpn_term.start%24,lang)
        if tp!=None:
            if lang=="en":
                timePeriod=VP(V("begin").t("pr"),tp)
            else:
                timePeriod=VP(V("débuter").t("pr"),tp)
            amount_term=get_term_at(amount_terms,pcpn_term.start)
        tp=jsrHour(pcpn_term.end%24,lang)
        if tp!=None:
            if lang=="en":
                timePeriod=VP(V("end").t("pr"),tp)
            else:
                timePeriod=VP(V("finir").t("pr"),tp)
            amount_term=get_term_at(amount_terms,pcpn_term.start)
        if pType in precipitationTypes:
            jsrExprs.append(NP(prob,precipitationTypes[pType][lang],timePeriod))
        else:
            jsrExprs.append(Q("[["+pType+"]]."))
        ## add amount
        if amount_term!=None:
            pcpnType=amount_term.infos[0]
            amount=amount_term.infos[1]
            if pcpnType=="rain":
                if amount>20:
                    if lang=="en":
                        jsrExprs.append(NP(N("amount"),NO(round(amount)),Q("mm")))
                    else:
                        jsrExprs.append(NP(N("accumulation"),P("de"),NO(round(amount)),Q("mm")))
            elif pcpnType=="snow":
                if amount>2:
                    if lang=="en":
                        jsrExprs.append(NP(N("amount"),NO(round(amount)),Q("cm")))
                    else:
                        jsrExprs.append(NP(N("accumulation"),P("de"),NO(round(amount)),Q("cm")))
        return " ".join(realize(jsrExpr,lang) for jsrExpr in jsrExprs)
    



## Wind

The realization of wind directions are given in a table with the corresponding compass degree which used to compute significant wind directions changes.

    jsrWindDirection = {
        "e":    {"en":Adv("east"),       "fr":NP(D("le"),N("est")),                    "deg":90},
        "n":    {"en":Adv("north"),      "fr":NP(D("le"),N("nord")),                   "deg":0},
        ...
        "sw":   {"en":Adv("southwest"),  "fr":NP(D("le"),N("sud-ouest")),              "deg":225},
        # "vrbl": {"en":A("variable"),     "fr":A("variable")},
    }


    # find the difference between compass directions
    def dir_diff(dir1,dir2):
        ...

Wind terms are scanned and an when a wind speed of more than 15 km/h is encountered, it is realized. When a wind speed changes by more than 20 km/h or if it changes direction then an appropriate realization is emitted. If a gust is detected during the period, it is also expressed. The expression is built incrementally by starting with an empty `S()` to which an `NP` and possibly a `VP` or an indication of the time are added.   

    def wind(wInfo,period,lang):
        wind_terms=wInfo.get_wind(period)
        if wind_terms==None:return None
        lastSpeed=None 
        lastDir=None
        jsrExprs=[]
        for wind_term in wind_terms:
            wSpeed = wind_term.infos[2]
            wDir= wind_term.infos[0]
            jsrExpr=S()
            if wSpeed>=15 and wDir in jsrWindDirection:
                if lastSpeed!=None and abs(wSpeed-lastSpeed)>=20:
                    lastSpeed=wSpeed
                    if lang=="en":
                        jsrExpr.add(VP(V("increase").t("pr"),PP(P("to"),NO(wSpeed))))
                    else:
                        jsrExpr.add(VP(V("augmenter").t("pr"),PP(P("à"),NO(wSpeed))))    
                elif lastDir!=None and dir_diff(wDir, lastDir):
                    if lang=="en":
                        jsrExpr.add(VP(V("become").t("pr"),jsrWindDirection[wDir][lang]))
                    else:
                        jsrExpr.add(VP(V("devenir").t("pr"),PP(P("de"),jsrWindDirection[wDir][lang])))
                    lastDir=wDir
                else:
                    lastSpeed=wSpeed
                    lastDir=wDir
                    if lang=="en":
                        jsrExpr.add(NP(N("wind"),jsrWindDirection[wDir][lang]))
                    else:
                        jsrExpr.add(NP(N("vent").n("p"),PP(P("de"),jsrWindDirection[wDir][lang])))
                # show gust or time
                if len(wind_term.infos)>3:
                    gust=wind_term.infos[3]
                    if gust[2]=='gust':
                        if lang=="en":
                            jsrExpr.add(VP(V("gust").t("pr"),PP(P("to"),NO(gust[3]))))
                        else:
                            jsrExpr.add(PP(P("avec"),NP(N("rafale").n("p"),P("à"),NO(gust[3]))))
                else:
                    jsrExpr.add(jsrHour(wind_term.start,lang))
                jsrExprs.append(jsrExpr)
        return " ".join(realize(jsrExpr,lang,False) for jsrExpr in jsrExprs)



## Temperature


## UV index

