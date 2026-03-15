import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEquipmentList } from "@/hooks/useEquipment";
import DashboardLayout from "@/components/DashboardLayout";
import QRPrintLabel, { type LabelSize } from "@/components/equipment/QRPrintTemplate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, FileDown, CheckSquare, Square, Search, Ruler } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const LABEL_SIZE_OPTIONS: { value: LabelSize; label: string }[] = [
  { value: "60x40", label: "60 × 40 mm (Compact)" },
  { value: "90x40", label: "90 × 40 mm (Standard)" },
  { value: "100x50", label: "100 × 50 mm (Grand)" },
];

const PrintQRPage = () => {
  const { profile, orgInfo } = useAuth();
  const { data: equipment, isLoading } = useEquipmentList(profile?.org_id ?? undefined);
  const organizationName = orgInfo?.orgName || "EQUIPSTRACK";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [labelSize, setLabelSize] = useState<LabelSize>("90x40");
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = (equipment ?? []).filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.item_number.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  };

  const selectedEquipment = (equipment ?? []).filter((e) => selected.has(e.id));

  const handlePrint = useCallback(() => {
    if (selectedEquipment.length === 0) {
      toast.error("Sélectionnez au moins un équipement");
      return;
    }
    window.print();
  }, [selectedEquipment]);

  const handleDownloadPDF = useCallback(async () => {
    if (!gridRef.current || selectedEquipment.length === 0) {
      toast.error("Sélectionnez au moins un équipement");
      return;
    }
    toast.info("Génération du PDF...");
    try {
      const canvas = await html2canvas(gridRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: gridRef.current.scrollWidth,
        windowHeight: gridRef.current.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const usableWidth = pageWidth - margin * 2;
      const imgRatio = canvas.height / canvas.width;
      const imgHeight = usableWidth * imgRatio;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, usableWidth, imgHeight);
      } else {
        // Multi-page support
        let yOffset = 0;
        const sliceHeight = ((pageHeight - margin * 2) / imgHeight) * canvas.height;

        while (yOffset < canvas.height) {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(sliceHeight, canvas.height - yOffset);
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, 0, -yOffset);
            const pageData = pageCanvas.toDataURL("image/png");
            const sliceImgHeight = (pageCanvas.height / canvas.width) * usableWidth;
            if (yOffset > 0) pdf.addPage();
            pdf.addImage(pageData, "PNG", margin, margin, usableWidth, sliceImgHeight);
          }
          yOffset += sliceHeight;
        }
      }

      pdf.save("qr-codes-equipstrack.pdf");
      toast.success("PDF téléchargé");
    } catch {
      toast.error("Erreur lors de la génération du PDF");
    }
  }, [selectedEquipment]);

  // Grid columns based on label size
  const gridCols = labelSize === "60x40" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" :
                   labelSize === "100x50" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" :
                   "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  return (
    <DashboardLayout
      title="Impression QR Codes"
      breadcrumb={[
        { label: "Inventaire", path: "/equipment" },
        { label: "Impression QR" },
      ]}
    >
      {/* Controls */}
      <div className="print:hidden space-y-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un équipement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LABEL_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selected.size === filtered.length ? (
              <CheckSquare className="h-4 w-4 mr-1.5" />
            ) : (
              <Square className="h-4 w-4 mr-1.5" />
            )}
            {selected.size === filtered.length ? "Désélectionner tout" : "Tout sélectionner"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} disabled={selected.size === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer ({selected.size})
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={selected.size === 0}>
            <FileDown className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>

        {/* Selection list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <div className="border border-border rounded-lg max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-3 w-10" />
                  <th className="text-left p-3 font-medium">N°</th>
                  <th className="text-left p-3 font-medium">Nom</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Site</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((eq) => (
                  <tr
                    key={eq.id}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer"
                    onClick={() => toggleSelect(eq.id)}
                  >
                    <td className="p-3">
                      <Checkbox checked={selected.has(eq.id)} />
                    </td>
                    <td className="p-3 font-mono text-xs">{eq.item_number}</td>
                    <td className="p-3">{eq.name}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">
                      {(eq as any).sites?.name ?? "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      Aucun équipement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print grid */}
      {selectedEquipment.length > 0 && (
        <div
          ref={gridRef}
          className={`print:block grid ${gridCols} gap-3 bg-white p-4 print:gap-0 print:p-0`}
          style={{ pageBreakAfter: "always" }}
        >
          {selectedEquipment.map((eq) => (
            <QRPrintLabel
              key={eq.id}
              equipment={{
                id: eq.id,
                item_number: eq.item_number,
                name: eq.name,
                org_id: eq.org_id,
                serial_number: eq.serial_number,
              }}
              siteName={(eq as any).sites?.name}
              orgName={organizationName}
              labelSize={labelSize}
            />
          ))}
        </div>
      )}

      {/* Print-only CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          [data-print-grid], [data-print-grid] * { visibility: visible; }
          .qr-label { page-break-inside: avoid; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default PrintQRPage;
