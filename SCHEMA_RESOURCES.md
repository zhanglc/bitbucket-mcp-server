# Bitbucket MCP Server - Schema Resources

## 概述

我们成功地将 Bitbucket API 的字段定义信息（field-schemas）集成到了 MCP 协议中，采用了 **Resources 层面** 的设计方案。这个实现解决了客户端如何发现和了解可用资源类型的问题。

## 设计方案

### URI 设计模式

我们采用了以下 URI 设计模式：

```
bitbucket://schema/index                               # 获取所有资源类型索引
bitbucket://schema/{resource_type}                     # 获取特定资源类型的完整 schema
bitbucket://schema/{resource_type}/field/{field_name}  # 获取特定字段的详细信息
bitbucket://schema/validation/{resource_type}          # 获取验证规则
```

### 支持的查询参数

#### Schema Index (`bitbucket://schema/index`) - 真正的静态资源
- 无查询参数支持
- 返回固定的资源类型列表
- 作为静态资源在 `listResources` 中可见

*注意：这是一个真正的静态资源，内容固定，不支持查询参数*

#### Resource Schema (`bitbucket://schema/{resource_type}`)
- `fields`: 逗号分隔的字段类型 (`fields,metadata,examples,validation`)
- `field_details`: `minimal` | `full` - 字段详细程度
- `filter_by`: `required` | `optional` | `readonly` | `nested` - 按属性过滤字段

#### Field Schema (`bitbucket://schema/{resource_type}/field/{field_name}`)
- `include_nested`: `true` | `false` - 是否包含嵌套字段信息

#### Validation Schema (`bitbucket://schema/validation/{resource_type}`)
- `operation`: `create` | `update` | `read` - 操作上下文

## 实现的功能

### 1. 资源类型发现

客户端可以通过以下方式发现可用的资源类型：

```javascript
// 获取所有资源类型（真正的静态资源）
GET bitbucket://schema/index
```

### 2. 详细的 Schema 查询

```javascript
// 获取完整的 pull request schema
GET bitbucket://schema/pullrequest

// 只获取必需字段
GET bitbucket://schema/pullrequest?filter_by=required

// 获取最小化字段信息
GET bitbucket://schema/repository?field_details=minimal
```

### 3. 字段级别的 Schema

```javascript
// 获取特定字段的详细信息
GET bitbucket://schema/repository/field/owner

// 包含嵌套字段信息
GET bitbucket://schema/pullrequest/field/author?include_nested=true
```

### 4. 验证规则

```javascript
// 获取读取操作的验证规则
GET bitbucket://schema/validation/pullrequest

// 获取创建操作的验证规则
GET bitbucket://schema/validation/pullrequest?operation=create
```

## 架构实现

### 文件结构

```
src/resources/
├── field-schemas.ts      # 扩展了资源类型分类和查询功能
├── schema-handlers.ts    # 新增：处理 schema 资源请求
├── handlers.ts          # 修改：集成 schema 处理器
└── templates.ts         # 修改：添加 schema 资源模板
```

### 核心类和函数

#### `SchemaHandlers` 类
- `handleSchemaIndex()` - 处理资源类型索引请求
- `handleResourceSchema()` - 处理资源 schema 请求
- `handleFieldSchema()` - 处理字段 schema 请求
- `handleValidationSchema()` - 处理验证规则请求

#### 扩展的工具函数
- `getAllResourceTypes()` - 获取所有资源类型
- `getResourceTypesByCategory()` - 按类别获取资源类型
- `getResourceTypeIndex()` - 生成资源类型索引
- `getFilteredFields()` - 按条件过滤字段
- `getValidationRules()` - 获取验证规则
- `getDetailedFieldSchema()` - 获取详细字段信息

## 使用场景

### 1. 智能字段选择器

客户端可以构建基于 schema 的智能字段选择器：

```javascript
// 1. 获取可用字段
const schema = await readResource('bitbucket://schema/pullrequest?field_details=minimal');

// 2. 构建 UI 让用户选择需要的字段
const selectedFields = showFieldSelector(schema.fields);

// 3. 使用选择的字段查询实际数据
const data = await readResource(`bitbucket://workspace/repo/pr/123?fields=${selectedFields.join(',')}`);
```

### 2. 客户端验证

```javascript
// 1. 获取验证规则
const rules = await readResource('bitbucket://schema/validation/repository?operation=create');

// 2. 验证用户输入
const validation = validateInput(userInput, rules.validation);

// 3. 显示错误信息或提交请求
if (validation.isValid) {
  await createRepository(userInput);
} else {
  showErrors(validation.errors);
}
```

### 3. 自动文档生成

```javascript
// 1. 获取所有资源类型
const index = await readResource('bitbucket://schema/index?include_fields=true');

// 2. 为每个类型获取详细 schema
const schemas = await Promise.all(
  index.resourceTypes.map(type => 
    readResource(`bitbucket://schema/${type.type}`)
  )
);

// 3. 生成文档
generateDocumentation(schemas);
```

## 优势

1. **声明式发现**：客户端无需预先知识即可发现资源类型
2. **智能字段选择**：基于 schema 构建智能 UI
3. **客户端验证**：提前验证请求，改善用户体验
4. **自动文档化**：从实时 schema 生成文档
5. **渐进增强**：客户端可以从简单开始，逐步添加复杂功能
6. **类型安全**：支持类型安全的客户端库开发

## 与现有功能的整合

这个实现与现有的字段过滤功能完美整合：

- Schema 提供可用字段的定义
- 字段过滤功能使用 schema 进行验证
- 客户端可以基于 schema 构建智能的字段选择器

现有的 `fields`, `exclude`, `format` 参数继续工作，但现在客户端可以通过 schema 了解哪些字段可用，以及如何正确使用这些参数。

## 测试和演示

运行 `test-schema-discovery.js` 查看完整的使用示例和工作流程演示：

```bash
node test-schema-discovery.js
```

这个脚本展示了：
- 客户端发现工作流程
- 各种 URI 使用示例
- 实际使用场景
- 这种方法的优势

## 总结

通过将 field-schemas 作为 MCP Resources 暴露，我们创建了一个强大、灵活且符合 MCP 设计理念的解决方案。客户端现在可以：

1. 动态发现可用的 Bitbucket 资源类型
2. 获取详细的字段定义和验证规则
3. 构建智能的用户界面
4. 进行客户端验证
5. 生成自动化文档

这个实现为 Bitbucket MCP Server 提供了强大的内省能力，使其更加用户友好和开发者友好。
