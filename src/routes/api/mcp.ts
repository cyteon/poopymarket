import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { eq } from "drizzle-orm";
import z from "zod";
import { getUserFromToken } from "~/server/auth";
import { db } from "~/server/db";
import { markets, positions, users } from "~/server/db/schema";
import { getTop10 } from "~/server/leaderboard";
import { getMarket, getMarkets } from "~/server/markets";
import { buySharesForUser, sellSharesForUser } from "~/server/shares";

export async function POST({ request }: { request: Request }) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return Response.json(
      { error: "Missing ?token parameter" },
      { status: 400 },
    );
  }

  let user = await getUserFromToken(token);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const server = new McpServer({ name: "poopymarket", version: "1.0.0" });

  server.registerTool(
    "get_user",
    {
      title: "Get user",
      description: "Get information about the current user, including balance",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async () => {
      user = await getUserFromToken(token);

      return {
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
      };
    },
  );

  server.registerTool(
    "get_user_positions",
    {
      title: "Get user positions",
      description: "Get the current user's open positions",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
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
      title: "Get leaderboard",
      description: "Get the top 10 users by balance",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await getTop10()),
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
        destructiveHint: false,
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

  server.registerTool(
    "get_open_markets",
    {
      title: "Get open markets",
      description: "Get all open markets",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async () => {
      const markets = (await getMarkets()).filter((m) => !m.resolved);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              markets.map((m) => ({ ...m, points: undefined })),
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "buy_shares",
    {
      title: "Buy shares",
      description:
        "Buy shares in a market, always tell the user: how many shares they got, how much you spent, avg price per share and how much they will get if it was correct (1 winning share = 1 credit)",
      inputSchema: {
        marketId: z.number().describe("ID of market"),
        outcome: z.enum(["YES", "NO"]).describe("Outcome to buy shares for"),
        amount: z.number().positive().describe("Amount of credits to spend"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async ({ marketId, outcome, amount }) => {
      try {
        const { bought, probAfter } = await buySharesForUser({
          user,
          marketId,
          outcome,
          spend: amount,
          minShares: 0,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                bought,
                spent: amount,
                avgPrice: amount / bought,
                probAfter: probAfter * 100,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                err instanceof Error
                  ? err.message
                  : "An error occurred while buying shares",
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "sell_shares",
    {
      title: "Sell shares",
      description:
        "Sell shares in a market, always tell the user: how many shares they sold, how much they got, avg price per share and their profit/loss from the sale",
      inputSchema: {
        marketId: z.number().describe("ID of market"),
        outcome: z.enum(["YES", "NO"]).describe("Outcome to sell shares for"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async ({ marketId, outcome }) => {
      try {
        const { sold, proceeds, originalSpent } = await sellSharesForUser({
          user,
          marketId,
          outcome,
          minValue: 0,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                sold,
                proceeds,
                originalSpent,
                avgPrice: proceeds / sold,
                profitLoss: proceeds - originalSpent,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                err instanceof Error
                  ? err.message
                  : "An error occurred while selling shares",
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "create_market",
    {
      title: "Create market",
      description: "Create a new market with a question",
      inputSchema: {
        question: z.string().describe("Question for the market"),
        rules: z.string().describe("Rules for the market"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async ({ question, rules }) => {
      try {
        user = await getUserFromToken(token);

        if (user.balance < 500) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Insufficient balance to create market",
              },
            ],
          };
        }

        const [market] = await db
          .insert(markets)
          .values({
            question,
            rules,
            creatorId: user.id,
            b: 1000,
          })
          .returning();

        await db
          .update(users)
          .set({ balance: user.balance - 500 })
          .where(eq(users.id, user.id));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ id: market.id }),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                err instanceof Error
                  ? err.message
                  : "An error occurred while creating market",
            },
          ],
        };
      }
    },
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });

  await server.connect(transport);

  return transport.handleRequest(request);
}
