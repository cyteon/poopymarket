import { createAsync, revalidate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { getUser } from "~/server/auth";
import Credit from "./Credit";
import {
  claimDailyCredits,
  getNotifications,
  markAllNotifsRead,
} from "~/server/user";
import { Bell } from "lucide-solid";

export default function Navbar() {
  const user = createAsync(() => getUser());
  const notifs = createAsync(async () => (user() ? getNotifications() : []));

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

  const [notifsVisible, setNotifsVisible] = createSignal(false);

  async function markAllRead() {
    try {
      await markAllNotifsRead();
      revalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <nav class="flex flex-col lg:grid lg:grid-cols-3 items-center p-2 px-4 border-b w-full bg-ctp-mantle">
      <a
        class="font-semibold hover:no-underline! hidden lg:block lg:col-start-1 lg:justify-self-start"
        href="/"
      >
        Kal<span class="text-ctp-green">shit</span>
      </a>

      <div class="mr-auto lg:mr-0 lg:col-start-2 lg:justify-self-center flex items-center text-sm">
        <a href="/">Home</a>

        <p class="mx-2 text-ctp-surface2!">\</p>

        <a href="/leaderboard">Leaderboard</a>

        <p class="mx-2 text-ctp-surface2!">\</p>

        <a href="/create">Create</a>

        <Show when={user()}>
          <p class="mx-2 text-ctp-surface2!">\</p>

          <a href={`/user/${user()!.username}`}>Profile</a>
        </Show>

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
          <div class="lg:justify-self-end ml-auto mt-1 lg:mt-0 flex gap-3">
            <div class="relative flex flex-col">
              <button
                class="bg-transparent! text-ctp-text! my-auto"
                onClick={() => setNotifsVisible(!notifsVisible())}
              >
                <Bell size={16} />
              </button>

              <Show when={notifs()?.some((n) => !n.read)}>
                <p class="absolute top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-ctp-red"></p>
              </Show>

              <Show when={notifsVisible()}>
                <div class="absolute top-full right-0 p-2 gap-2 mt-4 w-72 bg-ctp-mantle border rounded-lg max-h-96 overflow-y-auto flex flex-col">
                  <Show
                    when={notifs()?.length}
                    fallback={
                      <p class="text-sm text-ctp-subtext0!">No notifications</p>
                    }
                  >
                    <button
                      class="text-xs text-ctp-blue! bg-transparent! ml-auto mr-1"
                      onClick={markAllRead}
                    >
                      mark read
                    </button>

                    <For each={notifs()}>
                      {(notif) => (
                        <div
                          class={`p-2 border rounded-md text-sm bg-ctp-crust ${notif.read ? "" : "border-ctp-blue/60!"}`}
                        >
                          {notif.message}
                        </div>
                      )}
                    </For>
                  </Show>
                </div>
              </Show>
            </div>

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
