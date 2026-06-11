import { createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { getUser } from "~/server/auth";
import Credit from "./Credit";

export default function Navbar() {
  const user = createAsync(() => getUser());

  return (
    <nav class="p-2 px-4 border-b w-full bg-ctp-mantle flex items-center">
      <span class="font-semibold">
        Poopy<span class="text-ctp-blue">market</span>
      </span>

      <Show
        when={!user()}
        fallback={
          <span class="ml-auto px-2 py-0.5 border rounded-full text-sm font-semibold flex">
            <div class="mr-1 my-auto">
              <Credit />
            </div>{" "}
            {user()!.balance}
            <span class="font-normal! ml-1">credits</span>
          </span>
        }
      >
        <a href="/login" class="ml-auto text-ctp-blue">
          Login
        </a>
      </Show>
    </nav>
  );
}
