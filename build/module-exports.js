exports.Constituent=Constituent;

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
exports.Terminal=Terminal;

// Phrases
exports.S=S;
exports.SP=SP;
exports.CP=CP;
exports.VP=VP;
exports.NP=NP;
exports.AP=AP;
exports.PP=PP;
exports.AdvP=AdvP;
exports.Phrase=Phrase;

// Dependents
exports.root=root;
exports.subj=subj;
exports.det=det;
exports.mod=mod;
exports.comp=comp;
exports.compObj=compObj;
exports.compObl=compObl;
exports.coord=coord;
exports.Dependent=Dependent;

exports.DT=DT; // Dates
exports.NO=NO; // Numbers

// Utilities
exports.addToLexicon=addToLexicon; 
exports.updateLexicon=updateLexicon; 
exports.getLemma=getLemma;
exports.getLanguage=getLanguage;
exports.getLexicon=getLexicon;
exports.setQuoteOOV=setQuoteOOV;
exports.oneOf=oneOf;
exports.setExceptionOnWarning=setExceptionOnWarning;
exports.setReorderVPcomplements=setReorderVPcomplements;
exports.resetSavedWarnings=resetSavedWarnings;
exports.getSavedWarnings=getSavedWarnings;
exports.False=False;
exports.True=True;
exports.None=None;

// JSON
exports.fromJSON=fromJSON;
exports.ppJSON=ppJSON;

exports.jsRealB_version=jsRealB_version;
exports.jsRealB_dateCreated=jsRealB_dateCreated;

exports.lexiconEn=lexiconEn;
exports.loadEn=loadEn;
exports.lexiconFr=lexiconFr;
exports.loadFr=loadFr;
