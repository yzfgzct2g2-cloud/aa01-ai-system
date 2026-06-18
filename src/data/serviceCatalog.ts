export type ServiceGroupKey = "B" | "C" | "D" | "E" | "F" | "G" | "SC" | "OT";

export type PurchaseType = "限購置" | "可租賃可購置" | "限租賃" | "";

export interface ServiceItem {
  code: string;
  name: string;
  unit: string;
  purchaseType?: PurchaseType;
}

export interface ServiceGroup {
  title: string;
  items: ServiceItem[];
}

const s = (
  code: string,
  name: string,
  unit: string = "組",
  purchaseType: PurchaseType = ""
): ServiceItem => ({
  code,
  name,
  unit,
  purchaseType,
});

export const SERVICE_CATALOG: Record<ServiceGroupKey, ServiceGroup> = {
  B: {
    title: "B碼｜照顧及專業服務",
    items: [
      s("BA01", "基本身體清潔"),
      s("BA02", "基本日常照顧"),
      s("BA07", "協助沐浴及洗頭"),
      s("BA08", "足部照護"),
      s("BA09", "到宅沐浴車服務--第一型"),
      s("BA09a", "到宅沐浴車服務--第二型"),
      s("BA11", "肢體關節活動"),
      s("BA12", "協助上（下）樓梯"),
      s("BA13", "陪同外出"),
      s("BA14", "陪同就醫"),
      s("BA15-1", "家務協助（自用）"),
      s("BA15-2", "家務協助（共用）"),
      s("BA16-1", "代購或代領或代送服務（自用）"),
      s("BA16-2", "代購或代領或代送服務（共用）"),
      s("BA18", "安全看視"),
      s("BA20", "陪伴服務"),
      s("BB01", "日間照顧（全日）--第一型"),
      s("BB02", "日間照顧（半日）--第一型"),
      s("BC01", "家庭托顧（全日）--第一型"),
      s("BC02", "家庭托顧（半日）--第一型"),
      s("BD01", "社區式協助沐浴"),
      s("BD02", "社區式晚餐"),
    ],
  },

  C: {
    title: "C碼｜專業服務",
    items: [
      s("CA07", "IADLs復能、ADLs復能照護", "次"),
      s("CA08", "個別化服務計畫（ISP）擬定與執行", "次"),
      s("CB01a", "營養照護", "次"),
      s("CB02", "進食與吞嚥照護", "次"),
      s("CB03", "困擾行為照護", "次"),
      s("CB04", "臥床或長期活動受限照護", "次"),
      s("CC01", "居家環境安全或無障礙空間規劃", "次"),
      s("CD02", "居家護理指導與諮詢", "次"),
    ],
  },

  D: {
    title: "D碼｜交通接送服務",
    items: [s("DA01", "交通接送", "趟")],
  },

  E: {
    title: "E碼｜輔具購買或租賃服務",
    items: [
      s("EA01", "馬桶增高器、便盆椅或沐浴椅", "項", "限購置"),
      s("EB01", "單支枴杖-不銹鋼製", "項", "限購置"),
      s("EB03", "助行器", "項", "限購置"),
      s("EB04", "帶輪型助步車（助行椅）", "項", "可租賃可購置"),
      s("EC11", "電動輪椅", "項", "限租賃"),
      s("ED07", "移位機", "項", "可租賃可購置"),
      s("EG01", "氣墊床-A款", "項", "可租賃可購置"),
      s("EH01", "居家用照顧床", "項", "可租賃可購置"),
    ],
  },

  F: {
    title: "F碼｜居家無障礙環境改善服務",
    items: [
      s("FA22", "居家無障礙修繕固定式扶手（每十公分）", "項", "限購置"),
      s("FA23", "居家無障礙修繕可動式扶手（單支）", "項", "限購置"),
      s("FA25", "居家無障礙設備門檻斜角（單側）", "項", "限購置"),
      s("FA30", "居家無障礙修繕改善高低差（高度十公分以下）（單處）", "項", "限購置"),
      s("FA43", "居家無障礙設備移動式身體清洗槽-局部型", "項", "限購置"),
      s("FA44", "居家無障礙設備移動式身體清洗槽-全身型", "項", "限購置"),
    ],
  },

  G: {
    title: "G碼｜喘息服務",
    items: [
      s("GA03", "日間照顧中心喘息服務（全日）"),
      s("GA04", "日間照顧中心喘息服務（半日）"),
      s("GA05", "機構住宿式喘息服務", "天"),
      s("GA06", "小規模多機能服務夜間喘息"),
      s("GA07", "巷弄長照站喘息服務", "小時"),
      s("GA09", "居家喘息服務"),
    ],
  },

  SC: {
    title: "SC碼｜短照服務",
    items: [
      s("SC03", "日間照顧中心短照服務（全日）"),
      s("SC04", "日間照顧中心短照服務（半日）"),
      s("SC05", "機構住宿式短照服務", "天"),
      s("SC06", "小規模多機能服務夜間短照"),
      s("SC07", "巷弄長照站短照服務", "小時"),
      s("SC09", "居家短照服務"),
    ],
  },

  OT: {
    title: "OT碼｜宜蘭縣特有服務",
    items: [s("OT01", "營養餐飲服務", "餐")],
  },
};

export const GENERAL_SERVICE_GROUPS: ServiceGroupKey[] = ["B", "C", "D", "G", "SC", "OT"];
export const EQUIPMENT_SERVICE_GROUPS: ServiceGroupKey[] = ["E", "F"];

export function filterEquipmentItems(items: ServiceItem[], useType: "購置" | "租賃" | "皆可") {
  if (useType === "購置") {
    return items.filter(
      (item) => item.purchaseType === "限購置" || item.purchaseType === "可租賃可購置"
    );
  }

  if (useType === "租賃") {
    return items.filter(
      (item) => item.purchaseType === "限租賃" || item.purchaseType === "可租賃可購置"
    );
  }

  return items;
}