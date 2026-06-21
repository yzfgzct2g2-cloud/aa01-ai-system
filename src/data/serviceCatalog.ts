export type ServiceGroupKey = "B" | "C" | "D" | "E" | "F" | "G" | "SC" | "OT";

export type PurchaseType = "限購置" | "可租賃可購置" | "限租賃" | "";

export interface ServiceItem {
  code: string;
  name: string;
  /** template category used by the service goal library */
  category: string;
  unit: string;
  /** 給（支）付價格參考；輔具/無障礙為購置或租賃上限。實際依核定為準。 */
  price?: string;
  purchaseType?: PurchaseType;
}

export interface ServiceGroup {
  title: string;
  items: ServiceItem[];
}

// Service codes extracted from the official 修正長期照顧服務申請及給付辦法
// 附表四（照顧組合表）. C / SC / OT are not in that附表 and are retained from
// prior data — see knowledge/01-official/SERVICE_CATALOG_EXTRACTION_REPORT.md.
export const SERVICE_CATALOG: Record<ServiceGroupKey, ServiceGroup> = {
  B: {
    title: "B碼｜照顧及專業服務",
    items: [
      { code: "BA01", name: "基本身體清潔", category: "home-care", unit: "次", price: "260（原民/離島 310）" },
      { code: "BA02", name: "基本日常照顧", category: "home-care", unit: "次", price: "195（原民/離島 235）" },
      { code: "BA03", name: "測量生命徵象", category: "home-care", unit: "次", price: "35（原民/離島 40）" },
      { code: "BA04", name: "協助進食或管灌餵食", category: "home-care", unit: "次", price: "130（原民/離島 155）" },
      { code: "BA05", name: "餐食照顧", category: "home-care", unit: "次", price: "310（原民/離島 370）" },
      { code: "BA07", name: "協助沐浴及洗頭", category: "home-care", unit: "次", price: "325（原民/離島 385）" },
      { code: "BA08", name: "足部照護", category: "home-care", unit: "次" },
      { code: "BA09", name: "到宅沐浴車服務--第一型", category: "home-care", unit: "次", price: "2,200（原民/離島 2,640）" },
      { code: "BA09a", name: "到宅沐浴車服務--第二型", category: "home-care", unit: "次" },
      { code: "BA10", name: "翻身拍背", category: "home-care", unit: "次", price: "155（原民/離島 190）" },
      { code: "BA11", name: "肢體關節活動", category: "home-care", unit: "次", price: "195（原民/離島 235）" },
      { code: "BA12", name: "協助上（下）樓梯", category: "home-care", unit: "次", price: "130（原民/離島 155）" },
      { code: "BA13", name: "陪同外出", category: "home-care", unit: "次", price: "195（原民/離島 235）" },
      { code: "BA14", name: "陪同就醫", category: "home-care", unit: "次", price: "685（原民/離島 825）" },
      { code: "BA15", name: "家務協助", category: "home-care", unit: "次" },
      { code: "BA16", name: "代購或代領或代送服務", category: "home-care", unit: "次", price: "130（原民/離島 155）" },
      { code: "BA17a", name: "人工氣道管內（非氣管內管）分泌物抽吸", category: "home-care", unit: "次", price: "75（原民/離島 90）" },
      { code: "BA17b", name: "口腔內（懸壅垂之前）分泌物抽吸", category: "home-care", unit: "次", price: "65（原民/離島 80）" },
      { code: "BA17c", name: "尿管及鼻胃管之清潔與固定", category: "home-care", unit: "次" },
      { code: "BA17d1", name: "血糖機驗血糖", category: "home-care", unit: "次", price: "50（原民/離島 60）" },
      { code: "BA17d2", name: "甘油球通便", category: "home-care", unit: "次", price: "50（原民/離島 60）" },
      { code: "BA17e", name: "依指示置入藥盒", category: "home-care", unit: "次", price: "50（原民/離島 60）" },
      { code: "BA18", name: "安全看視", category: "home-care", unit: "次", price: "200（原民/離島 240）" },
      { code: "BA20", name: "陪伴服務", category: "home-care", unit: "次", price: "175（原民/離島 210）" },
      { code: "BA22", name: "巡視服務", category: "home-care", unit: "次", price: "130（原民/離島 160）" },
      { code: "BA23", name: "協助洗頭", category: "home-care", unit: "次", price: "200（原民/離島 240）" },
      { code: "BA24", name: "協助排泄", category: "home-care", unit: "次", price: "220（原民/離島 265）" },
      { code: "BB01", name: "日間照顧（全日）--第一型", category: "day-care", unit: "次", price: "675（原民/離島 810）" },
      { code: "BB02", name: "日間照顧（半日）--第一型", category: "day-care", unit: "次", price: "340（原民/離島 405）" },
      { code: "BB03", name: "日間照顧（全日）--第二型", category: "day-care", unit: "次", price: "840（原民/離島 1,005）" },
      { code: "BB04", name: "日間照顧（半日）--第二型", category: "day-care", unit: "次", price: "420（原民/離島 505）" },
      { code: "BB05", name: "日間照顧（全日）--第三型", category: "day-care", unit: "次", price: "920（原民/離島 1,105）" },
      { code: "BB06", name: "日間照顧（半日）--第三型", category: "day-care", unit: "次", price: "460（原民/離島 555）" },
      { code: "BB07", name: "日間照顧（全日）--第四型", category: "day-care", unit: "次", price: "1,045（原民/離島 1,255）" },
      { code: "BB08", name: "日間照顧（半日）--第四型", category: "day-care", unit: "次", price: "525（原民/離島 630）" },
      { code: "BB09", name: "日間照顧（全日）--第五型", category: "day-care", unit: "次", price: "1,130（原民/離島 1,355）" },
      { code: "BB10", name: "日間照顧（半日）--第五型", category: "day-care", unit: "次", price: "565（原民/離島 680）" },
      { code: "BB11", name: "日間照顧（全日）--第六型", category: "day-care", unit: "次", price: "1,210（原民/離島 1,450）" },
      { code: "BB12", name: "日間照顧（半日）--第六型", category: "day-care", unit: "次", price: "605（原民/離島 725）" },
      { code: "BB13", name: "日間照顧（全日）--第七型", category: "day-care", unit: "次", price: "1,285（原民/離島 1,540）" },
      { code: "BB14", name: "日間照顧（半日）--第七型", category: "day-care", unit: "次", price: "645（原民/離島 770）" },
      { code: "BC01", name: "家庭托顧（全日）--第一型", category: "day-care", unit: "次", price: "625（原民/離島 750）" },
      { code: "BC02", name: "家庭托顧（半日）--第一型", category: "day-care", unit: "次", price: "315（原民/離島 375）" },
      { code: "BC03", name: "家庭托顧（全日）--第二型", category: "day-care", unit: "次", price: "760（原民/離島 915）" },
      { code: "BC04", name: "家庭托顧（半日）--第二型", category: "day-care", unit: "次", price: "380（原民/離島 460）" },
      { code: "BC05", name: "家庭托顧（全日）--第三型", category: "day-care", unit: "次", price: "785（原民/離島 945）" },
      { code: "BC06", name: "家庭托顧（半日）--第三型", category: "day-care", unit: "次", price: "395（原民/離島 475）" },
      { code: "BC07", name: "家庭托顧（全日）--第四型", category: "day-care", unit: "次", price: "880（原民/離島 1,055）" },
      { code: "BC08", name: "家庭托顧（半日）--第四型", category: "day-care", unit: "次", price: "440（原民/離島 530）" },
      { code: "BC09", name: "家庭托顧（全日）--第五型", category: "day-care", unit: "次", price: "960（原民/離島 1,155）" },
      { code: "BC10", name: "家庭托顧（半日）--第五型", category: "day-care", unit: "次", price: "480（原民/離島 580）" },
      { code: "BC11", name: "家庭托顧（全日）--第六型", category: "day-care", unit: "次", price: "980（原民/離島 1,180）" },
      { code: "BC12", name: "家庭托顧（半日）--第六型", category: "day-care", unit: "次", price: "490（原民/離島 590）" },
      { code: "BC13", name: "家庭托顧（全日）--第七型", category: "day-care", unit: "次", price: "1,040（原民/離島 1,250）" },
      { code: "BC14", name: "家庭托顧（半日）--第七型", category: "day-care", unit: "次", price: "520（原民/離島 625）" },
      { code: "BD01", name: "社區式協助沐浴", category: "day-care", unit: "次", price: "200（原民/離島 240）" },
      { code: "BD02", name: "社區式晚餐", category: "day-care", unit: "次", price: "150（原民/離島 180）" },
      { code: "BD03", name: "社區式服務交通接送", category: "day-care", unit: "次", price: "6,000（原民/離島 7,200）" },
    ],
  },

  C: {
    title: "C碼｜專業服務",
    items: [
      { code: "CA07", name: "IADLs復能、ADLs復能照護", category: "professional", unit: "次" },
      { code: "CA08", name: "個別化服務計畫（ISP）擬定與執行", category: "professional", unit: "次" },
      { code: "CB01a", name: "營養照護", category: "professional", unit: "次" },
      { code: "CB02", name: "進食與吞嚥照護", category: "professional", unit: "次" },
      { code: "CB03", name: "困擾行為照護", category: "professional", unit: "次" },
      { code: "CB04", name: "臥床或長期活動受限照護", category: "professional", unit: "次" },
      { code: "CC01", name: "居家環境安全或無障礙空間規劃", category: "professional", unit: "次" },
      { code: "CD02", name: "居家護理指導與諮詢", category: "professional", unit: "次" },
    ],
  },

  D: {
    title: "D碼｜交通接送服務",
    items: [
      { code: "DA01", name: "交通接送", category: "transportation", unit: "趟" },
    ],
  },

  E: {
    title: "E碼｜輔具購買或租賃服務",
    items: [
      { code: "EA01", name: "馬桶增高器、便盆椅或沐浴椅", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 1,200" },
      { code: "EB01", name: "單支枴杖-不銹鋼製", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 1,000" },
      { code: "EB02", name: "單支枴杖-鋁製", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 500" },
      { code: "EB03", name: "助行器", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 800" },
      { code: "EB04", name: "帶輪型助步車（助行椅）", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 300／購置 3,000" },
      { code: "EC01", name: "輪椅-A款（非輕量化量產型）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 3,500" },
      { code: "EC02", name: "輪椅-B款（輕量化量產型）", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 450／購置 4,000" },
      { code: "EC03", name: "輪椅-C款（量身訂製型）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 9,000" },
      { code: "EC04", name: "輪椅附加功能-A款（具利於移位功能）", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 150／購置 5,000" },
      { code: "EC05", name: "輪椅附加功能-B款（具仰躺功能）", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 150／購置 2,000" },
      { code: "EC06", name: "輪椅附加功能-C款（具空中傾倒功能）", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 150／購置 4,000" },
      { code: "EC07", name: "擺位系統-A款（平面型輪椅背靠）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 1,000" },
      { code: "EC08", name: "擺位系統-B款（曲面適形輪椅背靠）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 6,000" },
      { code: "EC09", name: "擺位系統-C款（輪椅軀幹側支撐架）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 3,000" },
      { code: "EC10", name: "擺位系統-D款（輪椅頭靠系統）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 2,500" },
      { code: "EC11", name: "電動輪椅", category: "assistive-device", unit: "項", purchaseType: "限租賃", price: "租賃 2,500" },
      { code: "EC12", name: "電動代步車", category: "assistive-device", unit: "項", purchaseType: "限租賃", price: "租賃 1,200" },
      { code: "ED01", name: "移位腰帶", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 1,500" },
      { code: "ED02", name: "移位板", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 2,000" },
      { code: "ED03", name: "人力移位吊帶", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 4,000" },
      { code: "ED04", name: "移位滑墊-A款", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 3,000" },
      { code: "ED05", name: "移位滑墊-B款", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 8,000" },
      { code: "ED06", name: "移位轉盤", category: "assistive-device", unit: "項", purchaseType: "限購置" },
      { code: "ED07", name: "移位機", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 2,000／購置 40,000" },
      { code: "ED08", name: "移位機吊帶", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 500" },
      { code: "EG01", name: "氣墊床-A款", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 300／購置 8,000" },
      { code: "EG02", name: "氣墊床-B款", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置" },
      { code: "EG03", name: "輪椅座墊-A款（連通管型氣囊氣墊座-塑膠材質）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 5,000" },
      { code: "EG04", name: "輪椅座墊-B款（連通管型氣囊氣墊座-橡膠材質）", category: "assistive-device", unit: "項", purchaseType: "限購置" },
      { code: "EG05", name: "輪椅座墊-C款（液態凝膠座墊）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 10,000" },
      { code: "EG06", name: "輪椅座墊-D款（固態凝膠座墊）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 8,000" },
      { code: "EG07", name: "輪椅座墊-E款（填充式氣囊氣墊座）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 8,000" },
      { code: "EG08", name: "輪椅座墊-F款（交替充氣型座墊）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 5,000" },
      { code: "EG09", name: "輪椅座墊-G款（量製型座墊）", category: "assistive-device", unit: "項", purchaseType: "限購置", price: "購置 10,000" },
      { code: "EH01", name: "居家用照顧床", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 1,000／購置 8,000" },
      { code: "EH02", name: "居家用照顧床-附加功能A款（床面升降功能）", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 200／購置 5,000" },
      { code: "EH03", name: "居家用照顧床-附加功能B款（電動升降功能）", category: "assistive-device", unit: "項", purchaseType: "可租賃可購置", price: "租賃 500／購置 5,000" },
      { code: "EH04", name: "爬梯機（單趟）", category: "assistive-device", unit: "項", purchaseType: "限租賃", price: "租賃 700" },
      { code: "EH05", name: "爬梯機（月）", category: "assistive-device", unit: "項", purchaseType: "限租賃", price: "租賃 4,000" },
    ],
  },

  F: {
    title: "F碼｜居家無障礙環境改善服務",
    items: [
      { code: "FA08", name: "居家無障礙修繕-反光貼條或消光處理", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 3,000" },
      { code: "FA13", name: "居家無障礙修繕-水龍頭(單處)(新增、改換)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 3,000" },
      { code: "FA17", name: "居家無障礙修繕-壁掛式淋浴台(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 5,000" },
      { code: "FA18", name: "居家無障礙修繕-改善流理台(單處)（新增、改換）", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 15,000" },
      { code: "FA19", name: "居家無障礙修繕-改善抽油煙機(單處)（位置調整）", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 1,000" },
      { code: "FA22", name: "居家無障礙修繕-固定式扶手(每十公分)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 160" },
      { code: "FA23", name: "居家無障礙修繕-可動式扶手(單支)", category: "home-modification", unit: "項", purchaseType: "限購置" },
      { code: "FA24", name: "居家無障礙設備-床邊扶手(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 1,000" },
      { code: "FA25", name: "居家無障礙設備-門檻斜角(單側)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 1,000" },
      { code: "FA26", name: "居家無障礙設備-非固定式斜坡板A款", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 3,500" },
      { code: "FA27", name: "居家無障礙設備-非固定式斜坡板B款", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 5,000" },
      { code: "FA28", name: "居家無障礙設備-非固定式斜坡板C款", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 7,000" },
      { code: "FA29", name: "居家無障礙設備-非固定式斜坡板D款", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 10,000" },
      { code: "FA30", name: "居家無障礙修繕-改善高低差(高度十公分以下)(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 3,500" },
      { code: "FA31", name: "居家無障礙修繕-改善高低差(高度二十公分以下)(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 5,000" },
      { code: "FA32", name: "居家無障礙修繕-改善高低差(高度三十公分以下)(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 7,000" },
      { code: "FA33", name: "居家無障礙修繕-改善高低差(高度超過三十公分)(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 10,000" },
      { code: "FA34", name: "居家無障礙修繕-防滑地磚(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 6,000" },
      { code: "FA35", name: "居家無障礙設備-防滑措施", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 2,000" },
      { code: "FA36", name: "居家無障礙修繕-隔間(每平方公尺)(新增)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 800" },
      { code: "FA37", name: "居家無障礙修繕-門簡易型(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 7,000" },
      { code: "FA38", name: "居家無障礙修繕-門進階型(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 10,000" },
      { code: "FA39", name: "居家無障礙修繕-截水槽(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 6,000" },
      { code: "FA40", name: "居家無障礙修繕-改善浴缸(單處)（新增、改換、移除-含原處填補）", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 7,000" },
      { code: "FA41", name: "居家無障礙修繕-改善馬桶(單處)（新增、改換、移除-含原處填補）", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 5,000" },
      { code: "FA42", name: "居家無障礙修繕-馬桶背靠(單處)", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 2,000" },
      { code: "FA43", name: "居家無障礙設備-移動式身體清洗槽-局部型", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 2,000" },
      { code: "FA44", name: "居家無障礙設備-移動式身體清洗槽-全身型", category: "home-modification", unit: "項", purchaseType: "限購置", price: "購置 5,000" },
    ],
  },

  G: {
    title: "G碼｜喘息服務",
    items: [
      { code: "GA03", name: "日間照顧中心喘息服務--全日", category: "respite", unit: "次", price: "1,250（原民/離島 1,500）" },
      { code: "GA04", name: "日間照顧中心喘息服務--半日", category: "respite", unit: "次", price: "625（原民/離島 750）" },
      { code: "GA05", name: "機構住宿式喘息服務", category: "respite", unit: "天", price: "2,310（原民/離島 2,775）" },
      { code: "GA06", name: "小規模多機能服務-夜間喘息", category: "respite", unit: "次", price: "2,000（原民/離島 2,400）" },
      { code: "GA07", name: "巷弄長照站喘息服務", category: "respite", unit: "小時", price: "170（原民/離島 205）" },
      { code: "GA09", name: "居家喘息服務", category: "respite", unit: "次", price: "770（原民/離島 925）" },
    ],
  },

  SC: {
    title: "SC碼｜短照服務",
    items: [
      { code: "SC03", name: "日間照顧中心短照服務（全日）", category: "respite", unit: "次" },
      { code: "SC04", name: "日間照顧中心短照服務（半日）", category: "respite", unit: "次" },
      { code: "SC05", name: "機構住宿式短照服務", category: "respite", unit: "天" },
      { code: "SC06", name: "小規模多機能服務夜間短照", category: "respite", unit: "次" },
      { code: "SC07", name: "巷弄長照站短照服務", category: "respite", unit: "小時" },
      { code: "SC09", name: "居家短照服務", category: "respite", unit: "次" },
    ],
  },

  OT: {
    title: "OT碼｜宜蘭縣特有服務",
    items: [
      { code: "OT01", name: "營養餐飲服務", category: "meal", unit: "餐" },
    ],
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
