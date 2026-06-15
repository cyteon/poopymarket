import { LayoutDashboard, User } from "lucide-solid";
import Navbar from "~/components/Navbar";

export default function AdminLayout(props: { children: Node }) {
  return (
    <div class="h-screen flex flex-col">
      <Navbar />

      <div class="flex p-4 h-full gap-4 flex-col lg:flex-row">
        <div class="rounded-md border bg-ctp-surface0 h-full p-2">
          <a
            href="/admin"
            class="flex p-2 hover:no-underline! hover:bg-ctp-base rounded-lg"
          >
            <LayoutDashboard class="mr-2 my-auto" size={16} />
            Overview
          </a>
        </div>

        <div>{props.children}</div>
      </div>
    </div>
  );
}
