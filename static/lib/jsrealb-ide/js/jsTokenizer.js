// Token

Token.IDENTIFIER=1;
Token.NUMBER=2;
Token.SYM=3;
Token.STRING=4;
Token.OPERATOR=5
Token.OTHER=6;
Token.END_INPUT=7;

Token.types=["","IDENTIFIER","NUMBER","SYM","STRING","OPERATOR","OTHER","END_INPUT"];

Token.prototype.toString=function(){
    return "Token{"+Token.types[this.type]+",'"+this.val+"'}"
}

function Token(type,val){
    this.type=type;
    this.val=val;
}

//Tokenizer
Tokenizer.prototype.toString=function(){
    var res="Tokenizer: token="+this.token.toString()+"\n";
    var lines=this.input.split("\n");
    var k=0;
    var p=this.pos;
    var j=0;
    for(;j<lines.length;j++){
        k+=lines[j].length;
        res+=lines[j]+"\n";
        if(p>k){
            p-=lines[j].length+1;
        } else {
            for(;p>0;p--)res+=" ";
            res+="^\n";
            break;
        }
    }
    for(j++;j<lines.length;j++)res+=lines[j]+"\n";
    return res;
}

Tokenizer.prototype.span=function(regex,c){
    if(regex.test(c)){
        var str=c;
        this.pos++;
        while(this.pos < this.input.length && regex.test(c=this.input.charAt(this.pos))){
            str+=c;
            this.pos++;
        }
        return str;
    } else 
        return null    
}

Tokenizer.inWordRE=/[\w\u00C0-\u022F]/;
Tokenizer.noQuoteRE=/[^"]/;
Tokenizer.noAposRE=/[^']/;
Tokenizer.operatorRE=/[\+\-\*/\.:<>=\?!\|]/;

Tokenizer.prototype.next=function(){
    var c;
    if(this.pos>this.input.length)
        return this.token=new Token(Token.END_INPUT,null);
    if(/\/\//.test(this.input.substr(this.pos,2)))
        return this.token=new Token(Token.END_INPUT,null);
    while(/\s/.test(c=this.input.charAt(this.pos))){
        if(this.pos>this.input.length)
            return this.token=new Token(Token.END_INPUT,null);
        this.pos++;
    }
    if(",()[]{}".indexOf(c)>=0){
        this.pos++;
        return this.token=new Token(Token.SYM,c);
    }
    var str=this.span(Tokenizer.operatorRE,c); // vérification grossière des opérateurs permis
    if(str)return this.token=new Token(Token.OPERATOR,str);
    var str= this.span(/[0-9.]/,c);
    if(str) return this.token=new Token(Token.NUMBER,str);
    str = this.span(Tokenizer.inWordRE,c);
    if(str) return this.token=new Token(Token.IDENTIFIER,str);
    if(c=='"'){
        this.pos++;
        str=this.span(Tokenizer.noQuoteRE,this.input.charAt(this.pos));
        this.pos++;
        return this.token=new Token(Token.STRING,'"'+str+'"');
    }
    if(c=="'"){
        this.pos++;
        str=this.span(Tokenizer.noAposRE,this.input.charAt(this.pos));
        this.pos++;
        return this.token=new Token(Token.STRING,"'"+str+"'");
    }
    if(str) return this.token=new Token(Token.IDENTIFIER,str);
    this.pos++;
    if(this.pos>this.input.length)return new Token(Token.END_INPUT,null);
    return this.token=new Token(Token.OTHER,c);
}

Tokenizer.prototype.getAllTokens=function(){
    var res=[];
    for(var tok=this.next();tok.type!=Token.END_INPUT;tok=this.next())
        res.push(tok);
    return res;
}

function Tokenizer(input){
    this.input=input;
    this.pos=0;
    this.next();
}
