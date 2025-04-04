import React, { useEffect, useState } from "react";

const SERVER_URL = "http://localhost:3000";

const Testing = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const eventSource = new EventSource(`${SERVER_URL}/sse`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("🔹 SSE Message Received:", data);

      if (data.event === "session") {
        setSessionId(data.data.sessionId);
      } else {
        setMessages((prev) => [...prev, data]);
      }
    };

    eventSource.onerror = (error) => {
      console.error("🔥 SSE Error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const sendMessage = async (tool, params = {}) => {
    if (!sessionId) {
      alert("Session ID not available. Please wait...");
      return;
    }

    console.log("📩 Sending message with session ID:", sessionId);

    try {
      const response = await fetch(
        `${SERVER_URL}/messages?sessionId=${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool, params }),
        }
      );

      const responseText = await response.text(); // Log response for debugging
      console.log(response);

      console.log("📝 Raw Response:", responseText);

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      console.log(`✅ Message sent to ${tool}`);
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>🟢 SSE Client</h2>

      {sessionId ? (
        <p>✅ Connected (Session ID: {sessionId})</p>
      ) : (
        <p>⏳ Connecting...</p>
      )}

      <button onClick={() => sendMessage("getProducts")}>
        📦 Get Products
      </button>
      <br />
      <br />

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask OpenAI something..."
      />
      <button onClick={() => sendMessage("askOpenAI", { prompt: input })}>
        🤖 Ask OpenAI
      </button>

      <h3>📝 Messages:</h3>
      <pre style={{ background: "#eee", padding: "10px" }}>
        {messages.length
          ? JSON.stringify(messages, null, 2)
          : "No messages yet..."}
      </pre>
    </div>
  );
};

export default Testing;
