import { createAsync, revalidate, useParams } from "@solidjs/router";
import { createResource, createSignal } from "solid-js";
import Credit from "~/components/Credit";
import Navbar from "~/components/Navbar";
import { price } from "~/lib/lmsr";
import { getUser } from "~/server/auth";
import { getMarket } from "~/server/markets";
import { sharesForSpend } from "../../lib/lmsr";
import { buyShares } from "~/server/shares";

export default function Market() {
  const user = createAsync(() => getUser());

  const params = useParams();

  const [market, { refetch: refetchMarket }] = createResource(
    () => params.id,
    async (id) => {
      return await getMarket(parseInt(id));
    },
  );

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
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <main class="flex flex-col min-h-screen items-center">
      <Navbar />

      <div class="max-w-4xl w-full mt-8">
        <a href="/" class="text-xs text-ctp-subtext0 mb-2 inline-block">
          &larr; All Markets
        </a>

        <div class="flex gap-4">
          <div class="flex flex-col w-2/3 gap-4">
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
            </div>

            <div class="p-4 rounded-md border bg-ctp-surface0">
              <p class="text-sm font-bold mb-2">Market Rules</p>
              <h1 class="mt-2">{market()?.rules}</h1>
            </div>
          </div>

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
                  onClick={() => setSpend(user()!.balance * 0.25)}
                >
                  25%
                </button>

                <button
                  class="text-xs ghost border-ctp-surface1! w-full rounded-lg p-2 enabled:hover:border-ctp-surface2!"
                  onClick={() => setSpend(user()!.balance * 0.5)}
                >
                  50%
                </button>

                <button
                  class="text-xs ghost border-ctp-surface1! w-full rounded-lg p-2 enabled:hover:border-ctp-surface2!"
                  onClick={() => setSpend(user()!.balance * 0.75)}
                >
                  75%
                </button>

                <button
                  class="text-xs ghost border-ctp-surface1! w-full rounded-lg p-2 enabled:hover:border-ctp-surface2!"
                  onClick={() => setSpend(user()!.balance)}
                >
                  MAX
                </button>
              </div>

              <div class="mt-4 bg-ctp-mantle p-2 px-4 rounded-lg border text-sm">
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
                class={`mt-4 w-full rounded-lg p-2 flex justify-center border-ctp-surface1! enabled:hover:border-ctp-surface2! ${spend() == 0 ? "ghost" : ""}`}
                onClick={handleBuy}
                id="buy-btn"
                disabled={buyDisabled()}
              >
                Buy {outcome()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
