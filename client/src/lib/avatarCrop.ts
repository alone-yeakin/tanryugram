export const AVATAR_CROP_VIEWPORT = 280;
export const AVATAR_OUTPUT_SIZE = 512;
export type CropOffset = { x: number; y: number };

export function clampCropOffset(value: number, zoom: number) {
  const maxOffset = 140 + Math.max(0, zoom - 1) * 140;
  return Math.max(-maxOffset, Math.min(maxOffset, value));
}

export function cropAvatarImage(source: string, zoom: number, offset: CropOffset): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_OUTPUT_SIZE;
      canvas.height = AVATAR_OUTPUT_SIZE;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Your browser does not support image cropping"));
      const baseScale = Math.max(AVATAR_CROP_VIEWPORT / image.naturalWidth, AVATAR_CROP_VIEWPORT / image.naturalHeight);
      const drawWidth = image.naturalWidth * baseScale * zoom;
      const drawHeight = image.naturalHeight * baseScale * zoom;
      const scale = AVATAR_OUTPUT_SIZE / AVATAR_CROP_VIEWPORT;
      context.clearRect(0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
      context.drawImage(image, ((AVATAR_CROP_VIEWPORT - drawWidth) / 2 + offset.x) * scale, ((AVATAR_CROP_VIEWPORT - drawHeight) / 2 + offset.y) * scale, drawWidth * scale, drawHeight * scale);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create the cropped image")), "image/jpeg", 0.9);
    };
    image.onerror = () => reject(new Error("Could not read the selected image"));
    image.src = source;
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not prepare the cropped image"));
    reader.readAsDataURL(blob);
  });
}
