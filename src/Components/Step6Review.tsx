import type { AA01Form } from "../types";
import { buildServiceValidationWarnings } from "../rules/serviceValidation";

export function Step6Review({ form }: { form: AA01Form }) {
  const warnings = buildServiceValidationWarnings(form);

  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">六、檢核提醒</h2>

      {warnings.length === 0 ? (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          目前未偵測到明顯缺漏。
        </div>
      ) : (
        <div className="space-y-3">
          {warnings.map((warning) => (
            <div key={warning} className="rounded-lg bg-amber-50 p-4 text-amber-900">
              {warning}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}