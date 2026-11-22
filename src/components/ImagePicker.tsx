import { useEffect, useState } from "react";
import { useApp } from "../state";

export const MAX_IMAGES = 6;

export interface Picked { file: File; url: string; }

/** Choose, drop or paste photos. Photos stay in memory only and are never saved. */
export function ImagePicker({ images, onChange, id }: { images: Picked[]; onChange: (next: Picked[]) => void; id: string }) {
  const { t } = useApp();
  const [over, setOver] = useState(false);

  const add = (files: FileList | File[]) => {
    const next = [...images];
    for (const f of Array.from(files)) {
      if (f.type.startsWith("image/") && next.length < MAX_IMAGES) next.push({ file: f, url: URL.createObjectURL(f) });
    }
    onChange(next);
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length && document.getElementById(id)?.offsetParent !== null) add(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

  return (
    <div className="cs-stack" id={id}>
      <div
        className={"drop" + (over ? " over" : "")}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
      >
        <p>
          {t("dropHere")}{" "}
          <label className="linklike">
            {t("chooseFiles")}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
          </label>
        </p>
        <p className="cs-hint">{t("upTo", { n: MAX_IMAGES })}</p>
      </div>
      {images.length > 0 && (
        <div className="thumbs">
          {images.map((img, i) => (
            <figure key={img.url}>
              <img src={img.url} alt={`${i + 1}`} />
              <button type="button" aria-label={t("remove")} onClick={() => { URL.revokeObjectURL(img.url); onChange(images.filter((x) => x !== img)); }}>×</button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

export function clearPicked(images: Picked[]): void {
  for (const i of images) URL.revokeObjectURL(i.url);
}
