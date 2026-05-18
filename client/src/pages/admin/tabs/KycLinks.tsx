import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Plus, Link2, User, CheckCircle, Clock, AlertCircle } from "lucide-react";

type PoolLink = {
  id: number;
  rawLink: string;
  assignedUserId: number | null;
  assignedUsername: string | null;
  assignedAt: string | null;
  createdAt: string;
};

export default function KycLinks() {
  const qc = useQueryClient();
  const [newLink, setNewLink] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "assigned">("all");

  const { data: links = [], isLoading } = useQuery<PoolLink[]>({
    queryKey: ["/api/admin/kyc-pool"],
    queryFn: () => fetch("/api/admin/kyc-pool").then((r) => r.json()),
  });

  const addLink = useMutation({
    mutationFn: (rawLink: string) =>
      fetch("/api/admin/kyc-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawLink }),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message ?? "Failed to add link");
        return data;
      }),
    onSuccess: () => {
      setNewLink("");
      setError("");
      qc.invalidateQueries({ queryKey: ["/api/admin/kyc-pool"] });
    },
    onError: (err: any) => setError(err.message),
  });

  const deleteLink = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/kyc-pool/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/kyc-pool"] }),
  });

  const handleAdd = () => {
    const trimmed = newLink.trim();
    if (!trimmed) { setError("Paste a KYC link first"); return; }
    try { new URL(trimmed); } catch { setError("Must be a valid URL starting with https://"); return; }
    setError("");
    addLink.mutate(trimmed);
  };

  const available = links.filter((l) => !l.assignedUserId);
  const assigned = links.filter((l) => l.assignedUserId);
  const filtered = filter === "all" ? links : filter === "available" ? available : assigned;

  return (
    <div className="p-4 space-y-4">
      {/* Header + stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">KYC Link Pool</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{links.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{available.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Available</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{assigned.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Assigned</p>
          </div>
        </div>
      </div>

      {/* No links warning */}
      {available.length === 0 && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-700">
            No available links. New signups won't receive a KYC link until you add more.
          </p>
        </div>
      )}

      {/* Add new link */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add KYC Link</p>
        <textarea
          value={newLink}
          onChange={(e) => { setNewLink(e.target.value); setError(""); }}
          placeholder="https://bridge.withpersona.com/verify?..."
          rows={3}
          className={`w-full text-sm border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 ${
            error ? "border-red-400" : "border-gray-200"
          }`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleAdd}
          disabled={addLink.isPending}
          className="flex items-center gap-2 w-full justify-center bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {addLink.isPending ? "Adding…" : "Add to Pool"}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "available", "assigned"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors capitalize ${
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Link list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No links found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((link) => (
            <div
              key={link.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {link.assignedUserId ? (
                    <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      link.assignedUserId
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {link.assignedUserId ? "Assigned" : "Available"}
                  </span>
                </div>
                {!link.assignedUserId && (
                  <button
                    onClick={() => deleteLink.mutate(link.id)}
                    disabled={deleteLink.isPending}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-start gap-1.5 mb-2">
                <Link2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500 break-all line-clamp-2">{link.rawLink}</p>
              </div>

              {link.assignedUserId && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Assigned to <span className="font-medium">@{link.assignedUsername ?? link.assignedUserId}</span>
                    {link.assignedAt && (
                      <span className="text-gray-400 ml-1">
                        · {new Date(link.assignedAt).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
