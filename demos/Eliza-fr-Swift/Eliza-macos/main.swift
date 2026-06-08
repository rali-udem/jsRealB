//
//  main.swift
//  TestJSfromSwift-cl
//
//  Created by Guy Lapalme on 2026-05-28.
//

import JavaScriptCore
import Foundation

let jsch = JSCommunicationHandler()

// Find the current directory for the source file
let sourceDirectoryUrl = URL(filePath: #filePath).deletingLastPathComponent()

// load jsRealB
let jsRealBpath = URL(filePath: "../jsRealB.js", relativeTo: sourceDirectoryUrl).path
jsch.loadSourceFile(jsRealBpath)
// load eliza
let elizaPath = URL(filePath:"../eliza-all.js",relativeTo:sourceDirectoryUrl).path
jsch.loadSourceFile(elizaPath)

// set options for jsRealB
jsch.setObject("m", withName:"user_gender" )
jsch.setObject("m", withName:"eliza_gender" )
jsch.setObject(true, withName:"use_majestic" )

// example of call to jsRealB from Swift
print(jsch.evaluateJavaScript("""
    S(VP(V("discuter").pe(2).t("ip"),
         PP(P("avec"),Q("Eliza"))).a("!"),
      VP(V("taper").pe(2).t("ip"),
         Q("bye").ba('"'),
         PP(P("pour"),V("terminer").t("b"))).ba("(")
    ).typ({"maje":use_majestic}).realize()
    """
))

var prompt = jsch.call("initial_prompt")
print(prompt)
while let userInput = readLine() {
    // quote user input so that it is not evaluated by JS
    let quotedInput = "\"\(userInput.replacingOccurrences(of: "\"", with: "\\\""))\""
//    print("quoted: \(quotedInput)")
    if (jsch.call("want_to_quit",quotedInput)=="yes"){
        print(jsch.call("bye"))
        break;
    } else {
        prompt = jsch.call("answer",quotedInput)
        print(prompt)
    }
}
