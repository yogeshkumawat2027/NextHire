"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import LogoutButton from "@/app/components/LogoutButton";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-700 hover:bg-indigo-50"
      >
        <UserRound size={20} aria-hidden="true" />
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`absolute bottom-0 right-0 rounded-full bg-white text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <Link
            href="/employee/profile"
            onClick={() => setOpen(false)}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <UserRound size={16} aria-hidden="true" />
            View Profile
          </Link>
          <div className="border-t border-slate-100 pt-2">
            <LogoutButton className="inline-flex w-full items-center justify-start gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60" />
          </div>
        </div>
      )}
    </div>
  );
}
