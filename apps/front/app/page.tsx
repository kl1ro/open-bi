import { Toaster } from "sonner";

import StoreProvider from "@/state/StoreProvider";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="size-full p-4">
      <StoreProvider>
        <Toaster />
        <Dashboard />
      </StoreProvider>
    </div>
  );
}
