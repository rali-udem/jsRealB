var data = [
    new Task("a",10,"c,q,t"),
    new Task("b",3, "c,u"),
    new Task("c",15,"k,d,p"),
    new Task("d",10,"f,o"),
    new Task("e",15,"g,i,o,f",),
    new Task("f",5,"g,i,o"),
    new Task("g",30,"h"),
    new Task("h",20,"n"),
    new Task("i",4, "j"),
    new Task("j",18,"n"),
    new Task("k",60,"l,m"),
    new Task("l",20,"m,s"),
    new Task("m",5 ,"n"),
    new Task("n",25,"x,w,r"),
    new Task("o",5, "p"),
    new Task("p",5, "w,r"),
    new Task("q",45,"r"),
    new Task("r",35,"s"),
    new Task("s",40,"u"),
    new Task("t",2,"v"),
    new Task("u",20,"v"),
    new Task("v",20,""),
    new Task("w",35,""),
    new Task("x",55,"")
];

var tasks={};
// créer un objet pour faciliter les indexations
for (var i = 0; i < data.length; i++) {
    var d=data[i];
    d.index=i;
    tasks[d.id]=d;
}

///// for the node.js module
if (typeof module !== 'undefined' && module.exports) {
    exports.tasks=tasks;
    exports.data=data;
}
