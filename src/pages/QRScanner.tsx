import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CameraOff, Keyboard, Search } from "lucide-react";
import { toast } from "sonner";

const QRScannerPage = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualId, setManualId] = useState("");
  const [showManual, setShowManual] = useState(false);

  const handleScanResult = (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.id) {
        stopScanner();
        toast.success(`Équipement trouvé: ${data.name || data.id}`);
        navigate(`/equipment/${data.id}`);
        return;
      }
    } catch {
      // not JSON, try as URL
    }
    // try to extract equipment ID from URL pattern
    const match = decodedText.match(/\/equipment\/([a-f0-9-]+)/i);
    if (match) {
      stopScanner();
      navigate(`/equipment/${match[1]}`);
      return;
    }
    toast.error("QR code non reconnu");
  };

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanResult,
        () => {} // ignore errors during scanning
      );
      setScanning(true);
      setCameraError(false);
    } catch {
      setCameraError(true);
      setShowManual(true);
      toast.error("Impossible d'accéder à la caméra");
    }
  };

  const stopScanner = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    setScanning(false);
  };

  const handleManualSearch = () => {
    const trimmed = manualId.trim();
    if (!trimmed) return;
    // UUID pattern
    if (/^[a-f0-9-]{36}$/i.test(trimmed)) {
      navigate(`/equipment/${trimmed}`);
      return;
    }
    // Item number — redirect to equipment list with search
    navigate(`/equipment?search=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <DashboardLayout
      title="Scanner QR Code"
      breadcrumb={[{ label: "Scanner" }]}
    >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Camera scanner */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Scanner avec la caméra
              </h3>
              {!scanning ? (
                <Button size="sm" onClick={startScanner} disabled={cameraError}>
                  Démarrer
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={stopScanner}>
                  Arrêter
                </Button>
              )}
            </div>

            {/* Scanner viewport */}
            <div className="relative rounded-lg overflow-hidden bg-black aspect-square max-h-[350px]">
              <div id="qr-reader" className="w-full h-full" />
              {!scanning && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                  <p className="text-sm text-muted-foreground">
                    Appuyez sur « Démarrer » pour activer la caméra
                  </p>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80">
                  <CameraOff className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Caméra indisponible. Utilisez la saisie manuelle.
                  </p>
                </div>
              )}
              {/* Viewfinder overlay */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[250px] h-[250px] border-2 border-primary/50 rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual input */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <button
              onClick={() => setShowManual(!showManual)}
              className="flex items-center gap-2 text-sm font-semibold w-full text-left"
            >
              <Keyboard className="h-4 w-4" />
              Saisie manuelle
            </button>
            {showManual && (
              <div className="flex gap-2">
                <Input
                  placeholder="ID ou numéro d'équipement"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                />
                <Button onClick={handleManualSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QRScannerPage;
