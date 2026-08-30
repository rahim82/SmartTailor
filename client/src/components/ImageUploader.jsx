import { useRef, useState } from "react";
import { Upload, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api.js";
import { compressImage } from "../lib/imageCompress.js";

export default function ImageUploader({
  label = "Upload Image",
  value = null, // { url: string, publicId: string } or url string
  onChange,
  context = null, // e.g. { targetType: "tailorShopImage" }
  aspectHint = "PNG, JPG, WebP up to 5MB"
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Normalize image data
  const currentImage = typeof value === "string" 
    ? { url: value, publicId: null } 
    : value;

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const oldPublicId = currentImage?.publicId;

    try {
      // 1. Compress image before uploading
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressed);

      // 2. Upload new image to Cloudinary
      const { data } = await api.post("/uploads/images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const newImage = data.image; // { url, publicId }
      onChange?.(newImage);

      // 3. If replacing an existing image, delete the old one from Cloudinary & DB
      if (oldPublicId && oldPublicId !== newImage.publicId) {
        api.post("/uploads/images/delete", {
          publicId: oldPublicId,
          context
        }).catch((delErr) => {
          console.warn("Background deletion of replaced image:", delErr);
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveImage() {
    if (!currentImage?.url) return;

    setError("");
    setDeleting(true);

    try {
      // Delete from Cloudinary & Database
      if (currentImage.publicId) {
        await api.post("/uploads/images/delete", {
          publicId: currentImage.publicId,
          url: currentImage.url,
          context
        });
      }

      onChange?.(null);
    } catch (err) {
      console.warn("Image delete warning:", err);
      // Still allow removing from UI if cloud delete had an issue
      onChange?.(null);
    } finally {
      setDeleting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-ink/75">{label}</label>}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {currentImage?.url ? (
        /* Image Preview with Replace & Remove Controls */
        <div className="relative flex items-center justify-between gap-3.5 rounded-xl border border-black/10 bg-white/90 p-3 shadow-xs transition hover:border-black/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/5">
              <img
                src={currentImage.url}
                alt="Upload preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-bold text-ink truncate">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                Image Uploaded
              </p>
              <p className="text-[11px] text-ink/50 truncate">Saved in Cloud Storage</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              disabled={uploading || deleting}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-black/5 active:scale-95 transition disabled:opacity-50"
              title="Replace with new image"
            >
              <RefreshCw size={12} className={uploading ? "animate-spin" : ""} />
              <span>{uploading ? "Uploading..." : "Replace"}</span>
            </button>

            <button
              type="button"
              disabled={uploading || deleting}
              onClick={handleRemoveImage}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 active:scale-95 transition disabled:opacity-50"
              title="Remove from Cloudinary and Database"
            >
              <Trash2 size={12} />
              <span>{deleting ? "Deleting..." : "Remove"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone / Select Image */
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-black/20 bg-black/[0.015] px-4 py-4 text-center hover:border-stitch hover:bg-stitch/[0.03] transition-all duration-200 disabled:opacity-50"
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-stitch/10 text-stitch group-hover:scale-105 transition-transform duration-200">
            {uploading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
          </div>
          <p className="mt-2 text-xs font-semibold text-ink">
            {uploading ? "Uploading to Cloudinary..." : "Click to upload or drag & drop"}
          </p>
          <p className="text-[11px] text-ink/45 mt-0.5">{aspectHint}</p>
        </button>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}