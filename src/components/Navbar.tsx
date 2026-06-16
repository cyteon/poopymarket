import { createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { getUser } from "~/server/auth";
import Credit from "./Credit";

export default function Navbar() {
  const user = createAsync(() => getUser());
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
          <span class="lg:col-start-3 lg:justify-self-end px-2 py-0.5 border rounded-full text-sm font-semibold flex">
            <div class="mr-1 my-auto">
              <Credit />
            </div>{" "}
            {user()!.balance}
            <span class="font-normal! ml-1">credits</span>
          </span>
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
