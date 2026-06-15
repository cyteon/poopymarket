import { createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { getUser } from "~/server/auth";
import Credit from "./Credit";

export default function Navbar() {
  const user = createAsync(() => getUser());

  return (
    <nav class="p-2 px-4 border-b w-full bg-ctp-mantle flex items-center">
      <a class="font-semibold hover:no-underline!" href="/">
        Poopy<span class="text-ctp-blue">market</span>
      </a>

      <div class="mx-auto flex items-center">
        <a href="/" class="rounded-md text-sm font-medium">
          Home
        </a>

        <p class="mx-2 text-ctp-surface2!">\</p>

        <a href="/create" class="rounded-md text-sm font-medium">
          Create
        </a>
      </div>

      <Show
        when={!user()}
        fallback={
          <span class="px-2 py-0.5 border rounded-full text-sm font-semibold flex">
            <div class="mr-1 my-auto">
              <Credit />
            </div>{" "}
            {user()!.balance}
            <span class="font-normal! ml-1">credits</span>
          </span>
        }
      >
        <a href="/login" class="text-ctp-blue">
          Login
        </a>
      </Show>
    </nav>
  );
}
