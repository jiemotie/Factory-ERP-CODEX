# Database Design Draft

本文档描述优先模块的核心数据表草案。实际字段可在技术栈确定后进一步细化。

## Common Columns

建议业务表统一包含：

- `id`：主键
- `created_at` / `created_by`：创建时间与创建人
- `updated_at` / `updated_by`：更新时间与更新人
- `deleted_at`：软删除时间，可选
- `version`：乐观锁版本号，可选

## Identity Tables

- `users`：用户账号、姓名、手机号、邮箱、状态、密码哈希
- `roles`：角色编码、角色名称、状态
- `permissions`：权限编码、权限名称、资源、动作
- `user_roles`：用户与角色关联
- `role_permissions`：角色与权限关联

## Material Inbound Tables

- `material_inbound_orders`：入库单号、供应商、状态、入库日期、审核信息
- `material_inbound_items`：入库单、材料、批次、数量、单位、质检结果
- `inventory_transactions`：库存流水，记录入库、出库、调整等变动

## Order Entry Tables

- `orders`：订单号、客户、状态、交期、备注
- `order_items`：订单、产品、数量、单位、工艺路线

## Process Flow Tables

- `process_routes`：工艺路线编码、名称、版本、状态
- `process_steps`：路线、工序顺序、工序名称、标准工时
- `process_tasks`：订单明细、工序、状态、计划与实际时间
- `process_task_records`：开工、完工、暂停、返工、报工数量和不良数量

## Reports

报表优先通过后端查询服务或只读视图生成。对于高频报表，可引入聚合表或缓存，但必须由后端统一刷新和对外提供。
