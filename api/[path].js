// api/[path].js - Vercel Serverless Function

// 定义你的 GitHub 用户名、仓库名和分支名
const GITHUB_USER = "caijuemou"; // <<<< 替换为你的GitHub用户名
const GITHUB_REPO = "tvbox";       // <<<< 替换为你的GitHub仓库名
const GITHUB_BRANCH = "main";         // <<<< 替换为你的分支名 (通常是 main 或 master)

// GitHub Raw 内容的基础 URL
const GITHUB_RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

// Vercel Serverless Function 的入口函数
module.exports = async (request, response) => {
  const url = new URL(request.url);
  // 对于 Vercel 的动态路由 [path].js，实际路径在 request.query.path
  // 如果是 /api/tvbox.json，那么 request.query.path 就是 tvbox.json
  const requestedPath = request.query.path ? `/${request.query.path}` : '/';

  // 获取当前 Worker 的基础 URL，不包含路径部分
  const workerBaseUrl = url.origin; // 例如 "https://tvbox-github-proxy.yourusername.workers.dev"

  // --- 1. 处理根路径 /api/ 或者其他未匹配的路径 (显示一个无关紧要的欢迎页) ---
  if (requestedPath === '/') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.status(200).send(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TVBox 配置代理</title>
          <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; color: #333; }
              h1 { color: #007bff; }
              p { font-size: 1.1em; }
              code { background-color: #eee; padding: 2px 4px; border-radius: 4px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>欢迎使用 TVBox 配置代理服务！</h1>
              <p>这个页面主要用于代理 GitHub 上的 TVBox 配置和相关文件。</p>
              <p>你可以通过在Tvbox配置地址填入以下信息：</p>
              <ul>
                  <li><code>${workerBaseUrl}/api/tvbox.json</code></li>
              </ul>
              <p>本GitHub 仓库是公开的。</p>
              <p>祝您观影愉快！</p>
          </div>
      </body>
      </html>
    `);
    return;
  }

  // 构建完整的 GitHub Raw 文件 URL
  const githubFileUrl = GITHUB_RAW_BASE_URL + requestedPath;

  try {
    // 发起请求到 GitHub 获取文件内容
    const githubResponse = await fetch(githubFileUrl);

    // 检查 GitHub 响应是否成功
    if (!githubResponse.ok) {
      response.status(githubResponse.status).send(`Error fetching from GitHub: ${githubResponse.statusText}`);
      return;
    }

    // --- 3. 根据文件后缀名设置正确的 Content-Type ---
    const filename = requestedPath.split('/').pop(); // 获取文件名 (如 tvbox.json, xxx.js)
    let contentType = 'application/octet-stream'; // 默认通用二进制流

    if (filename.endsWith('.json')) {
      contentType = 'application/json; charset=utf-8';
    } else if (filename.endsWith('.js')) {
      contentType = 'application/javascript; charset=utf-8';
    } else if (filename.endsWith('.txt')) {
      contentType = 'text/plain; charset=utf-8';
    } else if (filename.endsWith('.xml')) {
      contentType = 'application/xml; charset=utf-8';
    }
    // 你可以根据需要添加更多文件类型的判断

    response.setHeader('Content-Type', contentType);
    response.status(200).send(await githubResponse.text()); // Vercel 函数通常用 .send() 发送文本

  } catch (error) {
    response.status(500).send(`Internal server error: ${error.message}`);
  }
};
