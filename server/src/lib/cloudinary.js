import { v2 as cloudinary } from "cloudinary";

// The SDK auto-configures itself from a CLOUDINARY_URL env var
// (cloudinary://<api_key>:<api_secret>@<cloud_name>, copied straight from
// the Cloudinary dashboard) if one is set. Falls back to the three discrete
// vars otherwise, for anyone who'd rather set them separately.
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export { cloudinary };
