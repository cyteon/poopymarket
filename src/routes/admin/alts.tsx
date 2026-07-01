import { createAsync } from "@solidjs/router";
import { Drama } from "lucide-solid";
import { For } from "solid-js";
import { getSuspectedAlts } from "~/server/admin";

export default function Alts() {
  const suspectedAlts = createAsync(() => getSuspectedAlts());

  return (
    <main class="flex w-full">
      <div class="w-full h-fit gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <For each={suspectedAlts()}>
          {(suspect) => (
            <div class="p-4 border rounded-md bg-ctp-surface0 w-full flex flex-col">
              <div class="flex">
                <Drama
                  class="mr-2 my-auto p-2 border rounded-lg bg-ctp-red/10 border-ctp-red/50! text-ctp-red"
                  size={48}
                />

                <div class="flex flex-col my-auto">
                  <p class="text-sm">
                    Suspected owner: <b>{suspect.suspected_owner}</b>
                  </p>

                  <p class="text-sm">
                    IP: <b>{suspect.ip}</b>
                  </p>
                </div>
              </div>

              <div class="mt-2 bg-ctp-mantle border rounded-md text-sm">
                <table class="w-full text-left">
                  <thead>
                    <tr class="text-left text-sm text-ctp-subtext0!">
                      <th class="p-2 px-3">User ID</th>
                      <th class="p-2 px-3">Username</th>
                      <th class="p-2 px-3 text-right">Banned</th>
                    </tr>
                  </thead>

                  <tbody>
                    <For each={suspect.users}>
                      {(user) => (
                        <tr class="border-t">
                          <td class="p-2 px-3">{user.userId}</td>
                          <td class="p-2 px-3">{user.username}</td>
                          <td class="p-2 px-3 text-right">
                            {user.banned ? (
                              <span class="text-ctp-green">Yes</span>
                            ) : (
                              <span class="text-ctp-red">No</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </For>
      </div>
    </main>
  );
}
