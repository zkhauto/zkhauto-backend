import multer from "multer";
import crypto from "crypto";
import fetch from "node-fetch";
import { Storage } from "@google-cloud/storage";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const gcs = new Storage();
const bucketName = "zkhauto-img";

const uploadImageToGCS = async (file) => {
  console.log("uploadImageToGCS: Starting upload for file:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    bufferLength: file.buffer ? file.buffer.length : "no buffer",
  });

  // Generate a hash of the file buffer
  const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
  const fileName = `${hash}-${file.originalname}`;
  console.log("uploadImageToGCS: Generated filename:", fileName);

  try {
    // Check if the file already exists in the bucket
    console.log("Checking if file exists in bucket...");
    const [fileExists] = await gcs.bucket(bucketName).file(fileName).exists();
    if (fileExists) {
      console.log("uploadImageToGCS: File already exists in bucket.");
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      return publicUrl;
    }
  } catch (error) {
    console.error("Error checking file existence:", error);
    throw error;
  }

  // Build the multipart/related payload
  const boundary = "BOUNDARY_STRING";
  const delimiter = `--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  const metadata = JSON.stringify({ name: fileName });
  // Metadata part (as JSON)
  const metaPart =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    metadata +
    "\r\n";
  // File part header
  const filePartHeader = delimiter + `Content-Type: ${file.mimetype}\r\n\r\n`;

  const multipartBody = Buffer.concat([
    Buffer.from(metaPart, "utf-8"),
    Buffer.from(filePartHeader, "utf-8"),
    file.buffer,
    Buffer.from(closeDelimiter, "utf-8"),
  ]);

  console.log(
    "uploadImageToGCS: Multipart body constructed, length:",
    multipartBody.length
  );

  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=multipart`;
  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log("uploadImageToGCS: GCS upload response:", responseData);
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log("uploadImageToGCS: Resolved public URL:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("uploadImageToGCS: Error during fetch upload:", error);
    throw error;
  }
};

export { upload, uploadImageToGCS };
