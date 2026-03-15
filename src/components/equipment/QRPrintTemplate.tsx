import { QRCodeCanvas } from "qrcode.react";

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
}

const QRPrintLabel = ({ equipment, siteName, orgName }: QRPrintLabelProps) => {
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
        width: "90mm",
        height: "40mm",
        border: "1.5px solid #1B3A6B",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header — org name */}
      <div
        style={{
          background: "#1B3A6B",
          padding: "3px 8px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "8px",
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

      {/* Body — QR left + Info right */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          padding: "5px 6px",
          gap: 0,
        }}
      >
        {/* QR side */}
        <div
          style={{
            flexShrink: 0,
            width: "27mm",
            height: "27mm",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <QRCodeCanvas
            value={qrData}
            size={96}
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
            height: "25mm",
            background: "#CBD5E1",
            margin: "0 6px",
            flexShrink: 0,
          }}
        />

        {/* Info side */}
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
              fontSize: "9.5px",
              fontWeight: "bold",
              color: "#1A1A2E",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "52mm",
              marginBottom: "3px",
            }}
          >
            {equipment.name}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2.5px" }}>
            {equipment.serial_number && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "7.5px" }}>
                <span style={{ color: "#64748B", minWidth: "13mm", fontSize: "7px" }}>N° Série</span>
                <span
                  style={{
                    color: "#1A1A2E",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    fontSize: "7.5px",
                    background: "#F1F5F9",
                    padding: "1px 4px",
                    borderRadius: "2px",
                  }}
                >
                  {equipment.serial_number}
                </span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "7.5px" }}>
              <span style={{ color: "#64748B", minWidth: "13mm", fontSize: "7px" }}>N° Item</span>
              <span
                style={{
                  color: "#1A1A2E",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  fontSize: "7.5px",
                  background: "#F1F5F9",
                  padding: "1px 4px",
                  borderRadius: "2px",
                }}
              >
                {equipment.item_number}
              </span>
            </div>

            {siteName && (
              <div style={{ color: "#64748B", fontSize: "7px", marginTop: "3px" }}>
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
