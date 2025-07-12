document.addEventListener('DOMContentLoaded', function () {
    // 文章容器
    const articleContainer = document.getElementById('articleContainer');
    const articleTitle = document.getElementById('articleTitle');
    const articleContent = document.getElementById('articleContent');
    const articleDate = document.getElementById('articleDate');
    const articleAuthor = document.getElementById('articleAuthor');

    // 评论区域
    const commentInput = document.getElementById('commentInput');
    const commentSubmit = document.getElementById('commentSubmit');
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');

    // 加载文章
    function loadArticle(articlePath) {
        fetch(articlePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`加载文章失败: ${response.status}`);
                }
                return response.text();
            })
            .then(htmlContent => {
                // 解析HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, 'text/html');

                // 提取元数据
                const title = doc.querySelector('title')?.textContent || '未知文章标题';
                const metaDate = doc.querySelector('meta[name="date"]')?.content || '未知日期';
                const metaAuthor = doc.querySelector('meta[name="author"]')?.content || '未知作者';

                // 提取文章内容
                const contentElement = doc.getElementById('article-content');
                if (!contentElement) {
                    throw new Error('文章内容容器未找到');
                }
                const content = contentElement.innerHTML;

                // 更新UI
                articleTitle.textContent = title;
                articleDate.textContent = metaDate;
                articleAuthor.textContent = metaAuthor;
                articleContent.innerHTML = content;

                // 显示文章容器
                articleContainer.style.display = 'block';
                articleContainer.scrollIntoView({ behavior: 'smooth' });

                // 加载评论
                loadComments(articlePath);
            })
            .catch(error => {
                console.error('加载文章出错:', error);
                articleContent.innerHTML = `<p class="error">加载文章错误: ${error.message}</p>`;
                articleContainer.style.display = 'block';
            });
    }

    // 加载评论
    function loadComments(articlePath) {
        const articleKey = `comments_${btoa(articlePath)}`;
        const comments = JSON.parse(localStorage.getItem(articleKey)) || [];
        commentsCount.textContent = comments.length;
        commentsList.innerHTML = '';

        comments.forEach(comment => {
            const commentElement = createCommentElement(comment);
            commentsList.appendChild(commentElement);
            
            // 加载回复
            if (comment.replies && comment.replies.length > 0) {
                const repliesContainer = document.createElement('div');
                repliesContainer.className = 'replies-container';
                comment.replies.forEach(reply => {
                    repliesContainer.appendChild(createCommentElement(reply));
                });
                commentElement.appendChild(repliesContainer);
            }
        });
    }

    // 创建评论元素
    function createCommentElement(comment) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        const isAuthor = currentUser && currentUser.id === comment.userId;
        const isAdmin = currentUser && currentUser.isAdmin;
        
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        commentElement.dataset.id = comment.id;
        
        commentElement.innerHTML = `
            <div class="comment-header">
                <img src="${comment.avatarUrl || 'https://www.gravatar.com/avatar/000?d=mp'}" 
                     alt="${comment.author}" class="comment-avatar">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-time">${comment.time}</div>
                ${currentUser ? `<button class="reply-btn" data-id="${comment.id}">回复</button>` : ''}
                ${(isAuthor || isAdmin) ? `<button class="delete-btn" data-id="${comment.id}">删除</button>` : ''}
            </div>
            <div class="comment-text">${comment.content}</div>
            <div class="reply-form" id="replyForm-${comment.id}" style="display:none;">
                <textarea class="comment-input" placeholder="回复${comment.author}..."></textarea>
                <button class="submit-reply" data-id="${comment.id}">提交回复</button>
            </div>
        `;
        
        return commentElement;
    }

    // 保存评论
    function saveComment(articlePath, comment, parentId = null) {
        const articleKey = `comments_${btoa(articlePath)}`;
        const comments = JSON.parse(localStorage.getItem(articleKey)) || [];
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        
        const newComment = {
            id: Date.now().toString(),
            author: currentUser ? currentUser.username : '匿名用户',
            userId: currentUser ? currentUser.id : null,
            time: new Date().toLocaleString(),
            content: comment,
            avatarUrl: currentUser ? currentUser.avatarUrl : 'https://www.gravatar.com/avatar/000?d=mp',
            parentId,
            replies: []
        };
        
        // 如果是回复，添加到父评论
        if (parentId) {
            const parentComment = findComment(comments, parentId);
            if (parentComment) {
                parentComment.replies.push(newComment);
            }
        } else {
            comments.unshift(newComment);
        }
        
        localStorage.setItem(articleKey, JSON.stringify(comments));
        loadComments(articlePath);
    }
    
    // 递归查找评论
    function findComment(comments, id) {
        for (const comment of comments) {
            if (comment.id === id) return comment;
            if (comment.replies && comment.replies.length > 0) {
                const found = findComment(comment.replies, id);
                if (found) return found;
            }
        }
        return null;
    }
    
    // 删除评论
    function deleteComment(articlePath, id) {
        const articleKey = `comments_${btoa(articlePath)}`;
        const comments = JSON.parse(localStorage.getItem(articleKey)) || [];
        
        // 递归删除评论
        function removeComment(arr, targetId) {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].id === targetId) {
                    arr.splice(i, 1);
                    return true;
                }
                if (arr[i].replies && arr[i].replies.length > 0) {
                    if (removeComment(arr[i].replies, targetId)) {
                        return true;
                    }
                }
            }
            return false;
        }
        
        if (removeComment(comments, id)) {
            localStorage.setItem(articleKey, JSON.stringify(comments));
            loadComments(articlePath);
        }
    }

    // 文章点击事件
    document.querySelectorAll('.project-header h2, .read-more-btn').forEach(element => {
        element.addEventListener('click', function () {
            const articlePath = this.getAttribute('data-article');
            loadArticle(articlePath);
        });
    });

    // 评论提交事件
    if (commentSubmit) {
        commentSubmit.addEventListener('click', function () {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const articlePath = document.querySelector('.read-more-btn[data-article]')?.getAttribute('data-article');

            if (!articlePath) {
                alert('请先选择一篇文章');
                return;
            }

            const content = commentInput.value.trim();
            if (!content) {
                alert('评论内容不能为空');
                return;
            }

            if (!currentUser) {
                alert('请登录后再评论');
                document.getElementById('authModal').style.display = 'flex';
                return;
            }

            saveComment(articlePath, content);
            commentInput.value = '';
        });
    }
    
    // 评论列表事件委托（回复、删除）
    if (commentsList) {
        commentsList.addEventListener('click', function(e) {
            const articlePath = document.querySelector('.read-more-btn[data-article]')?.getAttribute('data-article');
            if (!articlePath) return;
            
            // 回复按钮
            if (e.target.classList.contains('reply-btn')) {
                const commentId = e.target.dataset.id;
                const replyForm = document.getElementById(`replyForm-${commentId}`);
                replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
            }
            
            // 提交回复
            if (e.target.classList.contains('submit-reply')) {
                const commentId = e.target.dataset.id;
                const textarea = e.target.previousElementSibling;
                const content = textarea.value.trim();
                
                if (!content) {
                    alert('回复内容不能为空');
                    return;
                }
                
                if (!currentUser) {
                    alert('请登录后再回复');
                    document.getElementById('authModal').style.display = 'flex';
                    return;
                }
                
                saveComment(articlePath, content, commentId);
                textarea.value = '';
            }
            
            // 删除评论
            if (e.target.classList.contains('delete-btn')) {
                if (confirm('确定要删除这条评论吗？')) {
                    const commentId = e.target.dataset.id;
                    deleteComment(articlePath, commentId);
                }
            }
        });
    }
});
// 加载文章列表
function loadArticles() {
    const articleList = document.getElementById('articleList');
    const articles = JSON.parse(localStorage.getItem('articles')) || [];
    
    if (articles.length === 0) {
        articleList.innerHTML = '<p>暂无文章</p>';
        return;
    }
    
    articleList.innerHTML = '';
    
    articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article-item';
        articleElement.innerHTML = `
            <div class="article-header">
                <h4>${article.title}</h4>
                <span>${article.date}</span>
            </div>
            <p class="article-summary">${article.summary}</p>
            <div class="article-actions">
                <a href="articles/article.html?id=${article.id}" class="edit-btn">查看</a>
                <button class="delete-btn" data-id="${article.id}">删除</button>
            </div>
        `;
        articleList.appendChild(articleElement);
    });
    
    // 添加删除事件监听
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const articleId = this.dataset.id;
            if (confirm('确定要删除这篇文章吗？')) {
                deleteArticle(articleId);
            }
        });
    });
}