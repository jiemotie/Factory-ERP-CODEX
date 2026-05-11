# API Draft

所有接口使用 `/api/v1` 作为版本前缀。当前后端原型已实现下列接口；字段会随持久化模型继续细化。

## Authentication

除登录接口外，业务接口需要请求头：

```http
Authorization: Bearer <token>
```

开发环境可使用内置账号登录：`admin` / `admin123`。

## Identity

| Method | Path | Description | Status |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 登录并获取访问令牌 | Implemented |
| POST | `/api/v1/auth/logout` | 退出登录 | Implemented |
| GET | `/api/v1/users` | 查询用户列表 | Implemented |
| POST | `/api/v1/users` | 创建用户 | Implemented |
| GET | `/api/v1/roles` | 查询角色列表 | Implemented |
| POST | `/api/v1/roles` | 创建角色 | Implemented |
| GET | `/api/v1/permissions` | 查询权限点 | Implemented |

## Material Inbound

| Method | Path | Description | Status |
| --- | --- | --- | --- |
| GET | `/api/v1/material-inbounds` | 查询材料入库单 | Implemented |
| POST | `/api/v1/material-inbounds` | 创建材料入库单 | Implemented |
| GET | `/api/v1/material-inbounds/{id}` | 查询入库单详情 | Implemented |
| POST | `/api/v1/material-inbounds/{id}/approve` | 审核入库单 | Implemented |
| POST | `/api/v1/material-inbounds/{id}/confirm` | 确认入库并生成库存流水 | Implemented |
| GET | `/api/v1/inventory-transactions` | 查询库存流水 | Implemented |
| GET | `/api/v1/inventory-balances` | 查询库存余额 | Implemented |

## Order Entry

| Method | Path | Description | Status |
| --- | --- | --- | --- |
| GET | `/api/v1/orders` | 查询订单列表 | Implemented |
| POST | `/api/v1/orders` | 创建订单 | Implemented |
| GET | `/api/v1/orders/{id}` | 查询订单详情 | Implemented |
| PATCH | `/api/v1/orders/{id}` | 更新订单 | Implemented |
| POST | `/api/v1/orders/{id}/approve` | 审核订单 | Implemented |
| POST | `/api/v1/orders/{id}/cancel` | 取消订单 | Implemented |

## Process Flow

| Method | Path | Description | Status |
| --- | --- | --- | --- |
| GET | `/api/v1/process-routes` | 查询工艺路线 | Implemented |
| POST | `/api/v1/process-routes` | 创建工艺路线 | Implemented |
| GET | `/api/v1/process-tasks` | 查询工序任务 | Implemented |
| POST | `/api/v1/process-tasks` | 创建工序任务 | Implemented |
| POST | `/api/v1/process-tasks/{id}/start` | 工序开工 | Implemented |
| POST | `/api/v1/process-tasks/{id}/complete` | 工序完工 | Implemented |
| POST | `/api/v1/process-tasks/{id}/rework` | 工序返工 | Implemented |

## Reports

| Method | Path | Description | Status |
| --- | --- | --- | --- |
| GET | `/api/v1/reports/material-inbound-summary` | 入库统计报表 | Implemented |
| GET | `/api/v1/reports/order-progress` | 订单进度报表 | Implemented |
| GET | `/api/v1/reports/process-capacity` | 工序产能报表 | Implemented |
| GET | `/api/v1/reports/quality-rate` | 良率分析报表 | Implemented |
| GET | `/api/v1/reports/inventory-balance` | 库存余额报表 | Implemented |


## OpenAPI

| Method | Path | Description | Status |
| --- | --- | --- | --- |
| GET | `/api/v1/openapi.json` | 获取机器可读 OpenAPI JSON 契约 | Implemented |
