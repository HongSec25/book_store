import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AuditLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: () => apiFetch("/api/admin/audit-log"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { logs } = data;

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-ink">Audit log</h1>
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {logs.length === 0 && <p className="p-4 text-sm text-muted-foreground">No activity yet.</p>}
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {log.action}
                </Badge>
                <span className="text-ink">{log.entityLabel}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {log.actorEmail} &middot; {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
