//
//  Eliza_frApp.swift
//  Eliza-fr
//
//  Created by Guy Lapalme on 2026-05-30.
//

import SwiftUI
import JavaScriptCore
import Foundation

let jsch = JSCommunicationHandler()

@main
struct Eliza_frApp: App {
    var body: some Scene {
        // load jsRealB
        jsch.loadBundle("jsRealB","js")
        // load eliza
        jsch.loadBundle("eliza-all","js")
        return WindowGroup {
            ContentView()
        }
    }
}
