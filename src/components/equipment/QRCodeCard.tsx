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
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR - ${equipment.item_number}</title>
        <style>
          @page { size: 60mm 40mm; margin: 0; }
          body { margin: 0; display: flex; justify-content: center; align-items: center; width: 60mm; height: 40mm; font-family: system-ui, sans-serif; }
          .label { text-align: center; padding: 2mm; }
          .label img.qr { width: 22mm; height: 22mm; }
          .label .name { font-size: 7pt; font-weight: 600; margin-top: 1mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 56mm; }
          .label .id { font-size: 6pt; color: #666; margin-top: 0.5mm; }
          .label .org { font-size: 5pt; color: #999; margin-bottom: 1mm; }
        </style>
      </head>
      <body>
        <div class="label">
          ${orgName ? `<div class="org">${orgName}</div>` : ""}
          <img class="qr" src="${dataUrl}" />
          <div class="name">${equipment.name}</div>
          <div class="id">${equipment.item_number}</div>
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
