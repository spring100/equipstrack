import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";
import { Camera, Upload, X, Star, Check, RefreshCw, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

interface PhotoItem {
  id: string;
  previewUrl: string;
  storagePath?: string;
  publicUrl?: string;
  status: "uploading" | "success" | "error" | "offline";
  file?: File;
}

interface CameraCaptureProps {
  equipmentId?: string;
  orgId?: string;
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
}

const isMobile = () => /iPhone|iPad|Android/i.test(navigator.userAgent);

const CameraCapture = ({ equipmentId, orgId, photos, onPhotosChange }: CameraCaptureProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const mobile = isMobile();

  // Sync offline photos when back online
  useEffect(() => {
    const handleOnline = () => {
      const offlinePhotos = photos.filter((p) => p.status === "offline" && p.file);
      offlinePhotos.forEach((p) => uploadPhoto(p));
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [photos]);

  const uploadPhoto = useCallback(
    async (photo: PhotoItem) => {
      if (!orgId || !photo.file) return;

      const eqId = equipmentId || "draft";
      const ext = "jpg";
      const path = `${orgId}/${eqId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      onPhotosChange(
        photos.map((p) => (p.id === photo.id ? { ...p, status: "uploading" as const } : p))
      );

      const { error } = await supabase.storage
        .from("equipment-photos")
        .upload(path, photo.file, { contentType: "image/jpeg", upsert: false });

      if (error) {
        onPhotosChange(
          photos.map((p) => (p.id === photo.id ? { ...p, status: "error" as const } : p))
        );
        toast.error("Échec de l'envoi de la photo");
        return;
      }

      const { data: urlData } = supabase.storage.from("equipment-photos").getPublicUrl(path);

      onPhotosChange(
        photos.map((p) =>
          p.id === photo.id
            ? { ...p, status: "success" as const, storagePath: path, publicUrl: urlData.publicUrl }
            : p
        )
      );
    },
    [orgId, equipmentId, photos, onPhotosChange]
  );

  const handleCapture = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset input to allow re-capture
      event.target.value = "";

      if (photos.length >= MAX_PHOTOS) {
        toast.error(`Maximum ${MAX_PHOTOS} photos atteint`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("Photo trop volumineuse (max 15 Mo)");
        return;
      }

      setCapturing(true);

      try {
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: 1200,
          maxSizeMB: 1.5,
          useWebWorker: true,
        });

        const previewUrl = URL.createObjectURL(compressed);
        const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        const newPhoto: PhotoItem = {
          id,
          previewUrl,
          status: navigator.onLine ? "uploading" : "offline",
          file: compressed,
        };

        const updated = [...photos, newPhoto];
        onPhotosChange(updated);

        if (navigator.onLine && orgId) {
          const eqId = equipmentId || "draft";
          const path = `${orgId}/${eqId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

          const { error } = await supabase.storage
            .from("equipment-photos")
            .upload(path, compressed, { contentType: "image/jpeg" });

          if (error) {
            onPhotosChange(
              updated.map((p) => (p.id === id ? { ...p, status: "error" as const } : p))
            );
            toast.error("Échec de l'envoi");
          } else {
            const { data: urlData } = supabase.storage.from("equipment-photos").getPublicUrl(path);
            onPhotosChange(
              updated.map((p) =>
                p.id === id
                  ? { ...p, status: "success" as const, storagePath: path, publicUrl: urlData.publicUrl }
                  : p
              )
            );
          }
        }
      } catch {
        toast.error("Erreur lors du traitement de la photo");
      } finally {
        setCapturing(false);
      }
    },
    [photos, onPhotosChange, orgId, equipmentId]
  );

  const removePhoto = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    if (photo?.storagePath) {
      supabase.storage.from("equipment-photos").remove([photo.storagePath]);
    }
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  const retryUpload = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo) uploadPhoto(photo);
  };

  const disableCapture = photos.length >= MAX_PHOTOS || capturing;

  return (
    <div className="space-y-4">
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />
      <input
        ref={desktopInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCapture}
      />

      {/* Capture buttons */}
      <div className="flex flex-col gap-3">
        {mobile ? (
          <Button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disableCapture}
            size="lg"
            className="w-full h-20 text-xl gap-3"
          >
            {capturing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Camera className={cn("w-8 h-8", !disableCapture && "animate-pulse")} />
            )}
            {capturing ? "Traitement…" : "Prendre une photo"}
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disableCapture}
              size="lg"
              className="flex-1 h-16 gap-2"
            >
              {capturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              {capturing ? "Traitement…" : "Prendre une photo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => desktopInputRef.current?.click()}
              disabled={disableCapture}
              size="lg"
              className="flex-1 h-16 gap-2"
            >
              <Upload className="w-5 h-5" />
              Importer depuis l'ordinateur
            </Button>
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          {photos.length} / {MAX_PHOTOS} photos
        </p>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-md overflow-hidden border border-border group cursor-pointer"
              onClick={() => setFullscreenPhoto(photo.previewUrl)}
            >
              <img
                src={photo.previewUrl}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Badge index */}
              <span className="absolute top-1 left-1 bg-background/80 text-foreground text-[10px] font-mono rounded px-1">
                {idx + 1}
              </span>

              {/* Primary badge */}
              {idx === 0 && (
                <span className="absolute top-1 right-6 bg-accent text-accent-foreground text-[10px] rounded px-1 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" /> Principale
                </span>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(photo.id);
                }}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Status overlay */}
              {photo.status === "uploading" && (
                <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-[10px] text-foreground mt-1">Envoi…</span>
                </div>
              )}
              {photo.status === "success" && (
                <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                  <Check className="w-3 h-3" />
                </div>
              )}
              {photo.status === "error" && (
                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      retryUpload(photo.id);
                    }}
                    className="bg-destructive text-destructive-foreground rounded-full p-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
              {photo.status === "offline" && (
                <div className="absolute bottom-1 left-1 bg-accent text-accent-foreground rounded text-[10px] px-1 flex items-center gap-0.5">
                  <WifiOff className="w-2.5 h-2.5" /> En attente
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen dialog */}
      <Dialog open={!!fullscreenPhoto} onOpenChange={() => setFullscreenPhoto(null)}>
        <DialogContent className="max-w-3xl p-2">
          {fullscreenPhoto && (
            <img src={fullscreenPhoto} alt="Photo plein écran" className="w-full h-auto rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CameraCapture;
export type { PhotoItem };
