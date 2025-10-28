import { bucket } from "../firebase";
// Install with yarn:
// yarn add uuid
// yarn add -D @types/uuid
import { v4 as uuidv4 } from "uuid";

export async function uploadProductImage(file: Express.Multer.File) {
  const filename = `products/${uuidv4()}_${file.originalname}`;
  const fileUpload = bucket.file(filename);

  await fileUpload.save(file.buffer, {
    metadata: { contentType: file.mimetype },
    public: true,
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;
}
