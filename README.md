# 船期信息展示系统

这是一个用于展示和管理船期信息的网站系统。用户可以上传、查看和下载船期表文件。

## 功能特点

- 支持上传 Excel、PDF 和 PNG 格式的船期表文件
- 文件列表实时更新
- 支持文件预览（PDF 和图片）
- 支持文件下载
- 响应式设计，支持移动端访问

## 技术栈

- 前端：HTML5, CSS3, JavaScript, Bootstrap 5
- 后端：Node.js, Express.js
- 文件处理：express-fileupload

## 安装说明

1. 确保已安装 Node.js（建议版本 14.0.0 或更高）

2. 克隆项目后，在项目根目录运行以下命令安装依赖：
```bash
npm install
```

3. 启动服务器：
```bash
npm start
```

4. 访问 http://localhost:3000 即可使用系统

## 使用说明

1. 查看船期表：
   - 打开网站首页即可看到已上传的船期表列表
   - 可以点击"预览"按钮查看文件内容
   - 可以点击"下载"按钮下载文件

2. 上传新船期表：
   - 点击页面上方的"上传新船期表"按钮
   - 在弹出的对话框中选择要上传的文件
   - 点击"上传"按钮完成上传

## 注意事项

- 支持的文件格式：.xlsx, .xls, .pdf, .png
- Excel 文件不支持在线预览，需要下载后查看
- 上传的文件会保存在 public/uploads 目录下

## 目录结构

```
.
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── uploads/
├── server.js
├── package.json
└── README.md
``` 