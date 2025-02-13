// 引入必要的模块
import axios from 'axios';
import { firefox } from 'playwright';
import fs from 'fs';

// 从 JSON 文件中加载 cookies
function loadCookiesFromJson(filePath) {
    const cookies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        expires: cookie.expirationDate ? Math.floor(cookie.expirationDate) : -1
    }));
}

// 创建一个函数来检查稿件是否存在并获取 cid，支持重试机制
async function checkVideoExistsAndGetCid(bvid, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // 调用 Bilibili API
            const response = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
            
            // 检查 API 返回的 code 是否为 0，表示成功
            if (response.data.code === 0) {
                // 返回 cid
                return response.data.data.cid;
            } else {
                // 如果 code 不是 0，抛出错误
                throw new Error('稿件不存在或无法获取 cid');
            }
        } catch (error) {
            // 捕获并处理错误
            console.error(`Error fetching video data (attempt ${attempt + 1}):`, error.message);
            if (attempt === retries - 1) {
                return null;
            }
        }
    }
}

// 使用 Playwright 执行字幕上传
async function performSubtitleUpload(bvid, cid, cookies, subtitlePath) {
    const browser = await firefox.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        // 先打开 www.bilibili.com
        await page.goto('https://www.bilibili.com');
        console.log('已打开 www.bilibili.com');

        // 加载 cookies 并刷新页面
        await context.addCookies(cookies);
        await page.reload();
        console.log('已加载 cookies 并刷新页面');

        // 跳转到字幕编辑页面
        const url = `https://member.bilibili.com/platform/zimu/my-zimu/zimu-editor?bvid=${bvid}&cid=${cid}`;
        await page.goto(url);
        console.log(`已跳转到页面: ${url}`);

        // 切换到 iframe
        const frameElement = await page.waitForSelector('#root iframe');
        const frame = await frameElement.contentFrame();

        // 等待下拉列表出现并选择 "中文（简体）"
        await frame.waitForSelector('.language-selector .el-select-dropdown', { timeout: 10000 });
        await frame.locator('.language-selector .el-select-dropdown .el-select-dropdown__item span:has-text("中文（简体）")').click();
        console.log('已选择下拉列表中的 "中文（简体）"');

        // 上传字幕文件
        const fileInput = await frame.waitForSelector('input[type="file"]', { state: 'attached', timeout: 10000 });
        await fileInput.setInputFiles(subtitlePath); // 使用传入的字幕路径
        console.log('字幕文件已上传');

        // 监听 URL 变化
        const [newPage] = await Promise.all([
            page.waitForEvent('framenavigated'), // 等待页面导航事件
            frame.locator('.save-tool button:has-text("提交")').click() // 点击"提交"按钮
        ]);

        // 检查 URL 是否变化
        if (newPage.url() !== url) {
            console.log('提交成功，URL 已变化:', newPage.url());
            return true;
        } else {
            console.log('提交失败，URL 未变化');
            return false;
        }
    } catch (error) {
        console.error('操作时出错:', error);
        return false;
    } finally {
        await browser.close();
        console.log('浏览器已关闭');
    }
}

// 主函数
async function uploadSubtitle(bvid, subtitlePath) {
    const cid = await checkVideoExistsAndGetCid(bvid);
    if (cid) {
        console.log(`稿件存在，cid 为: ${cid}`);
        const cookies = loadCookiesFromJson('cookies.json'); // 请替换为实际的 cookies 文件路径
        const success = await performSubtitleUpload(bvid, cid, cookies, subtitlePath); // 传入字幕文件路径
        return success;
    } else {
        console.log('无法获取到 cid，不能上传字幕。');
        return false;
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.log('用法: node index.js [bvid] [subtitlePath]');
    process.exit(1);
}

const [bvid, subtitlePath] = args;
uploadSubtitle(bvid, subtitlePath).then(success => {
    if (success) {
        console.log('字幕上传成功');
    } else {
        console.log('字幕上传失败');
    }
});
