"Improvements" to the ACE JavaScript editor for jsRealB evaluation demo
Sept 2024 

This editor is very convenient to create jsRealB expressions to that they can be tested in the browser.
Over the years, we have added two features:
   - Color highlighting of jsRealB constructors
   - After a newline, indent to the current parenthesis level (instead of the same indent as the previous line)

In 2024, there were some problems typing diacritics in French (e.g. être which appeared as "^être").
This problem did not occur in recent versions of ACE. 

So we decided to apply the previous modifications to the new version. 
Unfortunately, I did not find a way to do these without changing the source code.

Here is a memorandum of these modifications, should they be needed to be applied again.
They are marked as "Guy Lapalme" in the sources, so searching for this string should flag these.

Needed files: 
"mode-javascript.js":
- in "JavaScriptHighlightRules", in "this.rules": add "highlight" regex for jsRealB constructors
- add function "computeParenStack" 
- add calls to "computeParenStack" in "getNextLineIndent" to which two parameters have been added

"ace.js":
- in "insert", add two parameters to the call to "getNextLineIndent"

"theme-textmate.js", "worker-javascript.js":
- no modification
