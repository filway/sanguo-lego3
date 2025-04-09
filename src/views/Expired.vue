<template>
  <div class="expired-container">
    <div class="expired-content">
      <van-icon name="warning-o" size="60" color="#f5222d" />
      <h1>访问受限</h1>
      <p class="message">{{ alertMsg }}</p>
      <div class="contact-info">
        <van-button type="primary" block round @click="contactService">联系客服</van-button>
      </div>
    </div>
    
    <!-- 客服微信弹窗 -->
    <van-dialog v-model:show="isShowWxDialog" class="wxDialog" show-cancel-button cancel-button-text="点击关闭"
      confirm-button-text="复制微信号" :before-close="copyWx" width="90%">
      <div class="image">
        <img src="../assets/img/cs.png" alt="" />
      </div>
      <div class="text">
        <h4>添加客服微信号，联系您的专属客服升级服务</h4>
        <div>微信号: {{ wx }}</div>
      </div>
    </van-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useStore } from 'vuex';
import { GlobalDataProps } from '../store/index';
import { Toast } from 'vant';

export default defineComponent({
  name: 'Expired',
  setup() {
    const store = useStore<GlobalDataProps>();
    const alertMsg = computed(() => store.state.templates.alert_msg || '你的logo链接有效期已过，如若需要下载源文件，请联系你的客服升级～');
    
    // 客服微信弹窗相关
    const isShowWxDialog = ref(false);
    const wx = sessionStorage.getItem('wx') || '';
    
    const contactService = () => {
      isShowWxDialog.value = true;
    };

    const copyWx = (action: string) => {
      if (action === 'confirm') {
        // 复制微信号到剪贴板
        const textArea = document.createElement('textarea');
        textArea.value = wx;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        Toast.success('微信号已复制');
        return false;
      } else {
        return true;
      }
    };

    return {
      alertMsg,
      contactService,
      isShowWxDialog,
      wx,
      copyWx
    };
  }
});
</script>

<style lang="scss" scoped>
.expired-container {
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f8f8;
  
  .expired-content {
    text-align: center;
    padding: 2rem;
    border-radius: 8px;
    background-color: white;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    width: 80%;
    max-width: 500px;
    
    h1 {
      margin: 1rem 0;
      color: #333;
    }
    
    .message {
      font-size: 1rem;
      color: #555;
      margin-bottom: 2rem;
      line-height: 1.5;
    }
    
    .contact-info {
      margin-top: 1.5rem;
    }
  }
  
  .wxDialog {
    .image {
      width: 100%;
      height: 13rem;
      
      img {
        height: 100%;
        width: 100%;
      }
    }

    .text {
      display: flex;
      flex-direction: column;
      text-align: center;
      padding: 1rem;

      h4 {
        letter-spacing: 2px;
        font-size: 16px;
        margin: 0 0 0.5rem;
      }

      div {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.719);
      }
    }
  }
}
</style>