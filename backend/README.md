# Backend API Service

后端是 Factory ERP 的唯一数据源（Single Source of Truth），负责统一承载业务规则、数据校验、权限控制和持久化访问。Web 管理端、Windows 桌面端和 Android 移动端必须通过同一套后端 API 读写数据，禁止直接访问数据库或各自维护独立业务数据。

## 建议技术栈

可选实现方向：ASP.NET Core、Spring Boot、NestJS 或 Django。当前目录先保留通用模块边界与接口职责，便于后续按团队技术栈落地。

## 优先模块

1. `identity`：用户、角色、权限基础模块
2. `material-inbound`：材料入库模块
3. `order-entry`：订单录入模块
4. `process-flow`：工序流转模块
5. `reports`：报表分析模块

## API 约定

- 所有业务 API 统一放在 `/api/v1` 前缀下。
- 认证建议使用 OAuth2/JWT 或同等级别的 Token 机制。
- 权限校验必须在后端执行，前端仅做展示与交互控制。
- 写操作应记录审计字段：创建人、创建时间、更新人、更新时间。
- 多端读取同一业务对象时，应以 API 返回结果为准。
