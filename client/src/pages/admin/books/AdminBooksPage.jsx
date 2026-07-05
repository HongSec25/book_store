import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useCovers } from "@/hooks/useCovers";
import CoverArt from "@/components/CoverArt";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminBooksPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "books"],
    queryFn: () => apiFetch("/api/admin/books"),
  });
  const { data: coverMap = {} } = useCovers();

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/books/${id}`, { method: "DELETE" });
      toast.success(`Deleted "${title}"`);
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      // Keep the storefront's separately-cached catalog query in sync too.
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete book.");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { books } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-ink">Books ({books.length})</h1>
        <Link to="/admin/books/new" className={buttonVariants()}>
          + New book
        </Link>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>
                    <div className="h-14 w-10 overflow-hidden rounded-sm border border-border">
                      {coverMap[book.slug] ? (
                        <img
                          src={coverMap[book.slug]}
                          alt={`Cover of ${book.title}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <CoverArt book={book} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-display font-bold text-ink">{book.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{book.slug}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Link to={`/admin/books/${book.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Edit
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(book.id, book.title)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
