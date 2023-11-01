// import jsRealB from "../../dist/jsRealB.js"
// Object.assign(globalThis,jsRealB);

import {Realizer} from "./Realizer.js"
export {English}
let uk;

class English extends Realizer {
    // tutorial example, compare with
    //   https://rosaenlg.org/rosaenlg/4.3.0/tutorials/tutorial_en_US.html
    // 
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
    
    //
    // compare with https://rosaenlg.org/rosaenlg/4.3.0/tutorials/example_en_US.html
    //
    realizeExample(){
        loadEn()
        addToLexicon("ampulla",{"N":{"tab":"n1"}})
        uk =  NP(D("the"),A("united").cap(),N("kingdom").cap())
        return super.realizeExample()
    }

    static dateOptions = {hour:false,minute:false,second:false}
    
    title(){
        return CP(C("and"),
                  uk,
                  NP(D("my").ow("s"),
                     N("monarch").n("p").cap()))
    }

    queenInfo(){
        function queen(){
            return NP(D("the"),
                      N("queen").cap(),
                      PP(P("of"),uk))
        } 
        return [
            S(Q("Elizabeth II"),
              VP(V("be"),
                 queen()).a(","),
              NP(NO(12).dOpt({"ord":true}),
                 N("monarch"))),
            S(queen().pro(),
             VP(V("marry").t("ps"),
                DT(new Date(1947, 10, 20)).dOpt(English.dateOptions)
                )),
            S(queen().pro(),
              VP(V("refuse"),
                 V("name").t("b-to"),
                 NP(D("a"),N("heir")))),
            S(N("rumor").n("p"),
              VP(V("say"),
                 SP(Pro("that"),
                    Q("Lilibet"),
                    VP(V("plan"),
                       V("step").t("b-to"),
                       P("down"),
                       PP(P("in"),Q("1983"))))))
        ]
    }

    succession(){
        const successors = [
            'Charles, Prince of Wales',
            'Prince William, Duke of Cambridge',
            'Prince George of Cambridge',
          ]; 
        const res = CP(C("and"))
        for (let i=0;i<successors.length;i++){
            res.add(SP(Q(successors[i]),NO(i+1).dOpt({"ord":true}).ba("(")))
        }
        return res
    }

    crownJewels(){
        const crownStuff = [
            ['sword', 6],
            ['orb', 2],
            ['trumpet', 16],
            ['ampulla', 1],
            ['armlet', 1],
          ];
        let stuffs = CP(Q(", plus"))
        for (let [name,num] of crownStuff){
            stuffs.add(
               (num == 1) ? NP(D("a"),N(name))
                          : NP(NO(num).nat(),N(name))
            )
        }
        const res = S(NP(D("the"),N("crown").cap(),N("jewel").n("p").cap()),
                      VP(V("be"),V("make").t("pp"),P("up"),
                        PP(P("of"),NP(NO(142),N("object")).a(","),
                        NP(P("for"),N("example")),
                        stuffs)).a("!"))
        return res
    }
}
