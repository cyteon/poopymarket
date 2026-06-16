import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp";
import { eq } from "drizzle-orm";
import z from "zod";
import { getUserFromToken } from "~/server/auth";
import { db } from "~/server/db";
import { markets, positions } from "~/server/db/schema";
import { getTop10 } from "~/server/leaderboard";
import { getMarket } from "~/server/markets";

export async function POST({ request }: { request: Request }) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return Response.json(
      { error: "Missing ?token parameter" },
      { status: 400 },
    );
  }

  const user = await getUserFromToken(token);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const server = new McpServer({ name: "poopymarket", version: "1.0.0" });

  // todo register tools
  server.registerTool(
    "get_user",
    {
      title: "Get User",
      description: "Get information about the current user, including balance",
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            id: user.id,
            username: user.username,
            balance: user.balance,
          }),
        },
      ],
    }),
  );

  server.registerTool(
    "get_user_positions",
    {
      title: "Get User Positions",
      description: "Get the current user's open positions",
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => {
      const holding = await db
        .select({
          resolved: markets.resolved,
          marketResolution: markets.resolution,
          question: markets.question,
          yesShares: positions.yesShares,
          noShares: positions.noShares,
          yesSpent: positions.yesSpent,
          noSpent: positions.noSpent,
        })
        .from(positions)
        .where(eq(positions.userId, user.id))
        .leftJoin(markets, eq(positions.marketId, markets.id));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(holding),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_leaderboard",
    {
      title: "Get Leaderboard",
      description: "Get the top 10 users by balance",
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(getTop10()),
        },
      ],
    }),
  );

  server.registerTool(
    "get_market",
    {
      title: "Get a market",
      description: "Get a market by ID",
      inputSchema: {
        id: z.number(),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ id }) => {
      const market = await getMarket(id);

      if (!market?.id) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Market not found",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...market, points: undefined }),
          },
        ],
      };
    },
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });

  await server.connect(transport);

  return transport.handleRequest(request);
}
