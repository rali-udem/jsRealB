#!/usr/bin/env bash
# LANG=${1:-en}
LANG=${1:-fr}
LOG=UD-2.7/$LANG/log.txt

rm -f $LOG 
for f in UD-2.7/$LANG/*.conllu; do
    echo $f
    echo $f >>$LOG 
    time ( node UDregenerator-node.js $LANG $f >$f.out ) 2>/tmp/xyz
    grep real /tmp/xyz >>$LOG
    echo nb sent : `grep '^# text =' $f | wc -l`  >>$LOG
    echo nb toks : `egrep "^[0-9]+\t" $f | wc -l` >>$LOG
    echo nb non-projective : `egrep "## non projective" $f.out | wc -l` >>$LOG
    echo OK : `egrep "^# TEXT =" $f.out | wc -l` >>$LOG
    echo regen-diffs: `egrep '^[0-9]+ diff' $f.out | wc -l` >>$LOG
    echo lexicon-errors: `egrep 'not found in lexicon | absent du lexique' $f.out | wc -l` >>$LOG
    tail -2 $f.out >>$LOG
    echo "---">>$LOG
done
