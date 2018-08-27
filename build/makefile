## create different version of jsRealB by concatenating basic modules

info:
	echo "make ALL to create all dist files."

jsRealB-dme.js   : core.js rule-en.js lexicon-dme.js addLexicon-dme.js 
	cat $^ > $@
jsRealB-enfr.js  : core.js rule-en.js lexicon-en.js  rule-fr.js lexicon-fr.js addLexicon-en.js   addLexicon-fr.js
	cat $^ > $@
jsRealB-dmefr.js : core.js rule-en.js lexicon-dme.js rule-fr.js lexicon-fr.js addLexicon-dme.js  addLexicon-fr.js
	cat $^ > $@

lexicon-dme.js : lexicon-var-en.js lexicon-dme.json
	cat $^ > $@

# generic rules for en|fr	
rule-%.js : rule-var-%.js rule-%.json
	cat $^ > $@

lexicon-%.js : lexicon-var-%.js lexicon-%.json
	cat $^ > $@

jsRealB-%.js : core.js rule-%.js lexicon-%.js addLexicon-%.js
	cat $^ > $@	

# create the Node module for en|fr|dme|enfr|dmefr
jsRealB-%-node.js : jsRealB-%.js node-module.js
	cat $^ > $@

%.min.js : %.js
	uglifyjs $^ -c >$@

clean:
	rm -f jsRealB-*.js

test-server: server-dme.js testServer.py
	node server-dme.js & \
	PID=$$! ;\
	sleep 3 ; \
	python testServer.py ;\
	kill $$PID

test-filter: filter-dme.js
	echo 'S(NP(D("the"),N("man")),VP(V("love")))' | node filter-dme.js

ALL: jsRealB-dme.js jsRealB-dmefr.js jsRealB-dme-node.js jsRealB-en.js jsRealB-en-node.js

MIN: jsRealB-dme.min.js jsRealB-dmefr.min.js jsRealB-dme-node.min.js jsRealB-en.min.js jsRealB-en-node.min.js
