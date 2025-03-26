document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded'); // 调试日志
    
    // 检查登录状态
    checkLoginStatus();

    // 加载船期表
    loadActiveSchedule();

    // 检查元素是否存在后再添加事件监听
    const uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('click', uploadSchedule);
    }

    // 为导航栏的登录按钮添加事件监听
    const navLoginButton = document.querySelector('.main-nav .btn-outline-primary');
    if (navLoginButton) {
        navLoginButton.addEventListener('click', function() {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        });
    }

    // 为登录模态框中的登录按钮添加事件监听
    const modalLoginButton = document.querySelector('#loginModal .btn-primary');
    if (modalLoginButton) {
        modalLoginButton.addEventListener('click', handleLogin);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const adminNav = document.querySelector('.admin-nav');

    if (isLoggedIn) {
        if (loginButton) loginButton.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'inline-block';
        if (adminNav) adminNav.style.display = 'block';
    } else {
        if (loginButton) loginButton.style.display = 'inline-block';
        if (logoutButton) logoutButton.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none';
    }
}

// 加载当前使用的船期表
function loadActiveSchedule() {
    fetch('/api/schedules')
        .then(response => response.json())
        .then(data => {
            const activeSchedule = data.schedules.find(s => s.isActive);
            if (activeSchedule) {
                const scheduleContainer = document.querySelector('.schedule-image');
                if (scheduleContainer) {
                    const fileExtension = activeSchedule.path.split('.').pop().toLowerCase();
                    
                    // 清空容器
                    scheduleContainer.innerHTML = '';
                    
                    if (fileExtension === 'pdf') {
                        // 创建 iframe 显示 PDF
                        const iframe = document.createElement('iframe');
                        iframe.src = activeSchedule.path;
                        iframe.style.width = '100%';
                        iframe.style.height = '800px';
                        iframe.style.border = 'none';
                        scheduleContainer.appendChild(iframe);
                    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                        // Excel 文件提供下载链接
                        scheduleContainer.innerHTML = `
                            <div class="alert alert-info">
                                <h4>当前船期表为 Excel 文件</h4>
                                <p>请点击下方按钮下载查看</p>
                                <a href="${activeSchedule.path}" class="btn btn-primary" download>
                                    下载船期表
                                </a>
                            </div>
                        `;
                    } else {
                        // 图片文件直接显示
                        const img = document.createElement('img');
                        img.src = activeSchedule.path;
                        img.className = 'img-fluid';
                        img.alt = '船期表';
                        scheduleContainer.appendChild(img);
                    }
                }
            }
        })
        .catch(error => {
            console.error('加载船期表失败:', error);
        });
}

// 上传船期表
function uploadSchedule() {
    const fileInput = document.getElementById('scheduleFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('请选择要上传的文件');
        return;
    }

    const formData = new FormData();
    formData.append('schedule', file);

    const uploadButton = document.getElementById('uploadButton');
    uploadButton.disabled = true;
    uploadButton.textContent = '上传中...';

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('上传成功');
            loadActiveSchedule();
            document.getElementById('uploadModal').querySelector('.btn-close').click();
            fileInput.value = '';
        } else {
            throw new Error(data.error || '上传失败');
        }
    })
    .catch(error => {
        console.error('上传失败:', error);
        alert(error.message || '上传失败，请重试');
    })
    .finally(() => {
        uploadButton.disabled = false;
        uploadButton.textContent = '上传';
    });
}

// 处理登录
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }

    console.log('尝试登录:', username); // 调试日志

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log('收到响应:', response.status); // 调试日志
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || '登录失败');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('登录响应:', data); // 调试日志
        if (data.success) {
            localStorage.setItem('isLoggedIn', 'true');
            checkLoginStatus();
            document.getElementById('loginModal').querySelector('.btn-close').click();
            document.getElementById('loginForm').reset();
        } else {
            alert(data.error || '登录失败，请检查用户名和密码');
        }
    })
    .catch(error => {
        console.error('登录错误:', error);
        alert(error.message || '登录失败，请重试');
    });
}

// 处理退出登录
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    checkLoginStatus();
    if (window.location.pathname === '/admin.html') {
        window.location.href = '/';
    }
}

// 预览船期表
function previewSchedule(path) {
    const previewModal = document.getElementById('previewModal');
    if (!previewModal) {
        console.error('未找到预览模态框元素');
        return;
    }

    const previewContent = document.getElementById('previewContent');
    if (!previewContent) {
        console.error('未找到预览内容元素');
        return;
    }

    const modal = new bootstrap.Modal(previewModal);
    const fileExtension = path.split('.').pop().toLowerCase();

    previewContent.innerHTML = '';

    if (fileExtension === 'png' || fileExtension === 'jpg' || fileExtension === 'jpeg') {
        const img = document.createElement('img');
        img.src = path;
        img.className = 'preview-image';
        previewContent.appendChild(img);
    } else if (fileExtension === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = path;
        iframe.className = 'preview-pdf';
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        previewContent.appendChild(iframe);
    } else {
        // Excel文件不能直接预览，提供下载链接
        previewContent.innerHTML = `
            <div class="alert alert-info">
                Excel文件无法直接预览，请
                <a href="${path}" download class="alert-link">点击此处下载</a>
                查看内容
            </div>
        `;
    }

    modal.show();
}

// 语言翻译数据
const translations = {
    zh: {
        schedule: '船舶班期',
        heroTitle: '为欧亚大陆运送未来',
        scheduleTitle: '船期查询',
        copyright: '© 2006-2025 年俄远东船务（上海）有限公司©版权所有 隐私政策',
        wechatTitle: '扫码添加FESCO中国官方微信号',
        wechatOfficialTitle: '关注FESCO中国官方微信公众号',
        address: '上海市虹口区东大名路908号金岸大厦8F'
    },
    en: {
        schedule: 'Shipping Schedule',
        heroTitle: 'Delivering the Future for Eurasia',
        scheduleTitle: 'Schedule Inquiry',
        copyright: '© 2006-2025 FESCO Far East Shipping (Shanghai) Co., Ltd. All Rights Reserved Privacy Policy',
        wechatTitle: 'Scan to Add FESCO China Official WeChat',
        wechatOfficialTitle: 'Follow FESCO China Official WeChat Account',
        address: '8F, Jin\'an Building, 908 Dongda Ming Road, Hongkou District, Shanghai'
    },
    ru: {
        schedule: 'Расписание судов',
        heroTitle: 'Доставляем будущее в Евразию',
        scheduleTitle: 'Запрос расписания',
        copyright: '© 2006-2025 ДВМП (Шанхай) ООО. Все права защищены Политика конфиденциальности',
        wechatTitle: 'Отсканируйте, чтобы добавить официальный WeChat FESCO China',
        wechatOfficialTitle: 'Подпишитесь на официальный аккаунт WeChat FESCO China',
        address: '8F, Jin\'an Building, 908 Dongda Ming Road, район Хункоу, Шанхай'
    }
};

// 更新页面文本
function updatePageText(language) {
    console.log('Updating page text to:', language); // 调试日志
    
    // 更新导航
    const navLink = document.querySelector('.nav-link.active');
    if (navLink) {
        navLink.textContent = translations[language].schedule;
    }
    
    // 更新hero标题
    const heroTitle = document.querySelector('.hero-content h1');
    if (heroTitle) {
        heroTitle.textContent = translations[language].heroTitle;
    }
    
    // 更新船期查询标题
    const scheduleTitle = document.querySelector('.schedule-section h2');
    if (scheduleTitle) {
        scheduleTitle.textContent = translations[language].scheduleTitle;
    }
    
    // 更新页脚内容
    const copyright = document.querySelector('.copyright');
    if (copyright) {
        copyright.textContent = translations[language].copyright;
    }

    const wechatTitle = document.querySelector('.wechat');
    if (wechatTitle) {
        wechatTitle.textContent = translations[language].wechatTitle;
    }

    const wechatOfficialTitle = document.querySelector('.footer h4:not(.wechat)');
    if (wechatOfficialTitle) {
        wechatOfficialTitle.textContent = translations[language].wechatOfficialTitle;
    }

    const address = document.querySelector('.footer .contact-info p:last-child');
    if (address) {
        address.textContent = translations[language].address;
    }
}

// 初始化语言选择器
function initLanguageSelector() {
    const languageSelector = document.querySelector('.language-selector select');
    if (!languageSelector) {
        console.error('Language selector not found');
        return;
    }

    // 从localStorage获取保存的语言设置，如果没有则使用默认语言
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'zh';
    languageSelector.value = savedLanguage;
    updatePageText(savedLanguage);
    
    // 监听语言选择变化
    languageSelector.addEventListener('change', function(e) {
        const selectedLanguage = e.target.value;
        console.log('Language changed to:', selectedLanguage); // 调试日志
        localStorage.setItem('selectedLanguage', selectedLanguage);
        updatePageText(selectedLanguage);
    });
} 