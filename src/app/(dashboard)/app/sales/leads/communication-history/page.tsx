import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CommunicationHistoryPage from "@/components/sales/leads/communication-history-page";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CommunicationHistoryPage />
    </Suspense>
  );
}
