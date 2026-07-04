import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { createResource, For, Show } from "solid-js";
import Credit from "~/components/Credit";
import Navbar from "~/components/Navbar";
import { format } from "~/lib/utils";
import { getUser } from "~/server/users";

export default function User() {
  const params = useParams();

  const [user] = createResource(
    () => params.username,
    async (username) => {
      return await getUser(username);
    },
    { deferStream: true },
  );

  return (
    <>
      <Title>{user()?.username} - Kalshit</Title>

      <main class="flex flex-col min-h-screen items-center">
        <Navbar />

        <div class="max-w-6xl w-full my-2 lg:my-4 px-2">
          <div class="flex">
            <h1 class="text-2xl font-bold">{user()?.username}</h1>

            <span class="inline-flex items-center justify-end gap-1 mt-1.5 ml-auto">
              <Credit />
              {user()?.balance}
            </span>
          </div>

          <div class="flex flex-col lg:flex-row gap-4 mt-4 text-sm">
            <div class="rounded-lg border bg-ctp-surface0 w-full">
              <p class="border-b p-2 px-4 font-bold">Open Positions</p>

              <div class="flex flex-col gap-2 p-4 overflow-y-auto max-h-96">
                <For each={user()?.positions.filter((p) => !p.resolved)}>
                  {(p) => {
                    const winningShares =
                      p.resolution === "YES" ? p.yesShares : p.noShares;

                    const spent = p.yesSpent + p.noSpent;

                    return (
                      <div class="flex flex-col p-2 border rounded-md">
                        <a
                          class="truncate font-semibold"
                          href={`/market/${p.marketId}`}
                        >
                          {p.market}
                        </a>
                        <div class="flex">
                          <span class="inline-flex items-center justify-end gap-1 text-ctp-subtext0">
                            <Credit />
                            {format(spent)} spent
                          </span>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>

            <div class="rounded-lg border bg-ctp-surface0 w-full">
              <p class="border-b p-2 px-4 font-bold">Closed Positions</p>

              <div class="flex flex-col gap-2 p-4 overflow-y-auto max-h-96">
                <For each={user()?.positions.filter((p) => p.resolved)}>
                  {(p) => {
                    const winningShares =
                      p.resolution === "YES" ? p.yesShares : p.noShares;

                    const spent = p.yesSpent + p.noSpent;

                    return (
                      <div class="flex flex-col p-2 border rounded-md">
                        <a
                          class="truncate font-semibold"
                          href={`/market/${p.marketId}`}
                        >
                          {p.market}
                        </a>
                        <div class="flex">
                          <span class="inline-flex items-center justify-end gap-1 text-ctp-subtext0">
                            <Credit />
                            {format(spent)} spent
                          </span>

                          <Show when={winningShares > spent}>
                            <span class="inline-flex items-center justify-end gap-1 ml-auto text-ctp-green font-bold">
                              won
                              <Credit />
                              {format(Math.floor(winningShares - spent))}
                            </span>
                          </Show>

                          <Show when={winningShares < spent}>
                            <span class="inline-flex items-center justify-end gap-1 ml-auto text-ctp-red font-bold">
                              lost
                              <Credit />
                              {format(
                                Math.abs(Math.floor(winningShares - spent)),
                              )}
                            </span>
                          </Show>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
