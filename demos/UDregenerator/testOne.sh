#!/usr/bin/env bash
LANG=${1:-en}
# LANG=${1:-fr}
f=$2
if [-z "$f"]
then  echo "no file given"; exit;
fi
echo $f
time ( node UDregenerator-node.js $LANG $f >$f.out ) 2>/tmp/xyz
grep real /tmp/xyz 
tail -4 $f.out
echo nb toks : `egrep "^[0-9]+\t" $f | wc -l`
echo OK : `egrep "# TEXT =" $f.out | wc -l` 
