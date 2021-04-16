#!/usr/bin/env bash
LANG=${1:-en}
# LANG=${1:-fr}
f=$2

echo $f
time ( node UDregenerator-node.js $LANG $f >$f.out ) 2>/tmp/xyz
grep real /tmp/xyz 
echo nb sent : `grep '^# text =' $f | wc -l` 
echo nb toks : `egrep "^[0-9]+\t" $f | wc -l`
echo nb non-projective : `egrep "## non projective" $f.out | wc -l`
echo OK : `egrep "# TEXT =" $f.out | wc -l` 
echo regen-diffs: `egrep '^[0-9]+ diff' $f.out | wc -l`
echo lexicon-errors: `egrep 'not found in lexicon | absent du lexique' $f.out | wc -l` 
tail -2 $f.out
