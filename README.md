# Bilibili 字幕上传工具

这是一个用于将字幕上传到 Bilibili 的命令行工具。该工具使用 Node.js 和 Playwright 实现。

## 安装

在使用此工具之前，请确保已安装 [Node.js](https://nodejs.org/) 和 [npm](https://www.npmjs.com/)。然后，您需要安装必要的 npm 包：

```bash
npm install axios playwright
```

接下来，安装 Playwright 所需的浏览器：

```bash
npx playwright install
```

## 准备工作

1. **准备 `cookies.json` 文件**：  
   您需要一个包含 Bilibili 登录状态的 `cookies.json` 文件。该文件应包含您的会话信息，以便工具可以自动登录并上传字幕。文件格式如下：

   ```json
   [
       {
           "name": "SESSDATA",
           "value": "your_sessdata_value",
           "domain": ".bilibili.com",
           "path": "/",
           "httpOnly": true,
           "secure": true,
           "expires": 1672531199
       },
       // 其他 cookie 项
   ]
   ```

2. **准备字幕文件**：  
   确保您有一个要上传的字幕文件，并记下其路径。

## 使用方法

在命令行中运行以下命令：

```bash
node index.js [bvid] [subtitlePath]
```

- `[bvid]`：要上传字幕的视频的 BVID。
- `[subtitlePath]`：字幕文件的路径。

例如：

```bash
node index.js BVxxxx D:\Desktop\30s.srt
```

## 注意事项

- 确保 `cookies.json` 文件位于与 `index.js` 相同的目录中，或者在代码中指定正确的路径。
- 确保字幕文件路径正确，并且文件存在。

## 许可证

MIT License
