"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { acceptInvitationSchema } from "@/schemas/invitation.schema";
import { acceptInvitationAction } from "@/server/actions/invitations.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import type { UserDTO } from "@/services/dto";
import type { ActionResult } from "@/server/api/response";

type FormValues = z.infer<typeof acceptInvitationSchema>;

interface Props { token: string; email: string }

const initial: ActionResult<UserDTO> = { ok: false, error: { code: "", message: "" } };

export function ActivationForm({ token, email }: Props) {
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const boundAction = acceptInvitationAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(boundAction, initial);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(acceptInvitationSchema) });

  useEffect(() => {
    if (state.ok) {
      setSuccess(true);
    } else if (state.error?.message) {
      toast.error(state.error.message);
    }
  }, [state]);

  const onSubmit = handleSubmit((_, event) => {
    const form = event?.target as HTMLFormElement;
    if (form) formAction(new FormData(form));
  });

  if (success) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Account created!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your account is ready. Sign in to get started.
            </p>
          </div>
          <Button asChild className="w-full gradient-primary shadow-primary">
            <Link href="/login">Sign in now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="email-display">Email</Label>
            <Input
              id="email-display"
              value={email}
              disabled
              className="bg-surface-1 text-muted-foreground"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register("name")} placeholder="Your full name" autoFocus />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="At least 8 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="Repeat your password"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary shadow-primary"
            disabled={isPending}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
            ) : (
              "Activate account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
