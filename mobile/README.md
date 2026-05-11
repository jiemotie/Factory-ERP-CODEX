# Android Mobile Client

Android 端用于移动仓库作业、现场扫码、工序报工和管理看板等场景。

## 数据访问原则

- 通过 `backend/` 统一 API 访问数据。
- 可使用本地缓存提升体验，但不得作为权威数据源。
- 离线提交必须经过后端校验与确认后才视为生效。

## 建议技术栈

Kotlin 原生、Flutter 或 React Native 均可。当前目录保留 `src/` 作为后续移动端工程入口。
