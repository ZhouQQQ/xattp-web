export function getJSONValueByPath(obj, pathStr) {
  // 将路径字符串分割为数组（使用 . 作为分隔符）
  const path = pathStr.split('.');
  
  // 遍历路径数组
  for (const key of path) {
    // 如果当前键包含方括号（例如 "c[0]"），则提取键名和索引
    const match = key.match(/(\w+)\[(\d+)\]/);
    const objKey = match ? match[1] : key;
    const index = match ? parseInt(match[2], 10) : undefined;
  
    // 根据键名和索引访问对象的属性
    obj = obj[objKey];
  
    // 如果提供了索引，则访问数组元素
    if (Array.isArray(obj) && index !== undefined) {
      obj = obj[index];
    }
  }
  
  return obj;
}
  