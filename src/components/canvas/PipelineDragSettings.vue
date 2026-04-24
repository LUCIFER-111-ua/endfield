<template>
  <div class="pipeline-drag-settings">
    <h3>产线拖拽设置</h3>
    
    <div class="setting-section">
      <h4>布局配置</h4>
      <div class="setting-item">
        <label>布局方向：</label>
        <select v-model="localConfig.layout.direction">
          <option value="down">向下排列</option>
          <option value="up">向上排列</option>
        </select>
      </div>
      <div class="setting-item">
        <label>层间隔：</label>
        <input type="number" v-model.number="localConfig.layout.layerSpacing" min="0" max="5" />
        <span class="unit">网格</span>
      </div>
      <div class="setting-item">
        <label>机器间隔：</label>
        <input type="number" v-model.number="localConfig.layout.machineSpacing" min="0" max="5" />
        <span class="unit">网格</span>
      </div>
      <div class="setting-item">
        <label>默认机器宽度：</label>
        <input type="number" v-model.number="localConfig.layout.machineSize.width" min="1" max="10" />
        <span class="unit">网格</span>
      </div>
      <div class="setting-item">
        <label>默认机器高度：</label>
        <input type="number" v-model.number="localConfig.layout.machineSize.height" min="1" max="10" />
        <span class="unit">网格</span>
      </div>
    </div>
    
    <div class="setting-section">
      <h4>预览样式</h4>
      <div class="setting-item">
        <label>有效位置颜色：</label>
        <input type="color" v-model="localConfig.preview.validColor" />
      </div>
      <div class="setting-item">
        <label>无效位置颜色：</label>
        <input type="color" v-model="localConfig.preview.invalidColor" />
      </div>
      <div class="setting-item">
        <label>边框宽度：</label>
        <input type="number" v-model.number="localConfig.preview.borderWidth" min="1" max="10" />
        <span class="unit">像素</span>
      </div>
      <div class="setting-item">
        <label>边框样式：</label>
        <select v-model="localConfig.preview.borderStyle">
          <option value="solid">实线</option>
          <option value="dashed">虚线</option>
        </select>
      </div>
    </div>
    
    <div class="setting-section">
      <h4>放置逻辑</h4>
      <div class="setting-item">
        <label>放置顺序：</label>
        <select v-model="localConfig.placement.order">
          <option value="bottom-up">从底层到上层</option>
          <option value="top-down">从上层到底层</option>
        </select>
      </div>
    </div>
    
    <div class="setting-section">
      <h4>碰撞检测</h4>
      <div class="setting-item checkbox">
        <input type="checkbox" id="checkBounds" v-model="localConfig.collision.checkBounds" />
        <label for="checkBounds">检查画布边界</label>
      </div>
      <div class="setting-item checkbox">
        <input type="checkbox" id="checkMachineCollision" v-model="localConfig.collision.checkMachineCollision" />
        <label for="checkMachineCollision">检查机器碰撞</label>
      </div>
    </div>
    
    <div class="setting-section">
      <h4>调试设置</h4>
      <div class="setting-item checkbox">
        <input type="checkbox" id="debugEnabled" v-model="localConfig.debug.enabled" />
        <label for="debugEnabled">启用调试信息</label>
      </div>
      <div class="setting-item">
        <label>日志级别：</label>
        <select v-model="localConfig.debug.logLevel">
          <option value="info">信息</option>
          <option value="debug">调试</option>
          <option value="error">错误</option>
        </select>
      </div>
    </div>
    
    <div class="setting-actions">
      <button @click="saveSettings" class="save-btn">保存设置</button>
      <button @click="resetSettings" class="reset-btn">重置默认</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { pipelineDragConfig, updatePipelineDragConfig } from '../../config/pipelineDragConfig.js'

// 本地配置副本
const localConfig = reactive(JSON.parse(JSON.stringify(pipelineDragConfig)))

// 保存设置
function saveSettings() {
  updatePipelineDragConfig(localConfig)
  
  background: #16213e;
  border-radius: 8px;
  color: #fff;
}

h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #e94560;
  font-size: 18px;
}

h4 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #fff;
  font-size: 14px;
  border-bottom: 1px solid #0f3460;
  padding-bottom: 4px;
}

.setting-section {
  margin-bottom: 16px;
}

.setting-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.setting-item label {
  width: 120px;
  font-size: 12px;
}

.setting-item input[type="number"] {
  width: 60px;
  padding: 4px;
  background: #0f3460;
  border: 1px solid #1a535c;
  color: #fff;
  border-radius: 4px;
}

.setting-item input[type="color"] {
  width: 40px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.setting-item select {
  padding: 4px;
  background: #0f3460;
  border: 1px solid #1a535c;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.setting-item.checkbox {
  display: flex;
  align-items: center;
}

.setting-item.checkbox input[type="checkbox"] {
  margin-right: 8px;
}

.setting-item.checkbox label {
  width: auto;
  cursor: pointer;
}

.unit {
  margin-left: 4px;
  font-size: 10px;
  color: #888;
}

.setting-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.save-btn, .reset-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: #e94560;
  color: #fff;
}

.save-btn:hover {
  background: #c0392b;
}

.reset-btn {
  background: #0f3460;
  color: #fff;
  border: 1px solid #1a535c;
}

.reset-btn:hover {
  background: #1a535c;
}
</style>
