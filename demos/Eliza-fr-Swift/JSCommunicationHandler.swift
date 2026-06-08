//
//  JSCommunicationHandler.swift
//  JavaScriptCoreExample
//
//  Created by Gualtiero Frigerio on 19/11/2019.
//  Copyright © 2019 Gualtiero Frigerio. All rights reserved.
//  https://github.com/gualtierofrigerio/JavaScriptCoreExample/tree/master/JavaScriptCoreExample
//  Simplified by Guy Lapalme, May 2026
//     because all input and output are simple strings and not objects or numbers

import Foundation
import JavaScriptCore

class JSCommunicationHandler {
    private let context = JSContext()! // note that the optional is unwrapped
    private let TRACE = false
    
    init() {
        // catch JS exception
        context.exceptionHandler = {context, exception in
            if let exception = exception {
                print("jsException:\(exception)")
            }
        }
        
        // add "require" to the JavaScript evaluation context
        // adapted from https://stackoverflow.com/questions/48354804/how-to-import-modules-in-swifts-javascriptcore
        // CAUTION: this only evaluates the file in the JavaScriptCore context
        // this is different from the "real" require:
        //    it DOES NOT return any value, nor deal with module.exports
        // The following was thought to be useful but is not currently used,
        // we leave it just in case...
//        let require: @convention(block) (String) -> (JSValue?) = { path in
//            // Return void or throw an error here.
//            guard FileManager.default.fileExists(atPath: path)
//                else { debugPrint("Require: filename \(path) does not exist"); return nil}
//            guard let fileContent = try? String(contentsOfFile: path,encoding: .utf8)
//                else { debugPrint("Bad file content"); return nil}
//            return self.context.evaluateScript(fileContent)
//        }
//        self.context.setObject(require,forKeyedSubscript: "require" as NSString)
    }
    // loading files
    func loadSourceFile(_ fileName:String) {
        guard let stringFromUrl = try? String(contentsOfFile: fileName,encoding:.utf8) else {return}
        context.evaluateScript(stringFromUrl)
    }

    func loadBundle(_ ressource:String,_ ext:String){
        // this has not yet been tested...
        let bundle = Bundle.main
        if let url = bundle.url(forResource: ressource, withExtension: ext) {
            if let script = try? String(contentsOf: url,encoding: .utf8) {
                context.evaluateScript(script)
            }
        } else {
            print("Unable to load \(ressource).\(ext)")
        }
    }
    
    
    func evaluateJavaScript(_ jsString:String) -> String {
        if TRACE {print("eval: \(jsString)")}
        return context.evaluateScript(jsString).toString() ?? ""
    }
    
    func call(_ fName:String,_ params:String...)->String {
        evaluateJavaScript("\(fName)(\(params.joined(separator: ",")));")
    }

    func getObject(_ name:String) -> Any? {
        return context.objectForKeyedSubscript(name)
    }
    
    func setObject(_ object:Any, withName:String) {
        context.setObject(object, forKeyedSubscript: withName as NSCopying & NSObjectProtocol)
    }
}
