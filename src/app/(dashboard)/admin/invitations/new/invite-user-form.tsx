"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { createInvitationSchema } from "@/schemas/invitation.schema";
import { createInvitationAction } from "@/server/actions/invitations.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Info } from "lucide-react";
import type { InvitationDTO } from "@/services/dto";
import type { ActionResult } from "@/server/api/response";

type FormValues = z.infer<typeof createInvitationSchema>;

const initial: ActionResult<InvitationDTO> = { ok: false, error: { code: "", message: "" } };

export function InviteUserForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createInvitationAction, initial);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(createInvitationSchema) });

  useEffect(() => {
    if (state.ok) {
      toast.success("Invitation sent successfully");
      router.push("/admin/invitations");
    } else if (state.error?.message) {
      toast.error(state.error.message);
    }
  }, [state, router]);

  const onSubmit = handleSubmit((_, event) => {
    const form = event?.target as HTMLFormElement;
    if (form) formAction(new FormData(form));
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" />
          Send Invitation
        </CardTitle>
        <CardDescription>
          The user will receive an email with a secure link to set their password.
          The link expires in 72 hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="jane@institution.edu"
              autoComplete="off"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <input type="hidden" {...register("role")} />
            <Select onValueChange={(v) => setValue("role", v as FormValues["role"])}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          <Alert variant="default" className="bg-info/5 border-info/20 text-info-foreground">
            <Info className="h-4 w-4 text-info" />
            <AlertDescription className="text-sm text-muted-foreground">
              Admin role cannot be assigned via invitation. Grant admin access manually after
              the user activates their account.
            </AlertDescription>
          </Alert>

          <Button type="submit" className="w-full gradient-primary shadow-primary" disabled={isPending}>
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending invitation…</>
            ) : (
              <><Mail className="mr-2 h-4 w-4" /> Send Invitation</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
