import json,ppJson,sys

dme=json.load(open("lexicon-dme.json"))
en=json.load(open("lexicon-en.json"))

def cmpEntry(en,dme):
    mess=""
    for f in en:
        if f not in dme:
            mess+=f+" not in dme\n"
        elif en[f]["tab"]!=dme[f]["tab"]:
            mess+=f+":"+str(en[f]["tab"])+" <> "+str(dme[f]["tab"])+","
    return mess
            

nbDiffs=0
for enEntry in en:
    if enEntry not in dme:
        print("%-10s: not in dme"%enEntry)
        nbDiffs+=1
    else:
        mess=cmpEntry(en[enEntry],dme[enEntry])
        if mess!="":
            print("%-10s: %s"%(enEntry,mess.rstrip()))
            nbDiffs+=1
            # if nbDiffs>5:break
print("%d differences"%nbDiffs)