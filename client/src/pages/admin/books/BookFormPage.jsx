import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const FORMAT_TYPES = ["hardcover", "ebook", "audio"];

/** Combined create/edit page. Simplified from the original: plain <select>
 * for author/imprint instead of an inline "+ New" creation dialog — admins
 * add new authors/imprints/collections via the API directly for now
 * (POST /api/admin/{authors,imprints,collections} still exist and work,
 * just not wired to an inline dialog here yet). */
export default function BookFormPage({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pending, setPending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "books", mode === "edit" ? id : "new"],
    queryFn: () => apiFetch(mode === "edit" ? `/api/admin/books/${id}` : "/api/admin/books"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const book = mode === "edit" ? data.book : null;
  // The list endpoint doubles as reference data provider; for edit mode we
  // need a second call to get authors/imprints/genres/collections.
  return <BookFormInner book={book} pending={pending} setPending={setPending} navigate={navigate} mode={mode} id={id} />;
}

function BookFormInner({ book, pending, setPending, navigate, mode, id }) {
  const queryClient = useQueryClient();
  const { data: refData, isLoading } = useQuery({
    queryKey: ["admin", "books", "reference"],
    queryFn: () => apiFetch("/api/admin/books"),
  });
  const [authorId, setAuthorId] = useState(book?.authorId ?? "");
  const [imprintId, setImprintId] = useState(book?.imprintId ?? "");
  const [coverPreview, setCoverPreview] = useState(null);
  const [newAuthorOpen, setNewAuthorOpen] = useState(false);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { authors, imprints, genres, collections } = refData;
  const formatByType = Object.fromEntries((book?.formats ?? []).map((f) => [f.type, f]));

  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!authorId || !imprintId) {
      toast.error("Choose an author and an imprint.");
      return;
    }
    setPending(true);
    const form = new FormData(e.currentTarget);

    const formats = FORMAT_TYPES.map((type) => {
      const price = form.get(`price_${type}`);
      if (price === null || price === "") return null;
      const outOfStock = form.get(`outOfStock_${type}`) === "on";
      return {
        type,
        price: Number(price),
        sku: String(form.get(`sku_${type}`) ?? ""),
        stockCount: outOfStock ? 0 : Number(form.get(`stock_${type}`) ?? 0),
      };
    }).filter(Boolean);

    const payload = new FormData();
    payload.set("title", form.get("title"));
    if (mode === "edit") payload.set("slug", book.slug);
    payload.set("coverColor", form.get("coverColor"));
    payload.set("imprintId", imprintId);
    payload.set("authorId", authorId);
    for (const g of form.getAll("genreIds")) payload.append("genreIds", g);
    for (const c of form.getAll("collectionIds")) payload.append("collectionIds", c);
    payload.set("publishDate", form.get("publishDate"));
    payload.set("isNewRelease", form.get("isNewRelease") === "on" ? "true" : "false");
    payload.set("isComingSoon", form.get("isComingSoon") === "on" ? "true" : "false");
    payload.set("isBestseller", form.get("isBestseller") === "on" ? "true" : "false");
    payload.set("isCultClassic", form.get("isCultClassic") === "on" ? "true" : "false");
    payload.set("synopsis", form.get("synopsis"));
    payload.set("pullQuote", form.get("pullQuote") ?? "");
    payload.set("formats", JSON.stringify(formats));
    payload.set("contentWarnings", form.get("contentWarnings") ?? "");
    payload.set("isbn", form.get("isbn"));
    const cover = form.get("cover");
    if (cover && cover.size > 0) payload.set("cover", cover);

    try {
      const result = await apiFetch(mode === "edit" ? `/api/admin/books/${id}` : "/api/admin/books", {
        method: mode === "edit" ? "PUT" : "POST",
        body: payload,
      });
      // The book itself always saves even if the cover upload specifically
      // failed (e.g. Storage misconfigured) — surface that distinctly
      // instead of a blanket success, since it otherwise looks like nothing
      // went wrong until the cover turns up missing later.
      if (result?.coverError) {
        toast.warning(result.coverError);
      } else {
        toast.success(mode === "edit" ? "Book updated" : "Book created");
      }
      // The storefront's useCatalog() lives under a separate ["catalog"]
      // query key with its own staleTime — without this, a new/edited book
      // won't show up on the customer-facing site until that cache expires
      // on its own (up to a minute), even though the admin list refreshes
      // immediately since it remounts on navigate().
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      navigate("/admin/books");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save book.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <Link
          to="/admin/books"
          className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="h-3 w-3" /> Back to books
        </Link>
        <h1 className="mt-2 font-display font-bold text-2xl text-ink">
          {mode === "edit" ? `Edit ${book.title}` : "New book"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Title">
              <Input name="title" defaultValue={book?.title} required />
            </Field>

            <Field label="Cover image">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-input bg-muted/40">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    name="cover"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleCoverChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional — without one, a generated cover is shown.</p>
                </div>
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Author">
                <div className="flex gap-2">
                  <Select value={authorId} onValueChange={setAuthorId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                    <SelectContent>
                      {authors.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={newAuthorOpen} onOpenChange={setNewAuthorOpen}>
                    <DialogTrigger render={<Button type="button" variant="outline" size="icon" />}>
                      <Plus />
                      <span className="sr-only">New author</span>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>New author</DialogTitle>
                      </DialogHeader>
                      <NewAuthorForm
                        onCreated={(author) => {
                          queryClient.invalidateQueries({ queryKey: ["admin", "books", "reference"] });
                          setAuthorId(author.id);
                          setNewAuthorOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </Field>
              <Field label="Imprint">
                <Select value={imprintId} onValueChange={setImprintId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select imprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {imprints.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Genres">
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-input p-3">
                {genres.map((g) => (
                  <ChipCheckbox key={g.id} name="genreIds" value={g.id} defaultChecked={book?.genreIds.includes(g.id)}>
                    {g.name}
                  </ChipCheckbox>
                ))}
              </div>
            </Field>

            <Field label="Collections">
              <div className="flex flex-wrap gap-2 rounded-lg border border-input p-3">
                {collections.map((c) => (
                  <ChipCheckbox
                    key={c.id}
                    name="collectionIds"
                    value={c.id}
                    defaultChecked={book?.collectionIds.includes(c.id)}
                  >
                    {c.name}
                  </ChipCheckbox>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Publish date">
                <Input type="date" name="publishDate" defaultValue={book?.publishDate} required />
              </Field>
              <Field label="Cover color">
                <Input type="color" name="coverColor" defaultValue={book?.coverColor ?? "#8C7A5B"} className="h-9 p-1" />
              </Field>
            </div>

            <Field label="Synopsis">
              <Textarea name="synopsis" defaultValue={book?.synopsis} required rows={3} />
            </Field>
            <Field label="Pull quote (optional)">
              <Input name="pullQuote" defaultValue={book?.pullQuote} />
            </Field>
            <Field label="Content warnings (comma separated)">
              <Input name="contentWarnings" defaultValue={book?.contentWarnings.join(", ")} />
            </Field>
            <Field label="ISBN">
              <Input name="isbn" defaultValue={book?.isbn} required />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["isNewRelease", "New release"],
                ["isComingSoon", "Coming soon"],
                ["isBestseller", "Bestseller"],
                ["isCultClassic", "Cult classic"],
              ].map(([name, label]) => (
                <label key={name} className="flex items-center gap-2 text-sm text-ink">
                  <Checkbox name={name} defaultChecked={book?.[name]} />
                  {label}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Formats & pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {FORMAT_TYPES.map((type) => {
              const existing = formatByType[type];
              return (
                <div key={type} className="rounded-lg border border-input p-4">
                  <p className="mb-3 font-display font-bold text-sm text-ink capitalize">{type}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                    <Field label="Price ($)" compact>
                      <Input type="number" step="0.01" min="0" name={`price_${type}`} defaultValue={existing?.price} />
                    </Field>
                    <Field label="SKU" compact>
                      <Input name={`sku_${type}`} defaultValue={existing?.sku} />
                    </Field>
                    <Field label="Stock" compact>
                      <Input type="number" min="0" name={`stock_${type}`} defaultValue={existing?.stockCount} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-ink pb-2">
                      <Checkbox name={`outOfStock_${type}`} defaultChecked={existing ? existing.stockCount === 0 : false} />
                      Out of stock
                    </label>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">
              Leave price blank to omit a format. Checking "Out of stock" overrides the stock number to 0.
            </p>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
          <Link to="/admin/books" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-ink">
            Cancel
          </Link>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Saving..." : book ? "Save changes" : "Create book"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function NewAuthorForm({ onCreated }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    try {
      const { author } = await apiFetch("/api/admin/authors", { method: "POST", body: JSON.stringify({ name, bio }) });
      toast.success(`Added ${author.name}`);
      onCreated(author);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create author.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-author-name">Name</Label>
        <Input id="new-author-name" required disabled={pending} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-author-bio">Bio (optional)</Label>
        <Textarea id="new-author-bio" rows={3} disabled={pending} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating..." : "Create author"}
      </Button>
    </form>
  );
}

function ChipCheckbox({ children, ...checkboxProps }) {
  return (
    <label className="group flex items-center gap-1.5 rounded-full border border-input px-3 py-1 text-xs text-ink transition-colors has-data-checked:border-rust has-data-checked:bg-rust/10 has-data-checked:text-rust">
      <Checkbox className="sr-only" {...checkboxProps} />
      {children}
    </label>
  );
}

function Field({ label, children, compact }) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
