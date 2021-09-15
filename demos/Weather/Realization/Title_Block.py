'''
Created on 14 sept. 2021

@author: lapalme
'''
import datetime
from jsRealBclass import jsRealB, N,A,Adv,V,D,P,C,DT,NO,Q, NP,AP,AdvP,VP,S,PP,CP
from Realization.common import realize

def title_block(wInfo,lang):
    issueDate = wInfo.get_issue_date()
    noSecond={"second":False}
    if lang=="en":
        s1=S(NP(N("forecast").n("p")),
             VP(V("issue").t("pp"),
                PP(P("by"),Q("jsRealB"),
                   DT(issueDate).dOpt(noSecond),
                   P("for"),CP(C("and"),
                               N("today"),
                               DT(issueDate+datetime.timedelta(days=1)).dOpt({"rtime":issueDate})))))
        s2=S(NP(D("the"),D("next"),V("schedule").t("pp"),N("forecast").n("p")),
             VP(V("be").t("f"),V("issue").t("pp"),
                DT(wInfo.get_next_issue_date()).dOpt(noSecond)))  
    else:
        s1=S(NP(N("prévision").n("p")),
             VP(V("émettre").t("pp"),
                PP(P("par"),Q("jsRealB"),
                   DT(issueDate).dOpt(noSecond),
                   P("pour"),CP(C("et"),
                               Adv("aujourd'hui"),
                               DT(issueDate+datetime.timedelta(days=1)).dOpt({"rtime":issueDate})))))
        s2=S(NP(D("le"),A("prochain").pos("pre"),N("prévision").n("p")),
             VP(V("être").t("f"),V("émettre").t("pp"),
                DT(wInfo.get_next_issue_date()).dOpt(noSecond)))  
    return "\n".join([realize(s1,lang,False),realize(s2,lang,False)])

if __name__ == '__main__':
    pass