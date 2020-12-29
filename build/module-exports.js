//  Terminals
exports.N=N;
exports.A=A;
exports.Pro=Pro;
exports.D=D;
exports.V=V;
exports.Adv=Adv;
exports.P=P;
exports.C=C;
exports.Q=Q;
// Phrases
exports.S=S;
exports.SP=SP;
exports.CP=CP;
exports.VP=VP;
exports.NP=NP;
exports.AP=AP;
exports.PP=PP;
exports.AdvP=AdvP;

exports.DT=DT; // Dates
exports.NO=NO; // Numbers

// Utilities
exports.addToLexicon=addToLexicon; 
exports.updateLexicon=updateLexicon; 
exports.getLemma=getLemma;
exports.getLanguage=getLanguage;
exports.getLexicon=getLexicon;
exports.oneOf=oneOf;
exports.setExceptionOnWarning=setExceptionOnWarning;
exports.resetSavedWarnings=resetSavedWarnings;
exports.getSavedWarnings=getSavedWarnings;
// JSON
exports.fromJSON=fromJSON;
exports.ppJSON=ppJSON;

exports.jsRealB_version=jsRealB_version;
exports.jsRealB_dateCreated=jsRealB_dateCreated;

if (typeof lexiconEn !== "undefined") exports.lexiconEn=lexiconEn;
if (typeof loadEn    !== "undefined") exports.loadEn=loadEn;
if (typeof lexiconFr !== "undefined") exports.lexiconFr=lexiconFr;
if (typeof loadFr    !== "undefined") exports.loadFr=loadFr;
