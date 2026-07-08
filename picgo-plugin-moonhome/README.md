# picgo-plugin-moonhome

MoonHome 项目专用 PicGo 图床插件，将图片上传至 [XiaYue9009/picgo_moonhome](https://github.com/XiaYue9009/picgo_moonhome) 仓库，并通过 jsDelivr CDN 生成外链。

## 安装

1. 安装 [PicGo](https://picgo.app/) 桌面客户端
2. 在 PicGo 中安装本插件：

```bash
picgo install ./picgo-plugin-moonhome
```

或从 GitHub 克隆后本地安装：

```bash
git clone https://github.com/XiaYue9009/picgo_moonhome.git
cd picgo_moonhome
picgo install .
```

## 配置

在 PicGo → 图床设置 → MoonHome 图床：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 仓库名 | `XiaYue9009/picgo_moonhome` | GitHub 仓库 |
| 分支 | `main` | 存储分支 |
| 路径 | `img/` | 文件前缀目录 |
| 自定义域名 | 留空 | 留空时使用 jsDelivr |
| Token | — | GitHub Personal Access Token（需 `repo` 权限） |

## 与 MoonHome 站点联动

1. 在 PicGo 设置中开启 **Server**，默认监听 `127.0.0.1:36677`
2. 将 MoonHome 图床设为当前图床
3. 本地运行 `pnpm dev` 后，Markdown 编辑器会通过 HTTP API 调用 PicGo 上传图片

详见 [PicGo 进阶用法 - PicGo-Server](https://docs.picgo.app/gui/guide/advance)。

## 外链格式

默认：

```
https://cdn.jsdelivr.net/gh/XiaYue9009/picgo_moonhome@main/img/{filename}
```

Markdown 示例：

```markdown
![screenshot](https://cdn.jsdelivr.net/gh/XiaYue9009/picgo_moonhome@main/img/example.png)
```
