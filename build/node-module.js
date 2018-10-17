if (typeof module !== 'undefined' && module.exports) {
    //// exports pour node.js
    //  Terminaux
    exports.N=N;
    exports.A=A;
    exports.Pro=Pro;
    exports.D=D;
    exports.V=V;
    exports.Adv=Adv;
    exports.P=P;
    exports.C=C;
    exports.Q=Q;
    // Syntagmes
    exports.S=S;
    exports.SP=SP;
    exports.CP=CP;
    exports.VP=VP;
    exports.NP=NP;
    exports.AP=AP;
    exports.PP=PP;
    exports.AdvP=AdvP;

    exports.DT=DT; // dates
    exports.NO=NO; // nombres

    exports.addToLexicon=addToLexicon;
    exports.getLemma=getLemma;
    exports.oneOf=oneOf;

    if (typeof lexiconEn !== "undefined") exports.lexiconEn=lexiconEn;
    if (typeof loadEn    !== "undefined") exports.loadEn=loadEn;
    if (typeof lexiconFr !== "undefined") exports.lexiconFr=lexiconFr;
    if (typeof loadFr    !== "undefined") exports.loadFr=loadFr;
}