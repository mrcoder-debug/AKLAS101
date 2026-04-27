"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { changePasswordSchema } from "@/schemas/user.schema";
import { changePasswordAction } from "@/server/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";

type FormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setIsPending(true);
    try {
      const result = await changePasswordAction(values);
      if (result.ok) {
        toast.success("Password changed — please sign in again");
        reset();
        router.push("/login");
      } else {
        toast.error(result.error?.message ?? "Failed to change password");
      }
    } finally {
      setIsPending(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="gradient-primary shadow-primary">
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing…</>
        ) : (
          <><KeyRound className="mr-2 h-4 w-4" /> Change password</>
        )}
      </Button>
    </form>
  );
}
