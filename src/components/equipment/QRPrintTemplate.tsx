import { QRCodeCanvas } from "qrcode.react";

export type LabelSize = "60x40" | "90x40" | "100x50";

interface LabelDimensions {
  width: string;
  height: string;
  qrSize: number;
  qrBoxSize: string;
  dividerHeight: string;
  headerFontSize: string;
  nameFontSize: string;
  detailFontSize: string;
  labelFontSize: string;
  siteFontSize: string;
  padding: string;
  headerPadding: string;
  maxNameWidth: string;
}

const LABEL_CONFIGS: Record<LabelSize, LabelDimensions> = {
  "60x40": {
    width: "60mm",
    height: "40mm",
    qrSize: 80,
    qrBoxSize: "22mm",
    dividerHeight: "20mm",
    headerFontSize: "7px",
    nameFontSize: "8px",
    detailFontSize: "6.5px",
    labelFontSize: "6px",
    siteFontSize: "6px",
    padding: "3px 4px",
    headerPadding: "2px 6px",
    maxNameWidth: "32mm",
  },
  "90x40": {
    width: "90mm",
    height: "40mm",
    qrSize: 96,
    qrBoxSize: "27mm",
    dividerHeight: "25mm",
    headerFontSize: "8px",
    nameFontSize: "9.5px",
    detailFontSize: "7.5px",
    labelFontSize: "7px",
    siteFontSize: "7px",
    padding: "5px 6px",
    headerPadding: "3px 8px",
    maxNameWidth: "52mm",
  },
  "100x50": {
    width: "100mm",
    height: "50mm",
    qrSize: 120,
    qrBoxSize: "32mm",
    dividerHeight: "32mm",
    headerFontSize: "9px",
    nameFontSize: "11px",
    detailFontSize: "8.5px",
    labelFontSize: "8px",
    siteFontSize: "7.5px",
    padding: "6px 8px",
    headerPadding: "4px 10px",
    maxNameWidth: "58mm",
  },
};

interface QRPrintLabelProps {
  equipment: {
    id: string;
    item_number: string;
    name: string;
    org_id: string;
    serial_number?: string | null;
  };
  siteName?: string;
  orgName?: string;
  labelSize?: LabelSize;
}

const QRPrintLabel = ({ equipment, siteName, orgName, labelSize = "90x40" }: QRPrintLabelProps) => {
  const config = LABEL_CONFIGS[labelSize];

  const qrData = JSON.stringify({
    id: equipment.id,
    item_number: equipment.item_number,
    name: equipment.name,
    org_id: equipment.org_id,
    url: `/equipment/${equipment.id}`,
  });

  const displayOrgName = orgName || "EQUIPSTRACK";

  return (
    <div
      className="qr-label bg-white break-inside-avoid overflow-hidden"
      style={{
        width: config.width,
        height: config.height,
        border: "1.5px solid #1B3A6B",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#1B3A6B",
          padding: config.headerPadding,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: config.headerFontSize,
            fontWeight: "bold",
            color: "#FFFFFF",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {displayOrgName}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          padding: config.padding,
          gap: 0,
        }}
      >
        {/* QR */}
        <div
          style={{
            flexShrink: 0,
            width: config.qrBoxSize,
            height: config.qrBoxSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <QRCodeCanvas
            value={qrData}
            size={config.qrSize}
            level="M"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor="#1B3A6B"
          />
        </div>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: config.dividerHeight,
            background: "#CBD5E1",
            margin: "0 6px",
            flexShrink: 0,
          }}
        />

        {/* Info */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "3px",
            overflow: "hidden",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: config.nameFontSize,
              fontWeight: "bold",
              color: "#1A1A2E",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: config.maxNameWidth,
              marginBottom: "3px",
            }}
          >
            {equipment.name}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2.5px" }}>
            {equipment.serial_number && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: config.detailFontSize }}>
                <span style={{ color: "#64748B", minWidth: "13mm", fontSize: config.labelFontSize }}>N° Série</span>
                <span
                  style={{
                    color: "#1A1A2E",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    fontSize: config.detailFontSize,
                    background: "#F1F5F9",
                    padding: "1px 4px",
                    borderRadius: "2px",
                  }}
                >
                  {equipment.serial_number}
                </span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: config.detailFontSize }}>
              <span style={{ color: "#64748B", minWidth: "13mm", fontSize: config.labelFontSize }}>N° Item</span>
              <span
                style={{
                  color: "#1A1A2E",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  fontSize: config.detailFontSize,
                  background: "#F1F5F9",
                  padding: "1px 4px",
                  borderRadius: "2px",
                }}
              >
                {equipment.item_number}
              </span>
            </div>

            {siteName && (
              <div style={{ color: "#64748B", fontSize: config.siteFontSize, marginTop: "3px" }}>
                📍 {siteName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPrintLabel;
