
// add a child to end of the elements of a parent but making sure the source reflects only the final result
function add(parent,child){
    parent.add(child,undefined,true)
}

function make_groups(pattern){
    
    function det(){
        return D(choice("un","le"))
    }
    
    
    function check(lemma, pos){
        lemma = lemma.trim()
        let infos = getLemma(lemma)
        if (infos == null){
            console.log("** lemme absent du dictionnaire:"+lemma)
            return null
        }
        if (infos[pos]===undefined){
            console.log("** %s mauvaise partie du discours: %s",lemma,pos)
            return null
        }
        return lemma
    }
    
    // analyse un patron de la forme 
    // alternative de noms, blanc, alternative d'adjectifs
    function getNP(group){
        let nps = []
        for (let ng of group.split("|")){
            let ng_comp = ng.trim().split(" ");
            let n = check(ng_comp[0],"N")
            if (n != null){
                let np = NP(det(),N(n))
                if (ng_comp.length==2){
                    let a = check(ng_comp[1],"A")
                    if (a !=null)add(np,A(a))
                }
                nps.push(np)
            }
        }
        return nps    
    }
    
    
    let groups = pattern.split(",")
    if (groups.length != 3){
        console.log("** pattern n'a pas trois composantes:"+pattern)
        return null
    }
    // traiter sujets
    let subjs = getNP(groups[0])
                                
    if (subjs.length==0){
        console.log("** sujet manquant:"+pattern)
        return null
    }
    // traiter verbes
    let vps = []
    for (let vg of groups[1].split("|")){
        let vg_comp = vg.trim().split(" ")
        let v = check(vg_comp[0],"V") // sortir le verbe
        if (v!=null){
            let vp = VP(V(v))
            if (vg_comp.length == 2){
                let p = check(vg_comp[1],"P")
                if (p != null)add(vp,PP(P(p)))
            } else if (vg_comp.length == 3){
                let adv = check(vg_comp[1],"Adv")
                if (adv != null){
                    let p = check(vg_comp[2],"P")
                    if (p != null)add(vp,AdvP(Adv(adv),P(p)))    
                }
            }
            vps.push(vp)
        }
    }
    // traiter compléments
    let objs  = getNP(groups[2])
    if (objs.length==0) {
        console.log("** objet manquant:"+pattern)
        return null
    }
    return [subjs,vps,objs]  
}
                                
function addObj(vp,np){
    if(vp.elements.length==1){
        add(vp,np)
    } else {
        add(vp.elements[1],np)
    }
}                               
                                
function testPatterns(patterns){
    for (let pattern of patterns){
        console.log("==",pattern)
        let svo = make_groups(pattern);
        if (svo == null) continue;
        let [subjs,vps,objs] = svo
        if (subjs.length>0 && vps.length>0 && objs.length>0){
            for (let subj of subjs){
                for (let vp of vps){
                    for (let obj of objs){
                        let s_c = subj.clone()
                        let vp_c = vp.clone()
                        let o_c = obj.clone()
                        addObj(vp_c,o_c)
                        let expr = S(s_c,vp_c)
                        console.log(expr.toSource())
                        console.log(expr.realize())
                    }
                }
            }
        }
    }
}

// launch testing of all patterns...

// import("../../dist/jsRealB.js");
// Object.assign(globalThis,jsRealB);
// load("fr")
// Constituent.debug=true;
// testPatterns(patterns)

