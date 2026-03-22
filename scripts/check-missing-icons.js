/**
 * 脚本：对比 icons 目录和 data.json，找出缺失的图标
 * 使用方法：node scripts/check-missing-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 icons 目录
const iconsDir = path.join(__dirname, '..', 'icons');
const iconFiles = fs.readdirSync(iconsDir)
  .filter(file => file.endsWith('.webp'))
  .map(file => file.replace('item_', '').replace('.webp', ''));

console.log(`找到 ${iconFiles.length} 个图标文件`);

// 读取 data.json
const dataPath = path.join(__dirname, '..', 'data', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// 获取 data.json 中已定义的图标 ID
const definedIconIds = new Set(data.icons.map(icon => icon.id));

// 找出缺失的图标
const missingIcons = iconFiles.filter(iconId => !definedIconIds.has(iconId));

console.log(`\n缺失 ${missingIcons.length} 个图标定义：`);
missingIcons.forEach((icon, index) => {
  console.log(`${index + 1}. ${icon}`);
});

// 找出 data.json 中有但实际文件没有的图标
const extraIcons = data.icons.filter(icon => {
  const fileName = `item_${icon.id}.webp`;
  return !fs.existsSync(path.join(iconsDir, fileName));
});

console.log(`\n\ndata.json 中有 ${extraIcons.length} 个图标没有对应的文件：`);
extraIcons.forEach((icon, index) => {
  console.log(`${index + 1}. ${icon.id}`);
});

// 生成缺失图标的 JSON 模板
console.log('\n\n缺失图标的 JSON 模板：');
console.log(JSON.stringify(missingIcons.map(iconId => ({
  id: iconId,
  position: 'auto',
  color: '#808080' // 默认灰色
})), null, 2));
