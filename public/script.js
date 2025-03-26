// 首页 - 加载文章列表
document.addEventListener('DOMContentLoaded', function() {
    fetchArticles();
});

// 获取文章列表
async function fetchArticles() {
    try {
        const response = await fetch('https://api.github.com/repos/wanwusangzhigit/wanwusangzhi/contents/articles');
        if (!response.ok) {
            throw new Error('获取文章列表失败');
        }
        const data = await response.json();
        
        const articles = data.map(item => {
            return fetchArticleDetail(item.download_url);
        });
        
        const articleDetails = await Promise.all(articles);
        
        const container = document.getElementById('articles-container');
        container.innerHTML = '';
        
        articleDetails.forEach(article => {
            if (article) {
                const articleElement = document.createElement('div');
                articleElement.className = 'article-item';
                articleElement.innerHTML = `
                    <h2>${article.title}</h2>
                    <p class="publish-date">发布于: ${article.publishDate}</p>
                    <p>${article.preview}</p>
                    <a href="/article-detail.html?id=${article.id}" class="read-more">阅读更多</a>
                `;
                container.appendChild(articleElement);
            }
        });
    } catch (error) {
        console.error(error);
        showError('获取文章列表失败，请稍后再试');
    }
}

// 文章详情页
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在文章详情页
    if (window.location.pathname === '/article-detail.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        if (articleId) {
            fetchArticleDetail(articleId);
            setupArticleActions();
        } else {
            showError('无效的文章ID');
        }
    }
});

// 获取文章详情
async function fetchArticleDetail(articleId) {
    try {
        const response = await fetch(`https://api.github.com/repos/wanwusangzhigit/wanwusangzhi/contents/articles/${articleId}.json`);
        if (!response.ok) {
            throw new Error('文章未找到');
        }
        const data = await response.json();
        const articleContent = await fetch(data.download_url);
        const article = await articleContent.json();
        
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('publish-date').textContent = `发布于: ${article.publishDate}`;
        document.getElementById('article-content').innerHTML = article.content;
    } catch (error) {
        console.error(error);
        showError('获取文章详情失败，请稍后再试');
    }
}

// 设置文章操作事件
function setupArticleActions() {
    // 编辑按钮点击事件
    document.getElementById('edit-btn').addEventListener('click', function() {
        enterEditMode();
    });
    
    // 保存按钮点击事件
    document.getElementById('save-btn').addEventListener('click', function() {
        saveArticleChanges();
    });
    
    // 取消按钮点击事件
    document.getElementById('cancel-btn').addEventListener('click', function() {
        exitEditMode();
    });
    
    // 删除按钮点击事件
    document.getElementById('delete-btn').addEventListener('click', function() {
        showDeleteConfirmation();
    });
}

// 进入编辑模式
function enterEditMode() {
    const articleContainer = document.querySelector('.article-container');
    const titleElement = document.getElementById('article-title');
    const contentElement = document.getElementById('article-content');
    
    // 创建编辑框
    const editTitle = document.createElement('input');
    editTitle.type = 'text';
    editTitle.value = titleElement.textContent;
    editTitle.className = 'edit-title';
    editTitle.style.width = '100%';
    editTitle.style.padding = '0.5rem';
    editTitle.style.marginBottom = '1rem';
    editTitle.style.backgroundColor = '#2c3e50';
    editTitle.style.color = '#ffffff';
    editTitle.style.border = '2px solid #00ff80';
    editTitle.style.borderRadius = '4px';
    
    // 创建路径输入框
    const pathInput = document.createElement('input');
    pathInput.type = 'text';
    pathInput.placeholder = '输入文章保存路径（可选）';
    pathInput.className = 'path-input';
    pathInput.style.width = '100%';
    pathInput.style.padding = '0.5rem';
    pathInput.style.marginBottom = '1rem';
    pathInput.style.backgroundColor = '#2c3e50';
    pathInput.style.color = '#ffffff';
    pathInput.style.border = '1px solid #00ff80';
    pathInput.style.borderRadius = '4px';
    
    // 替换标题为输入框
    titleElement.parentNode.replaceChild(editTitle, titleElement);
    
    // 创建Markdown编辑器
    const simplemde = new SimpleMDE({
        element: document.createElement("textarea"),
        autoDownloadFontAwesome: false,
        status: false,
        toolbar: false,
        previewRender: function(plainText) {
            return marked(plainText, { sanitize: true });
        }
    });
    
    // 替换内容为编辑器
    contentElement.innerHTML = '';
    contentElement.appendChild(simplemde.render());
    
    // 保存原始内容
    simplemde.value(contentElement.innerHTML);
    
    // 显示路径输入框、保存和取消按钮，隐藏编辑按钮
    contentElement.parentNode.insertBefore(pathInput, contentElement);
    document.getElementById('edit-btn').style.display = 'none';
    document.getElementById('save-btn').style.display = 'inline-block';
    document.getElementById('cancel-btn').style.display = 'inline-block';
    
    // 添加编辑模式类
    articleContainer.classList.add('edit-mode');
    
    // 聚焦到标题输入框
    editTitle.focus();
}

// 保存文章更改
function saveArticleChanges() {
    const editTitle = document.querySelector('.edit-title');
    const pathInput = document.querySelector('.path-input');
    const simplemde = document.querySelector('.CodeMirror');
    
    if (!editTitle || !simplemde) {
        showError('编辑模式未正确初始化');
        return;
    }
    
    const articleId = generateArticleId();
    const articleData = {
        id: articleId,
        title: editTitle.value,
        content: simplemde.value(),
        path: pathInput.value || 'articles' // 默认路径为 'articles'
    };
    
    // 触发GitHub Actions工作流
    triggerGitHubAction(articleData);
    
    // 重置编辑模式
    exitEditMode();
    showSuccess('文章保存成功并已提交');
}

// 触发GitHub Actions工作流
function triggerGitHubAction(articleData) {
    // 在实际应用中，这里应该通过GitHub API触发工作流
    console.log('触发GitHub Actions工作流:', articleData);
    
    // 模拟触发工作流
    setTimeout(() => {
        console.log('GitHub Actions工作流已触发');
    }, 1000);
}

// 退出编辑模式
function exitEditMode() {
    const articleContainer = document.querySelector('.article-container');
    const editTitle = document.querySelector('.edit-title');
    const pathInput = document.querySelector('.path-input');
    const simplemde = document.querySelector('.CodeMirror');
    
    // 恢复标题
    const titleElement = document.createElement('h1');
    titleElement.id = 'article-title';
    titleElement.textContent = editTitle.value;
    titleElement.style.color = '#00ff80';
    
    editTitle.parentNode.replaceChild(titleElement, editTitle);
    
    // 恢复内容
    const contentElement = document.getElementById('article-content');
    contentElement.innerHTML = simplemde ? simplemde.value() : '';
    
    // 移除路径输入框
    if (pathInput) {
        pathInput.remove();
    }
    
    // 隐藏保存和取消按钮，显示编辑按钮
    document.getElementById('edit-btn').style.display = 'inline-block';
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('cancel-btn').style.display = 'none';
    
    // 移除编辑模式类
    articleContainer.classList.remove('edit-mode');
}

// 显示删除确认对话框
function showDeleteConfirmation() {
    // 创建确认对话框
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    
    const confirmDialogContent = document.createElement('div');
    confirmDialogContent.className = 'confirm-dialog-content';
    
    const message = document.createElement('p');
    message.textContent = '确定要删除这篇文章吗？此操作不可撤销。';
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定删除';
    confirmButton.style.backgroundColor = '#e74c3c';
    confirmButton.style.color = '#ffffff';
    confirmButton.addEventListener('click', function() {
        // 在实际应用中，这里应该触发GitHub Action来删除文章
        showSuccess('文章删除成功');
        setTimeout(function() {
            window.location.href = '/'; // 返回首页
        }, 1500);
        confirmDialog.remove();
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.style.backgroundColor = '#666';
    cancelButton.style.color = '#ffffff';
    cancelButton.addEventListener('click', function() {
        confirmDialog.remove();
    });
    
    confirmDialogContent.appendChild(message);
    confirmDialogContent.appendChild(confirmButton);
    confirmDialogContent.appendChild(cancelButton);
    confirmDialog.appendChild(confirmDialogContent);
    
    document.body.appendChild(confirmDialog);
}

// 显示成功消息
function showSuccess(message) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = message;
    successMessage.style.position = 'fixed';
    successMessage.style.top = '20px';
    successMessage.style.right = '20px';
    successMessage.style.padding = '10px 15px';
    successMessage.style.backgroundColor = '#00ff80';
    successMessage.style.color = '#1e272e';
    successMessage.style.borderRadius = '4px';
    successMessage.style.zIndex = '1000';
    
    document.body.appendChild(successMessage);
    
    setTimeout(function() {
        successMessage.remove();
    }, 3000);
}

// 显示错误消息
function showError(message) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    errorMessage.style.position = 'fixed';
    errorMessage.style.top = '20px';
    errorMessage.style.right = '20px';
    errorMessage.style.padding = '10px 15px';
    errorMessage.style.backgroundColor = '#e74c3c';
    errorMessage.style.color = '#ffffff';
    errorMessage.style.borderRadius = '4px';
    errorMessage.style.zIndex = '1000';
    
    document.body.appendChild(errorMessage);
    
    setTimeout(function() {
        errorMessage.remove();
    }, 3000);
}

// 生成文章ID
function generateArticleId() {
    return Math.random().toString(36).substr(2, 9);
}
