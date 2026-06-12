import { useParams } from "@solidjs/router";
import { createResource } from "solid-js";
import Navbar from "~/components/Navbar";
import { getMarket } from "~/server/markets";

export default function Market() {
  const params = useParams();

  const [market] = createResource(
    () => params.id,
    async (id) => {
      return await getMarket(parseInt(id));
    },
  );

  return (
    <main class="flex flex-col min-h-screen items-center">
      <Navbar />

      <div class="max-w-2xl w-full mt-8">
        <a href="/" class="text-xs text-ctp-subtext0 mb-2 inline-block">
          &larr; All Markets
        </a>

        <div class="flex gap-2">
          <div class="flex flex-col w-2/3">
            <div class="p-4 rounded-md border bg-ctp-surface0">
              <h1 class="text-xl font-bold mb-2">{market()?.question}</h1>
            </div>
          </div>

          <div class="flex flex-col w-1/3">buy</div>
        </div>
      </div>
    </main>
  );
}
