const COPY_ERROR_MESSAGE = "無法複製內容，請手動選取並複製。";

function copyWithTextarea(text: string) {
  let documentApi: Document | undefined;
  try {
    documentApi = globalThis.document;
  } catch {
    documentApi = undefined;
  }

  if (!documentApi?.body || typeof documentApi.execCommand !== "function") {
    throw new Error(COPY_ERROR_MESSAGE);
  }

  const textarea = documentApi.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "-9999px",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
  });
  documentApi.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    if (!documentApi.execCommand("copy")) {
      throw new Error(COPY_ERROR_MESSAGE);
    }
  } catch {
    throw new Error(COPY_ERROR_MESSAGE);
  } finally {
    textarea.remove();
  }
}

export async function copyText(text: string): Promise<void> {
  let clipboard: Clipboard | undefined;
  try {
    clipboard = globalThis.navigator?.clipboard;
  } catch {
    clipboard = undefined;
  }

  if (typeof clipboard?.writeText === "function") {
    try {
      await clipboard.writeText(text);
      return;
    } catch {
      // Continue to the synchronous fallback for denied or unavailable access.
    }
  }

  copyWithTextarea(text);
}
