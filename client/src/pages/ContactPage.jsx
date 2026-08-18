import { useState } from "react";
import { toast } from "sonner";
import { Mail, MapPin } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Reveal from "@/components/motion/Reveal";
import SplitHeading from "@/components/motion/SplitHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const EMPTY_FORM = { name: "", email: "", message: "" };

const SOCIALS = [
  {
    name: "Facebook",
    href: "https://web.facebook.com/dont.confess.uwillget.reject",
    icon: FacebookIcon,
  },
  {
    name: "Telegram",
    href: "https://t.me/Launmyat",
    icon: TelegramIcon,
  },
];

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TelegramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22.05 2.94a1.62 1.62 0 0 0-1.65-.27L1.9 10.05c-.7.27-1.15.9-1.15 1.63 0 .73.44 1.36 1.15 1.6l4.87 1.6 1.86 6.02c.13.42.5.7.94.7.05 0 .1 0 .15-.01a1 1 0 0 0 .8-.6l2.4-4.7 4.98 3.7c.28.2.6.31.93.31.2 0 .4-.04.6-.13.5-.22.85-.68.93-1.22l2.86-14.4a1.63 1.63 0 0 0-.37-1.4c0-.03-.01-.05-.02-.06zM9.3 13.94l-3.9-1.28 12.6-6.9-8.7 8.18zm.98 4.98-1.1-3.55 1.87 1.4-.77 2.15zm2.2-3.28 8.05-7.56-2.05 10.34-6-4.78z" />
    </svg>
  );
}

export default function ContactPage() {
  useDocumentTitle("Contact");
  const [form, setForm] = useState(EMPTY_FORM);
  const [pending, setPending] = useState(false);

  function updateField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  // Demo form: nothing is actually sent — for real inquiries, use the
  // Facebook or Telegram links below.
  function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setTimeout(() => {
      toast.success("Message received — this is a demo, so nothing was actually sent.");
      setForm(EMPTY_FORM);
      setPending(false);
    }, 500);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <SplitHeading as="h1" className="font-display font-black text-4xl text-ink text-center">
        Get in Touch
      </SplitHeading>
      <Reveal
        as="p"
        variant="slide-up"
        delay={0.2}
        className="mt-6 text-center font-body text-ink/80 leading-relaxed max-w-xl mx-auto"
      >
        Questions about an order, a book, or just want to say hello? Send us a message, or reach
        out directly on Facebook or Telegram.
      </Reveal>

      <div className="mt-12 grid gap-8 md:grid-cols-5">
        <Reveal as="div" variant="slide-up" delay={0.3} className="md:col-span-3">
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={updateField("name")} maxLength={100} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={updateField("email")}
                    maxLength={200}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={form.message}
                    onChange={updateField("message")}
                    maxLength={2000}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Sending..." : "Send message"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  This form is for demonstration only. For a real reply, message us on Facebook or
                  Telegram.
                </p>
              </form>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal as="div" variant="slide-up" delay={0.4} className="md:col-span-2">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col justify-between gap-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-line mb-4">Contact info</p>
                <ul className="space-y-3 font-body text-sm text-ink/80">
                  <li className="flex items-center gap-2.5">
                    <Mail className="size-4 shrink-0 text-rust" />
                    hello@scorchedquarto.test
                  </li>
                  <li className="flex items-center gap-2.5">
                    <MapPin className="size-4 shrink-0 text-rust" />
                    Phnom Penh, Cambodia
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-line mb-4">Connect with us</p>
                <div className="flex gap-3">
                  {SOCIALS.map(({ name, href, icon: Icon }) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={name}
                      className="inline-flex size-10 items-center justify-center rounded-lg border border-line bg-parchment-card text-ink/80 transition-colors hover:border-rust hover:text-rust"
                    >
                      <Icon className="size-5" />
                    </a>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </main>
  );
}
