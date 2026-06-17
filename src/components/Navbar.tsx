import { createAsync, revalidate } from "@solidjs/router";
import { Show } from "solid-js";
import { getUser } from "~/server/auth";
import Credit from "./Credit";
import { claimDailyCredits } from "~/server/user";

export default function Navbar() {
  const user = createAsync(() => getUser());

  const canClaimCredits = () => {
    if (!user())
      return {
        can: false,
      };

    const todayDate = new Date().toISOString().split("T")[0];
    const lastDailyDate = new Date(user()!.lastDaily)
      .toISOString()
      .split("T")[0];

    if (todayDate !== lastDailyDate) {
      return {
        can: true,
      };
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const hoursUntilTomorrow =
      (tomorrow.getTime() - Date.now()) / (1000 * 60 * 60);
    const minutesUntilTomorrow =
      (tomorrow.getTime() - Date.now()) / (1000 * 60);

    return {
      can: false,
      time: `${Math.floor(hoursUntilTomorrow)}h ${Math.floor(minutesUntilTomorrow % 60)}m`,
    };
  };

  async function claimDaily() {
    try {
      await claimDailyCredits();
      revalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <nav class="flex lg:grid lg:grid-cols-3 items-center p-2 px-4 border-b w-full bg-ctp-mantle">
      <a
        class="font-semibold hover:no-underline! hidden lg:block lg:col-start-1 lg:justify-self-start"
        href="/"
      >
        Poopy<span class="text-ctp-blue">market</span>
      </a>

      <div class="mr-auto lg:mr-0 lg:col-start-2 lg:justify-self-center flex items-center text-sm">
        <a href="/">Home</a>

        <p class="mx-2 text-ctp-surface2!">\</p>

        <a href="/leaderboard">Leaderboard</a>

        <p class="mx-2 text-ctp-surface2!">\</p>

        <a href="/create">Create</a>

        <Show when={user()?.admin}>
          <p class="mx-2 text-ctp-surface2!">\</p>

          <a href="/admin" class="text-ctp-yellow!">
            Admin
          </a>
        </Show>
      </div>

      <Show
        when={!user()}
        fallback={
          <div class="lg:justify-self-end flex gap-3">
            <span class="lg:col-start-3 px-2 py-0.5 border rounded-full text-sm font-semibold flex">
              <div class="mr-1 my-auto">
                <Credit />
              </div>{" "}
              {user()!.balance}
              <span class="font-normal! ml-1">credits</span>
            </span>

            <button
              class={`px-3 py-0.5 rounded-lg text-xs ${canClaimCredits().can ? "" : "ghost border-ctp-surface2!"}`}
              onClick={claimDaily}
              disabled={!canClaimCredits().can}
            >
              {canClaimCredits().can
                ? "claim daily credits"
                : `can claim in ${canClaimCredits().time}`}
            </button>
          </div>
        }
      >
        <a
          href="/login"
          class="lg:col-start-3 lg:justify-self-end text-ctp-blue"
        >
          Login
        </a>
      </Show>
    </nav>
  );
}
