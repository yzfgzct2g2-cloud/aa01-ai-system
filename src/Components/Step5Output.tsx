import type { AA01Form } from "../types";
import { buildAA01Draft } from "../rules/aa01Generator";

export function Step5Output({ form }: { form: AA01Form }) {
  const draft = buildAA01Draft(form);

  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">五、AA01輸出</h2>

      <textarea className="w-full border p-3" rows={28} value={draft} readOnly />

      <button
        className="mt-4"
        onClick={() => navigator.clipboard.writeText(draft)}
      >
        複製AA01草稿
      </button>
    </section>
  );
}