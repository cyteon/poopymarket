import { Title } from "@solidjs/meta";
import { useLocation } from "@solidjs/router";
import {
  Ban,
  ChartArea,
  LayoutDashboard,
  Receipt,
  ShoppingBasket,
  User,
} from "lucide-solid";
import Navbar from "~/components/Navbar";
import { requireAdmin } from "~/server/admin";

export const route = {
  preload: () => requireAdmin(),
};

export default function AdminLayout(props: { children: Node }) {
  const location = useLocation();

  return (
    <>
      <Title>Admin - Poopymarket</Title>

      <main class="h-screen flex flex-col">
        <Navbar />

        <div class="flex p-4 lg:h-full flex-col lg:flex-row gap-4">
          <div class="rounded-md border bg-ctp-surface0 h-full p-2 lg:w-48 text-sm gap-1 flex flex-col">
            <a
              href="/admin"
              class={`flex p-2 px-4 hover:no-underline! hover:bg-ctp-base rounded-lg ${location.pathname === "/admin" ? "border bg-ctp-base" : ""}`}
            >
              <LayoutDashboard class="mr-2 my-auto" size={16} />
              Overview
            </a>

            <a
              href="/admin/users"
              class={`flex p-2 px-4 hover:no-underline! hover:bg-ctp-base rounded-lg ${location.pathname === "/admin/users" ? "border bg-ctp-base" : ""}`}
            >
              <User class="mr-2 my-auto" size={16} />
              Users
            </a>

            <a
              href="/admin/markets"
              class={`flex p-2 px-4 hover:no-underline! hover:bg-ctp-base rounded-lg ${location.pathname === "/admin/markets" ? "border bg-ctp-base" : ""}`}
            >
              <ShoppingBasket class="mr-2 my-auto" size={16} />
              Markets
            </a>

            <a
              href="/admin/trades"
              class={`flex p-2 px-4 hover:no-underline! hover:bg-ctp-base rounded-lg ${location.pathname === "/admin/trades" ? "border bg-ctp-base" : ""}`}
            >
              <Receipt class="mr-2 my-auto" size={16} />
              Trades
            </a>

            <a
              href="/admin/ledger"
              class={`flex p-2 px-4 hover:no-underline! hover:bg-ctp-base rounded-lg ${location.pathname === "/admin/ledger" ? "border bg-ctp-base" : ""}`}
            >
              <ChartArea class="mr-2 my-auto" size={16} />
              Ledger
            </a>

            <a
              href="/admin/alts"
              class={`flex p-2 px-4 hover:no-underline! hover:bg-ctp-base rounded-lg ${location.pathname === "/admin/alts" ? "border bg-ctp-base" : ""}`}
            >
              <Ban class="mr-2 my-auto" size={16} />
              Alts
            </a>
          </div>

          <div class="flex w-full">{props.children}</div>
        </div>
      </main>
    </>
  );
}
