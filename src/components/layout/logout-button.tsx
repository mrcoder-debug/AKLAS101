"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-accent disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
