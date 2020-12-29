///  Tokenizer for a jsRealB expression

function Tokenizer(s){
    this.allTokens=this.tokenize(s)
    this.pos = 0;
}    

Tokenizer.prototype.current = function (){
    if (this.pos<this.allTokens.length)
        return this.allTokens[this.pos];
    return null;
}
    
Tokenizer.prototype.next = function (){
    if (++this.pos<this.allTokens.length)
        return this.allTokens[this.pos];
    return null;
}
    
Tokenizer.prototype.tokenize = function (s){
    let tokens=[];
    function addToken(kind,val,line,col){
        tokens.push({kind:kind,val:val,line:line,col:col})
    }
    // groups : 1=Constructor, 2=String, 3=Option, 4=number, 5=Special [(),]
    // caution: does not deal exactly with escape sequences within strings (strings must be double quoted)
    //          takes for granted that tokens (including string) do not span over more than one line
    const tokenRE = /([A-Za-z]+)|"([^"]+)"|\.([a-zA-Z]+\([^)]+\))|([0-9]+\.?[0-9]*)|([(),])/g
    let lines=s.split(/\n/)
    for (let i = 0; i < lines.length; i++) {
        let m;
        tokenRE.lastIndex=0;
        while ((m=tokenRE.exec(lines[i]))!=null){
            if (m[1]!=null)
                addToken("cnst",m[1],i+1,tokenRE.lastIndex-m[1].length+1);
            else if (m[2]!=null)
                addToken("str",m[2],i+1,tokenRE.lastIndex-m[2].length-1); // take quotes into account
            else if (m[3]!=null)
                addToken("opt",m[3],i+1,tokenRE.lastIndex-m[3].length+1);
            else if (m[4]!=null)
                addToken("num",m[4],i+1,tokenRE.lastIndex-m[4].length+1);
            else 
                addToken("sym",m[5],i+1,tokenRE.lastIndex)
        }
    }
    return tokens;
}

var constituents,terminals;  // results
// create a tree of node by parsing a jsRealB expression, using tokenizer tok
//   NO ERROR recovery...
function constParse(tok){
    let constituent,token;
    token=tok.current();
    if (token.kind=="cnst"){
        constituent={label:token.val,children:[],opts:[],x:-1,y:-1}
        constituents.push(constituent);
        token=tok.next();
        if (token.kind=="sym" && token.val=="("){
            do {
                token=tok.next();
                if (token.kind=="str" || token.kind=="num"){
                    let terminal = {form:token.val, x:-1,y:-1}
                    terminals.push(terminal)
                    constituent.children.push(terminal)
                    token=tok.next();
                } else if (token.kind=="cnst"){
                    constituent.children.push(constParse(tok));
                    token=tok.current();
                }
            } while (token.kind=="sym" && token.val==",");
            if (token===null) return constituent;
            if (token.kind ==="sym" || token.val ===")"){
                token=tok.next();
            } else {
                console.log("%d:%d - Right parenthesis expected",token.line,token.col);
                token=tok.next();
            }
            while (token!==null && token.kind=="opt"){
                constituent.opts.push(token.val);
                token=tok.next();
            }
            return constituent;
        } else {
            console.log("%d:%d - Left parenthesis expected",token.line,token.col);
            token=tok.next();
        }
    }
    return constituent;
}
