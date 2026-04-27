"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { createUserSchema } from "@/schemas/user.schema";
import { createUserAction } from "@/server/actions/users.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { UserDTO } from "@/services/dto";
import type { ActionResult } from "@/server/api/response";

type FormValues = z.infer<typeof createUserSchema>;

const initial: ActionResult<UserDTO> = { ok: false, error: { code: "", message: "" } };

export function CreateUserForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createUserAction, initial);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(createUserSchema) });

  useEffect(() => {
    if (state.ok) {
      toast.success("User created");
      router.push("/admin/users");
    } else if (state.error.message) {
      toast.error(state.error.message);
    }
  }, [state, router]);

  const onSubmit = handleSubmit((_, event) => {
    const form = event?.target as HTMLFormElement;
    if (form) formAction(new FormData(form));
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register("name")} placeholder="Jane Smith" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="jane@institution.edu" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <input type="hidden" {...register("role")} />
            <Select onValueChange={(v) => setValue("role", v as FormValues["role"])}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create user
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
