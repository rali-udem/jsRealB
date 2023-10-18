export {Realizer};

class Realizer {
    realizePhone(phone){
        this.ref_idx=-1;
        return [this.intro(phone),...this.phone_chunks(phone)].join("")  
    }
}
