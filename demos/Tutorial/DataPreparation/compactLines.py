import json,sys
lines=json.load(sys.stdin)
print("[")
for i in range(0,len(lines)):
    if len(lines[i])>0:
        stations=[json.dumps(s,ensure_ascii=False) for s in lines[i]]
        print('  {"route":%d, "stations":[\n    %s\n  ]}%s'%\
              (i+1,",\n    ".join(stations),"" if i==len(lines)-1 else ","))
print("]")