import jsRealB from "../../dist/jsRealB.js"
Object.assign(globalThis,jsRealB);

import {Realizer} from "./Realizer.js"
export {English}

class English extends Realizer {
    constructor(){
        super()
        loadEn()
    }

    realizePhone(phone){
        loadEn();
        return super.realizePhone(phone)
    }

    intro(phone){
        const name=(Q(phone.name))
        return oneOf(
            ()=>S(D("the"),name,
                  VP(V("be"),
                     Adv("really"),
                     NP(D("a"),A("fantastic"),N("phone")))),
            ()=>S(Pro("I").pe(1),
                  VP(Adv("really"),
                     V("love"),
                     NP(D("the"),A("new"),name))),
            ()=>S(name.a(":"),NP(D("a"),A("great"),N("phone")))
            )
    }
    
    itHasADisplay(phone){
        return S(this.phone_ref(phone),
                VP(V("have"),
                   NP(D("a"),N("display"),P("with"))))
    }
    
    display(phone){
        return this.itHasADisplay(phone)
            .add(
               CP(C("and"),
                  NP(D("a"),A("physical"),N("size"),
                     PP(P("of"),NP(NO(phone.displaySize),N("inch")))),
                  NP(D("a"),N("screen").lier(),P("to").lier(),N("body"),
                     N("ratio"),P("of"),Q(phone.screenRatio).a("%")))
            )
    }
    
    colors(phone){
        return S(NP(this.phone_ref(phone).a("'s"),A("available"),
                    N(oneOf("color","tint","tone")).n("p")),
                 VP(V("be").n("p"),
                    CP(C("and"),phone.colors.map(c=>Q(c))))
                )
    }
    
    phone_ref(phone){
        return oneOf(
           ()=>NP(D("the"),N("phone")),
           ()=>NP(D("this"),N("phone")),
           ()=>Pro("me").g("n")
        )
    }
    
    phone_chunks(phone){
        let battery_said = false
        const d = this.display(phone)
        const battery = NP(D("a"),N("battery"),
                           PP(P("of"),Q(phone.battery),Q("mAh")))
        return mix(
            ()=>this.colors(phone),
            ()=>{if (!battery_said){
                    d.add(PP(P("along"),P("with"),battery));
                    battery_said = true
                }
               return d},
            ()=>{if (! battery_said){
                    battery_said = true;
                    return S(this.phone_ref(phone),
                             VP(V("have"),battery))
                }
                return Q("")
            }
        )
    }
}
