import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { A2UISurface } from '../A2UISurface';

interface MessageListProps {
    components: any[];
    onAction?: (action: any) => void;
    talkBackEnabled?: boolean;
    selectedVoiceURI?: string;
}

export const MessageList = ({ components, onAction, talkBackEnabled, selectedVoiceURI }: MessageListProps) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [components]);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-2">
            <div className="max-w-4xl mx-auto min-h-full pb-8">
                {/* 
                  The A2UISurface handles the rendering of the component tree.
                  Ideally, we update A2UISurface to use our new MessageBubble internally 
                  OR we rewrite the list rendering here.
                  
                  Given A2UISurface is designed for the "Server Driven UI", 
                  we should likely keep using it but ensure it uses our nice styles.

                  However, the plan said "Components/Chat/MessageList.tsx".
                  So we can wrap A2UISurface here.
                */}
                <A2UISurface
                    id="main"
                    components={components}
                    onAction={onAction}
                    talkBackEnabled={talkBackEnabled}
                    selectedVoiceURI={selectedVoiceURI}
                    className="w-full"
                />

                <div ref={bottomRef} className="h-4" />
            </div>
        </div>
    );
};
