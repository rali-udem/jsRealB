// table of pronouns as given by François Lareau

const options=['tn("")','tn("refl")','c("nom")','c("acc")','c("dat")','c("gen")'];

const tonics = {
  "me":  ["me","myself","I","me","me","mine"],
  "you": ["you","yourself","you","you","you","yours"],
  "him": ["him","himself","he","him","him","his"],
  "her": ["her","herself","she","her","her","hers"],
  "it":  ["it","itself","it","it","it","its"],
  "us":  ["us","ourselves","we","us","us","ours"],
  "them":["them","themselves","they","them","them","theirs"],
}

const possDets ={
    my:'D("my").pe(1).ow("s")',
    your:'D("my").pe(2).ow("s")',
    his:'D("my").pe(3).ow("s").g("m")',
    her:'D("my").pe(3).ow("s").g("m").g("f")',
    its:'D("my").pe(3).ow("s").g("m").g("f").g("n")',
    our:'D("my").pe(1).ow("p")',
    your:'D("my").pe(2).ow("p")',
    their:'D("my").pe(3).ow("p")',
}

QUnit.test( "English pronouns", function( assert ) {
    loadEn();
    for (let [pro,results] of Object.entries(tonics)){
        for (let ix in options){
            const exp=eval(`Pro("${pro}").${options[ix]}`+(pro=="me"?".pe(1)":""));
            assert.equal(exp.realize(),tonics[pro][ix],exp.toSource()+"=>"+tonics[pro][ix])
        }
    }
    for (let [val,exp] of Object.entries(possDets)){
        assert.equal(eval(exp).realize(),val,exp+"=>"+val)
    }
});