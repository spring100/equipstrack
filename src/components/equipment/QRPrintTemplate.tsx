import { QRCodeCanvas } from "qrcode.react";

interface QRPrintLabelProps {
  equipment: {
    id: string;
    item_number: string;
    name: string;
    org_id: string;
  };
  siteName?: string;
  orgName?: string;
}

const QRPrintLabel = ({ equipment, siteName, orgName }: QRPrintLabelProps) => {
  const qrData = JSON.stringify({
    id: equipment.id,
    item_number: equipment.item_number,
    name: equipment.name,
    org_id: equipment.org_id,
    url: `/equipment/${equipment.id}`,
  });

  return (
    <div className="qr-label w-[60mm] h-[40mm] flex flex-col items-center justify-center p-[2mm] border border-border bg-white text-center break-inside-avoid">
      {orgName && (
        <span className="text-[5pt] text-muted-foreground mb-[1mm] truncate max-w-[56mm]">
          {orgName}
        </span>
      )}
      <QRCodeCanvas
        value={qrData}
        size={80}
        level="M"
        includeMargin={false}
        bgColor="#FFFFFF"
        fgColor="#1B3A6B"
      />
      <p className="text-[7pt] font-semibold mt-[1mm] truncate max-w-[56mm] text-foreground">
        {equipment.name}
      </p>
      <p className="text-[6pt] font-mono text-muted-foreground">{equipment.item_number}</p>
      {siteName && (
        <p className="text-[5pt] text-muted-foreground truncate max-w-[56mm]">{siteName}</p>
      )}
    </div>
  );
};

export default QRPrintLabel;
