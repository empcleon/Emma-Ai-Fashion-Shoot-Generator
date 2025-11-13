import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ImageChatProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isProcessing: boolean;
}

const ImageChat: React.FC<ImageChatProps> = ({ messages, onSendMessage, isProcessing }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isProcessing) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="p-3">
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2 mb-2">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.author === 'user' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-zinc-700 text-zinc-200'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 {isProcessing && (
                    <div className="flex justify-start">
                         <div className="bg-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm flex items-center">
                            <SpinnerIcon className="w-4 h-4 mr-2" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., Change the background to a beach"
                    disabled={isProcessing}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-md p-2 text-sm text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                />
            </form>
        </div>
    );
};

export default ImageChat;
