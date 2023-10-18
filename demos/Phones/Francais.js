import jsRealB from "../../dist/jsRealB.js"
Object.assign(globalThis,jsRealB);

import {Realizer} from "./Realizer.js"
export {Francais}

class Francais extends Realizer {
    constructor(){
        super();
        loadFr()
    }

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
}    
