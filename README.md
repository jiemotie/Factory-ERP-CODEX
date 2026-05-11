# Factory-ERP-CODEX

Factory ERP 多端项目骨架，采用统一后端 API 作为唯一数据源，Web 管理端、Windows 桌面端和 Android 移动端均通过同一套 API 读写业务数据。

## Repository Structure

```text
backend/   统一后端 API 服务
web/       Web 管理端（当前提供表格化原型）
desktop/   Windows 桌面端
mobile/    Android 移动端
docs/      需求说明、数据库设计、接口文档
```

## Architecture Principle

后端是唯一权威数据源（Single Source of Truth）。所有客户端必须通过后端 API 访问用户、权限、材料入库、订单、工序和报表数据，避免多端直接读写数据库造成数据不一致。

## Priority Modules

1. 用户、角色、权限基础模块
2. 材料入库模块
3. 订单录入模块
4. 工序流转模块
5. 报表分析模块

## Documentation

- [Architecture](docs/architecture.md)
- [Priority Modules](docs/modules.md)
- [API Draft](docs/api.md)
- [Database Design Draft](docs/database-design.md)
- [Development Workflow](docs/development.md)
- [Current Status](docs/status.md)
- [OpenAPI Contract](docs/openapi.md)
