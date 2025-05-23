import { computed } from "vue";
import { Module } from "vuex";
import store, { actionWrapper, GlobalDataProps } from "./index";
import { RespData, RespListData } from "./respTypes";

type editRandom = Pick<
  Required<TemplateProps>,
  "materialId" | "randomIndex" | "randomTitleFamily" | "randomSubTitleFamily"
>;
type templateProp = Partial<TemplateProps>;

export interface TemplateProps {
  materialId: number;
  fileName: string;
  materialName: string;
  materialPath: string;
  name: string;
  name_en: string;
  rgb: string;
  svg: string;
  randomIndex: number;
  randomTitleFamily?: string;
  randomSubTitleFamily?: string;
  len: number;
  design: string; // 设计理念
  main_color: string; // 主色调
  bg_color: string; // 背景色
  font_l: string; // 横版字体
  font_v: string; // 竖版字体
}

export interface TemplatesProps {
  data: TemplateProps[];
  cp: string | undefined;
  title: string | undefined;
  totalTemplates?: number;
  currentNameEn?: string;
  tips: string | undefined;
  free_statement: string | undefined;
  alert_msg: string | undefined;
}

const stateStroage = sessionStorage.getItem("state");
let sData = [];
if (stateStroage != null) {
  sData = JSON.parse(stateStroage).templates.data;
}
const templates: Module<TemplatesProps, GlobalDataProps> = {
  state: {
    data: sData,
    cp: "",
    totalTemplates: 0,
    title: "",
    tips: "",
    free_statement: "",
    alert_msg: "",
  },
  mutations: {
    fetchTemplates(state, rawData: RespListData<TemplateProps[]>) {
      //处理返回数据，确保materialId唯一, 0结尾代表左右布局，1结尾代表上下布局，需要区分开
      rawData.data.forEach((item, index) => {
        rawData.data[index].materialId = parseInt(
          item.materialId.toString() + item.randomIndex.toString()
        );
      });
      state.data = rawData.data;
      state.cp = rawData.attr?.complain;
      state.title = rawData.attr?.title;
      state.tips = rawData.attr?.tips;
      state.free_statement = rawData.attr?.free_statement;
      state.alert_msg = rawData.attr?.alert_msg;
      sessionStorage.setItem("wx", rawData.attr ? rawData.attr.wx : "");
      sessionStorage.setItem("is_pay", rawData.attr ? rawData.attr.is_pay : "");
      sessionStorage.setItem("pay_price", rawData.attr ? rawData.attr.pay_price : "");
      sessionStorage.setItem("alert_msg", rawData.attr ? rawData.attr.alert_msg : "");
      store.dispatch("setWatermarkFromResponse", rawData);
      sessionStorage.setItem("watermark", rawData.attr ? rawData.attr.watermark : "");
    },
    translate(state, rawData: RespData<string>) {
      state.currentNameEn = rawData.data;
    },
    setRandomProps(state, random: editRandom) {
      const {
        materialId,
        randomIndex,
        randomTitleFamily,
        randomSubTitleFamily,
      } = random;
      const currentTemplate = computed<TemplateProps>(() =>
        store.getters.getTemplateById(materialId)
      );
      currentTemplate.value.randomIndex = randomIndex;
      currentTemplate.value.randomTitleFamily = randomTitleFamily;
      currentTemplate.value.randomSubTitleFamily = randomSubTitleFamily;
    },
    setCurrentTemplateProp(state, prop: templateProp) {
      if (prop.materialId) {
        const currentTemplate = computed<TemplateProps>(() =>
          store.getters.getTemplateById(prop.materialId)
        );
        if (prop.name) {
          currentTemplate.value.name = prop.name;
        }
        if (prop.name_en) {
          currentTemplate.value.name_en = prop.name_en;
        }
      }
    },
  },
  actions: {
    fetchTemplates: actionWrapper("/match", "fetchTemplates", {
      method: "post",
    }),
    translate: actionWrapper("/translate", "translate", { method: "post" }),
  },
  getters: {
    getTemplateById: (state) => (id: number) =>
      state.data.find((t) => t.materialId === id),
    getCurrentNameEn: (state) => state.currentNameEn,
  },
};

export default templates;
