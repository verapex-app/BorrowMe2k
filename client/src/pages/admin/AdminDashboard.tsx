import { useState } from "react";
import { LayoutDashboard, Users, CreditCard, History, LogOut, ShieldCheck, Link2 } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import AdminLogin from "./AdminLogin";
import Overview from "./tabs/Overview";
import UsersKyc from "./tabs/UsersKyc";
import Loans from "./tabs/Loans";
import Repayments from "./tabs/Repayments";
import KycLinks from "./tabs/KycLinks";
import { Loader2 } from "lucide-react";

type Tab = "overview" | "users" | "loans" | "repayments" | "kyc-links";

const tabs: { id: Tab; label: string; Icon: React.ComponentType<any> }[] = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "users", label: "Users", Icon: Users },
  { id: "loans", label: "Loans", Icon: CreditCard },
  { id: "repayments", label: "Repayments", Icon: History },
  { id: "kyc-links", label: "KYC Links", Icon: Link2 },
];

export default function AdminDashboard() {
  const { isAdmin, login, logout } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin onLogin={login} />;
  }

  const ActiveTab =
    activeTab === "overview"
      ? Overview
      : activeTab === "users"
      ? UsersKyc
      : activeTab === "loans"
      ? Loans
      : activeTab === "repayments"
      ? Repayments
      : KycLinks;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">BorrowMe2K Admin</p>
            <p className="text-gray-400 text-xs leading-tight">Management Portal</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <ActiveTab />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === id
                ? "text-green-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="leading-tight text-center">
              {id === "users" ? "Users" : label}
            </span>
            {activeTab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
