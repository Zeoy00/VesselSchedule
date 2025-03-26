document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkLoginStatus();

    // 加载船期表列表
    loadSchedules();

    // 加载管理员列表
    loadAdmins(1);

    // 上传按钮点击事件
    const uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('click', uploadSchedule);
    }

    // 筛选按钮点击事件
    const filterButton = document.getElementById('filterButton');
    if (filterButton) {
        filterButton.addEventListener('click', filterSchedules);
    }

    // 退出登录按钮点击事件
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // 保存管理员按钮点击事件
    const saveAdminButton = document.getElementById('saveAdminButton');
    if (saveAdminButton) {
        saveAdminButton.addEventListener('click', saveAdmin);
    }

    // 添加管理员按钮点击事件
    const addAdminButton = document.getElementById('addAdminButton');
    if (addAdminButton) {
        addAdminButton.addEventListener('click', () => {
            // 重置表单
            const adminForm = document.getElementById('adminForm');
            if (adminForm) {
                adminForm.reset();
            }
            // 清空隐藏的ID字段
            const adminId = document.getElementById('adminId');
            if (adminId) {
                adminId.value = '';
            }
            // 启用用户名输入框
            const adminUsername = document.getElementById('adminUsername');
            if (adminUsername) {
                adminUsername.disabled = false;
            }
            // 更新模态窗口标题
            const modalTitle = document.querySelector('#adminModal .modal-title');
            if (modalTitle) {
                modalTitle.textContent = '添加管理员';
            }
            // 显示模态窗口
            const adminModal = document.getElementById('adminModal');
            if (adminModal) {
                new bootstrap.Modal(adminModal).show();
            }
        });
    }

    // 添加搜索框事件监听
    const searchInput = document.getElementById('adminSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadAdmins(1); // 重置到第一页并重新加载
            }, 300); // 300ms 延迟，避免频繁请求
        });
    }
});

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = '/';
    }
}

// 加载船期表列表
function loadSchedules(page = 1) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // 构建查询参数
    const params = new URLSearchParams({
        page: page
    });

    // 只有当日期有值时才添加到查询参数中
    if (startDate) {
        params.append('startDate', startDate);
    }
    if (endDate) {
        params.append('endDate', endDate);
    }

    fetch(`/api/schedules?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || '加载失败');
            }

            const tbody = document.getElementById('schedulesTableBody');
            tbody.innerHTML = '';
            
            if (data.schedules && data.schedules.length > 0) {
                data.schedules.forEach(schedule => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${schedule.name}</td>
                        <td>${new Date(schedule.uploadTime).toLocaleString()}</td>
                        <td>${schedule.isActive ? '<span class="badge bg-success">当前使用</span>' : ''}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-primary btn-action" onclick="previewSchedule('${schedule.path}')">
                                    预览
                                </button>
                                <a href="${schedule.path}" class="btn btn-sm btn-success btn-action" download>
                                    下载
                                </a>
                                ${!schedule.isActive ? `
                                    <button class="btn btn-sm btn-warning btn-action" onclick="activateSchedule('${schedule.name}')">
                                        应用
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="4" class="text-center">没有找到符合条件的船期表</td>';
                tbody.appendChild(row);
            }

            // 更新分页器
            updatePagination(data.totalPages || 1, data.currentPage || 1);
        })
        .catch(error => {
            console.error('加载船期表失败:', error);
            alert(error.message || '加载船期表失败，请刷新页面重试');
        });
}

// 更新分页器
function updatePagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // 确保 totalPages 和 currentPage 是有效的数字
    totalPages = parseInt(totalPages) || 1;
    currentPage = parseInt(currentPage) || 1;

    // 上一页
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 || totalPages === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="event.preventDefault(); loadSchedules(${currentPage - 1})">
            上一页
        </a>
    `;
    pagination.appendChild(prevLi);

    // 显示当前页码和总页数
    const pageInfo = document.createElement('li');
    pageInfo.className = 'page-item disabled';
    pageInfo.innerHTML = `
        <span class="page-link">
            第 ${currentPage} 页 / 共 ${totalPages} 页
        </span>
    `;
    pagination.appendChild(pageInfo);

    // 下一页
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages || totalPages === 1 ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="event.preventDefault(); loadSchedules(${currentPage + 1})">
            下一页
        </a>
    `;
    pagination.appendChild(nextLi);
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
            loadSchedules();
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

// 预览船期表
function previewSchedule(path) {
    const fileExtension = path.split('.').pop().toLowerCase();
    
    if (fileExtension === 'png' || fileExtension === 'jpg' || fileExtension === 'jpeg') {
        window.open(path, '_blank');
    } else if (fileExtension === 'pdf') {
        window.open(path, '_blank');
    } else {
        alert('Excel文件无法预览，请下载查看');
    }
}

// 应用船期表
function activateSchedule(scheduleName) {
    if (!confirm('确定要应用这个船期表吗？')) {
        return;
    }

    fetch(`/api/schedules/${scheduleName}/activate`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('应用成功');
            loadSchedules();
        } else {
            throw new Error(data.error || '应用失败');
        }
    })
    .catch(error => {
        console.error('应用失败:', error);
        alert(error.message || '应用失败，请重试');
    });
}

// 筛选船期表
function filterSchedules() {
    // 重置到第一页
    loadSchedules(1);
}

// 退出登录
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/';
}

// 加载管理员列表
function loadAdmins(page = 1) {
    const searchQuery = document.getElementById('adminSearch').value;
    const tbody = document.getElementById('adminTableBody');
    
    if (!tbody) {
        console.error('找不到管理员表格的tbody元素');
        return;
    }
    
    // 构建查询参数
    const params = new URLSearchParams({
        page: page
    });
    
    // 如果有搜索关键词，添加到查询参数中
    if (searchQuery) {
        params.append('search', searchQuery);
    }

    fetch(`/api/admins?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || '加载失败');
            }

            tbody.innerHTML = '';
            
            if (data.admins && data.admins.length > 0) {
                data.admins.forEach(admin => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${admin.username}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-primary btn-action" onclick="editAdmin('${admin.username}')">
                                    编辑
                                </button>
                                <button class="btn btn-sm btn-danger btn-action" onclick="deleteAdmin('${admin.username}')">
                                    删除
                                </button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="2" class="text-center">没有找到管理员</td>';
                tbody.appendChild(row);
            }

            // 更新分页器
            updateAdminPagination(data.currentPage || 1, data.totalPages || 1);
        })
        .catch(error => {
            console.error('加载管理员列表失败:', error);
            alert(error.message || '加载管理员列表失败，请刷新页面重试');
        });
}

// 更新管理员分页
function updateAdminPagination(currentPage, totalPages) {
    const pagination = document.querySelector('#adminPagination');
    if (!pagination) return;

    // 确保 currentPage 和 totalPages 是有效的数字
    currentPage = parseInt(currentPage) || 1;
    totalPages = parseInt(totalPages) || 1;

    // 构建分页HTML
    let paginationHtml = `
        <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); loadAdmins(${currentPage - 1})">上一页</a>
        </li>
        <li class="page-item disabled">
            <span class="page-link">第 ${currentPage} 页 / 共 ${totalPages} 页</span>
        </li>
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); loadAdmins(${currentPage + 1})">下一页</a>
        </li>
    `;

    pagination.innerHTML = paginationHtml;
}

// 编辑管理员
function editAdmin(username) {
    document.getElementById('adminUsername').value = username;
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminId').value = username;
    document.getElementById('adminUsername').disabled = true;
    document.getElementById('adminModal').querySelector('.modal-title').textContent = '编辑管理员';
    new bootstrap.Modal(document.getElementById('adminModal')).show();
}

// 删除管理员
function deleteAdmin(username) {
    if (!confirm(`确定要删除管理员 ${username} 吗？`)) {
        return;
    }

    fetch(`/api/admins/${username}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('删除成功');
            loadAdmins();
        } else {
            throw new Error(data.error || '删除失败');
        }
    })
    .catch(error => {
        console.error('删除失败:', error);
        alert(error.message || '删除失败，请重试');
    });
}

// 保存管理员
function saveAdmin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const adminId = document.getElementById('adminId').value;

    if (!username || !password) {
        alert('请填写完整信息');
        return;
    }

    const data = {
        username,
        password
    };

    const method = adminId ? 'PUT' : 'POST';
    const url = adminId ? `/api/admins/${adminId}` : '/api/admins';

    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(adminId ? '更新成功' : '添加成功');
            loadAdmins();
            // 关闭模态窗口
            const adminModal = document.getElementById('adminModal');
            if (adminModal) {
                const modal = bootstrap.Modal.getInstance(adminModal);
                if (modal) {
                    modal.hide();
                }
            }
            // 重置表单
            const adminForm = document.getElementById('adminForm');
            if (adminForm) {
                adminForm.reset();
            }
            // 清空隐藏的ID字段
            const adminIdInput = document.getElementById('adminId');
            if (adminIdInput) {
                adminIdInput.value = '';
            }
            // 启用用户名输入框
            const adminUsername = document.getElementById('adminUsername');
            if (adminUsername) {
                adminUsername.disabled = false;
            }
            // 更新模态窗口标题
            const modalTitle = document.querySelector('#adminModal .modal-title');
            if (modalTitle) {
                modalTitle.textContent = '添加管理员';
            }
        } else {
            throw new Error(data.error || (adminId ? '更新失败' : '添加失败'));
        }
    })
    .catch(error => {
        console.error(adminId ? '更新失败:' : '添加失败:', error);
        alert(error.message || (adminId ? '更新失败，请重试' : '添加失败，请重试'));
    });
} 