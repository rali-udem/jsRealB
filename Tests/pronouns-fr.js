// table of pronouns as given by François Lareau

const optionsFr=['tn("")','tn("refl")','c("nom")','c("acc")','c("dat")','c("refl")'];

const tonicsFr = {
   "moi":  ["moi","moi-même","je","me","me","me"],
   "toi":  ["toi","toi-même","tu","te","te","te"],
   "lui":  ["lui","lui-même","il","le","lui","se"],
   "elle": ["elle","elle-même","elle","la","lui","se"],
   "on":   ["soi","soi-même","on","le","soi","se"],
   "nous": ["nous","nous-mêmes","nous","nous","nous","nous"],
   "vous": ["vous","vous-mêmes","vous","vous","vous","vous"],
   "eux":  ["eux","eux-mêmes","ils","les","leur","se"],
   "elles":["elles","elles-mêmes","elles","les","leur","se"],
}

const possProsFr = {
   mien:'Pro("mien").pe(1)',
   miens:'Pro("mien").n("p").pe(1)',
   mienne:'Pro("mien").g("f").pe(1)',
   miennes:'Pro("mien").n("p").g("f").pe(1)',
   tien:'Pro("tien")',
   tiens:'Pro("tien").n("p")',
   tienne:'Pro("tien").g("f")',
   tiennes:'Pro("tien").n("p").g("f")',
   sien:'Pro("sien")',
   siens:'Pro("sien").n("p")',
   sienne:'Pro("sien").g("f")',
   siennes:'Pro("sien").n("p").g("f")',
   nôtre:'Pro("nôtre").pe(1)',
   nôtres:'Pro("nôtre").n("p").pe(1)',
   nôtre:'Pro("nôtre").g("f").pe(1)',
   nôtres:'Pro("nôtre").n("p").g("f").pe(1)',
   vôtre:'Pro("vôtre")',
   vôtres:'Pro("vôtre").n("p")',
   vôtre:'Pro("vôtre").g("f")',
   vôtres:'Pro("vôtre").n("p").g("f")',
   leur:'Pro("leur")',
   leurs:'Pro("leur").n("p")',
   leur:'Pro("leur").g("f")',
   leurs:'Pro("leur").n("p").g("f")',
}

const possDetsFr ={
    mon: 'D("mon").pe(1)',
    mon: 'D("mon").pe(1).n("s").g("m")',
    ma: 'D("mon").pe(1).n("s").g("f")',
    mes: 'D("mon").pe(1).n("p").g("m")',
    mes: 'D("mon").pe(1).n("p").g("f")',
    ton: 'D("mon").pe(2)',
    ton: 'D("ton").n("s").g("m")',
    ta: 'D("ton").n("s").g("f")',
    tes: 'D("ton").n("p").g("m")',
    tes: 'D("ton").n("p").g("f")',
    son: 'D("mon").pe(3)',
    son: 'D("son").n("s").g("m")',
    sa: 'D("son").n("s").g("f")',
    ses: 'D("son").n("p").g("m")',
    ses: 'D("son").n("p").g("f")',
    notre: 'D("notre").pe(1)',
    notre: 'D("notre").pe(1).n("s").g("m")',
    notre: 'D("notre").pe(1).n("s").g("f")',
    nos: 'D("notre").pe(1).n("p").g("m")',
    nos: 'D("notre").pe(1).n("p").g("f")',
    votre: 'D("notre").pe(2)',
    votre: 'D("votre").n("s").g("m")',
    votre: 'D("votre").n("s").g("f")',
    vos: 'D("votre").n("p").g("m")',
    vos: 'D("votre").n("p").g("f")',
    leur: 'D("notre").pe(3)',
    leur: 'D("leur").n("s").g("m")',
    leur: 'D("leur").n("s").g("f")',
    leurs: 'D("leur").n("p").g("m")',
    leurs: 'D("leur").n("p").g("f")',
}
 
QUnit.test( "Pronoms français", function( assert ) {
    loadFr();
    for (let [pro,results] of Object.entries(tonicsFr)){
        for (let ix in optionsFr){
            const exp=eval(`Pro("${pro}").${optionsFr[ix]}`+(pro=="moi"?".pe(1)":""));
            assert.equal(exp.realize(),tonicsFr[pro][ix],exp.toSource()+"=>"+tonicsFr[pro][ix])
        }
    }
    for (let [val,exp] of Object.entries(possProsFr)){
        assert.equal(eval(exp).realize(),val,exp+"=>"+val)
    }
    for (let [val,exp] of Object.entries(possDetsFr)){
        assert.equal(eval(exp).realize(),val,exp+"=>"+val)
    }
    
});