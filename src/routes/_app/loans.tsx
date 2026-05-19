import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/finance/PageHeader";
import { LoanCreateSection, type ApiLoan } from "@/components/loans/LoanCreateSection";
import { ActiveLoanTable } from "@/components/loans/ActiveLoanTable";
import { apiRequest } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/loans")({
  head: () => ({ meta: [{ title: "Loans — BuenaMano" }] }),
  component: LoansPage,
});

function LoansPage() {
  const { token } = useRole();
  const [loans, setLoans]     = useState<ApiLoan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<ApiLoan[]>("GET", "loans", { token });
      setLoans(data);
    } catch {
      toast.error("Failed to load loans.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  function handleLoanCreated(loan: ApiLoan) {
    setLoans((prev) => [loan, ...prev]);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Loan management" subtitle="Encode new loans and review the active loan ledger." />
      <LoanCreateSection token={token} onLoanCreated={handleLoanCreated} />
      <ActiveLoanTable loans={loans} loading={loading} />
    </div>
  );
}
