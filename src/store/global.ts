import { Module } from "vuex";
import { GlobalDataProps } from ".";

export interface GlobalStatus {
  opNames: { [key: string]: boolean };
  requestNumber: number;
  jpgDownloadUrl: string;
  pngDownloadUrl: string;
  error: {
    status: boolean;
    message?: string;
  };
  watermark: string;
}

const global: Module<GlobalStatus, GlobalDataProps> = {
  state: {
    requestNumber: 0,
    opNames: {},
    jpgDownloadUrl: "",
    pngDownloadUrl: "",
    error: {
      status: false,
    },
    watermark: '',
  },
  mutations: {
    startLoading(state, { opName }) {
      state.requestNumber += 1;
      if (opName) {
        state.opNames[opName] = true;
      }
    },
    finishLoading(state, { opName }) {
      setTimeout(() => {
        state.requestNumber -= 1;
        delete state.opNames[opName];
      }, 1000);
    },
    setError(state, e) {
      state.error = e;
    },
    setjpgDownloadUrl(state, url) {
      state.jpgDownloadUrl = url;
    },
    setpngDownloadUrl(state, url) {
      state.pngDownloadUrl = url;
    },
    setWatermark(state, watermark) {
      state.watermark = watermark;
    },
  },
  getters: {
    isLoading: (state) => state.requestNumber > 0,
    isOpLoading: (state) => (opName: string) => state.opNames[opName],
    getjpgDownloadUrl: (state) => state.jpgDownloadUrl,
    getpngDownloadUrl: (state) => state.pngDownloadUrl,
  },
  actions: {
    setWatermarkFromResponse({ commit }, response) {
      if (response && response.attr && response.attr.watermark) {
        commit('setWatermark', response.attr.watermark);
      }
    },
  }
};

export default global;
