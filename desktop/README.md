# Windows Desktop Client

Windows 桌面端用于车间、仓库或办公室场景下的本地操作入口。

## 数据访问原则

- 通过 `backend/` 统一 API 访问数据。
- 离线缓存如需支持，必须具备同步冲突处理策略，并以后端确认为最终状态。
- 不直接访问数据库，避免与 Web、Android 端产生数据不一致。

## 建议技术栈

WPF、WinUI、Electron 或 Avalonia 均可。当前目录保留 `src/` 作为后续桌面端工程入口。
