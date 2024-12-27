interface SelectFilesConfig {
  multiple?: boolean;
  accept?: string;
  capture?: string; // Optional: for capturing media directly
}

/**
 * Promisified file selector utility function.
 */
export const selectFiles = (
  config: SelectFilesConfig = {}
): Promise<FileList> => {
  return new Promise<FileList>((resolve, reject) => {
    const inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.style.display = "none";

    if (config.multiple) {
      inputElement.multiple = true;
    }
    if (config.accept) {
      inputElement.accept = config.accept;
    }
    if (config.capture) {
      inputElement.capture = config.capture;
    }

    document.body.appendChild(inputElement);

    // Define cleanup function
    const cleanup = () => {
      inputElement.removeEventListener("change", onChange);
      document.body.removeChild(inputElement);
    };

    // Handle file selection
    const onChange = (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      files ? resolve(files) : reject(new Error("No files selected"));
      cleanup();
    };

    inputElement.addEventListener("change", onChange);

    inputElement.click();
  });
};

/**
 * Return the file extension from a file name
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
