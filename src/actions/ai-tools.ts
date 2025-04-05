import { experimental_createMCPClient, tool } from "ai";
import { z } from "zod";

const mcpClient = await experimental_createMCPClient({
  transport: {
    type: "sse",
    url: "https://testmcpserver.gobbl.ai/sse",
  },
  name: "Order Service",
});

export default async function getTools() {
  const tools = await mcpClient.tools();
  return {
    ...tools,
  };
}
