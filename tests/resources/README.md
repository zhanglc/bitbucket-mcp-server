# Resource Discovery Tests for MCP Compliance

此目录包含针对 Bitbucket MCP 服务器资源发现机制的全面测试套件，旨在验证 MCP 规范合规性。

## 测试结构

### 单元测试 (`tests/unit/resources/`)

#### `resource-discovery.test.ts`
**目标**: 验证资源发现组件的 MCP 规范合规性

**测试类别**:
- **静态资源定义**: 验证 `staticResources` 数组的结构和内容
- **静态资源辅助函数**: 测试 `isStaticResource()` 和 `getStaticResource()` 函数
- **资源模板验证**: 确保 `resourceTemplates` 符合 MCP ResourceTemplate 接口
- **MCP 合规性验证**: 验证资源和模板格式符合 MCP 标准
- **资源发现集成**: 测试静态资源和动态模板的分离机制
- **错误场景**: 验证错误处理的健壮性

**关键测试点**:
- ✅ 静态资源不包含参数占位符
- ✅ 资源模板包含参数占位符
- ✅ 没有静态资源与模板URI重叠
- ✅ 所有必需的 schema 资源都已定义
- ✅ URI 格式符合 `bitbucket://` 协议

### 集成测试 (`tests/integration/resources/`)

#### `static-resource-access.test.ts`
**目标**: 测试静态资源的实际访问行为

**测试类别**:
- **Schema Index 资源访问**: 验证 `bitbucket://schema/index` 的访问
- **单个 Schema 资源访问**: 测试各个 schema 资源的访问
- **Schema 资源字段过滤**: 验证字段过滤和格式化功能
- **错误处理**: 测试无效资源访问的错误处理
- **响应格式合规性**: 验证响应格式符合 MCP 标准

**关键测试点**:
- ✅ Schema index 返回完整的资源类型信息
- ✅ 各个 schema 资源可正常访问
- ✅ 字段过滤功能正常工作
- ✅ 错误情况得到优雅处理
- ✅ 响应格式符合 MCP Content 接口

#### `mcp-resource-discovery.test.ts`
**目标**: 端到端验证 MCP 资源发现工作流

**测试类别**:
- **ListResources 端点**: 验证静态资源列表返回
- **ListResourceTemplates 端点**: 验证资源模板列表返回
- **资源发现分离**: 确保静态资源和动态模板明确分离
- **静态资源访问**: 测试静态资源的读取功能
- **资源发现工作流**: 验证完整的发现到访问流程
- **MCP 合规性验证**: 验证所有响应格式符合 MCP 标准

## 测试运行

### 运行所有资源相关测试
```bash
npm run test:resources
```

### 运行资源发现专项测试
```bash
npm run test:resource-discovery
```

### 运行单个测试文件
```bash
# 单元测试
npm test tests/unit/resources/resource-discovery.test.ts

# 集成测试
npm test tests/integration/resources/static-resource-access.test.ts
npm test tests/integration/resources/mcp-resource-discovery.test.ts
```

## 测试覆盖范围

### MCP 规范合规性 ✅
- **ListResources**: 返回具体可访问的静态资源
- **ListResourceTemplates**: 返回参数化的资源模板
- **ReadResource**: 支持访问静态 schema 资源
- **资源URI格式**: 符合 `bitbucket://` 协议标准
- **响应格式**: 符合 MCP Content 和 Resource 接口

### 静态资源覆盖 ✅
- `bitbucket://schema/index` - 资源类型索引
- `bitbucket://schema/repository` - 仓库字段模式
- `bitbucket://schema/pullrequest` - PR 字段模式
- `bitbucket://schema/commit` - 提交字段模式
- `bitbucket://schema/branch` - 分支字段模式
- `bitbucket://schema/file` - 文件字段模式
- `bitbucket://schema/diff` - 差异字段模式
- `bitbucket://schema/user` - 用户字段模式
- `bitbucket://schema/workspace` - 工作空间字段模式

### 动态资源模板覆盖 ✅
- Repository files and directories
- Pull requests and diffs
- Branches and commits
- Code search
- Schema resources with parameters

## 重要修正

### 问题 1: Resource Discovery 模式不符合 MCP 规范
**修正前**: `ListResources` 只返回单个静态资源，混合了静态和动态资源概念
**修正后**: 
- `ListResources` 返回多个明确定义的静态 schema 资源
- `ListResourceTemplates` 返回参数化的动态资源模板
- 清晰分离静态资源和模板资源

### 实现文件
- `src/resources/static-resources.ts` - 静态资源定义
- 测试文件验证所有修正是否正确实施

## 测试指标

**总测试用例**: 27 个
- 单元测试: 16 个 ✅
- 集成测试: 11 个 ✅

**覆盖领域**:
- 资源发现机制 ✅
- 静态资源访问 ✅ 
- MCP 规范合规性 ✅
- 错误处理 ✅
- 字段过滤功能 ✅

所有测试通过，验证了 Resource Discovery 修正的正确性和 MCP 规范合规性。