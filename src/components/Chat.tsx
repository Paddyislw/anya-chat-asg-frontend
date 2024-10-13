// File: Chat.tsx

import  { useEffect, useState, FormEvent, ChangeEvent } from "react";
import io, { Socket } from "socket.io-client";

interface Session {
  id: string;
  users_permissions_user: {
    id: number;
    username: string;
  };
  chat_messages: Message[];
}

interface Message {
  id: string;
  sender: {
    id: number | null;
    username: string;
  };
  content: string;
  session: string;
  createdAt: string;
  isServerMessage: boolean;
}

interface ChatProps {
  userId: number;
  username: string;
}

const socket: Socket = io("https://energized-sparkle-7c45b9ab8e.strapiapp.com");

function Chat({ userId, username }: ChatProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputMessage, setInputMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  console.log("Debug messages", messages);

  useEffect(() => {
    console.log("Initializing chat component for user:", userId);

    console.log("Emitting get_sessions with userId:", userId);
    socket.emit("get_sessions", { userId });

    socket.on("sessions_list", (sessionsList: Session[]) => {
      console.log("Received sessions:", JSON.stringify(sessionsList, null, 2));
      setSessions(sessionsList);
      const newMessages: Record<string, Message[]> = {};
      sessionsList.forEach((session) => {
        console.log(
          `Processing session ${session.id} with ${session.chat_messages.length} messages`
        );
        newMessages[session.id] = session.chat_messages;
      });
      setMessages(newMessages);
      console.log(
        "Updated messages state:",
        JSON.stringify(newMessages, null, 2)
      );
    });

    socket.on(
      "session_joined",
      (data: { sessionId: string; messages: Message[] }) => {
        console.log(
          "Received session_joined event with data:",
          JSON.stringify(data, null, 2)
        );
        console.log("SessionId type:", typeof data.sessionId);
        setMessages((prevMessages) => {
          const updatedMessages = {
            ...prevMessages,
            [data.sessionId]: data.messages,
          };
          console.log(
            "Updated messages state after joining session:",
            JSON.stringify(updatedMessages, null, 2)
          );
          return updatedMessages;
        });
        setCurrentSessionId(data.sessionId);
        console.log(
          "Set current session ID to:",
          data.sessionId,
          "type:",
          typeof data.sessionId
        );
      }
    );

    socket.on("new_message", (message: Message) => {
      console.log("Received new message:", JSON.stringify(message, null, 2));
      setMessages((prevMessages) => {
        const updatedMessages = {
          ...prevMessages,
          [message.session]: [
            ...(prevMessages[message.session] || []),
            message,
          ],
        };
        console.log(
          "Updated messages state after new message:",
          JSON.stringify(updatedMessages, null, 2)
        );
        return updatedMessages;
      });
    });

    socket.on("error", (data: { message: string }) => {
      console.error("Received error:", data.message);
      setError(data.message);
    });

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off("sessions_list");
      socket.off("session_joined");
      socket.off("new_message");
      socket.off("error");
    };
  }, [userId]);

  const joinSession = (sessionId: string) => {
    console.log(
      "Attempting to join session:",
      sessionId,
      "type:",
      typeof sessionId
    );
    if (currentSessionId) {
      console.log("Leaving current session:", currentSessionId);
      socket.emit("leave_session", { userId, sessionId: currentSessionId });
    }
    socket.emit("join_session", { userId, sessionId });
  };

  const sendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputMessage && currentSessionId) {
      console.log(
        "Attempting to send message:",
        inputMessage,
        "to session:",
        currentSessionId
      );
      socket.emit("send_message", {
        userId,
        sessionId: currentSessionId,
        message: inputMessage,
      });
      setInputMessage("");
    } else {
      console.log(
        "Cannot send message. Input message:",
        inputMessage,
        "Current session ID:",
        currentSessionId
      );
    }
  };

  const createNewSession = () => {
    console.log("Attempting to create new session");
    socket.emit("join_session", { userId, sessionId: null });
  };

  console.log("Rendering component. Current session:", currentSessionId);
  console.log("Current messages state:", JSON.stringify(messages, null, 2));

  return (
    <div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        <p className="text-3xl">Chat Sessions</p>
        <div className="flex mx-auto justify-center items-center gap-2 flex-wrap my-4">
          {sessions.map((session) => (
            <button
              className="bg-[#c06360] px-2 py-2 text-sm rounded-lg"
              key={session.id}
              onClick={() => joinSession(session.id)}
            >
              Session {session.id} - {session.users_permissions_user.username}
            </button>
          ))}
        </div>
        <button
          className="bg-[#fe5f59] w-fit mx-auto py-2 px-6 rounded-lg font-semibold"
          onClick={createNewSession}
        >
          New Session
        </button>
      </div>
      {currentSessionId && (
        <div className="bg-[#424242] w-full max-w-[600px] mx-auto mt-6 rounded-lg">
          <p className="font-semibold">
            Current Chat (Session ID: {currentSessionId})
          </p>
          <div className="p-2" style={{ height: "300px", overflowY: "scroll" }}>
            {messages[currentSessionId] ? (
              messages[currentSessionId].map((msg) => {
                const isServerMessage =
                  msg.isServerMessage || msg?.sender?.username === "Server";
                return (
                  <div className={`flex font-semibold ${isServerMessage?'justify-end':'justify-start'}`} key={msg.id}>
                    <p className="text-red-300">{isServerMessage ? "Server" :username  }: </p>
                    <p>{msg.content}</p>
                  </div>
                );
              })
            ) : (
              <div>No messages in this session</div>
            )}
          </div>
          <form onSubmit={sendMessage} className="flex relative">
            <input
              value={inputMessage}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setInputMessage(e.target.value)
              }
              placeholder="Type a message..."
              className="rounded-lg py-3 px-4 bg-[#565656] w-full"
            />
            <button
              className="bg-[#fe5f59] w-fit mx-auto py-2 px-6 rounded-lg font-semibold absolute top-1 right-1"
              type="submit"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;
