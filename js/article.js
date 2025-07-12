document.addEventListener('DOMContentLoaded', function () {
    // 获取DOM元素
    const commentInput = document.getElementById('commentInput');
    const commentSubmit = document.getElementById('commentSubmit');
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

    // 加载评论
    function loadComments() {
        const articleKey = `comments_${btoa(window.location.pathname)}`;
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
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        commentElement.dataset.id = comment.id;
        
        // 检查当前用户是否是评论作者或管理员
        const isAuthor = currentUser && currentUser.id === comment.userId;
        const isAdmin = currentUser && currentUser.isAdmin;
        
        // 添加管理员标识（如果评论者是管理员）
        const adminBadge = comment.isAdmin ? '<span class="admin-badge" title="管理员">👑</span>' : '';
        
        commentElement.innerHTML = `
            <div class="comment-header">
                <img src="${comment.avatarUrl || 'https://www.gravatar.com/avatar/000?d=mp'}" 
                     alt="${comment.author}" class="comment-avatar">
                <div class="comment-author">${comment.author} ${adminBadge}</div>
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
    function saveComment(comment, parentId = null) {
        const articleKey = `comments_${btoa(window.location.pathname)}`;
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
            replies: [],
            // 新增：保存管理员状态
            isAdmin: currentUser ? currentUser.isAdmin : false
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
        loadComments();
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
    function deleteComment(id) {
        const articleKey = `comments_${btoa(window.location.pathname)}`;
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
            loadComments();
        }
    }

    // 评论提交事件
    if (commentSubmit) {
        commentSubmit.addEventListener('click', function () {
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
            
            saveComment(content);
            commentInput.value = '';
        });
    }
    
    // 事件委托处理回复和删除
    commentsList.addEventListener('click', function(e) {
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
            
            saveComment(content, commentId);
            textarea.value = '';
        }
        
        // 删除评论
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('确定要删除这条评论吗？')) {
                const commentId = e.target.dataset.id;
                deleteComment(commentId);
            }
        }
    });

    // 页面加载时加载评论
    loadComments();
});