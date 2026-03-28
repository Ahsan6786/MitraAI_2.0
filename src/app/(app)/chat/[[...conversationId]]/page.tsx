
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatInterface from '@/components/chat-interface';
import { ChatHistorySidebar, ChatHistorySidebarProvider, useChatHistorySidebar } from '@/components/chat-history-sidebar';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';


function ChatPageContent() {
    const params = useParams();
    const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : undefined;

    return (
        <div className="h-screen lg:h-full flex overflow-hidden">
            <div className="h-full w-80 bg-background/40 backdrop-blur-2xl border-r border-white/10 flex-col hidden lg:flex overflow-hidden shrink-0">
                <ChatHistorySidebar currentConversationId={conversationId} />
            </div>
            
            {/* Main Chat Interface */}
            <div className="flex-1 overflow-hidden h-full">
                <ChatInterface conversationId={conversationId} />
            </div>
        </div>
    );
}


function ChatPageWrapper() {
    return <ChatPageContent />;
}

export default function ChatPage() {
    return (
        <ChatHistorySidebarProvider>
            <ChatPageWrapper />
        </ChatHistorySidebarProvider>
    )
}
