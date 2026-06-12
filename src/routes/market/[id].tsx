import { useParams } from "@solidjs/router";
import { createResource } from "solid-js";
import Navbar from "~/components/Navbar";
import { getMarket } from "~/server/markets";

export default function Market() {
  const params = useParams();

  const [market] = createResource(
    () => params.id,
    async (id) => {
      return await getMarket(parseInt(id));
    },
  );

  return (
    <main class="flex flex-col min-h-screen">
      <Navbar />
    </main>
  );
}
