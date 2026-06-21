import type { AA01Form } from "../types";
import type {
  CaseProfile,
  FamilyProfile,
  EconomicProfile,
  SocialSupportProfile,
  EnvironmentProfile,
} from "../types/caseProfile";
import { StepSection } from "./common/StepSection";

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">請選擇</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RadioField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="form-field">
      <span className="form-label">{label}</span>
      <div className="form-actions" style={{ marginTop: 0 }}>
        {options.map((option) => (
          <label key={option} className="inline-field">
            <input
              type="radio"
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function CheckboxGroup({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (option: string) => {
    onChange(
      values.includes(option)
        ? values.filter((value) => value !== option)
        : [...values, option]
    );
  };
  return (
    <div className="form-field">
      <span className="form-label">{label}</span>
      <div className="form-actions" style={{ marginTop: 0 }}>
        {options.map((option) => (
          <label key={option} className="inline-field">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => toggle(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

const MARITAL = ["未婚", "已婚", "離婚", "喪偶", "其他"];
const CHILDREN = ["0", "1", "2", "3", "4", "5 以上"];
const CO_RESIDENTS = ["配偶", "子女", "媳婿", "孫子女", "父母", "兄弟姊妹", "看護", "獨居", "其他"];
const CAREGIVERS = ["配偶", "子女", "媳婿", "外籍看護", "本國看護", "鄰里", "無", "其他"];
const BURDEN = ["輕度", "中度", "重度", "無法評估"];

const WELFARE = ["一般戶", "中低收入戶", "低收入戶", "榮民", "其他"];
const INCOME = ["退休金", "子女供給", "政府補助", "老人年金", "身障津貼", "工作收入", "其他"];
const ALLOWANCE = ["中低收老人生活津貼", "身心障礙者生活補助", "長照補助", "其他"];

const SUPPORT_LEVEL = ["良好", "普通", "薄弱", "無"];
const YES_NO = ["有", "無"];

const HOUSING = ["自宅", "租屋", "子女家", "機構", "其他"];
const FLOOR = ["1 樓", "2 樓", "3 樓", "4 樓以上"];
const DEVICES = ["輪椅", "助行器", "拐杖", "電動床", "氣墊床", "移位機", "無", "其他"];
const ENV_RISK = ["地面濕滑", "光線不足", "走道狹窄", "門檻或高低差", "樓梯", "無"];

export function Step4CaseProfile({
  form,
  setForm,
}: {
  form: AA01Form;
  setForm: (form: AA01Form) => void;
}) {
  const profile: CaseProfile = form.caseProfile ?? {};

  const update = (patch: Partial<CaseProfile>) =>
    setForm({ ...form, caseProfile: { ...profile, ...patch } });
  const setFamily = (patch: Partial<FamilyProfile>) =>
    update({ family: { ...profile.family, ...patch } });
  const setEconomic = (patch: Partial<EconomicProfile>) =>
    update({ economic: { ...profile.economic, ...patch } });
  const setSocial = (patch: Partial<SocialSupportProfile>) =>
    update({ socialSupport: { ...profile.socialSupport, ...patch } });
  const setEnvironment = (patch: Partial<EnvironmentProfile>) =>
    update({ environment: { ...profile.environment, ...patch } });

  const family = profile.family ?? {};
  const economic = profile.economic ?? {};
  const social = profile.socialSupport ?? {};
  const environment = profile.environment ?? {};

  return (
    <StepSection title="個案概況">
      <p className="form-help">
        以下對應 AA01 第一段（二）家庭功能、（三）經濟、（四）社會支持、（五）輔具及居家環境概況。
        請以選單與勾選為主，未填欄位於 AA01 顯示「待補充」。
      </p>

      <div className="field-list">
        <div className="field-group">
          <h3 className="field-group__title">（二）家庭功能概況</h3>
          <div className="form-grid">
            <SelectField label="婚姻狀況" value={family.maritalStatus ?? ""} options={MARITAL} onChange={(v) => setFamily({ maritalStatus: v })} />
            <SelectField label="子女數" value={family.childrenCount ?? ""} options={CHILDREN} onChange={(v) => setFamily({ childrenCount: v })} />
            <SelectField label="主要照顧者" value={family.primaryCaregiver ?? ""} options={CAREGIVERS} onChange={(v) => setFamily({ primaryCaregiver: v })} />
            <SelectField label="次要照顧者" value={family.secondaryCaregiver ?? ""} options={CAREGIVERS} onChange={(v) => setFamily({ secondaryCaregiver: v })} />
          </div>
          <CheckboxGroup label="同住者" values={family.coResidents ?? []} options={CO_RESIDENTS} onChange={(v) => setFamily({ coResidents: v })} />
          <RadioField label="照顧者負荷" value={family.caregiverBurden ?? ""} options={BURDEN} onChange={(v) => setFamily({ caregiverBurden: v })} />
        </div>

        <div className="field-group">
          <h3 className="field-group__title">（三）經濟概況</h3>
          <div className="form-grid">
            <SelectField label="福利身份別" value={economic.welfareCategory ?? ""} options={WELFARE} onChange={(v) => setEconomic({ welfareCategory: v })} />
          </div>
          <CheckboxGroup label="收入來源" values={economic.incomeSource ?? []} options={INCOME} onChange={(v) => setEconomic({ incomeSource: v })} />
          <CheckboxGroup label="補助／津貼" values={economic.allowance ?? []} options={ALLOWANCE} onChange={(v) => setEconomic({ allowance: v })} />
        </div>

        <div className="field-group">
          <h3 className="field-group__title">（四）社會支持概況</h3>
          <div className="form-grid">
            <RadioField label="親屬支持" value={social.relativesSupport ?? ""} options={SUPPORT_LEVEL} onChange={(v) => setSocial({ relativesSupport: v })} />
            <RadioField label="社區支持" value={social.communitySupport ?? ""} options={SUPPORT_LEVEL} onChange={(v) => setSocial({ communitySupport: v })} />
            <RadioField label="基金會或機構支持" value={social.foundationSupport ?? ""} options={YES_NO} onChange={(v) => setSocial({ foundationSupport: v })} />
          </div>
          <label className="form-field">
            <span className="form-label">其他支持（可填寫）</span>
            <input className="form-input" value={social.otherSupport ?? ""} onChange={(e) => setSocial({ otherSupport: e.target.value })} />
          </label>
        </div>

        <div className="field-group">
          <h3 className="field-group__title">（五）輔具及居家環境概況</h3>
          <div className="form-grid">
            <SelectField label="居住型態" value={environment.housingType ?? ""} options={HOUSING} onChange={(v) => setEnvironment({ housingType: v })} />
            <SelectField label="樓層" value={environment.floor ?? ""} options={FLOOR} onChange={(v) => setEnvironment({ floor: v })} />
            <RadioField label="電梯" value={environment.elevator ?? ""} options={YES_NO} onChange={(v) => setEnvironment({ elevator: v })} />
            <RadioField label="浴室扶手" value={environment.bathroomGrabBar ?? ""} options={YES_NO} onChange={(v) => setEnvironment({ bathroomGrabBar: v })} />
            <RadioField label="地面防滑" value={environment.antiSlip ?? ""} options={YES_NO} onChange={(v) => setEnvironment({ antiSlip: v })} />
          </div>
          <CheckboxGroup label="現有輔具" values={environment.assistiveDevices ?? []} options={DEVICES} onChange={(v) => setEnvironment({ assistiveDevices: v })} />
          <CheckboxGroup label="環境風險" values={environment.environmentRisk ?? []} options={ENV_RISK} onChange={(v) => setEnvironment({ environmentRisk: v })} />
        </div>
      </div>
    </StepSection>
  );
}
