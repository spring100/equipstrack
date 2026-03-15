import { useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface QRCodeCardProps {
  equipment: {
    id: string;
    item_number: string;
    name: string;
    org_id: string;
  };
  orgLogoUrl?: string | null;
  orgName?: string;
  size?: number;
}

const QRCodeCard = ({ equipment, orgLogoUrl, orgName, size = 180 }: QRCodeCardProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const qrData = JSON.stringify({
    id: equipment.id,
    item_number: equipment.item_number,
    name: equipment.name,
    org_id: equipment.org_id,
    url: `/equipment/${equipment.id}`,
  });

  const equipmentUrl = `${window.location.origin}/equipment/${equipment.id}`;

  const handleDownloadPNG = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${equipment.item_number}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("QR code téléchargé");
    });
  }, [equipment.item_number]);

  const handlePrint = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const displayOrg = orgName || "EQUIPSTRACK";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR - ${equipment.item_number}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .label { width: 90mm; height: 40mm; border: 1.5px solid #1B3A6B; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; background: white; }
          .label-header { background: #1B3A6B; padding: 3px 8px; display: flex; align-items: center; }
          .org-name { font-size: 8px; font-weight: bold; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px; }
          .label-body { display: flex; flex-direction: row; align-items: center; flex: 1; padding: 5px 6px; }
          .qr-side { flex-shrink: 0; width: 27mm; height: 27mm; display: flex; align-items: center; justify-content: center; }
          .qr-side img { width: 27mm; height: 27mm; }
          .divider { width: 1px; height: 25mm; background: #CBD5E1; margin: 0 6px; flex-shrink: 0; }
          .info-side { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 3px; overflow: hidden; }
          .eq-name { font-size: 9.5px; font-weight: bold; color: #1A1A2E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 52mm; margin-bottom: 3px; }
          .detail-row { display: flex; align-items: center; gap: 4px; font-size: 7.5px; }
          .label-key { color: #64748B; min-width: 13mm; font-size: 7px; }
          .label-val { color: #1A1A2E; font-weight: 600; font-family: monospace; font-size: 7.5px; background: #F1F5F9; padding: 1px 4px; border-radius: 2px; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="label-header"><span class="org-name">${displayOrg}</span></div>
          <div class="label-body">
            <div class="qr-side"><img src="${dataUrl}" /></div>
            <div class="divider"></div>
            <div class="info-side">
              <div class="eq-name">${equipment.name}</div>
              <div class="detail-row"><span class="label-key">N° Item</span><span class="label-val">${equipment.item_number}</span></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.onload = () => {
      win.print();
      win.close();
    };
  }, [equipment, orgName]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(equipmentUrl);
    setCopied(true);
    toast.success("Lien copié");
    setTimeout(() => setCopied(false), 2000);
  }, [equipmentUrl]);

  return (
    <Card className="w-fit">
      <CardContent className="p-5 flex flex-col items-center gap-3">
        {orgLogoUrl && (
          <img src={orgLogoUrl} alt="Logo" className="h-6 object-contain" />
        )}
        {orgName && !orgLogoUrl && (
          <span className="text-xs font-medium text-muted-foreground">{orgName}</span>
        )}

        <div ref={canvasRef} className="bg-white p-3 rounded-lg">
          <QRCodeCanvas
            value={qrData}
            size={size}
            level="M"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor="#1B3A6B"
          />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{equipment.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{equipment.item_number}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            Lien
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeCard;
