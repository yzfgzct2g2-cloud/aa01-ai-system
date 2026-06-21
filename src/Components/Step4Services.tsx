import type { AA01Form, PlannedService } from "../types";
import {
  EQUIPMENT_SERVICE_GROUPS,
  GENERAL_SERVICE_GROUPS,
  SERVICE_CATALOG,
  filterEquipmentItems,
  type ServiceGroupKey,
} from "../data/serviceCatalog";
import { StepSection } from "./common/StepSection";
import { Button } from "./common/Button";

function createEmptyService(): PlannedService {
  return {
    id: crypto.randomUUID(),
    serviceKind: "一般服務",
    group: "B",
    code: "",
    name: "",
    unit: "",
    quantity: "",
    frequency: "",
    providerName: "",
    providerStatus: "",
    equipmentUseType: "購置",
    purchaseType: "",
  };
}

function normalizeService(service: PlannedService): PlannedService {
  const item = SERVICE_CATALOG[service.group]?.items.find((x) => x.code === service.code);

  return {
    ...service,
    name: item?.name || "",
    unit: item?.unit || "",
    purchaseType: item?.purchaseType || "",
  };
}

export function Step4Services({
  form,
  setForm,
}: {
  form: AA01Form;
  setForm: (form: AA01Form) => void;
}) {
  const services = form.services?.length ? form.services : [createEmptyService()];

  const updateServices = (next: PlannedService[]) => {
    setForm({ ...form, services: next });
  };

  const updateOne = (id: string, patch: Partial<PlannedService>) => {
    updateServices(
      services.map((service) =>
        service.id === id ? normalizeService({ ...service, ...patch }) : service
      )
    );
  };

  return (
    <StepSection title="四、服務規劃">
      <div className="field-list">
        {services.map((service, index) => {
          const groups =
            service.serviceKind === "一般服務"
              ? GENERAL_SERVICE_GROUPS
              : EQUIPMENT_SERVICE_GROUPS;

          const group = groups.includes(service.group)
            ? service.group
            : service.serviceKind === "一般服務"
              ? "B"
              : "E";

          const rawItems = SERVICE_CATALOG[group].items;
          const items =
            service.serviceKind === "輔具/無障礙"
              ? filterEquipmentItems(rawItems, service.equipmentUseType || "購置")
              : rawItems;

          return (
            <div key={service.id} className="field-group">
              <h3 className="field-group__title">服務項目 {index + 1}</h3>

              <div className="form-grid">
                <label className="form-field">
                  <span className="form-label">服務類型</span>
                  <select
                    className="form-select"
                    value={service.serviceKind}
                    onChange={(e) =>
                      updateOne(service.id, {
                        serviceKind: e.target.value as PlannedService["serviceKind"],
                        group: e.target.value === "一般服務" ? "B" : "E",
                        code: "",
                        name: "",
                        unit: "",
                      })
                    }
                  >
                    <option value="一般服務">一般服務</option>
                    <option value="輔具/無障礙">輔具/無障礙</option>
                  </select>
                </label>

                {service.serviceKind === "輔具/無障礙" && (
                  <label className="form-field">
                    <span className="form-label">使用方式</span>
                    <select
                      className="form-select"
                      value={service.equipmentUseType || "購置"}
                      onChange={(e) =>
                        updateOne(service.id, {
                          equipmentUseType: e.target.value as "購置" | "租賃" | "皆可",
                          code: "",
                          name: "",
                          unit: "",
                        })
                      }
                    >
                      <option value="購置">購置：限購置＋可租賃可購置</option>
                      <option value="租賃">租賃：限租賃＋可租賃可購置</option>
                      <option value="皆可">皆可：全部顯示</option>
                    </select>
                  </label>
                )}

                <label className="form-field">
                  <span className="form-label">服務大類</span>
                  <select
                    className="form-select"
                    value={group}
                    onChange={(e) =>
                      updateOne(service.id, {
                        group: e.target.value as ServiceGroupKey,
                        code: "",
                        name: "",
                        unit: "",
                      })
                    }
                  >
                    {groups.map((key) => (
                      <option key={key} value={key}>
                        {SERVICE_CATALOG[key].title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">服務碼別</span>
                  <select
                    className="form-select"
                    value={service.code}
                    onChange={(e) => updateOne(service.id, { code: e.target.value })}
                  >
                    <option value="">請選擇</option>
                    {items.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} {item.name}
                        {item.purchaseType ? `（${item.purchaseType}）` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">數量</span>
                  <input
                    className="form-input"
                    value={service.quantity}
                    onChange={(e) => updateOne(service.id, { quantity: e.target.value })}
                    placeholder="例如：40"
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">頻率/補充</span>
                  <input
                    className="form-input"
                    value={service.frequency}
                    onChange={(e) => updateOne(service.id, { frequency: e.target.value })}
                    placeholder="例如：每週2次，每次4組"
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">服務單位</span>
                  <input
                    className="form-input"
                    value={service.providerName}
                    onChange={(e) => updateOne(service.id, { providerName: e.target.value })}
                    placeholder="例如：宜蘭縣私立..."
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">單位狀態</span>
                  <select
                    className="form-select"
                    value={service.providerStatus}
                    onChange={(e) =>
                      updateOne(service.id, {
                        providerStatus: e.target.value as PlannedService["providerStatus"],
                      })
                    }
                  >
                    <option value="">請選擇</option>
                    <option value="舊案原派">舊案原派</option>
                    <option value="案家指定">案家指定</option>
                    <option value="待媒合">待媒合</option>
                    <option value="新派案">新派案</option>
                  </select>
                </label>
              </div>

              <div className="field-meta">
                已選：{service.code || "未選擇"} {service.name}
                {service.unit ? `｜單位：${service.unit}` : ""}
                {service.purchaseType ? `｜${service.purchaseType}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="form-actions">
        <Button
          variant="primary"
          onClick={() => updateServices([...services, createEmptyService()])}
        >
          ＋新增服務
        </Button>

        <Button
          disabled={services.length <= 1}
          onClick={() => updateServices(services.slice(0, -1))}
        >
          －移除最後一筆
        </Button>
      </div>
    </StepSection>
  );
}