"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton({ className }) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      window.location.assign("/login");
    } catch {
      setLoading(false);
      alert("Logout failed. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className || "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"}
    >
      <LogOut size={16} aria-hidden="true" />
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}