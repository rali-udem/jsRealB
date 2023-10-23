//////////// realiser part using jsRealB
Object.assign(globalThis,jsRealB);

class Realizer {
    // Common processing to both languages
    // Simple concatenation of the realization taking care of undefined return
    realize(fields,phrase_type){
        function noUndef(struct){
            if (struct == undefined) return ""
            return struct.realize()
        }
        switch (phrase_type) {
            case 1:
                return noUndef(CP(this.and_conj,
                                  this.advice(fields),
                                  this.customerRating(fields),
                                  this.familyFriendly(fields)));
            case 2:
                return noUndef(CP(this.and_conj,
                                  this.advice(fields),
                                  this.customerRating(fields)).a("."))
                       + noUndef(this.familyFriendly(fields));
            case 3:                        
                return noUndef(this.advice(fields))
                    + noUndef(this.customerRating(fields))
                    + noUndef(this.familyFriendly(fields))
        }
    }
}
