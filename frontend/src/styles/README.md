# ResuOpti 样式系统说明

本目录包含 ResuOpti 项目的全局样式配置，包括 Element Plus 暗黑主题自定义和项目特定的样式变量。

## 文件结构

```
src/styles/
├── theme.scss          # Element Plus 主题自定义变量
├── variables.scss      # 项目全局样式变量
├── global.scss         # 全局样式和工具类
└── index.ts           # 样式统一导出文件
```

## 文件说明

### theme.scss
Element Plus 暗黑主题自定义变量，定义了：
- 主色调（primary、success、warning、danger、info）
- 背景色（bg-color、bg-color-page、bg-color-overlay）
- 文字色（text-color-primary、regular、secondary、placeholder）
- 边框色（border-color 及其变体）
- 组件尺寸和圆角

支持浅色模式和暗黑模式（`html.dark`）的 CSS 变量覆盖。

### variables.scss
项目特定的 SCSS 变量，包含：
- 布局尺寸（header、sidebar）
- 间距系统（xs、sm、md、lg、xl）
- 字体设置（family、size）
- 阴影样式
- 过渡动画
- z-index 层级
- 响应式断点

### global.scss
全局样式定义，包含：
- 全局样式重置
- 滚动条样式（支持暗黑主题）
- 通用工具类（flex-center、flex-between、text-ellipsis）
- 响应式容器
- 暗黑模式特定样式

## 使用方法

### 1. 在组件中使用 CSS 变量

```vue
<style scoped>
.my-component {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color);
}
</style>
```

### 2. 在组件中使用 SCSS 变量

```vue
<style scoped lang="scss">
.my-component {
  padding: $spacing-md;
  font-size: $font-size-base;
  transition: $transition-base;
}
</style>
```

**注意**：SCSS 变量已通过 Vite 配置全局注入，无需手动导入。

### 3. 使用工具类

```vue
<template>
  <div class="flex-center">
    <span class="text-ellipsis">长文本会自动省略</span>
  </div>
</template>
```

### 4. 响应式设计

```vue
<style scoped lang="scss">
.my-component {
  padding: $spacing-sm;

  @media (min-width: $breakpoint-md) {
    padding: $spacing-lg;
  }
}
</style>
```

## 主题切换

主题切换由 `stores/theme.ts` 管理，通过给 `html` 元素添加或移除 `dark` 类来实现：

```typescript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 切换主题
themeStore.toggleTheme()

// 设置特定主题
themeStore.setTheme('dark')  // 'light' | 'dark' | 'auto'

// 获取当前主题状态
const isDark = themeStore.isDark
```

## 自定义主题

### 修改主题颜色

编辑 `theme.scss` 中的 CSS 变量：

```scss
:root {
  --el-color-primary: #your-color;
}

html.dark {
  --el-color-primary: #your-dark-color;
}
```

### 添加新的 SCSS 变量

编辑 `variables.scss`：

```scss
// 添加新变量
$my-custom-variable: 16px;
```

### 添加新的工具类

编辑 `global.scss`：

```scss
.my-utility-class {
  // 样式定义
}
```

## 技术栈

- **SCSS**: CSS 预处理器，支持变量、嵌套、混合等功能
- **Element Plus**: UI 框架，内置完整的暗黑主题支持
- **CSS Variables**: 实现运行时主题切换
- **Vite**: 构建工具，支持 SCSS 预处理和模块化

## 注意事项

1. **CSS 变量 vs SCSS 变量**：
   - CSS 变量：运行时可变，用于主题切换
   - SCSS 变量：编译时固定，用于构建时的值计算

2. **暗黑模式适配**：
   - 所有自定义样式都应考虑暗黑模式
   - 使用 CSS 变量而非硬编码颜色
   - 在 `html.dark` 选择器中覆盖变量

3. **性能优化**：
   - 避免过度使用 CSS 变量造成运行时开销
   - 合理使用 SCSS 嵌套，避免选择器过深
   - 工具类优先于重复样式

4. **响应式设计**：
   - 使用定义的断点变量保持一致性
   - 移动端优先的设计策略
   - 测试不同屏幕尺寸的显示效果

## 相关文件

- `/frontend/src/main.ts` - 样式文件导入入口
- `/frontend/src/stores/theme.ts` - 主题状态管理
- `/frontend/vite.config.ts` - Vite SCSS 配置