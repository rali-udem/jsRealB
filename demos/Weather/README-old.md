# Generation weather bulletins in French and English

## Context of the application

The input of the application is set of meteorological information (e.g precipitations, temperature, wind, UV index,...) provided by [Environment and Climate Change Canada](https://www.canada.ca/en/environment-climate-change.html "Environment and Climate Change Canada - Canada.ca") (ECCC). Unlike usual data-to-text applications, this information is machine generated: it is created by a numerical weather model which outputs data for ranges of hours after the time the bulletin is expected to be issued. ECCC emits three *regular* bulletins each day (morning, midday and evening) for each of the NNN regions of Canada. A bulletin gives the predictions for the current day or evening and the next day. These bulletins are generated in both English and French.

Here is an example of an evening bulletin realized by **jsRealB** in English and French.

<!-- tonight ( 16h, +6h) :: fpto12-2018-07-18-2000-r1209c :: 2018-07-18 16:00:00
    precipitation-type        : [20h,+5h):[showers, [20h,+5h):[thunderstorm]]
    precipitation-probability : [15h,20h):[10], [20h,+5h):[30], [+5h,+15h):[10]
    sky-cover                 : [-1h,18h):[1, 1], [18h,20h):[3, 3], [20h,+5h):[5, 5], [+5h,+11h):[2, 2]
    temperatures              : [16h,18h):[28], [18h,20h):[26], [20h,23h):[20], [23h,+2h):[14], [+2h,+5h):[14], [+5h,+8h):[15]
    wind                      : [12h,20h):[w, speed, 20], [20h,+0h):[sw, speed, 15], [+0h,+12h):[sw, speed, 10]
    ----
    tomorrow ( +6h,+18h) :: fpto12-2018-07-18-2000-r1209c :: 2018-07-18 16:00:00
    precipitation-type        : [+15h,⧺0h):[showers, [+15h,⧺0h):[thunderstorm]]
    precipitation-probability : [+5h,+15h):[10], [+15h,+18h):[30]
    sky-cover                 : [+5h,+11h):[2, 2], [+11h,+15h):[2, 8], [+15h,+18h):[8, 8]
    temperatures              : [+5h,+8h):[15], [+8h,+11h):[23], [+11h,+14h):[28], [+14h,+17h):[25], [+17h,+20h):[23]
    uv-index                  : [+12h,+14h):[7.7]
    wind                      : [+0h,+12h):[sw, speed, 10], [+12h,+20h):[sw, speed, 20]
    ----
    tomorrow_night (+18h, ⧺6h) :: fpto12-2018-07-18-2000-r1209c :: 2018-07-18 16:00:00
    precipitation-type        : [+15h,⧺0h):[showers, [+15h,⧺0h):[thunderstorm]]
    precipitation-probability : [+18h,⧺0h):[30], [⧺0h,⧺6h):[20]
    sky-cover                 : [+18h,⧺0h):[8, 8], [⧺0h,⧺6h):[7, 7]
    temperatures              : [+17h,+20h):[23], [+20h,+23h):[18], [+23h,⧺2h):[15], [⧺2h,⧺5h):[14], [⧺5h,⧺8h):[15]
    wind                      : [+12h,+20h):[sw, speed, 20], [+20h,⧺0h):[sw, speed, 10], [⧺0h,⧺8h):[nil, speed, 5]
-->

    WEATHER BULLETIN: regular
    Forecasts issued by jsRealB on Wednesday, July 18, 2018 at 4:00 p.m. for today and tomorrow.
    The next scheduled forecasts will be issued on Thursday, July 19, 2018 at 5:30 a.m.
    Armstrong - Auden - Wabakimi Park
    Nakina - Aroland - Pagwa

    Tonight : Clear. A few clouds. Partly cloudy. 30 percent chances of
     showers. Wind west around noon. Becoming southwest in the evening.
     Low 28, with temperature rising to 14 by morning.
    Thursday : Mainly sunny. Increasing cloudiness tomorrow morning.
     Mainly cloudy. 30 percent chances of showers. Wind southwest. High
     28. Low 15. UV index 8 or very high.
    Thursday night : Mainly cloudy. 30 percent chances of showers. Wind
     southwest. Low 23, with temperature rising to 14 by morning.
    END 

    BULLETIN MÉTÉOROLOGIQUE: régulier
    Prévisions émises par jsRealB le mercredi 18 juillet 2018 à 16 h 0 pour aujourd'hui et demain.
    Les prochaines prévisions seront émises le jeudi 19 juillet 2018 à 5 h 30.
    Armstrong - Auden - parc Wabakimi
    Nakina - Aroland - Pagwa

    Ce soir et cette nuit : Dégagé. Quelques nuages. Partiellement
     couvert. 30 pour cent de probabilités d'averses. Vents de l'ouest
     vers midi. Devenant du sud-ouest dans la soirée. Minimum 28,
     températures à la hausse pour atteindre 14 en matinée.
    Jeudi : Généralement ensoleillé. Ennuagement demain matin.
     Généralement nuageux. 30 pour cent de probabilités d'averses. Vents
     du sud-ouest. Maximum 28. Minimum 15. Indice UV 8 ou très élevé.
    Jeudi soir et nuit : Généralement nuageux. 30 pour cent de
     probabilités d'averses. Vents du sud-ouest. Minimum 23, températures
     à la hausse pour atteindre 14 en matinée.
    FIN 


For the purpose of this demo, we extracted a subset of the global information for regions of Ontario and Québec for 2018 and 2019 which is nevertheless illustrative of the natural language generation problems encountered in this context.  We converted the Meteocode, an internal data format of ECCC, to [JSON](https://www.json.org/json-en.html "JSON") in which all time indications are *shifted*, so that they appear in local time while, in the original, they were in UTC. 

This demonstration program does not try to reproduce verbatim the output of the system used by ECCC because we highly simplified it for didactic purposes. Our goal is to illustrate a use of the **jsRealB** realizer in an interesting context, in fact [weather information is one of the most successful *real life* application of Natural Language Generation (NLG)](https://ehudreiter.com/2017/05/09/weathergov/ "You Need to Understand your Corpora! The Weathergov Example &#8211; Ehud Reiter&#039;s Blog"). 

This document outlines the organization of the system and should be read in conjunction with the Python source code.  Only excerpts are shown here to emphasize the aspects of text generation that are more challenging. It takes for granted that the reader can understand Python code and is familiar with the constituent notation used as input for **jsRealB**.

## Data organization

We now outline the JSON data organization in terms of Python data structures:

* administrative information:
    * `header` : issue `datetime`, next-issue `datetime` 
    * `names-en`: list of English region names to which the forecast applies
    * `names-fr`: list of French region names to which the forecast applies
* weather information : list of values of which the first two are the *starting hour* and *ending hour*  relative to 0h of the issue datetime, when they are negative, they refer to historical data; the other values (described below depend on the type of information). For `precipitation-type` and `wind`, a value can be a list of values which describes an exceptional phenomenon (e.g. gust within a wind period) that occurs during this period.
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
    

## Bulletin generation (`Bulletin.py`)
This demonstration program is a data-to-text application that generates bilingual (English and French) weather bulletins. The core of the data manipulation and text organization is in Python and the final text realization is performed by **jsRealB**.

As shown in the sample given above, a weather bulletin is composed of standardized block of informations some of which are created using simple format statements (`communication_header`,`forecast_regions` and `end_statement`), but others (`title_block` and `forecast_text`) must be generated as they use natural language text. All these functions return a string that can be split over many lines if it is too long or `None` in which case it is ignored in the output.

    def generate_bulletin(wInfo,lang):
        text=[
            communication_header(wInfo,lang),
            title_block(wInfo,lang),
            forecast_regions(wInfo,lang),
            forecast_text(wInfo,lang),
            end_statement(lang),
        ]    
        return "\n".join(line for line in text if line!=None)

To illustrate interesting NLG issues, we describe `forecast_text` which creates 3 paragraphs for each forecasting period. A paragraph starts with the name of the period (which will be explained later) and then the text realized by `forecast_period`. The string is formatted similarly to the original bulletin.

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

A period is described as a list of sentences dealing with different weather aspects when they are relevant according to the data for the given period: conditions of the sky (clear, cloudy, etc.), precipitations (quantity of snow or rain), wind (direction and speed), temperature (levels, variations within the period) and the value of the UV index. When the data is not *relevant* for the period, these functions return `None` which is ignored in the final realization.

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

### Bilingual patterns generation (`Realization.common.py`)

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

This `dict` is used in the following function:

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

The last line sets the realization language and `pp()` creates a JSON serialization string passed as parameter to the `jsRealB` function which calls the **jsRealB** server and returns the realized string.

### Access to the weather information (`WeatherInfo.py`)

The `WeatherInfo` class gives access to the content of the JSON file. Its constructor reads the JSON file from which is extracted a list of `WeatherTerm` instances having three fields: `start` hour, `end` hour and `infos` a  list of values. The list of terms only contains terms that intersect the appropriate period according to the following table: 

    issue_time_to_periods = {
        "morning":{"today":(5,18),"tonight":(18,30),"tomorrow":(30,42)},
        "midday":{"today":(12,18),"tonight":(18,30),"tomorrow":(30,42)},
        "evening":{"tonight":(16,30),"tomorrow":(30,42),"tomorrow_night":(42,54)},
    }

For example, in an `evening` bulletin, for the `tomorrow` period only terms that have an ending time greater or equal than 30 and a starting time less than 42 are returned. If a given information is not found or if not values intersect the given range, `None` is returned.

For the tomorrow period of the above bulletin, these terms can be visualized as follows:

    tomorrow ( +6h,+18h) :: fpto12-2018-07-18-2000-r1209c :: 2018-07-18 16:00:00
    precipitation-type        : [+15h,⧺0h):[showers, [+15h,⧺0h):[thunderstorm]]
    precipitation-probability : [+5h,+15h):[10], [+15h,+18h):[30]
    sky-cover                 : [+5h,+11h):[2, 2], [+11h,+15h):[2, 8], [+15h,+18h):[8, 8]
    temperatures              : [+5h,+8h):[15], [+8h,+11h):[23], [+11h,+14h):[28], [+14h,+17h):[25], [+17h,+20h):[23]
    uv-index                  : [+12h,+14h):[7.7]
    wind                      : [+0h,+12h):[sw, speed, 10], [+12h,+20h):[sw, speed, 20]
    
The semi-open time intervals are indicated by hour modulo 24 prefixed with + for the next day and ⧺ for the day after tomorrow. The first line give the period name, its time interval, its id and the issue time. Then are given the (non `None`) field names with the terms with time intervals that intersect the period interval. Each term is shows with its time interval followed by its lists of values, some of which can be terms themselves (e.g. `thunderstorm` in `precipitation-type`)

Access to the information in `WeatherInfo` is performed with functions such as the following which returns only relevant terms for the period:
    
    def get_precipitation_probabilities(self,period):
        if "precipitation-probability" not in self.data: return None
        return self.select_terms(period, self.data["precipitation-probability"])
    
## Sky condition (`Realization.Sky_Condition.py`)

This indicates the general weather conditions, such as :
    
    Mainly sunny. Increasing cloudiness tomorrow morning.
    Généralement ensoleillé. Ennuagement demain matin.

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


## Precipitation (`Realization.Precipitation.py`)

For information about rain or snow, for example:

    30 percent chances of showers ending during the night.
    30 pour cent de probabilités d'averses finissant durant la nuit.

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

A precipitation amount is realized when the probability, in increment of 10%, is between 30% and 70%, but different than 50%. When it is 80% or more, the beginning or ending is given. The amount is given when it is significant (at least 2cm of snow or at least 25mm of rain). Only probability terms that are more than 30% are realized.

    def precipitation(wInfo,period,lang):
        jsrExprs=[]
        prob_terms=wInfo.get_precipitation_probabilities(period)
        type_terms=wInfo.get_precipitation_type(period)
        accum_terms=wInfo.get_precipitation_accumulation(period)
        for prob_term in prob_terms:
            prob_val=round(prob_term.infos[0]/10)*10
            type_term=get_term_at(type_terms,prob_term.start)
            if type_term!=None and prob_val>=30:     # interesting precipitation
                if prob_val <= 70 and prob_val!=50:  # show probability
                    if lang=="en":
                        prob=NP(NO(prob_val),Q("percent"),N("chance"),P("of"))
                    else:
                        prob=NP(NO(prob_val),Q("pour cent"),P("de"),N("probabilité"),P("de"))
                    timePeriod=None
                else:                                # probability >= 80% 
                    prob=None                        # indicate beginning or ending
                    start=prob_term.start
                    end=prob_term.end
                    if wInfo.is_in_period(start,period):  
                        timePeriod=VP(V("begin" if lang=="en" else "débuter").t("pr"),jsrHour(start%24,lang))
                    elif wInfo.is_in_period(end,period):
                        timePeriod=VP(V("end" if lang=="en" else "finir").t("pr"),jsrHour(end%24,lang))
                    else:
                        timePeriod=None
                jsrExpr=NP(prob,precipitationTypes[type_term.infos[0]][lang],timePeriod)            
                amount_term=get_term_at(accum_terms,prob_term.start)
                if amount_term!=None:                 # check for significant amount
                    pcpnType=amount_term.infos[0]
                    amount=amount_term.infos[1]
                    jsrAmount=None
                    if pcpnType=="rain" and amount>=25:
                        jsrAmount=NP(NO(round(amount)),Q("mm"))
                    elif pcpnType=="snow" and amount>=2:
                        jsrAmount=NP(NO(round(amount)),Q("cm"))
                    if jsrAmount!=None:
                        if lang=="en":
                            jsrAmount.add(N("amount"),0)
                        else:
                            jsrAmount.add(N("accumulation"),0).add(P("de"),1)
                        jsrExpr=SP(jsrExpr.a(","),jsrAmount)   
                jsrExprs.append(jsrExpr)
        return " ".join(realize(jsrExpr,lang) for jsrExpr in jsrExprs)
    

## Wind (`Realization.Wind.py`)

Information about the wind speed and directions are realized such as the following:

    Wind west around noon. Becoming southwest in the evening.
    Vents de l'ouest vers midi. Devenant du sud-ouest dans la soirée.

Wind direction realizations are given in a table with the corresponding compass degree which used to compute significant wind directions changes.

    jsrWindDirection = {
        "e":    {"en":Adv("east"),       "fr":NP(D("le"),N("est")),       "deg":90},
        "n":    {"en":Adv("north"),      "fr":NP(D("le"),N("nord")),      "deg":0},
        ...                                                               
        "sw":   {"en":Adv("southwest"),  "fr":NP(D("le"),N("sud-ouest")), "deg":225},
    }


    # find the difference between compass directions
    def dir_diff(dir1,dir2):
        ...

Wind terms are scanned to realize the ones with wind speed of more than 15 km/h. When a wind speed changes by more than 20 km/h or if it changes direction then an appropriate realization is emitted. If a gust is detected during the period, it is also expressed. The expression is built incrementally by starting with an empty `S()` to which an `NP` and possibly a `VP` or an indication of the time are added.   

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
                        jsrExpr.add(NP(N("wind"),jsrWindDirection[wDir][lang]))
                    else:
                        jsrExpr.add(NP(N("vent").n("p"),PP(P("de"),jsrWindDirection[wDir][lang])))
                if len(wind_term.infos)>3:                       # add gusting information
                    gust=wind_term.infos[3]
                    if gust[2]=='gust':
                        if lang=="en":
                            jsrExpr.add(VP(V("gust").t("pr"),PP(P("to"),NO(gust[3]))))
                        else:
                            jsrExpr.add(PP(P("avec"),NP(N("rafale").n("p"),P("à"),NO(gust[3]))))
                else:                                           # add time information
                    jsrExpr.add(jsrHour(wind_term.start,lang))
                jsrExprs.append(jsrExpr)                        # add built expression to the list
            return " ".join(realize(jsrExpr,lang,False) for jsrExpr in jsrExprs)



## Temperature (`Realization.Temperature.py`)

Temperatures can be described very simply such as:
    
    High 28. Low 15.
    Maximum 28. Minimum 15.

or with a trend when there is a significant difference in temperatures: negative change of at least 3°C during daytime or a positive change of at least 3°C during nighttime:

    Temperature rising to 28 by morning.
    Températures à la hausse pour atteindre 28 en matinée.

This achieved with this 

    def temperature(wInfo,period,lang):
        temperature_terms=wInfo.get_temperature(period)
        if temperature_terms == None : return None
        maxTemp=get_max_term(temperature_terms,0).infos[0]
        minTemp=get_min_term(temperature_terms,0).infos[0]
        dn= "night" if period in ["tonight","tomorrow_night"] else "day"
        tempVals=wInfo.get_temperature_values(period)
        periodName=periodNames[period][lang](wInfo.get_issue_date())
        # checking for an abnormal temperature trend, either
        #     positive change of least 3°C during the night
        #     negative change of last 3°C during the day
        (t1,t2,i1)=(maxTemp,minTemp,tempVals.index(minTemp)) if dn=="night" else\
                   (minTemp,maxTemp,tempVals.index(maxTemp))
        if t1 >= t2+3:                       # abnormal change time
            if i1 <=1 :
                return realize(jsrAbnormal[dn]["a"][lang](t1, periodName),lang,False)
            else:
                if i1 < 6:        # abnormality occurs during the first 6 hours of the period
                    rest=tempVals[i1:]
                    if all([abs(t-t1)<=2 for t in rest]):
                        # c) remains +/- 2 for the rest of the period
                        return realize(jsrAbnormal[dn]["c"][lang](t1,periodName),lang,False)
                    elif any([t-t1>2 for t in rest]):
                        # d) rises more than 2 for the rest 
                        return realize(jsrAbnormal[dn]["d"][lang](t1,periodName),lang,False)
                    elif any([t1-t>2 for t in rest]):
                        # e) falls more than 2 for the rest (this should never happen!!!)
                        return realize(jsrAbnormal[dn]["e"][lang](t1,periodName),lang,False)
                else:
                    # b) low temperature after the beginning (but no special case)
                    return realize(jsrAbnormal[dn]["b"][lang](t2,t1),lang,False)
        # normal case 
        res=[]                             
        if lang=="en":                      # output maximum temperature   
            res.append(realize(S(Adv("high"),jsrTemp(maxTemp,"en")),"en",False))
        else:
            res.append(realize(S(N("maximum"),jsrTemp(maxTemp,"fr")),"fr",False))
        if minTemp < maxTemp-2:             # output minimum if it differs significantly from the maximum 
            if lang=="en":
                res.append(realize(S(Adv("low"),jsrTemp(minTemp,"en")),"en",False))
            else:
                res.append(realize(S(N("minimum"),jsrTemp(minTemp,"fr")),"fr",False))
        return " ".join(res)

The value of a temperature is indicated using the conventions of ECCC, add a qualifier `plus` when it is less or equal to 5, and `minus` when it is below 0:

    def jsrTemp(val,lang):
        if val==0: return N("zero") if lang=="en" else N("zéro")
        if val<0 : return AdvP(A("minus") if lang=="en" else Adv("moins"),NO(abs(val)))
        if val<=5 : return AP(A("plus"), NO(val)) if lang=="en" else AdvP(Adv("plus"),NO(val))
        return NO(val)

The trend expression is built using the following function:

    def temp_trend(lang,trend,goalTemp,when):
        if lang=="en":
            return S(N("temperature"),
                    VP(V(trend).t("pr"),
                       PP(P("to"),jsrTemp(goalTemp,lang)),
                       when))
        else:
            return S(NP(N("température").n("p"),
                        PP(P("à"),NP(D("le"),N(trend)))),
                        PP(P("pour"),V("atteindre").t("b"),jsrTemp(goalTemp,lang),
                        when))

*abnormal* situations are encoded using the following table:

    jsrAbnormal = {  
        "night":{ 
            "a":{
                "en":lambda t,_:temp_trend("en","rise",t,PP(P("by"),N("morning"))),
                "fr":lambda t,_:temp_trend("fr","hausse",t,PP(P("en"),N("matinée")))
            },
            ...
            "e":{
                "en":lambda t,p:temp_trend("en","rise",t,p).add(AdvP(Adv("then"),V("fall").t("pr"))),
                "fr":lambda t,p:temp_trend("fr","hausse",t,p).add(PP(P("pour"),Adv("ensuite"),
                                                                      V("être").t("b"),PP(P("à"),
                                                                                          NP(D("le"),N("baisse")))))
            },
        },
        "day":{ 
            ...
        }
    }                


## UV index (`Realization.UV_index.py`)

UV index information, a number which ranges from a low of zero to a high of 11+, is only given for bulletin during a day period in the following way:

    UV index 8 or very high.
    Indice UV 8 ou très élevé.

Its realization is simple matter of outputting its rounded value and if it is greater than 0. The English or French realization is obtained by searching a table [according to the guidelines of ECCC](https://www.canada.ca/en/environment-climate-change/services/weather-health/uv-index-sun-safety/about.html "About the UV index - Canada.ca").

    uv_ranges= [(2,   {"en":A("low"),                     "fr":A("bas")}), 
                (5,   {"en":A("moderate"),                "fr":A("modéré")}), 
                (7,   {"en":A("high"),                    "fr":A("élevé")}), 
                (10,  {"en":AP(Adv("very"), A("high")),   "fr":AP(Adv("très"),A("élevé"))}), 
                (1000,{"en":A("extreme"),                 "fr":A("extrême")})]

    def uv_index(wInfo,period,lang):
        if period in ["tonight","tomorrow_night"]:      # no UV index during the night
            return None
        uvi_terms=wInfo.get_uv_index(period)
        if uvi_terms==None:return None 
        uvVal=uvi_terms[0].infos[0]                     # consider only the first uvi_term
        if uvVal<1: return None                         # too low
        uvVal=round(uvVal)
        if uvVal==0:return None
        for high,expr in uv_ranges:
            if uvVal<=high:
                return realize(NP(Q("UV index" if lang=="en" else "indice UV"),
                                  NO(uvVal),C("or" if lang=="en" else "ou"),expr[lang]),
                               lang)
        return None


## Conclusion

This document has shown how to generate bilingual documents from a single source of information using **jsRealB** using the Python API as the data manipulation is performed in Python. Although the input data and the generated documents are simpler than what would be used in a real life context, the essential organization of the system should stay the same as the framework is extensible. 

[Guy Lapalme](mailto:lapalme@iro.umontreal.ca)

