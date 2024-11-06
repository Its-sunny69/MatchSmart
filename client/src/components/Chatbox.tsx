import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Socket } from "socket.io-client";

interface ChatboxProps {
    roomId: string,
    socket: Socket
}

interface Message {
    id: string;
    msg: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ roomId, socket }) => {
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        // Listen for incoming messages and update the messages array
        socket.on('message', (msg: string, id: string) => {
            setMessages((prevMessages) => [...prevMessages, { id, msg }]);
        });

        // Clean up the listener when the component unmounts
        return () => {
            socket.off('message');
        };
    }, [socket]);

    const handleSendMessage = () => {
        if (!message.trim()) {
            return alert('Please enter a message.');
        }

        // Emit the message to the server
        socket.emit('message', message, roomId, socket.id!); // Use `socket.id!` to assert non-nullable
        setMessages((prevMessages) => [...prevMessages, { id: socket.id!, msg: message }]);
        setMessage('');
    };

    return (
        <div className="w-full h-fit flex-col">
            <div className="w-full border-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                {messages.map((msgObj, index) => (
                    <div
                        key={index}
                        className={`w-full p-2 flex ${msgObj.id === socket.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-xs p-3 rounded-lg ${msgObj.id === socket.id ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
                            <p>{msgObj.msg}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-auto w-full h-24 flex justify-center items-center">
                <div className="w-3/4 h-full border-2 flex justify-center items-center">
                    <Input
                        className="w-full py-5 text-lg"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
                <Button
                    className="border-2 py-3 px-10 bg-blue-500 text-white"
                    onClick={handleSendMessage}
                >
                    Send
                </Button>
            </div>
        </div>
    );
};

export default Chatbox;
