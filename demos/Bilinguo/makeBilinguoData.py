#!/usr/bin/env python3.10

#  Create sentence patterns for Bilinguo demo from pairs of sentences with parameters
#     - parse English and French sentence into dependencies using Stanza
#     - convert Stanza dependencies into jsReal Dependents
#     - create a file in the format expected by Bilinguo
#     - The resulting file can then be hand edited for tuning the parameterization

#  The input file (ending in "-fr-en.txt") consists of groups of lines separated by an empty line
#     - level of "difficulty" of this sentence
#     - French sentence
#     - English sentence
#     - lines of parameters as French-English comma separed word pairs (pairs are separated by semicolons)
#     - the words in the first pair must be specified exactly as they appear in the sentence (not their lemma)
#       the words in the other pairs are alternative that should be given as LEMMATA

# CAUTION:
#   - Only isolated words can be specified as parameters
#   - Sentences should be affirmative at the indicative present tense, 1st person singular so that variations can be applied
#   - this translation into JavaScript for Bilinguo is intended to be a first approximation that should be
#     checked carefully before being added to the Binlinguo web page.

import stanza
from pyrealb import *

udPos_jsrPos = {
    #  Open class
    "ADJ": "A", "ADV": "Adv", "INTJ": "Q", "NOUN": "N", "PROPN": "Q", "VERB": "V",
    # Closed class
    "ADP": "P", "AUX": "V", "CCONJ": "C", "DET": "D", "NUM": "NO", "PART": "Q", "PRON": "Pro", "SCONJ": "C",
    # other
    "PUNCT": "Q", "SYM": "Q", "X": "Q",
}

udDeprel_jsrDep = {
    # core arguments
    "nsubj": "subj", "csubj": "subj",
    "obj": "comp", "ccomp": "comp",
    "iobj": "comp", "xcomp": "comp",
    # non-core dependents
    "obl": "comp", "advcl": "mod", "advmod": "mod", "aux": "mod",
    "vocative": "mod", "discourse": "mod", "cop": "mod",
    "expl": "mod", "mark": "mod",
    # nominal dependents
    "nmod": "mod", "acl": "comp", "amod": "mod", "det": "det",
    "appos": "mod", "clf": "mod",
    "nummod": "mod", "case": "mod",
    # coordination
    "conj": "mod", "cc": "mod",
    # multiword expressions
    "fixed": "mod", "flat": "mod", "compound": "mod",
    # loose
    "list": "mod", "parataxis": "mod", "dislocated": "mod",
    # special
    "orphan": "mod", "goeswith": "mod", "reparandum": "mod",
    # other
    "punct": "mod", "root": "root", "dep": "comp",
}


#  create the Dependency structure
class UDNode:
    """Information about the structure of the dependencies"""

    def __init__(self, w):
        self.w = w
        self.left = []
        self.right = []

    def __str__(self):
        return self.w.text + ":" + str(self.left) + ":" + str(self.right)


def makeFeats(s):
    if s is None or s == "_": return {}
    return dict(f.split("=") for f in s.split("|"))


# patch dependency words containing a copula by swapping root noun or adjective with the current root
#   UD has the attribute as root, but for jsRealB the root should be the copula (as in SUD)
def patchCopula(root, sent):
    copIdx = -1  # find index of copula
    for i, w in enumerate(sent.words, 1):
        if w.head == root and w.deprel == "cop":
            copIdx = i
            break
    if copIdx < 0:
        return root  # no copula found, no change is done
    # mark new root
    sent.words[copIdx - 1].deprel = "root"  # HACK: sent.words is 0-based
    sent.words[copIdx - 1].head = 0
    # swap pointers between new root and copula
    for w in sent.words:
        if w.head == root:
            w.head = copIdx
        elif w.head == copIdx:
            w.head = root
    sent.words[root - 1].head = copIdx
    root = copIdx
    return root


def makeNodes(sent):
    nodes = [None]
    root = -1
    lastWord = sent.words[-1]
    if lastWord.upos == "PUNCT":
        # remove final punct, it will be regenerated by jsRealB
        sent.words.pop(-1)
    for i, w in enumerate(sent.words, 1):
        if w.head == 0:
            root = i
        nodes.append(UDNode(w))
    if nodes[root].w.upos != "VERB":
        root = patchCopula(root, sent)
    for (i, w) in enumerate(sent.words, 1):
        if w.head != 0:
            if i < w.head:
                nodes[w.head].left.append((w.deprel, i))
            else:
                nodes[w.head].right.append((w.deprel, i))
    return (nodes[root], nodes)


def option(name, s):
    return "." + name + "(" + repr(s) + ")"


def makeTerminal(w, env):
    termType = udPos_jsrPos.get(w.upos, "*" + w.upos + "*")
    opts = ""
    feats = makeFeats(w.feats)
    lemma = w.lemma
    if termType == "Pro":
        if lemma == "my":  # very special case...
            termType = "D"
            opts += ".pe(pe).n(n).g('f')"
        else:
            if lemma == "I":
                lemma = "me"
            elif lemma == "il":
                lemma = "moi"
            elif lemma == "se":
                lemma = "me*refl"
            # print(w.feats,feats)
            if "Case" in feats:
                opts += option("c", feats['Case'].lower())
            else:
                opts += option("c", "nom")
    elif termType == "D" and lemma == "son":
        lemma="mon"
        opts += ".pe(pe).n(n)"
    elif termType == "V":
        if "VerbForm" in feats:
            verbForm = feats["VerbForm"]
            if verbForm == "Fin":
                if "Mood" in feats and feats["Mood"] == "Ind":
                    if feats["Tense"] == "Past":
                        opts += option("t", "ps")
            elif verbForm == "Inf":
                opts += option("t", "b")
            elif verbForm == "Ger":
                opts += option("t", "pr")
            elif verbForm == "Part":
                opts += option("t", "pp" if feats["Tense"] == "Past" else "pr")
    elif termType == "Adv":
        if lemma == "when":
            termType = "C"
    if w.text in env:
        env[w.text] = w.lemma
        return termType + "(" + w.text + ")" + opts
    return termType + "(" + repr(lemma) + ")" + opts


def ppDep(nodes, env, node, deprel, isLeft, indent):
    deprel = udDeprel_jsrDep.get(deprel, "comp")
    terminal = makeTerminal(node.w, env)
    res = deprel + "(" + terminal
    if deprel == "subj":
        if terminal.startswith("N"):
            res += ".n(n)"
        elif terminal.startswith("Pro"):
            res += ".n(n).pe(pe)"
    indent += len(deprel) + 1
    sep = ",\n" + indent * " "
    if len(node.left):
        res += "".join([sep + ppDep(nodes, env, nodes[i], deprel, True, indent) for (deprel, i) in node.left])
    if len(node.right):
        res += "".join([sep + ppDep(nodes, env, nodes[i], deprel, False, indent) for (deprel, i) in node.right])
    res += ")"
    if isLeft and deprel not in ["subj", "det", "root"]:
        res += ".pos('pre')"
    elif not isLeft and deprel not in ["comp", "mod"]:
        res += ".pos('post')"
    return res


def text2jsrDep(nlp, text, env, id, conlluFile=None):
    doc = nlp(text)
    sentence = doc.sentences[0]
    sentence.sent_id = str(id)
    if conlluFile is not None:
        conlluFile.write("{:C}\n\n".format(doc))
    # sentence.print_words()
    (root, nodes) = makeNodes(sentence)
    return ppDep(nodes, env, root, "root", True, 4)


def show_infos(id, level, text, TEXT, en_params, en, fr_params, fr, params):
    return f"""
{{
  "id":{id},
  "level":{level},
  "text":{text},
  "TEXT":{TEXT},
  "en":({en_params})=>
  {en},
  "fr":({fr_params})=>
  {fr},   
  "params":{params},
}},"""


def makeSentences(infileN):
    if not infileN.endswith("-fr-en.txt"):
        print("bad file name:", infileN)
        return

    sentences = open(infileN, "r").read().split("\n\n")
    # prepare JavaScript outfile
    outfileN = infileN.replace(".txt", ".js")
    outFile = open(outfileN, "w")
    conlluFile = open(infileN.replace(".txt", ".conllu"), "w")
    outFile.write('import {dets,pes,numbers,relatives} from "./entities.js"\n')
    outFile.write("export {sentences}\n")
    outFile.write("const sentences = [")

    for (id, lines) in enumerate(sentences, 1):
        if len(lines)<=1: break
        [level, fr, en, *params] = lines.split("\n")
        en = en.strip()
        fr = fr.strip()
        # create list of parameters
        pairs = []
        for param in params:
            param=param.replace(" ","")
            if len(param)==0:break
            pairs.append([p.split(",") for p in param.split(";")])

        print(level,fr)  # process French sentence
        loadFr()
        fr_env = dict(env)
        if len(pairs) > 0:
            fr_env.update({p[0][0]: p[0] for p in pairs})
        fr_jsr = text2jsrDep(nlp_fr, fr, fr_env, id, conlluFile)
        fr_text = eval(fr_jsr, None, fr_env).realize()
        # patch first pairs to put its lemma that has been updated in the fr_env
        for i in range(0, len(pairs)):
            pairs[i][0][0] = fr_env[pairs[i][0][0]]

        print(level,en)  # process English sentence
        loadEn()
        en_env = dict(env)
        if len(pairs) > 0:
            en_env.update({p[0][1]: p[0][1] for p in pairs})
        en_jsr = text2jsrDep(nlp_en, en, en_env, id, conlluFile)
        en_text = eval(en_jsr, None, en_env).realize()
        # patch first pairs to put its lemma that has been updated in the en_env
        for i in range(0, len(pairs)):
            pairs[i][0][1] = en_env[pairs[i][0][1]]

        # write the combined results
        outFile.write(
            show_infos(id, level,
                       repr(en + " | " + fr), repr(en_text + "| " + fr_text),
                       ",".join(en_env.keys()), en_jsr, ",".join(fr_env.keys()), fr_jsr,
                       "[pes,numbers" + "".join(",\n" + 10 * " " + str(p) for p in pairs) + "]"
                       ))
    outFile.write("];\n")
    outFile.close()
    print(outfileN + " written")
    conlluFile.close()


# launch generation
nlp_en = stanza.Pipeline("en", processors='tokenize,pos,lemma,depparse', verbose=False)
nlp_fr = stanza.Pipeline("fr", processors='tokenize,pos,lemma,depparse,mwt', verbose=False)
env = {"pe": 1, "n": "s"}
# makeSentences("sentences-en-fr.txt")
makeSentences("./demos/Bilinguo/data/PhrasesDuJour-fr-en.txt")