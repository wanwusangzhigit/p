const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const path = require('path');

// 配置Octokit客户端
const octokit = new Octokit({
    auth: process.env.MY_GITHUB_TOKEN
});

async function main() {
    const args = process.argv.slice(2);
    const options = parseArgs(args);
    
    switch (options.action) {
        case 'publish':
            await publishArticle(options);
            break;
        case 'update':
            await updateArticle(options);
            break;
        case 'delete':
            await deleteArticle(options);
            break;
        default:
            console.error('无效的操作类型');
            process.exit(1);
    }
}

async function publishArticle(options) {
    if (!options.title || !options.content) {
        console.error('发布文章需要标题和内容');
        process.exit(1);
    }
    
    const articleId = generateArticleId();
    const articleData = {
        id: articleId,
        title: options.title,
        publishDate: new Date().toISOString().split('T')[0],
        content: options.content
    };
    
    const articlePath = `${options.path}/${articleId}.json`;
    await saveArticleToRepo(articlePath, articleData);
    
    console.log(`文章发布成功，保存路径: ${articlePath}`);
}

async function updateArticle(options) {
    if (!options.articleId) {
        console.error('更新文章需要文章ID');
        process.exit(1);
    }
    
    if (!options.title && !options.content) {
        console.error('至少需要提供标题或内容进行更新');
        process.exit(1);
    }
    
    const articlePath = `${options.path}/${options.articleId}.json`;
    let articleData = await getArticleFromRepo(articlePath);
    
    if (!articleData) {
        console.error('文章未找到');
        process.exit(1);
    }
    
    if (options.title) articleData.title = options.title;
    if (options.content) articleData.content = options.content;
    
    await saveArticleToRepo(articlePath, articleData);
    console.log(`文章更新成功，保存路径: ${articlePath}`);
}

async function deleteArticle(options) {
    if (!options.articleId) {
        console.error('删除文章需要文章ID');
        process.exit(1);
    }
    
    const articlePath = `${options.path}/${options.articleId}.json`;
    await deleteArticleFromRepo(articlePath);
    console.log(`文章删除成功，删除路径: ${articlePath}`);
}

async function getArticleFromRepo(path) {
    try {
        const response = await octokit.rest.repos.getContent({
            owner: 'wanwusangzhigit',
            repo: 'wanwusangzhi',
            path: path,
            ref: 'main'
        });
        
        const content = Buffer.from(response.data.content, 'base64').toString();
        return JSON.parse(content);
    } catch (error) {
        if (error.status === 404) {
            return null;
        }
        throw error;
    }
}

async function saveArticleToRepo(path, data) {
    const content = Buffer.from(JSON.stringify(data)).toString('base64');
    
    try {
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: 'wanwusangzhigit',
            repo: 'wanwusangzhi',
            path: path,
            message: `更新文章: ${data.title}`,
            content: content,
            branch: 'main'
        });
    } catch (error) {
        console.error('保存文章失败:', error);
        process.exit(1);
    }
}

async function deleteArticleFromRepo(path) {
    try {
        const file = await octokit.rest.repos.getContent({
            owner: 'wanwusangzhigit',
            repo: 'wanwusangzhi',
            path: path,
            ref: 'main'
        });
        
        await octokit.rest.repos.deleteFile({
            owner: 'wanwusangzhigit',
            repo: 'wanwusangzhi',
            path: path,
            message: '删除文章',
            sha: file.data.sha,
            branch: 'main'
        });
    } catch (error) {
        console.error('删除文章失败:', error);
        process.exit(1);
    }
}

function generateArticleId() {
    return Math.random().toString(36).substr(2, 9);
}

function parseArgs(args) {
    const options = {
        action: null,
        articleId: null,
        title: null,
        content: null,
        path: 'articles' // 默认路径
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--action') {
            options.action = args[i + 1];
        } else if (args[i] === '--articleId') {
            options.articleId = args[i + 1];
        } else if (args[i] === '--title') {
            options.title = args[i + 1];
        } else if (args[i] === '--content') {
            options.content = args[i + 1];
        } else if (args[i] === '--path') {
            options.path = args[i + 1];
        }
    }
    
    return options;
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
