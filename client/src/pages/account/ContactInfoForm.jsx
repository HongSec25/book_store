import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { CAMBODIA_PROVINCES, citiesForProvince } from "@/lib/cambodia-locations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContactInfoForm({ profile, onSaved }) {
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [province, setProvince] = useState(profile?.province ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [addressDetail, setAddressDetail] = useState(profile?.addressDetail ?? "");
  const [pending, setPending] = useState(false);

  const cities = citiesForProvince(province);

  function handleProvinceChange(next) {
    if (!next) return;
    setProvince(next);
    setCity(""); // reset city since it belongs to the previous province
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    try {
      await apiFetch("/api/account/contact", {
        method: "PATCH",
        body: JSON.stringify({ phone, province, city, addressDetail }),
      });
      toast.success("Contact info updated");
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update contact info.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
          Phone number
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="012 345 678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Province</Label>
          <Select value={province} onValueChange={handleProvinceChange} disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {CAMBODIA_PROVINCES.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            City / District
          </Label>
          <Select value={city} onValueChange={(v) => v && setCity(v)} disabled={pending || !province}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={province ? "Select city" : "Choose a province first"} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="addressDetail" className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
          Street / house address
        </Label>
        <Textarea
          id="addressDetail"
          rows={3}
          placeholder="House number, street, village..."
          value={addressDetail}
          onChange={(e) => setAddressDetail(e.target.value)}
          disabled={pending}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Save contact info"}
      </Button>
    </form>
  );
}
