/**
 * Downloads an audio file via fetch + createObjectURL to handle cross-origin
 * Vercel Blob URLs where a direct <a download> would not work.
 */
export async function downloadAudio(audioUrl: string, filename: string): Promise<void> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // Revoke after a short delay to ensure the browser has initiated the download
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }
}
