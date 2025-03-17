import type { App, Directive, DirectiveBinding } from 'vue'

interface WatermarkOptions {
  text?: string
  width?: number
  height?: number
  font?: string
  textColor?: string
  fillTextX?: string
}

interface WatermarkElement extends HTMLElement {
  _watermarkId?: string
  _watermarkWatcher?: ReturnType<typeof setInterval>
}

// Extract the watermark mounting logic to a separate function
function mountWatermark(el: WatermarkElement, binding: DirectiveBinding<WatermarkOptions>) {
  // Unique ID for this watermark
  const watermarkId = `watermark-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  el._watermarkId = watermarkId;
  
  // Water mark text, parent element, canvas width, canvas height, font, text color, canvas x-coordinate
  function addWaterMarker(
    str: string, 
    parentNode: HTMLElement,
    width?: number, 
    height?: number, 
    font?: string, 
    textColor?: string, 
    fillTextX: string = '10'
  ): void { 
    // Remove existing watermark if any
    const existingWatermark = parentNode.querySelector(`div[data-watermark="true"]`);
    if (existingWatermark) {
      parentNode.removeChild(existingWatermark);
    }

    // Create new watermark
    const can = document.createElement('canvas');
    parentNode.appendChild(can);
    can.width = width || 200;
    can.height = height || 140;
    can.style.display = 'none';
    
    const cans = can.getContext('2d');
    if (!cans) return;
    
    cans.rotate(-20 * Math.PI / 180);
    cans.font = font || "16px Arial";
    cans.fillStyle = textColor || "#ccc";
    cans.textAlign = 'left';
    cans.textBaseline = 'middle';
    cans.fillText(str, parseInt(fillTextX), can.height / 2);
    
    // Create a div and position it to cover the parent element
    const div = document.createElement('div');
    div.id = watermarkId;
    div.dataset.watermark = 'true'; // Add data attribute for easier selection
    div.style.pointerEvents = 'none';
    div.style.top = '0';
    div.style.left = '0';
    div.style.position = 'absolute';
    div.style.zIndex = '2';
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.background = 'url(' + can.toDataURL('image/png') + ')';
    
    // Make sure parent has position relative
    const computedStyle = window.getComputedStyle(parentNode);
    if (computedStyle.position === 'static') {
      parentNode.style.position = 'relative';
    }
    
    parentNode.appendChild(div);
    console.log(`Watermark added with ID: ${watermarkId}`);
  }
  
  // Start watching for payment status changes
  function watchPaymentStatus() {
    let lastPayStatus = '';
    
    // Update watermark based on payment status
    function updateWatermark() {
      const currentPayStatus = sessionStorage.getItem('is_pay') || '0';
      
      // Only update if payment status changed
      if (lastPayStatus !== currentPayStatus) {
        console.log(`Payment status changed from ${lastPayStatus} to ${currentPayStatus}`);
        lastPayStatus = currentPayStatus;
        
        // Remove existing watermark
        const existingWatermark = el.querySelector(`div[data-watermark="true"]`);
        if (existingWatermark) {
          el.removeChild(existingWatermark);
        }
        
        // Add new watermark if not paid
        if (currentPayStatus !== '1' && binding.value?.text) {
          addWaterMarker(
            binding.value.text, 
            el, 
            binding.value.width, 
            binding.value.height, 
            binding.value.font, 
            binding.value.textColor, 
            binding.value.fillTextX
          );
        }
      }
    }
    
    // Run first time immediately
    updateWatermark();
    
    // Then set up interval to check repeatedly
    const intervalId = setInterval(updateWatermark, 200);
    el._watermarkWatcher = intervalId;
  }
  
  // Start the watcher
  watchPaymentStatus();
}

const watermark: Directive<WatermarkElement, WatermarkOptions> = {
  mounted(el: WatermarkElement, binding: DirectiveBinding<WatermarkOptions>) {
    mountWatermark(el, binding);
  },
  
  updated(el: WatermarkElement, binding: DirectiveBinding<WatermarkOptions>) {
    // If binding value changes, clear the interval and restart
    if (binding.value?.text !== binding.oldValue?.text) {
      if (el._watermarkWatcher) {
        clearInterval(el._watermarkWatcher);
      }
      
      // Re-mount with new values using the external function
      mountWatermark(el, binding);
    }
  },
  
  beforeUnmount(el: WatermarkElement) {
    // Clear interval on unmount
    if (el._watermarkWatcher) {
      clearInterval(el._watermarkWatcher);
    }
    
    // Remove any watermark elements
    const watermark = el.querySelector(`div[data-watermark="true"]`);
    if (watermark) {
      el.removeChild(watermark);
    }
  }
};

// Export the directive for use in the application
export default {
  install(app: App): void {
    app.directive('watermark', watermark);
  }
};