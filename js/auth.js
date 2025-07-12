// 用户管理
const users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// 管理员邮箱列表
const ADMIN_EMAILS = ["2138820937@qq.com", "mingyang49570@outlook.com", "2934741099@qq.com", "nnpghm_2025@qq.com","2403691529@qq.com"];

// DOM元素
const authButtons = document.getElementById('authButtons');
const userInfo = document.getElementById('userInfo');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const registerModal = document.getElementById('registerModal');
const closeModal = document.getElementById('closeModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const loginBtn = document.getElementById('loginBtn');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginSubmit = document.getElementById('loginSubmit');
const loginStatus = document.getElementById('loginStatus');
const registerBtn = document.getElementById('registerBtn');
const registerUsername = document.getElementById('registerUsername');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerConfirm = document.getElementById('registerConfirm');
const registerSubmit = document.getElementById('registerSubmit');
const registerStatus = document.getElementById('registerStatus');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

// 密码加密
function encryptPassword(password) {
    return CryptoJS.SHA256(password).toString();
}

// 初始化页面
function initPage() {
    if (currentUser) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        usernameDisplay.textContent = currentUser.username;
        
        // 添加头像显示
        const userAvatar = document.createElement('img');
        userAvatar.src = currentUser.avatarUrl || 'https://www.gravatar.com/avatar/000?d=mp';
        userAvatar.alt = currentUser.username;
        userAvatar.className = 'user-avatar';
        userAvatar.style.width = '30px';
        userAvatar.style.height = '30px';
        userAvatar.style.borderRadius = '50%';
        userAvatar.style.marginRight = '10px';
        
        // 在用户名前插入头像
        usernameDisplay.parentNode.insertBefore(userAvatar, usernameDisplay);
        
        // 添加管理员标识（如果是管理员）
        if (currentUser.isAdmin) {
            const adminBadge = document.createElement('span');
            adminBadge.textContent = '👑';
            adminBadge.title = '管理员';
            adminBadge.style.marginLeft = '5px';
            usernameDisplay.parentNode.appendChild(adminBadge);
        }
        
        // 添加管理员面板（如果是管理员）
        if (currentUser.isAdmin) {
            const adminPanel = document.getElementById('adminPanel');
            if (!adminPanel) {
                const newAdminPanel = document.createElement('div');
                newAdminPanel.id = 'adminPanel';
                newAdminPanel.innerHTML = `
                    <button id="adminToggle" class="admin-toggle-btn">管理面板</button>
                    <div id="adminControls" style="display:none;">
                        <h3>管理员功能</h3>
                        <p>您可以删除任何评论</p>
                    </div>
                `;
                document.body.insertBefore(newAdminPanel, document.body.firstChild);
                
                document.getElementById('adminToggle').addEventListener('click', function() {
                    const controls = document.getElementById('adminControls');
                    controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
                });
            }
        }
    } else {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
        // 移除管理员面板（如果存在）
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.remove();
    }
}

// 显示状态消息
function showStatus(element, message, isSuccess) {
    element.textContent = message;
    element.className = isSuccess ? 'status-message success' : 'status-message error';
    element.style.display = 'block';
    
    // 3秒后消失
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// 登录功能
function login() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    // 验证输入
    if (!username || !password) {
        showStatus(loginStatus, '用户名和密码不能为空', false);
        return;
    }
    
    // 加密密码
    const encryptedPassword = encryptPassword(password);
    
    // 查找用户
    const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === encryptedPassword
    );
    
    if (user) {
        // 登录成功
        currentUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            isAdmin: user.isAdmin,
            joinDate: user.joinDate
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 更新UI
        initPage();
        
        // 关闭模态框
        authModal.style.display = 'none';
        
        // 清空输入
        loginUsername.value = '';
        loginPassword.value = '';
        
        showStatus(loginStatus, '登录成功！', true);
    } else {
        showStatus(loginStatus, '用户名或密码错误', false);
    }
}

// 注册功能
function register() {
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const confirm = registerConfirm.value.trim();
    const avatarUrl = document.getElementById('avatarUrl').value.trim() || 'https://www.gravatar.com/avatar/000?d=mp';
    
    // 验证输入
    if (!username || !email || !password || !confirm) {
        showStatus(registerStatus, '请填写所有必填字段', false);
        return;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showStatus(registerStatus, '请输入有效的电子邮箱', false);
        return;
    }
    
    // 验证密码是否一致
    if (password !== confirm) {
        showStatus(registerStatus, '两次输入的密码不一致', false);
        return;
    }
    
    // 检查用户是否已存在
    const userExists = users.some(u => u.username === username || u.email === email);
    if (userExists) {
        showStatus(registerStatus, '用户名或邮箱已被注册', false);
        return;
    }
    
    // 加密密码
    const encryptedPassword = encryptPassword(password);
    
    // 检查是否为管理员
    const isAdmin = ADMIN_EMAILS.includes(email);
    
    // 创建新用户
    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: encryptedPassword,
        avatarUrl,
        isAdmin,
        joinDate: new Date().toLocaleDateString()
    };
    
    // 保存用户
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // 显示成功消息
    showStatus(registerStatus, '注册成功！请登录', true);
    
    // 清空输入
    registerUsername.value = '';
    registerEmail.value = '';
    registerPassword.value = '';
    registerConfirm.value = '';
    document.getElementById('avatarUrl').value = '';
    document.getElementById('avatarPreview').src = 'https://www.gravatar.com/avatar/000?d=mp';
    
    // 切换到登录模态框
    setTimeout(() => {
        registerModal.style.display = 'none';
        authModal.style.display = 'flex';
    }, 1500);
}

// 新增：修改头像功能
function updateAvatar() {
    const newAvatarUrl = document.getElementById('newAvatarUrl').value.trim() || 
                         document.getElementById('avatarPreview').src;
    
    if (!newAvatarUrl) {
        showStatus(avatarStatus, '请上传或输入头像URL', false);
        return;
    }
    
    // 更新当前用户头像
    currentUser.avatarUrl = newAvatarUrl;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // 更新用户列表中的头像
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].avatarUrl = newAvatarUrl;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // 更新UI
    initPage();
    
    // 关闭模态框
    avatarModal.style.display = 'none';
    
    showStatus(avatarStatus, '头像更新成功！', true);
}


// 退出功能
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    initPage();
    showStatus(loginStatus, '您已成功退出', true);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    
    // 显示登录模态框
    if (loginBtn) loginBtn.addEventListener('click', function() {
        authModal.style.display = 'flex';
    });
    
    // 显示注册模态框
    if (registerBtn) registerBtn.addEventListener('click', function() {
        registerModal.style.display = 'flex';
    });
    
    // 关闭模态框
    if (closeModal) closeModal.addEventListener('click', function() {
        authModal.style.display = 'none';
    });
    
    if (closeRegisterModal) closeRegisterModal.addEventListener('click', function() {
        registerModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
    });
    
    // 登录提交
    if (loginSubmit) loginSubmit.addEventListener('click', login);
    
    // 注册提交
    if (registerSubmit) registerSubmit.addEventListener('click', register);
    
    // 切换到注册
    if (switchToRegister) switchToRegister.addEventListener('click', function(e) {
        e.preventDefault();
        authModal.style.display = 'none';
        registerModal.style.display = 'flex';
    });
    
    // 切换到登录
    if (switchToLogin) switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerModal.style.display = 'none';
        authModal.style.display = 'flex';
    });
    
    // 退出登录
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // 按Enter键提交
    if (loginUsername) loginUsername.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    if (loginPassword) loginPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    if (registerUsername) registerUsername.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
    
    if (registerPassword) registerPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
    
    if (registerConfirm) registerConfirm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
    
    // 头像上传功能
        const avatarUpload = document.getElementById('avatarUpload');
        const avatarPreview = document.getElementById('avatarPreview');
        const avatarUrlInput = document.getElementById('avatarUrl');
        const uploadBtn = document.getElementById('uploadAvatarBtn');
        
        if (avatarUpload && uploadBtn) {
            uploadBtn.addEventListener('click', function() {
                avatarUpload.click();
            });
            
            avatarUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        avatarPreview.src = event.target.result;
                        avatarUrlInput.value = event.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // 新增：修改头像按钮点击事件
        const updateAvatarBtn = document.getElementById('updateAvatarBtn');
        if (updateAvatarBtn) {
            updateAvatarBtn.addEventListener('click', function() {
                avatarModal.style.display = 'flex';
                // 设置预览为当前头像
                document.getElementById('newAvatarPreview').src = currentUser.avatarUrl;
            });
        }
        
        // 新增：关闭头像修改模态框
        const closeAvatarModal = document.getElementById('closeAvatarModal');
        if (closeAvatarModal) {
            closeAvatarModal.addEventListener('click', function() {
                avatarModal.style.display = 'none';
            });
        }
        
        // 新增：保存头像按钮点击事件
        const saveAvatarBtn = document.getElementById('saveAvatarBtn');
        if (saveAvatarBtn) {
            saveAvatarBtn.addEventListener('click', updateAvatar);
        }
        
        // 新增：头像修改模态框的上传功能
        const newAvatarUpload = document.getElementById('newAvatarUpload');
        const newAvatarPreview = document.getElementById('newAvatarPreview');
        const uploadNewAvatarBtn = document.getElementById('uploadNewAvatarBtn');
        
        if (newAvatarUpload && uploadNewAvatarBtn) {
            uploadNewAvatarBtn.addEventListener('click', function() {
                newAvatarUpload.click();
            });
            
            newAvatarUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        newAvatarPreview.src = event.target.result;
                        document.getElementById('newAvatarUrl').value = event.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            });
        }
    });
	// 在auth.js中添加注销账号功能
	function deleteAccount() {
	    if (!currentUser) return;
	    
	    // 从用户列表中删除
	    const users = JSON.parse(localStorage.getItem('users')) || [];
	    const updatedUsers = users.filter(user => user.id !== currentUser.id);
	    localStorage.setItem('users', JSON.stringify(updatedUsers));
	    
	    // 清除当前用户
	    localStorage.removeItem('currentUser');
	    currentUser = null;
	    
	    // 更新UI
	    initPage();
	    
	    // 重定向到首页
	    window.location.href = 'index.html';
	}
	
	// 在DOMContentLoaded事件中添加
	if (document.getElementById('deleteAccountBtn')) {
	    document.getElementById('deleteAccountBtn').addEventListener('click', deleteAccount);
	}