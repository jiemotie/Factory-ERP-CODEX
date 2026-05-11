# Backend API Service

后端是 Factory ERP 的唯一数据源（Single Source of Truth），负责统一承载业务规则、数据校验、权限控制和持久化访问。Web 管理端、Windows 桌面端和 Android 移动端必须通过同一套后端 API 读写数据，禁止直接访问数据库或各自维护独立业务数据。

当前版本提供一个无外部依赖的 Node.js 后端 API 原型，便于先验证模块边界、接口契约和多端统一访问方式。后续可在保持接口契约的前提下迁移到 ASP.NET Core、Spring Boot、NestJS 或 Django。

## 运行方式

```bash
cd backend
npm test
npm start
```

默认监听 `http://localhost:3000`，接口统一使用 `/api/v1` 前缀。

如需将内存数据持久化到本地 JSON 文件，可设置：

```bash
ERP_DATA_FILE=./data/factory-erp.json npm start
```

运行时会自动创建数据文件；登录会话仍保存在内存中，重启后需要重新登录。

## 开发账号

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | 系统管理员 |

## 已实现模块

1. `identity`：登录、退出、用户列表/创建、角色列表/创建、权限列表
2. `material-inbound`：材料入库单创建、查询、审核、确认入库、状态校验、库存流水查询与库存余额汇总
3. `order-entry`：订单创建、查询、更新、审核、取消
4. `process-flow`：工艺路线创建/查询、工序任务创建、开工、完工、返工
5. `reports`：入库统计、订单进度、工序产能、良率分析、库存余额报表

## API 约定

- 所有业务 API 统一放在 `/api/v1` 前缀下。
- 认证当前使用开发 Token，调用登录接口后在请求头传入 `Authorization: Bearer <token>`。
- 权限校验必须在后端执行，前端仅做展示与交互控制。
- 写操作记录审计日志，后续可持久化到数据库审计表。
- 多端读取同一业务对象时，应以 API 返回结果为准。
