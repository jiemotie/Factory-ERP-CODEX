# API Draft

所有接口均建议使用 `/api/v1` 作为版本前缀。具体字段以后续 OpenAPI 文档为准。

## Identity

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | 登录并获取访问令牌 |
| POST | `/api/v1/auth/refresh` | 刷新访问令牌 |
| POST | `/api/v1/auth/logout` | 退出登录 |
| GET | `/api/v1/users` | 查询用户列表 |
| POST | `/api/v1/users` | 创建用户 |
| GET | `/api/v1/roles` | 查询角色列表 |
| POST | `/api/v1/roles` | 创建角色 |
| GET | `/api/v1/permissions` | 查询权限点 |

## Material Inbound

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/material-inbounds` | 查询材料入库单 |
| POST | `/api/v1/material-inbounds` | 创建材料入库单 |
| GET | `/api/v1/material-inbounds/{id}` | 查询入库单详情 |
| POST | `/api/v1/material-inbounds/{id}/approve` | 审核入库单 |
| POST | `/api/v1/material-inbounds/{id}/confirm` | 确认入库并生成库存流水 |

## Order Entry

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/orders` | 查询订单列表 |
| POST | `/api/v1/orders` | 创建订单 |
| GET | `/api/v1/orders/{id}` | 查询订单详情 |
| PATCH | `/api/v1/orders/{id}` | 更新订单 |
| POST | `/api/v1/orders/{id}/approve` | 审核订单 |
| POST | `/api/v1/orders/{id}/cancel` | 取消订单 |

## Process Flow

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/process-routes` | 查询工艺路线 |
| POST | `/api/v1/process-routes` | 创建工艺路线 |
| GET | `/api/v1/process-tasks` | 查询工序任务 |
| POST | `/api/v1/process-tasks/{id}/start` | 工序开工 |
| POST | `/api/v1/process-tasks/{id}/complete` | 工序完工 |
| POST | `/api/v1/process-tasks/{id}/rework` | 工序返工 |

## Reports

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/reports/material-inbound-summary` | 入库统计报表 |
| GET | `/api/v1/reports/order-progress` | 订单进度报表 |
| GET | `/api/v1/reports/process-capacity` | 工序产能报表 |
| GET | `/api/v1/reports/quality-rate` | 良率分析报表 |
