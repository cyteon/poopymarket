import { price } from "~/lib/lmsr";
import { Market } from "~/server/db/schema";
import Credit from "./Credit";
import { format } from "~/lib/utils";

interface MarketCardProps {
  market: Market;
}

export default function Marketcard({ market }: MarketCardProps) {
  const yesChance = () => {
    return (price(market.b, market.qYes, market.qNo) * 100).toFixed(0);
  };

  const noChance = () => {
    return (100.0 - yesChance()).toFixed(0);
  };

  return (
    <div class="border bg-ctp-surface0 w- rounded p-4 m-2">
      <a href={`/market/${market.id}`} class="font-bold">
        {market.question}
      </a>

      <h1 class="text-3xl text-ctp-green! font-bold mt-2">{yesChance()}%</h1>

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

        <p>{format(market.volume)} vol.</p>
      </div>
    </div>
  );
}
