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

    // Get parent dimensions for better sizing
    const parentRect = parentNode.getBoundingClientRect();
    
    // Canvas should be large enough to create a pattern that will tile well
    // but not so large it causes performance issues
    const canvasWidth = width || Math.min(Math.max(300, parentRect.width / 2), 600);
    const canvasHeight = height || Math.min(Math.max(200, parentRect.height / 2), 400);
    
    // Create new watermark
    const can = document.createElement('canvas');
    can.width = canvasWidth;
    can.height = canvasHeight;
    can.style.display = 'none';
    
    const cans = can.getContext('2d');
    if (!cans) return;
    
    // Clear the canvas
    cans.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Set text properties - use a lighter color and appropriate font size
    const fontSize = parseInt(font?.match(/\d+/)?.[0] || '14');
    cans.font = font || `${fontSize}px Arial`;
    cans.fillStyle = textColor || "rgba(128, 128, 128, 0.3)";
    cans.textAlign = 'center';
    cans.textBaseline = 'middle';
    
    // Calculate text metrics for spacing
    const textWidth = cans.measureText(str).width;
    
    // Determine ideal spacing for at least 3 diagonal rows
    // We want the rows to be evenly spaced based on the canvas size
    const diagonalLength = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
    // 减小 1.5 的值会增加行数，使水印更密集
    const numRows = Math.max(3, Math.ceil(diagonalLength / (textWidth * 1.5)));
    const rowSpacing = diagonalLength / numRows;
    
    // Calculate column spacing based on text width
    // 减小 2 的值会使列间距变小，水印更密集
    const colSpacing = textWidth * 1.42; // Space between columns
    
    // Save the canvas state before rotating
    cans.save();
    
    // Rotate the entire canvas for diagonal text (30 degrees for top-left to bottom-right)
    cans.translate(canvasWidth / 2, canvasHeight / 2);
    cans.rotate(30 * Math.PI / 180);
    
    // Calculate the diagonal bounds to ensure we cover the rotated canvas
    const diagonalWidth = Math.abs(canvasWidth * Math.cos(30 * Math.PI / 180)) + 
                          Math.abs(canvasHeight * Math.sin(30 * Math.PI / 180));
    const diagonalHeight = Math.abs(canvasWidth * Math.sin(30 * Math.PI / 180)) + 
                           Math.abs(canvasHeight * Math.cos(30 * Math.PI / 180));
    
    // Calculate starting positions to ensure we cover the entire canvas
    const startX = -diagonalWidth;
    const endX = diagonalWidth;
    const startY = -diagonalHeight;
    const endY = diagonalHeight;
    
    // Draw the text in a grid pattern
    for (let y = startY; y <= endY; y += rowSpacing) {
      for (let x = startX; x <= endX; x += colSpacing) {
        cans.fillText(str, x, y);
      }
    }
    
    // Restore the canvas state
    cans.restore();
    
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
    div.style.backgroundRepeat = 'repeat'; // Ensure pattern repeats
    
    // Make sure parent has position relative for proper absolute positioning
    const computedStyle = window.getComputedStyle(parentNode);
    if (computedStyle.position === 'static') {
      parentNode.style.position = 'relative';
    }
    
    // Remove the canvas from DOM after creating the data URL
    if (can.parentNode === parentNode) {
      parentNode.removeChild(can);
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