import { useEffect, useState, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Socket } from "socket.io-client";
import SendSvg from "../assets/send.svg";
import "../App.css"

interface ChatboxProps {
  roomId: string;
  socket: Socket | null;
}

interface Message {
  id: string;
  msg: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ roomId, socket }) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [visibleMessages, setVisibleMessages] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    // Listen for incoming messages and update the messages array
    socket?.on("message", (msg: string, id: string) => {
      setMessages((prevMessages) => [...prevMessages, { id, msg }]);
    });

    // Clean up the listener when the component unmounts
    return () => {
      socket?.off("message");
    };
  }, [socket]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth", // Smooth scrolling effect
      });
    }
  }, [messages]);

  // Function to detect visible messages
  const detectVisibleMessages = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const buffer = 100; // Adjust buffer size (in pixels)

    const updatedVisibility: Record<number, number> = {};

    container.childNodes.forEach((node, index) => {
      const messageElement = node as HTMLElement;
      const rect = messageElement.getBoundingClientRect();

      // Adjust viewport range by adding buffer zone
      const topInView = rect.top >= containerRect.top - buffer;
      const bottomInView = rect.bottom <= containerRect.bottom + buffer;

      if (topInView && bottomInView) {
        const distanceFromTop = Math.max(
          0,
          rect.top - containerRect.top + buffer
        ); // Include buffer
        const visiblePercent =
          1 - distanceFromTop / (containerRect.height + buffer);
        updatedVisibility[index] = visiblePercent;
      }
    });

    setVisibleMessages(updatedVisibility);
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    container?.addEventListener("scroll", detectVisibleMessages);
    detectVisibleMessages(); // Initial detection

    return () =>
      container?.removeEventListener("scroll", detectVisibleMessages);
  }, [messages]);

  // Function to interpolate between two colors
  const interpolateColor = (
    color1: number[],
    color2: number[],
    factor: number
  ) => {
    return color1.map((start, i) =>
      Math.round(start + (color2[i] - start) * factor)
    );
  };

  const getBackgroundColor = (index: number) => {
    const visibility = visibleMessages[index] || 0;

    const color1 = [18, 169, 134]; // #12a986 (green)
    const color2 = [63, 55, 174]; // #3f37ae (purple)

    // Interpolate based on visibility
    const interpolatedColor = interpolateColor(color1, color2, visibility);
    return `rgb(${interpolatedColor.join(",")})`;
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      return alert("Please enter a message.");
    }

    // Emit the message to the server
    socket?.emit("message", message, roomId, socket.id!); // Use `socket.id!` to assert non-nullable
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: socket?.id!, msg: message },
    ]);
    setMessage("");
  };

  return (
    <div className="w-full h-fit flex-col">
      <div className="w-full bg-[url('../src/assets/chat-background.jpeg')] bg-cover border-2 min-h-[200px] max-h-[400px] p-1">
        <div
          className="customScroll w-full h-[20rem] overflow-y-auto"
          ref={chatContainerRef}
        >
          {messages.map((msgObj, index) => (
            <div
              key={index}
              className={`w-full p-2 flex justify-start items-start ${msgObj.id === socket?.id ? "" : ""
                }`}
            >
              <div
                className={`max-w-xs px-1.5 py-1 rounded-xl ${msgObj.id === socket?.id
                    ? " text-white mr-0 rounded-br-[2px]"
                    : "bg-[#d1d5db55] backdrop-blur-sm text-white ml-0 rounded-bl-[2px]"
                  }`}
                style={{
                  backgroundColor:
                    msgObj.id === socket?.id
                      ? getBackgroundColor(index)
                      : "#d1d5db55",
                }}
              >
                <p className="break-words whitespace-pre-wrap p-1 leading-4 font-light">
                  {msgObj.msg}
                </p>
                <p className="text-[0.6rem] font-light flex justify-end pl-5 text-slate-200">
                  {"11:30 pm"}
                </p>
              </div>
              {/* <div ref={chatContainerRef}></div> */}
            </div>
          ))}
        </div>
        <div className="w-full mt-5 flex justify-center items-center">
          <div className=" border border-white bg-[#d1d5db55] backdrop-blur-sm w-full mx-1  md:w-[70%] flex justify-center items-center rounded-full p-1">
            <div className="w-full mx-2 flex justify-center items-center rounded-full">
              <Input
                className="w-full py-2 text-sm border-none focus-visible:ring-0"
                placeholder="Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // Prevents default behavior like new line
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <Button
              className="border-2 group py-1 px-3.5 bg-[#12a986] rounded-full hover:bg-[#12a986] border-none active:scale-95 transition-all"
              onClick={handleSendMessage}
            >
              <img src={SendSvg} alt="Send" className="group-hover:rotate-45 transition-all" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;
