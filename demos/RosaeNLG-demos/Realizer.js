export {Realizer};

class Realizer {
    realizePhone(phone){
        return [this.intro(phone),...this.phone_chunks(phone)].join("")  
    }

    makeParagraphs(elems){
        let res = ""
        for (let elem of elems){
            if (Array.isArray(elem)){
                res += "<p>"+elem.map(e=>e.realize()).join("")+"</p>\n"
            } else 
                res += "<p>"+elem.realize()+"</p>\n"
        }
        return res;
    }

    // English Example 
    //    https://rosaenlg.org/rosaenlg/4.3.0/tutorials/example_en_US.html
    realizeExample(){
        return this.title().tag("h3").realize()+"\n"+
          this.makeParagraphs([
            this.queenInfo(),
            this.succession(),
            this.crownJewels()
          ])
    }

    // Exemple en français
    //    https://rosaenlg.org/rosaenlg/4.3.0/tutorials/example_fr_FR.html
    realizeExemple(){
        return this.titre().tag("h3").realize()+"\n"+
          this.makeParagraphs([
            this.langues(),
            this.feteNationale(),
            this.president(),
            this.specialites(),
            this.repute()
        ])
    }
}
