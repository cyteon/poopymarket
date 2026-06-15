import { createAsync } from "@solidjs/router";
import Credit from "~/components/Credit";
import { format } from "~/lib/utils";
import { getOverview } from "~/server/admin";

export default function Admin() {
  const overview = createAsync(() => getOverview());

  return (
    <div class="flex w-full">
      <div class="flex w-full h-fit gap-2">
        <div class="p-4 border rounded-md bg-ctp-surface0 w-full flex flex-col">
          <p class="text-sm text-ctp-subtext0 mb-2">Total volume</p>
          <p class="text-2xl font-bold mx-auto inline-flex items-center gap-1">
            <Credit />
            {format(overview()?.totalVolume)}
          </p>
        </div>

        <div class="p-4 border rounded-md bg-ctp-surface0 w-full flex flex-col">
          <p class="text-sm text-ctp-subtext0 mb-2">Trade count</p>
          <p class="text-2xl font-bold mx-auto">
            {format(overview()?.tradeCount)}
          </p>
        </div>

        <div class="p-4 border rounded-md bg-ctp-surface0 w-full flex flex-col">
          <p class="text-sm text-ctp-subtext0 mb-2">Market count</p>
          <p class="text-2xl font-bold mx-auto">
            {format(overview()?.marketCount)}
          </p>
        </div>

        <div class="p-4 border rounded-md bg-ctp-surface0 w-full flex flex-col">
          <p class="text-sm text-ctp-subtext0 mb-2">User count</p>
          <p class="text-2xl font-bold mx-auto">
            {format(overview()?.userCount)}
          </p>
        </div>
      </div>
    </div>
  );
}
