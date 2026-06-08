//
//  ContentView.swift
//  Eliza-fr
//
//  Created by Guy Lapalme on 2026-05-30.
//

// suggested by Gemini after the Google query
//       "swift application for message like interaction"

import SwiftUI

// 1. Data model representing an individual text chat item
struct MessageItem: Identifiable, Equatable {
    let id = UUID()
    let text: String
    let isFromCurrentUser: Bool
    var reaction: String? = nil
}

// 2. Main interactive interface coordinate layout
struct ChatInteractionView: View {
    @State private var messages: [MessageItem] = [
        MessageItem(text: jsch.evaluateJavaScript("""
    S(VP(V("discuter").pe(2).t("ip"),
         PP(P("avec"),Q("Eliza"))).a("!"),
      VP(V("taper").pe(2).t("ip"),
         Q("bye").ba('"'),
         PP(P("pour"),V("terminer").t("b"))).ba("(")
    ).typ({"maje":use_majestic}).realize()
    """),
                        isFromCurrentUser: false),
        MessageItem(text: jsch.call("initial_prompt"), isFromCurrentUser: false),
//        MessageItem(text: "Try long-pressing any bubble to react to it! 👍", isFromCurrentUser: false)
    ]
    @State private var typedText: String = ""
    @State private var activeReactionMessageID: UUID? = nil
    @State private var stopped: Bool = false
    
    var body: some View {
        ZStack {
            VStack {
                // Scrollable timeline feed of active interactions
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach($messages) { $msg in
                                ChatBubbleRow(message: $msg, activeReactionID: $activeReactionMessageID)
                                    .id(msg.id)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 10)
                    }
                    // Auto-scrolling feature forces focus onto newer incoming context data
                    .onChange(of: messages.count) { _ in
                        if let lastMessage = messages.last {
                            withAnimation {
                                proxy.scrollTo(lastMessage.id, anchor: .bottom)
                            }
                        }
                    }
                }
                
                Divider()
                
                // Dynamic Input composing panel bar
                HStack(spacing: 12) {
                    TextField("Écrivez ici...", text: $typedText, axis: .vertical)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        .cornerRadius(20)
                        .lineLimit(1...5)
                        .disableAutocorrection(true)
                        .textInputAutocapitalization(.never)
                    
                    Button(action: commitMessageDispatch) {
                        Image(systemName: "paperplane.fill")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(typedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .gray : .blue)
                    }
                    .disabled(typedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
            }
//            .blur(radius: activeReactionMessageID != nil ? 3 : 0)
//            .disabled(activeReactionMessageID != nil)
            
            // Context overlay window for emoji interaction options
//            if let targetID = activeReactionMessageID {
//                ReactionPickerOverlay(targetID: targetID, messages: $messages, activeReactionID: $activeReactionMessageID)
//            }
        }
//        .animation(.easeInOut(duration: 0.2), value: activeReactionMessageID)
    }
    
    private func commitMessageDispatch() {
        let cleanText = typedText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanText.isEmpty && !stopped else { return }
        
        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
            messages.append(MessageItem(text: cleanText, isFromCurrentUser: true))
            let quotedInput = "\"\(cleanText.replacingOccurrences(of: "\"", with: "\\\""))\""
            if (jsch.call("want_to_quit",quotedInput)=="yes"){
                messages.append(MessageItem(text:jsch.call("bye"),isFromCurrentUser: false))
                stopped = true
            } else {
                messages.append(MessageItem(text: jsch.call("answer",quotedInput), isFromCurrentUser: false))
            }
            typedText = ""
        }
    }
}

// 3. Extracted reusable structural presentation cell block
struct ChatBubbleRow: View {
    @Binding var message: MessageItem
    @Binding var activeReactionID: UUID?
    
    var body: some View {
        HStack {
            if message.isFromCurrentUser { Spacer() }
            
            VStack(alignment: message.isFromCurrentUser ? .trailing : .leading, spacing: 4) {
                Text(message.text)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(message.isFromCurrentUser ? Color.blue : Color(.systemGray5))
                    .foregroundColor(message.isFromCurrentUser ? .white : .primary)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .onLongPressGesture(minimumDuration: 0.4) {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        activeReactionID = message.id
                    }
                
                // Embedded micro-badge anchor for reactions
//                if let reaction = message.reaction {
//                    Text(reaction)
//                        .padding(4)
//                        .background(Color(.systemBackground))
//                        .font(.caption)
//                        .clipShape(Circle())
//                        .shadow(radius: 2)
//                        .offset(x: message.isFromCurrentUser ? -8 : 8, y: -8)
//                }
            }
            if !message.isFromCurrentUser { Spacer() }
        }
    }
}

// 4. Floating popover modal engine handling long-press emoji interaction additions
//struct ReactionPickerOverlay: View {
//    let targetID: UUID
//    @Binding var messages: [MessageItem]
//    @Binding var activeReactionID: UUID?
//    
//    let emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"]
//    
//    var body: some View {
//        Color.black.opacity(0.15)
//            .ignoresSafeArea()
//            .onTapGesture { activeReactionID = nil }
//        
//        VStack {
//            HStack(spacing: 16) {
//                ForEach(emojis, id: \.self) { emoji in
//                    Button(action: {
//                        applyReaction(emoji)
//                    }) {
//                        Text(emoji)
//                            .font(.system(size: 28))
//                            .scaleEffect(1.1)
//                    }
//                }
//            }
//            .padding(.horizontal, 20)
//            .padding(.vertical, 12)
//            .background(Color(.systemBackground))
//            .clipShape(Capsule())
//            .shadow(color: Color.black.opacity(0.15), radius: 10, x: 0, y: 5)
//        }
//    }
//    
//    private func applyReaction(_ emoji: String) {
//        if let index = messages.firstIndex(where: { $0.id == targetID }) {
//            messages[index].reaction = emoji
//        }
//        activeReactionID = nil
//    }
//}

struct ContentView: View {
    var body: some View {
        ChatInteractionView()
    }
}

#Preview {
    ContentView()
}
