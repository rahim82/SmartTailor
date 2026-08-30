import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret
});

export function uploadBuffer(buffer, folder) {
  // If credentials are empty, fallback to Base64 Data URL for local testing convenience
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;
    return Promise.resolve({
      secure_url: dataUrl,
      public_id: "mock_local_upload_" + Date.now()
    });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        console.warn("Cloudinary upload failed! Error details:", error.message || error);
        if (env.nodeEnv === "development") {
          console.warn("Falling back to local Base64 Data URL because we are in development mode.");
          const base64 = buffer.toString("base64");
          const dataUrl = `data:image/png;base64,${base64}`;
          resolve({
            secure_url: dataUrl,
            public_id: "mock_local_upload_" + Date.now()
          });
        } else {
          reject(error);
        }
      } else {
        resolve(result);
      }
    });

    stream.end(buffer);
  });
}

export function deleteImage(publicId) {
  if (!publicId || typeof publicId !== "string" || publicId.startsWith("mock_local_upload_")) {
    return Promise.resolve({ result: "ok" });
  }

  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return Promise.resolve({ result: "ok" });
  }

  return new Promise((resolve) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.warn("Cloudinary delete error:", error.message || error);
        resolve({ result: "error", error: error.message });
      } else {
        resolve(result);
      }
    });
  });
}

