/**
 * Return the file extension from a file name
 * @param name - The file name
 * @returns The file extension or an empty string if no extension exists
 */
export function getExtensionFromFileName(name: string): string {
  if (typeof name !== "string" || !name.trim()) {
    return "";
  }

  const trimmedName = name.trim();
  const match = trimmedName.match(/\.([^.]+)$/);

  // Return the matched extension (group 1) or an empty string
  return match ? match[1] : "";
}

/**
 * Read a blob file and return a base64 string
 */
export const blobToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
  });
};

/**
 * Convert a base64 string to a Blob
 */
export const base64ToBlob = (
  base64: string,
  fallbackMimeType: string = "application/octet-stream"
): Blob => {
  /**
   * data:image/png;base64,iVBORw0K...
   */
  const matched = base64.match(/^data:(.+?);base64,(.+)$/);

  const mimeType = matched?.[1] || fallbackMimeType;
  const base64Data = matched?.[2] || base64;

  // Decode base64 data to binary
  const binary = atob(base64Data);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new Blob([bytes], { type: mimeType });
};
