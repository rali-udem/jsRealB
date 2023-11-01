// import jsRealB from "../../dist/jsRealB.js"
// Object.assign(globalThis,jsRealB);

import {Realizer} from "./Realizer.js"
export {Francais}

class Francais extends Realizer {

    // tutorial example, compare with
    //   https://rosaenlg.org/rosaenlg/4.3.0/tutorials/tutorial_fr_FR.html
    // 

    realizePhone(phone){
        loadFr();
        return super.realizePhone(phone)
    }

    intro(phone){
        const name=Q(phone.name)
        return oneOf(
            ()=>S(D("le"),name,
                  VP(V("être"),
                     Adv("réellement"),
                     NP(D("un"),A("super").pos("pre"),N("téléphone")))),
            ()=>S(Pro("je").pe(1),
                  VP(V("adorer"),
                     NP(D("le"),A("nouveau"),name))),
            ()=>S(name.a(":"),NP(D("un"),A("super").pos("pre"),N("téléphone")))
            )
    }

    itHasADisplay(phone){
        return S(this.phone_ref(phone),
                VP(V("avoir"),
                   NP(D("un"),N("écran"),
                      Pro("qui"))))
    }
    
    display(phone){
        return this.itHasADisplay(phone)
            .add(
               CP(C("et"),
                  VP(V("couvrir"),
                     Q(phone.screenRatio).a("%"),
                     PP(P("de"),
                        NP(D("mon"),N("surface")))),
                 VP(V("faire"),
                    NP(NO(phone.displaySize),N("pouce"))))
            )
    }
    
    colors(phone){
        var colorMapping = {
            'Black': 'Noir',
            'Red': 'Rouge',
            'White': 'Blanc',
            'Gold': 'Or',
            'Gray': 'Gris'
          }
        return S(NP(D("le"),
                     N(oneOf("couleur","teinte","finition")).n("p"),
                     A("disponible"),
                     PP(P("pour"),
                        NP(this.phone_ref(phone,true),
                        A(oneOf('exceptionnel','fabuleux','singulier'))))),
                VP(V("être"),
                   CP(C("et"),phone.colors.map(c=>Q(colorMapping[c])))))
    }

    phone_ref(phone,no_pron){
        const ref = oneOf(
           ()=>NP(D("ce"),N("appareil")),
           ()=>NP(D("ce"),N("machine")),
           ()=>NP(D("ce"),N("téléphone")),
           ()=>NP(D("le"),N("téléphone")),
        )
        if (no_pron===undefined && Math.random()<0.3)
            ref.pro();
        return ref
    }
            
    phone_chunks(phone){
        let battery_said = false
        const d = this.display(phone)
        const batterie = NP(D("un"),N("batterie"),
                           PP(P("de"),Q(phone.battery),Q("mAh")))
        return mix(
            ()=>this.colors(phone),
            ()=>{if (!battery_said){
                    d.add(SP(C("et"),
                             VP(V("disposer"),
                                P("par"),Adv("ailleurs"),
                                PP(P("de"),batterie))));
                    battery_said = true
                }
               return d},
            ()=>{if (! battery_said){
                    battery_said = true;
                    return S(this.phone_ref(phone),
                             VP(V("avoir"),batterie))
                }
                return Q("")
            }
        )
    }

    //
    // compare with https://rosaenlg.org/rosaenlg/4.3.0/tutorials/example_fr_FR.html
    //

    realizeExemple(){
        loadFr()
        addToLexicon({"France":{"N":{"g":"f","tab":"n17"}}})
        addToLexicon({"tartiflette":{"N":{"g":"f","tab":"n17"}}})
        this.france = NP(D("le"),N("France"))
        return super.realizeExemple()
    }

    titre(){
        return CP(C("et"),
                  this.france,
                  NP(D("le"),N("langue"),A("français"))).cap()
    }

    langues(){
        const languesRegionales = [
            ['créole', 1500000],
            ['occitan', 800000],
            ['alsacien', 550000],
            ['breton', 300000],
          ];
      
        const s1 = S(NP(D("le"),N("langue"),A("officiel"),A("unique"),
                       PP(P("de"), this.france)),
                    VP(V("être"),
                       NP(D("le"),N("français"))))
        const s2=S(Pro("lui").c("nom"),
                   VP(V("exister"),
                      NP(D("un"),N("dialecte").n("p"),A("régional"))).a(","),
                      PP(P("par"),N("exemple")).a(","))
        const langues = CP(Q("ou encore"))
        for (let i=0;i<languesRegionales.length;i++ ){
            let [langue,num]=languesRegionales[i]
            const ieme = NO(i+1).dOpt({"ord":true})
            langues.add(NP(D("le"),A(langue),
                           (i==0 ? PP(ieme,P("avec"),NP(NO(num),N("locuteur"))) 
                                 : PP(ieme.a(","),NP(NO(num))).ba("("))))
        }
        return [s1,s2.add(langues)]
    }

    feteNationale(){
        return S(NP(D("le"),N("fête"),A("national")),
                    VP(V("avoir"),N("lieu"),
                       DT(new Date(2023,6,14))
                       .dOpt({"year":false,"hour":false,"minute":false,"second":false,"day":false})))
    }

    president(){
        return S(NP(D("le"),N("président"),A("actuel")),
                 VP(V("être"),Q("Emmanuel Macron").a(","),
                    SP(Pro("qui"),
                       VP(V("succéder").t("pc"),
                          PP(P("à"),Q("François Hollande"))))))
    }

    specialites(){
        const specialites = [
            ['cassoulet', 'succulent'],
            ['tartiflette', 'délicieux'],
            ['macaron', 'incroyable'],
          ];
        const specs = CP(Q("et bien sûr"))
        for (let i=0;i<specialites.length;i++){
            let [plat,qualificatif] = specialites[i]
            specs.add(NP(D("le"),A(qualificatif).pos("pre"),N(plat)))
        }
        const s = S(PP(P("parmi"),
                 NP(D("le"),N("spécialité").n("p"),A("culinaire")).a(",")),
              VP(V("citer").pe(1).n("p"),
                 specs))      
        return s
    }

    repute(){
        return S(this.france,
                    VP(V("être"),A("réputé"),
                       PP(P("pour"),
                          CP(C("et"),
                             NP(D("son"),A("beau"),N("plage")),
                             NP(D("son"),A("somptueux").pos("pre"),N("ville")),
                             NP(D("son"),A("extraordinaire"),N("festival"))).n("p"))))
    }
}    
