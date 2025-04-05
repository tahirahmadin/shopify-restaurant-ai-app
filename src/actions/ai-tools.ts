import { experimental_createMCPClient, tool } from "ai";
import { z } from "zod";

// Declare client outside, initialize lazily
let mcpClient: Awaited<ReturnType<typeof experimental_createMCPClient>> | null =
  null;

export default async function getTools() {
  if (!mcpClient) {
    mcpClient = await experimental_createMCPClient({
      transport: {
        type: "sse",
        url: "https://testmcpserver.gobbl.ai/sse",
      },
      name: "Order Service",
    });
  }

  const tools = await mcpClient.tools();
  return {
    ...tools,
  };
}
