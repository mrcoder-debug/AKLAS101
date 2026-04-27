"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { updateProfileSchema } from "@/schemas/user.schema";
import { updateProfileAction } from "@/server/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Linkedin, Twitter, Github, User } from "lucide-react";
import type { UserProfileDTO } from "@/services/dto";

type FormValues = z.infer<typeof updateProfileSchema>;

export function ProfileForm({ profile }: { profile: UserProfileDTO }) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile.name,
      avatarUrl: profile.avatarUrl ?? undefined,
      bio: profile.bio ?? undefined,
      linkedinUrl: profile.linkedinUrl ?? undefined,
      twitterUrl: profile.twitterUrl ?? undefined,
      githubUrl: profile.githubUrl ?? undefined,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsPending(true);
    try {
      const result = await updateProfileAction(values);
      if (result.ok) {
        toast.success("Profile updated");
      } else {
        toast.error(result.error?.message ?? "Failed to update profile");
      }
    } finally {
      setIsPending(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Basic Information
          </CardTitle>
          <CardDescription>Your name and bio shown to other users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" {...register("bio")} placeholder="A short intro about yourself…" />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              {...register("avatarUrl")}
              placeholder="https://example.com/avatar.png"
            />
            {errors.avatarUrl && (
              <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Social links (optional)</p>

            <div className="space-y-1.5">
              <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                {...register("linkedinUrl")}
                placeholder="https://linkedin.com/in/…"
              />
              {errors.linkedinUrl && (
                <p className="text-xs text-destructive">{errors.linkedinUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="twitterUrl" className="flex items-center gap-2">
                <Twitter className="h-3.5 w-3.5" /> Twitter / X
              </Label>
              <Input
                id="twitterUrl"
                type="url"
                {...register("twitterUrl")}
                placeholder="https://x.com/…"
              />
              {errors.twitterUrl && (
                <p className="text-xs text-destructive">{errors.twitterUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="githubUrl" className="flex items-center gap-2">
                <Github className="h-3.5 w-3.5" /> GitHub
              </Label>
              <Input
                id="githubUrl"
                type="url"
                {...register("githubUrl")}
                placeholder="https://github.com/…"
              />
              {errors.githubUrl && (
                <p className="text-xs text-destructive">{errors.githubUrl.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !isDirty} className="gradient-primary shadow-primary">
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save changes</>
          )}
        </Button>
      </div>
    </form>
  );
}
