import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  file: string | Buffer,
  folder: string = "shraddha-garments/fabrics",
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof file === "string") {
      // If it's a file path
      cloudinary.uploader
        .upload(file, { folder, resource_type: "auto" })
        .then((result) => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
          resolve(result.secure_url);
        })
        .catch((error) => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
          reject(error);
        });
    } else {
      // If it's a Buffer (optimized for Vercel)
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" },
        (error, result) => {
          if (error) return reject(error);
          if (result) resolve(result.secure_url);
        },
      );
      uploadStream.end(file);
    }
  });
};

export default cloudinary;
