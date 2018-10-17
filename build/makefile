js   := jsRealB-dme.js jsRealB-dmefr.js jsRealB-en.js jsRealB-enfr.js jsRealB-fr.js
minjs = $(patsubst %.js,../dist/%.min.js,$(js))

## create different version of jsRealB by concatenating basic modules

info:
	echo "make dist to create all dist files."

jsRealB-dme.js   : core.js rule-en.js lexicon-dme.js addLexicon-dme.js  node-module.js
	cat $^ > $@
jsRealB-enfr.js  : core.js rule-en.js lexicon-en.js  rule-fr.js lexicon-fr.js addLexicon-en.js   addLexicon-fr.js node-module.js
	cat $^ > $@
jsRealB-dmefr.js : core.js rule-en.js lexicon-dme.js rule-fr.js lexicon-fr.js addLexicon-dme.js  addLexicon-fr.js node-module.js
	cat $^ > $@

lexicon-dme.js : lexicon-var-en.js lexicon-dme.json
	cat $^ > $@

# generic rules for en|fr	
rule-%.js : rule-var-%.js rule-%.json
	cat $^ > $@

lexicon-%.js : lexicon-var-%.js lexicon-%.json
	cat $^ > $@

jsRealB-%.js : core.js rule-%.js lexicon-%.js addLexicon-%.js node-module.js
	cat $^ > $@	

../dist/%.min.js : %.js
	mkdir -p ../dist
	uglifyjs $^ -c >$@

clean:
	rm -f jsRealB-*.js

dist: $(minjs)

test-server: server-dme.js testServer.py
	node server-dme.js & \
	PID=$$! ;\
	sleep 3 ; \
	python3 testServer.py ;\
	kill $$PID

test-filter: filter-dme.js
	echo 'S(NP(D("the"),N("man")),VP(V("love")))' | node filter-dme.js

JS:   $(js)

NODE: $(node)
