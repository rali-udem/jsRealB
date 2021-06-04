#!/usr/bin/env bash
# LANG=${1:-en}
LANG=${1:-fr}
UDdir=/Users/lapalme/Dropbox/UDregenerator/UD-2.8
LOG=$UDdir/$LANG/log.txt

rm -f $LOG 
for f in $UDdir/$LANG/*.conllu; do
    echo $f
    echo $f >>$LOG 
    time ( node UDregenerator-node.js $LANG $f >$f.out ) 2>/tmp/xyz
    grep real /tmp/xyz >>$LOG
    tail -4 $f.out >>$LOG
    echo nb toks : `egrep "^[0-9]+\t" $f | wc -l` >>$LOG
    echo OK : `egrep "^# TEXT =" $f.out | wc -l` >>$LOG
    echo lexicon-errors: `egrep 'not found in lexicon | absent du lexique' $f.out | wc -l` >>$LOG
    echo "---">>$LOG
done
