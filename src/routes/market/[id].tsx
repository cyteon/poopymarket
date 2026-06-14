import { createAsync, revalidate, useParams } from "@solidjs/router";
import { createResource, createSignal, Show } from "solid-js";
import Credit from "~/components/Credit";
import Navbar from "~/components/Navbar";
import { floorPoints, price, sellProceeds } from "~/lib/lmsr";
import { getUser } from "~/server/auth";
import { getMarket, resolveMarket } from "~/server/markets";
import { sharesForSpend } from "../../lib/lmsr";
import { buyShares, getUserShares, sellShares } from "~/server/shares";
import { format } from "~/lib/utils";
import { Chart } from "~/components/Chart";
import { Meta } from "@solidjs/meta";

export const route = {
  preload: () => getUser(),
};

export default function Market() {
  const user = createAsync(() => getUser());

  const params = useParams();

  const [market, { refetch: refetchMarket }] = createResource(
    () => params.id,
    async (id) => {
      return await getMarket(parseInt(id));
    },
    { deferStream: true },
  );

  const [shares, { refetch: refetchShares }] = createResource(
    () => market()?.id,
    async (id) => {
      return await getUserShares(id);
    },
  );

  const netPayout = () => {
    if (!shares()) return 0;

    const yesPayout =
      shares()!.yesShares * (market()?.resolution === "YES" ? 1 : 0);
    const noPayout =
      shares()!.noShares * (market()?.resolution === "NO" ? 1 : 0);

    return yesPayout + noPayout - shares()?.yesSpent - shares()?.noSpent;
  };

  const yesChance = () => {
    return (price(market()?.b, market()?.qYes, market()?.qNo) * 100).toFixed(0);
  };

  const noChance = () => {
    return (100.0 - yesChance()).toFixed(0);
  };

  const [error, setError] = createSignal("");
  const [outcome, setOutcome] = createSignal<"YES" | "NO">("YES");
  const [spend, setSpend] = createSignal(0);

  const buyingShares = () => {
    return sharesForSpend(
      market()?.b,
      market()?.qYes,
      market()?.qNo,
      outcome(),
      spend(),
    );
  };

  const buyDisabled = () => {
    return spend() <= 0 || !user() || spend() > user()!.balance;
  };

  async function handleBuy() {
    setError("");

    if (buyDisabled()) {
      setError("Invalid spend amount");
      return;
    }

    try {
      await buyShares({
        marketId: market()!.id,
        outcome: outcome(),
        spend: spend(),
        minShares: buyingShares(),
      });

      revalidate();
      refetchMarket();
      refetchShares();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleResolve(resolution: "YES" | "NO") {
    setError("");

    try {
      await resolveMarket(market()!.id, resolution);

      revalidate();
      refetchMarket();
      refetchShares();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleSell(outcome: "YES" | "NO") {
    setError("");

    try {
      await sellShares({
        marketId: market()!.id,
        outcome,
      });

      revalidate();
      refetchMarket();
      refetchShares();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <main class="flex flex-col min-h-screen items-center">
      <Meta
        property="og:title"
        content={`${market()?.question} (${yesChance()}%)`}
      />
      <Meta property="og:description" content={market()?.rules} />

      <Navbar />

      <div class="max-w-4xl w-full mt-8 px-2">
        <a href="/" class="text-xs text-ctp-subtext0 mb-2 inline-block">
          &larr; All Markets
        </a>

        <div class="flex gap-4 flex-col lg:flex-row">
          <div class="flex flex-col lg:w-2/3 gap-4">
            <div class="p-4 rounded-md border bg-ctp-surface0">
              <h1 class="text-xl font-bold">{market()?.question}</h1>

              <h2 class="mt-3 text-4xl font-bold text-ctp-green">
                {yesChance()}%
              </h2>

              <div class="flex mt-2">
                <p class="text-sm text-ctp-subtext0!">YES</p>
                <p class="text-sm text-ctp-subtext0! ml-auto">NO</p>
              </div>

              <div class="rounded-xl w-full flex overflow-hidden h-1 mt-1">
                <span
                  style={{
                    width: `${yesChance()}%`,
                  }}
                  class="bg-ctp-green"
                ></span>
                <span
                  style={{
                    width: `${noChance()}%`,
                  }}
                  class="bg-ctp-red"
                ></span>
              </div>

              <div class="mt-1 flex text-sm">
                <div class="my-auto mr-1">
                  <Credit />
                </div>

                <p>{format(market()?.volume)} vol.</p>
              </div>
            </div>

            <Show
              when={
                !market()?.resolved &&
                (user()?.id === market()?.creatorId || user()?.admin)
              }
            >
              <div
                class={`p-4 rounded-md bg-ctp-surface0 border ${user()?.id !== market()?.creatorId ? "border-ctp-yellow! border-dashed" : ""}`}
              >
                <p class="text-sm font-bold mb-2">
                  Resolve market (creator only)
                </p>
                <p class="text-sm text-ctp-red">
                  Warning: resolving will close the market and pay out all
                  positions, this cannot be undone
                </p>

                <div class="flex mt-2">
                  <button
                    class={`ghost border-ctp-surface1! hover:border-ctp-surface2! w-full rounded-lg p-2 ${market()?.resolution === "YES" ? "bg-ctp-green! text-ctp-crust! border-0!" : ""}`}
                    onClick={() => {
                      const confirm = window.confirm(
                        "Are you sure you want to resolve this market as YES? This action cannot be undone.",
                      );

                      if (confirm) {
                        handleResolve("YES");
                      }
                    }}
                  >
                    Resolve YES
                  </button>

                  <button
                    class={`ghost border-ctp-surface1! hover:border-ctp-surface2! w-full rounded-lg p-2 ml-2 ${market()?.resolution === "NO" ? "bg-ctp-red! text-ctp-crust! border-0!" : ""}`}
                    onClick={() => {
                      const confirm = window.confirm(
                        "Are you sure you want to resolve this market as NO? This action cannot be undone.",
                      );

                      if (confirm) {
                        handleResolve("NO");
                      }
                    }}
                  >
                    Resolve NO
                  </button>
                </div>
              </div>
            </Show>

            <div class="p-4 rounded-md border bg-ctp-surface0">
              <p class="text-sm font-bold mb-2">Chance over time</p>

              <Chart data={market()?.points!} />
            </div>

            <Show
              when={
                user() &&
                shares() &&
                (shares()!.yesShares > 0 || shares()!.noShares > 0)
              }
            >
              <div class="p-4 rounded-md border bg-ctp-surface0">
                <p class="text-sm font-bold mb-2">Your positions</p>

                <table class="w-full text-left">
                  <thead>
                    <tr class="text-ctp-subtext0 text-sm">
                      <th>Outcome</th>
                      <th class="text-right">Shares</th>
                      <th class="text-right">Avg. price</th>
                      <th class="text-right">Value</th>
                      <th class="text-right">P/L</th>
                      <th class="text-right w-16"></th>
                    </tr>
                  </thead>

                  <tbody class="text-sm [&_td]:py-0.5">
                    <Show when={shares()!.yesShares > 0}>
                      {(() => {
                        const m = market()!;
                        const resolved = m.resolved;
                        const won = resolved && m.resolution === "YES";

                        const value = resolved
                          ? won
                            ? Math.floor(shares()!.yesShares)
                            : 0
                          : floorPoints(
                              sellProceeds(
                                m.b,
                                m.qYes,
                                m.qNo,
                                "YES",
                                shares()!.yesShares,
                              ),
                            );

                        const pl = value - shares()!.yesSpent;

                        return (
                          <tr>
                            <td>YES</td>

                            <td class="text-right">
                              {shares()!.yesShares.toFixed(2)}
                            </td>

                            <td class="text-right">
                              <span class="inline-flex items-center justify-end gap-1">
                                <Credit />
                                {(
                                  shares()!.yesSpent / shares()!.yesShares
                                ).toFixed(2)}
                              </span>
                            </td>

                            <td class="text-right">
                              <span class="inline-flex items-center justify-end gap-1">
                                <Credit />
                                {value}
                              </span>
                            </td>

                            <td class="text-right">
                              <span
                                class="inline-flex items-center justify-end gap-1"
                                classList={{
                                  "text-ctp-green": pl > 0,
                                  "text-ctp-red": pl < 0,
                                }}
                              >
                                <Credit />
                                {pl >= 0 ? "+" : ""}
                                {pl}
                              </span>
                            </td>

                            <Show when={!market()?.resolved}>
                              <td class="text-right">
                                <button
                                  class="text-xs ghost border-ctp-surface1! w-fit rounded-lg py-1 px-2 enabled:hover:border-ctp-surface2!"
                                  onClick={() => {
                                    const confirm = window.confirm(
                                      `This will sell ${shares()?.yesShares.toFixed(2)} YES shares. Are you sure?`,
                                    );

                                    if (confirm) {
                                      handleSell("YES");
                                    }
                                  }}
                                  disabled={
                                    shares()!.yesShares === 0 ||
                                    market()?.resolved
                                  }
                                >
                                  Sell
                                </button>
                              </td>
                            </Show>
                          </tr>
                        );
                      })()}
                    </Show>

                    <Show when={shares()!.noShares > 0}>
                      {(() => {
                        const m = market()!;
                        const resolved = m.resolved;
                        const won = resolved && m.resolution === "NO";

                        const value = resolved
                          ? won
                            ? Math.floor(shares()!.noShares)
                            : 0
                          : floorPoints(
                              sellProceeds(
                                m.b,
                                m.qYes,
                                m.qNo,
                                "NO",
                                shares()!.noShares,
                              ),
                            );

                        const pl = value - shares()!.noSpent;

                        return (
                          <tr>
                            <td>NO</td>

                            <td class="text-right">
                              {shares()!.noShares.toFixed(2)}
                            </td>

                            <td class="text-right">
                              <span class="inline-flex items-center justify-end gap-1">
                                <Credit />
                                {(
                                  shares()!.noSpent / shares()!.noShares
                                ).toFixed(2)}
                              </span>
                            </td>

                            <td class="text-right">
                              <span class="inline-flex items-center justify-end gap-1">
                                <Credit />
                                {value}
                              </span>
                            </td>

                            <td class="text-right">
                              <span
                                class="inline-flex items-center justify-end gap-1"
                                classList={{
                                  "text-ctp-green": pl > 0,
                                  "text-ctp-red": pl < 0,
                                }}
                              >
                                <Credit />
                                {pl >= 0 ? "+" : ""}
                                {pl}
                              </span>
                            </td>

                            <Show when={!market()?.resolved}>
                              <td class="text-right">
                                <button
                                  class="text-xs ghost border-ctp-surface1! w-fit rounded-lg py-1 px-2 enabled:hover:border-ctp-surface2!"
                                  onClick={() => {
                                    const confirm = window.confirm(
                                      `This will sell ${shares()?.noShares.toFixed(2)} NO shares. Are you sure?`,
                                    );

                                    if (confirm) {
                                      handleSell("NO");
                                    }
                                  }}
                                  disabled={
                                    shares()!.noShares === 0 ||
                                    market()?.resolved
                                  }
                                >
                                  Sell
                                </button>
                              </td>
                            </Show>
                          </tr>
                        );
                      })()}
                    </Show>
                  </tbody>
                </table>
              </div>
            </Show>

            <div class="p-4 rounded-md border bg-ctp-surface0">
              <p class="text-sm font-bold mb-2">Market Rules</p>
              <h1 class="mt-2">{market()?.rules}</h1>
            </div>
          </div>

          <Show
            when={!market()?.resolved}
            fallback={
              <div class="flex flex-col lg:w-1/3 gap-4">
                <div class="p-4 rounded-md border bg-ctp-surface0">
                  <p class="text-sm font-bold mb-2">Market resolved</p>

                  <h1
                    class={`text-3xl font-bold ${market()?.resolution === "YES" ? "text-ctp-green" : "text-ctp-red"}`}
                  >
                    {market()?.resolution}
                  </h1>
                </div>

                <Show when={user() && shares()}>
                  <div class="p-4 rounded-md border bg-ctp-surface0">
                    <p class="text-sm font-bold mb-2">Your shares</p>

                    <div class="mt-4 bg-ctp-mantle p-3 px-4 rounded-lg border text-sm">
                      <div class="flex">
                        <p class="text-ctp-subtext0">YES shares</p>
                        <p class="ml-auto">{shares()?.yesShares.toFixed(2)}</p>
                      </div>
                      <div class="flex">
                        <p class="text-ctp-subtext0">Paid out</p>
                        <p class="ml-auto flex">
                          <span class="my-auto mr-1">
                            <Credit />
                          </span>

                          {market()?.resolution === "YES"
                            ? Math.floor(shares()?.yesShares || 0)
                            : 0}
                        </p>
                      </div>
                      <hr class="my-2 border-ctp-surface1!" />
                      <div class="flex">
                        <p class="text-ctp-subtext0">NO shares</p>
                        <p class="ml-auto">{shares()?.noShares.toFixed(2)}</p>
                      </div>
                      <div class="flex">
                        <p class="text-ctp-subtext0">Paid out</p>
                        <p class="ml-auto flex">
                          <span class="my-auto mr-1">
                            <Credit />
                          </span>

                          {market()?.resolution === "NO"
                            ? Math.floor(shares()?.noShares || 0)
                            : 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="p-4 rounded-md border bg-ctp-surface0">
                    <p class="text-sm font-bold mb-2">Net profit/loss</p>

                    <p
                      class={`text-2xl font-bold flex ${shares() && netPayout() >= 0 ? "text-ctp-green" : "text-ctp-red"}`}
                    >
                      <span class="my-auto mr-2">
                        <Credit />
                      </span>

                      {shares() ? (netPayout() >= 0 ? "+" : "") : ""}

                      {shares() ? netPayout().toFixed(2) : 0}
                    </p>
                  </div>
                </Show>
              </div>
            }
          >
            <div class="flex flex-col w-1/3">
              <div class="p-4 rounded-md border bg-ctp-surface0">
                <div class="flex gap-2 text-sm">
                  <button
                    class={`ghost border-ctp-surface1! hover:border-ctp-surface2! w-full rounded-lg p-2 ${outcome() === "YES" ? "bg-ctp-green! text-ctp-crust! border-0!" : ""}`}
                    onClick={() => setOutcome("YES")}
                  >
                    Yes <span class="font-bold">{yesChance()}%</span>
                  </button>

                  <button
                    class={`ghost border-ctp-surface1! hover:border-ctp-surface2! w-full rounded-lg p-2 ${outcome() === "NO" ? "bg-ctp-red! text-ctp-crust! border-0!" : ""}`}
                    onClick={() => setOutcome("NO")}
                  >
                    No <span class="font-bold">{noChance()}%</span>
                  </button>
                </div>

                <p class="text-xs text-ctp-subtext0! mt-4">Amount to spend</p>
                <div class="flex bg-ctp-mantle rounded-lg p-3 text-sm mt-1">
                  <div class="my-auto ml-1 mr-3 scale-">
                    <Credit />
                  </div>

                  <input
                    type="number"
                    onkeydown="if(event.key==='.' || event.key===',') event.preventDefault();"
                    value={spend()}
                    onInput={(e) => {
                      setSpend(parseFloat(e.currentTarget.value));

                      if (isNaN(spend())) {
                        setSpend(0);
                      }

                      if (user() && spend() > user()!.balance) {
                        setSpend(user()!.balance);
                      }

                      if (spend() < 0) {
                        setSpend(0);
                      }
                    }}
                    class="w-full bg-transparent outline-none"
                  />
                </div>
                <div class="flex gap-1 mt-1">
                  <button
                    class="text-xs ghost border-ctp-surface1! w-full rounded-lg p-2 enabled:hover:border-ctp-surface2!"
                    onClick={() =>
                      setSpend(Math.floor((user()?.balance || 0) * 0.25))
                    }
                  >
                    25%
                  </button>

                  <button
                    class="text-xs ghost border-ctp-surface1! w-full rounded-lg p-2 enabled:hover:border-ctp-surface2!"
                    onClick={() =>
                      setSpend(Math.floor((user()?.balance || 0) * 0.5))
                    }
                  >
                    50%
                  </button>

                  <button
                    class="text-xs ghost border-ctp-surface1! w-full rounded-lg p-2 enabled:hover:border-ctp-surface2!"
                    onClick={() =>
                      setSpend(Math.floor((user()?.balance || 0) * 0.75))
                    }
                  >
                    75%
                  </button>

                  <button
                    class="text-xs ghost border-ctp-surface1! w-full rounded-lg p-2 enabled:hover:border-ctp-surface2!"
                    onClick={() => setSpend(user()?.balance || 0)}
                  >
                    MAX
                  </button>
                </div>

                <div class="mt-4 bg-ctp-mantle p-3 px-4 rounded-lg border text-sm">
                  <div class="flex">
                    <p class="text-ctp-subtext0">Cost</p>

                    <p class="ml-auto flex">
                      <span class="my-auto mr-1">
                        <Credit />
                      </span>

                      {spend()}
                    </p>
                  </div>

                  <div class="flex">
                    <p class="text-ctp-subtext0">Shares</p>
                    <p class="ml-auto">{buyingShares().toFixed(2)}</p>
                  </div>

                  <div class="flex">
                    <p class="text-ctp-subtext0">Avg. price / share</p>
                    <p class="ml-auto flex">
                      <span class="my-auto mr-1">
                        <Credit />
                      </span>

                      {buyingShares() > 0
                        ? (spend() / buyingShares()).toFixed(2)
                        : 0}
                    </p>
                  </div>

                  <hr class="my-2 border-ctp-surface1!" />

                  <div class="flex">
                    <p class="text-ctp-subtext0">Potential payout</p>

                    <p class="ml-auto flex text-ctp-green font-bold">
                      <span class="my-auto mr-1">
                        <Credit />
                      </span>

                      {buyingShares() > 0 ? Math.floor(buyingShares()) : 0}
                    </p>
                  </div>
                </div>

                {error() && <p class="text-sm text-ctp-red mt-4">{error()}</p>}

                <button
                  class={`mt-4 w-full rounded-lg p-2 flex justify-center border-ctp-surface1! enabled:hover:border-ctp-surface2! ${spend() == 0 || !user() ? "ghost" : ""}`}
                  onClick={handleBuy}
                  id="buy-btn"
                  disabled={buyDisabled()}
                >
                  Buy {outcome()}
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </main>
  );
}
