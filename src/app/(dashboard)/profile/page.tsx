export const dynamic = 'force-dynamic';

import { requireUserOrRedirect, toActor } from "@/server/auth/session";
import { getOwnProfile } from "@/services/users.service";
import { getMyStats, getMyBadges } from "@/services/gamification.service";
import { listCertificates } from "@/services/certificate.service";
import { ProfileForm } from "./profile-form";
import { GamificationStats } from "@/components/gamification/gamification-stats";
import { UserCircle } from "lucide-react";

export default async function ProfilePage() {
  const user = await requireUserOrRedirect();
  const ctx = { actor: toActor(user) };

  const [profile, stats, badges, certs] = await Promise.all([
    getOwnProfile(ctx),
    getMyStats(ctx),
    getMyBadges(ctx),
    listCertificates(ctx),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <UserCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your personal information</p>
        </div>
      </div>
      <ProfileForm profile={profile} />
      <GamificationStats stats={stats} badges={badges} certificateCount={certs.length} />
    </div>
  );
}
