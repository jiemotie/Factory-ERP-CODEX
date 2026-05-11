export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Factory ERP Backend API',
    version: '0.2.0',
    description: 'Factory ERP 统一后端 API 契约，供 Web、Windows 桌面端和 Android 移动端共同使用。'
  },
  servers: [{ url: 'http://localhost:3000', description: '本地开发环境' }],
  tags: [
    { name: 'Identity', description: '用户、角色、权限与认证' },
    { name: 'MaterialInbound', description: '材料入库、库存流水与库存余额' },
    { name: 'OrderEntry', description: '订单录入与订单状态流转' },
    { name: 'ProcessFlow', description: '工艺路线与工序任务流转' },
    { name: 'Reports', description: '报表分析' },
    { name: 'Audit', description: '审计日志' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' }
    },
    schemas: {
      ApiError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          displayName: { type: 'string' },
          roleIds: { type: 'array', items: { type: 'string' } },
          status: { type: 'string' }
        }
      },
      MaterialInboundItem: {
        type: 'object',
        required: ['materialCode', 'materialName', 'quantity', 'unit'],
        properties: {
          materialCode: { type: 'string' },
          materialName: { type: 'string' },
          batchNo: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' }
        }
      },
      MaterialInbound: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          inboundNo: { type: 'string' },
          supplierName: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'approved', 'confirmed'] },
          inboundDate: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/MaterialInboundItem' } }
        }
      },
      InventoryBalance: {
        type: 'object',
        properties: {
          materialCode: { type: 'string' },
          materialName: { type: 'string' },
          batchNo: { type: 'string' },
          unit: { type: 'string' },
          quantity: { type: 'number' },
          lastTransactionAt: { type: 'string' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderNo: { type: 'string' },
          customerName: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'approved', 'cancelled'] },
          dueDate: { type: 'string' },
          items: { type: 'array', items: { type: 'object' } }
        }
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          actorId: { type: 'string' },
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          details: { type: 'object' },
          createdAt: { type: 'string' }
        }
      },
      ProcessTask: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderId: { type: 'string' },
          processName: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'rework'] },
          outputQuantity: { type: 'number' },
          defectQuantity: { type: 'number' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/v1/auth/login': {
      post: {
        tags: ['Identity'],
        security: [],
        summary: '登录并获取访问令牌',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
        },
        responses: { '200': { description: '登录成功' }, '401': { description: '用户名或密码错误' } }
      }
    },
    '/api/v1/auth/logout': { post: { tags: ['Identity'], summary: '退出登录', responses: { '200': { description: '退出成功' } } } },
    '/api/v1/users': {
      get: { tags: ['Identity'], summary: '查询用户列表', responses: { '200': { description: '用户列表' } } },
      post: { tags: ['Identity'], summary: '创建用户', responses: { '201': { description: '创建成功' } } }
    },
    '/api/v1/roles': {
      get: { tags: ['Identity'], summary: '查询角色列表', responses: { '200': { description: '角色列表' } } },
      post: { tags: ['Identity'], summary: '创建角色', responses: { '201': { description: '创建成功' } } }
    },
    '/api/v1/permissions': { get: { tags: ['Identity'], summary: '查询权限点', responses: { '200': { description: '权限列表' } } } },
    '/api/v1/audit-logs': { get: { tags: ['Audit'], summary: '查询审计日志', responses: { '200': { description: '审计日志列表' } } } },
    '/api/v1/material-inbounds': {
      get: { tags: ['MaterialInbound'], summary: '查询材料入库单', responses: { '200': { description: '入库单列表' } } },
      post: { tags: ['MaterialInbound'], summary: '创建材料入库单', responses: { '201': { description: '创建成功' } } }
    },
    '/api/v1/material-inbounds/{id}': {
      get: {
        tags: ['MaterialInbound'],
        summary: '查询入库单详情',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '入库单详情' }, '404': { description: '入库单不存在' } }
      }
    },
    '/api/v1/material-inbounds/{id}/approve': {
      post: {
        tags: ['MaterialInbound'],
        summary: '审核入库单',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '审核成功' }, '400': { description: '状态不允许审核' } }
      }
    },
    '/api/v1/material-inbounds/{id}/confirm': {
      post: {
        tags: ['MaterialInbound'],
        summary: '确认入库并生成库存流水',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '确认成功' }, '400': { description: '状态不允许确认' } }
      }
    },
    '/api/v1/inventory-transactions': { get: { tags: ['MaterialInbound'], summary: '查询库存流水', responses: { '200': { description: '库存流水列表' } } } },
    '/api/v1/inventory-balances': { get: { tags: ['MaterialInbound'], summary: '查询库存余额', responses: { '200': { description: '库存余额列表' } } } },
    '/api/v1/orders': {
      get: { tags: ['OrderEntry'], summary: '查询订单列表', responses: { '200': { description: '订单列表' } } },
      post: { tags: ['OrderEntry'], summary: '创建订单', responses: { '201': { description: '创建成功' } } }
    },
    '/api/v1/orders/{id}': {
      get: { tags: ['OrderEntry'], summary: '查询订单详情', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '订单详情' } } },
      patch: { tags: ['OrderEntry'], summary: '更新订单', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '更新成功' } } }
    },
    '/api/v1/orders/{id}/approve': { post: { tags: ['OrderEntry'], summary: '审核订单', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '审核成功' } } } },
    '/api/v1/orders/{id}/cancel': { post: { tags: ['OrderEntry'], summary: '取消订单', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '取消成功' } } } },
    '/api/v1/orders/{id}/generate-process-tasks': { post: { tags: ['OrderEntry', 'ProcessFlow'], summary: '从已审核订单生成工序任务', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: '生成成功' }, '400': { description: '订单状态不允许或已生成' } } } },
    '/api/v1/process-routes': {
      get: { tags: ['ProcessFlow'], summary: '查询工艺路线', responses: { '200': { description: '工艺路线列表' } } },
      post: { tags: ['ProcessFlow'], summary: '创建工艺路线', responses: { '201': { description: '创建成功' } } }
    },
    '/api/v1/process-tasks': {
      get: { tags: ['ProcessFlow'], summary: '查询工序任务', responses: { '200': { description: '工序任务列表' } } },
      post: { tags: ['ProcessFlow'], summary: '创建工序任务', responses: { '201': { description: '创建成功' } } }
    },
    '/api/v1/process-tasks/{id}/start': { post: { tags: ['ProcessFlow'], summary: '工序开工', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '开工成功' } } } },
    '/api/v1/process-tasks/{id}/complete': { post: { tags: ['ProcessFlow'], summary: '工序完工', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '完工成功' } } } },
    '/api/v1/process-tasks/{id}/rework': { post: { tags: ['ProcessFlow'], summary: '工序返工', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: '返工成功' } } } },
    '/api/v1/reports/material-inbound-summary': { get: { tags: ['Reports'], summary: '入库统计报表', responses: { '200': { description: '报表数据' } } } },
    '/api/v1/reports/order-progress': { get: { tags: ['Reports'], summary: '订单进度报表', responses: { '200': { description: '报表数据' } } } },
    '/api/v1/reports/process-capacity': { get: { tags: ['Reports'], summary: '工序产能报表', responses: { '200': { description: '报表数据' } } } },
    '/api/v1/reports/quality-rate': { get: { tags: ['Reports'], summary: '良率分析报表', responses: { '200': { description: '报表数据' } } } },
    '/api/v1/reports/inventory-balance': { get: { tags: ['Reports'], summary: '库存余额报表', responses: { '200': { description: '报表数据' } } } },
    '/api/v1/openapi.json': { get: { tags: ['Reports'], security: [], summary: '获取 OpenAPI 契约', responses: { '200': { description: 'OpenAPI JSON 文档' } } } }
  }
};
