import { redirect } from "next/navigation";

export default function FinanceRootRedirect() {
  redirect("/app/finance/dashboard");
}
