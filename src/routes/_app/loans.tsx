import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/finance/PageHeader";
import { LoanCreateSection } from "@/components/loans/LoanCreateSection";
import { ActiveLoanTable } from "@/components/loans/ActiveLoanTable";

export const Route = createFileRoute("/_app/loans")({
  head: () => ({ meta: [{ title: "Loans — BuenaMano" }] }),
  component: LoansPage,
});

function LoansPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Loan management" subtitle="Encode new loans and review the active loan ledger." />
      <LoanCreateSection />
      <ActiveLoanTable />
    </div>
  );
}
