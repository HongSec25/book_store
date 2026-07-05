import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import ProfileNameField from "./ProfileNameField";
import ContactInfoForm from "./ContactInfoForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["account", "profile"],
    queryFn: () => apiFetch("/api/account/profile"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const profile = data.profile;
  const hasContactInfo = Boolean(profile?.phone || profile?.province || profile?.addressDetail);

  return (
    <div className="space-y-6">
      <h1 className="font-display font-black text-2xl text-ink">Settings</h1>

      <Card className="rounded-2xl shadow-sm max-w-md">
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Name</p>
            <ProfileNameField initialName={user.name ?? ""} email={user.email} />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</p>
            <p className="text-sm text-ink">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display font-bold text-ink">Contact & shipping address</p>
              {hasContactInfo ? (
                <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                  {profile.phone && <p>{profile.phone}</p>}
                  {(profile.city || profile.province) && (
                    <p>
                      {[profile.city, profile.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {profile.addressDetail && <p className="truncate">{profile.addressDetail}</p>}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No contact info on file yet.</p>
              )}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" className="shrink-0" />}>
                <Pencil /> Edit
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rust" /> Contact & shipping address
                  </DialogTitle>
                </DialogHeader>
                <ContactInfoForm
                  profile={profile}
                  onSaved={() => {
                    queryClient.invalidateQueries({ queryKey: ["account", "profile"] });
                    setDialogOpen(false);
                  }}
                />
                <p className="text-xs text-muted-foreground">We use this to prefill your shipping details at checkout.</p>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
