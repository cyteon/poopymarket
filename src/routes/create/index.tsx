import { createAsync, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import Credit from "~/components/Credit";
import Navbar from "~/components/Navbar";
import { requireUser } from "~/server/auth";
import { createMarket } from "~/server/markets";

export const route = {
  preload: () => requireUser(),
};

export default function Create() {
  const navigate = useNavigate();
  const user = createAsync(() => requireUser());

  const [question, setQuestion] = createSignal("");
  const [rules, setRules] = createSignal("");
  const [error, setError] = createSignal("");

  async function handleCreate() {
    console.log("hi");

    setError("");

    if (!question() || !rules()) {
      setError("Question and rules cannot be empty");
      return;
    }

    try {
      const { id } = await createMarket(question(), rules());
      navigate(`/market/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <main class="flex flex-col min-h-screen items-center">
      <Navbar />

      <div class="max-w-md w-full my-auto px-2">
        <h1 class="text-xl font-bold">Create Market</h1>
        <p class="text-sm text-ctp-subtext0! mb-4 flex">
          Create a new prediction market, costs
          <span class="mx-1 my-auto">
            <Credit />
          </span>
          500 credits
        </p>

        <div class="rounded-md border bg-ctp-surface0 p-4">
          <label class="text-sm mb-1 font-bold">Question</label>
          <p class="text-sm text-ctp-subtext0! mb-2">
            Make it objective and time-based, so it can be clearly resolved
          </p>

          <input
            type="text"
            value={question()}
            onInput={(e) => setQuestion(e.currentTarget.value)}
            class="w-full rounded-lg border bg-ctp-mantle p-2 px-3 mb-4 text-md"
            placeholder="Will GTA 6 release in 2026?"
          />

          <label class="text-sm mb-1 font-bold">Rules</label>
          <p class="text-sm text-ctp-subtext0! mb-2">
            Define how the market will be resolved, and any other relevant
            information
          </p>

          <textarea
            value={rules()}
            onInput={(e) => setRules(e.currentTarget.value)}
            class="w-full rounded-lg border bg-ctp-mantle p-2 px-3 mb-4 text-md resize-none"
            placeholder="Resolves to 'Yes' if GTA 6 is released before January 1st, 2027. Otherwise resolves to 'No'"
            rows={5}
          />

          {error() && <p class="text-sm text-ctp-red mb-4">{error()}</p>}

          <button
            class="ghost w-full rounded-lg p-2 flex justify-center border-ctp-surface1! enabled:hover:border-ctp-surface2!"
            onClick={handleCreate}
          >
            Create Market (
            <span class="mx-1 my-auto">
              <Credit />
            </span>
            500 credits)
          </button>
        </div>
      </div>
    </main>
  );
}
