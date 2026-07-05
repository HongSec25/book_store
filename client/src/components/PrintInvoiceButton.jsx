import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintInvoiceButton() {
  return (
    <Button onClick={() => window.print()} className="gap-2 print:hidden">
      <Printer className="h-4 w-4" />
      Print invoice
    </Button>
  );
}
