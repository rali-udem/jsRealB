#!/usr/bin/python
# coding=utf-8

####### Validation of a JSON file according to a JSON-rnc schema
###  Guy Lapalme (lapalme@iro.umontreal.ca) March 2015
########################################################################

import sys 
import json

## to sort object fields without accents
import unicodedata
def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str.decode("utf-8"))
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

#### prettyprint a JSON in more compact format
##   that I find more readable

def out(file,s):file.write(s)
def outQuoted(file,s):
    if '\\' in s: s=s.replace('\\','\\\\')
    if '"'  in s: s=s.replace('"','\\"')
    if '\n' in s: s=s.replace('\n','\\n')
    out(file,'"'+s+'"')

## by default the keys of an object are sorted
def ppJson(file,obj,level=0,sortkeys=False):
    if isinstance(obj,str):
        outQuoted(file,obj)
    elif obj==None:
        out(file,"null")
    elif type(obj) is bool:
        out(file,"true" if obj else "false")
    elif isinstance(obj,(int,float)):
        out(file,str(obj))
    elif type(obj) is dict:
        out(file,"{")
        n=len(obj)
        i=1
        keys=list(obj.keys())
        if sortkeys: keys.sort(key=remove_accents)
        for key in keys:
            if i>1 : out(file,"\n"+(level+1)*" ")
            outQuoted(file,key)
            out(file,":")
            ppJson(file,obj[key],level+1+len(key)+3,sortkeys) # largeur de [{" de la clé
            if i<n: out(file,",")
            i+=1
        out(file,"}")
    elif type(obj) is list:
        out(file,"[")
        # indent only if one of the elements of the array are an object or a list
        # indent=any([type(elem) is dict or type(elem) is list for elem in obj])
        n=len(obj)
        i=1
        for elem in obj:
            if isinstance(elem, (list,dict)) and i>1: out(file,"\n"+(level+1)*" ")
            ppJson(file,elem,level+1,sortkeys)
            if i<n: out(file,",")
            i+=1
        out(file,"]")
    if level==0:out(file,"\n")

if __name__ == '__main__':
    # read many json objects from stdin, each object possibly spanning more than one line
    # taken from: http://stackoverflow.com/questions/20400818/python-trying-to-deserialize-multiple-json-objects-in-a-file-with-each-object-s
    for line in sys.stdin:
        while True:
            try:
                obj=json.loads(line)
                ppJson(sys.stdout,obj)
                break
            except:
                line += next(sys.stdin)

