const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// 中间件设置
app.use(cors()); // 启用CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 打印所有请求的日志
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// 文件上传配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 获取文件扩展名
        const ext = path.extname(file.originalname).toLowerCase();
        // 检查文件类型
        if (!['.xlsx', '.xls', '.pdf', '.png', '.jpg', '.jpeg'].includes(ext)) {
            return cb(new Error('不支持的文件格式'));
        }
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 限制文件大小为 10MB
    }
});

// 管理员账户配置
const ADMINS_FILE = 'admins.json';

// 初始化管理员账号
function initAdmins() {
    if (!fs.existsSync(ADMINS_FILE)) {
        const defaultAdmins = [
            { username: 'admin1', password: 'password1' },
            { username: 'admin2', password: 'password2' }
        ];
        fs.writeFileSync(ADMINS_FILE, JSON.stringify(defaultAdmins, null, 2));
    }
}

// 读取管理员账号
function readAdmins() {
    try {
        return JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
    } catch (err) {
        console.error('读取管理员账号失败:', err);
        return [];
    }
}

// 保存管理员账号
function saveAdmins(admins) {
    try {
        fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
        return true;
    } catch (err) {
        console.error('保存管理员账号失败:', err);
        return false;
    }
}

// 初始化管理员账号
initAdmins();

// 登录路由
app.post('/api/login', (req, res) => {
    console.log('收到登录请求:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
        console.log('用户名或密码为空');
        return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }

    const admins = readAdmins();
    const admin = admins.find(a => a.username === username && a.password === password);
    
    if (admin) {
        console.log('登录成功:', username);
        res.json({ success: true });
    } else {
        console.log('登录失败:', username);
        res.status(401).json({ success: false, error: '用户名或密码错误' });
    }
});

// 获取管理员列表
app.get('/api/admins', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';
    
    // 从文件读取管理员列表
    fs.readFile(ADMINS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('读取管理员文件失败:', err);
            return res.status(500).json({ success: false, message: '读取管理员列表失败' });
        }

        try {
            const admins = JSON.parse(data);
            
            // 如果有搜索关键词，进行过滤
            let filteredAdmins = admins;
            if (searchQuery) {
                filteredAdmins = admins.filter(admin => 
                    admin.username.toLowerCase().includes(searchQuery)
                );
            }
            
            const totalItems = filteredAdmins.length;
            const totalPages = Math.ceil(totalItems / pageSize);
            
            // 确保页码在有效范围内
            const validPage = Math.max(1, Math.min(page, totalPages));
            
            // 计算当前页的数据范围
            const startIndex = (validPage - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, totalItems);
            
            // 获取当前页的数据
            const currentPageAdmins = filteredAdmins.slice(startIndex, endIndex);
            
            console.log('管理员列表分页信息:', {
                totalItems,
                totalPages,
                currentPage: validPage,
                pageSize,
                startIndex,
                endIndex,
                itemsInCurrentPage: currentPageAdmins.length,
                searchQuery
            });

            res.json({
                success: true,
                admins: currentPageAdmins,
                currentPage: validPage,
                totalPages
            });
        } catch (error) {
            console.error('解析管理员数据失败:', error);
            res.status(500).json({ success: false, message: '解析管理员数据失败' });
        }
    });
});

// 添加管理员
app.post('/api/admins', (req, res) => {
    try {
        const { username, password } = req.body;
        const admins = readAdmins();

        if (admins.some(admin => admin.username === username)) {
            return res.status(400).json({ success: false, error: '用户名已存在' });
        }

        admins.push({ username, password });
        if (saveAdmins(admins)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: '保存管理员失败' });
        }
    } catch (err) {
        console.error('添加管理员失败:', err);
        res.status(500).json({ success: false, error: '添加管理员失败' });
    }
});

// 更新管理员
app.put('/api/admins/:username', (req, res) => {
    try {
        const { username } = req.params;
        const { password } = req.body;
        const admins = readAdmins();

        const index = admins.findIndex(admin => admin.username === username);
        if (index === -1) {
            return res.status(404).json({ success: false, error: '管理员不存在' });
        }

        admins[index].password = password;
        if (saveAdmins(admins)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: '更新管理员失败' });
        }
    } catch (err) {
        console.error('更新管理员失败:', err);
        res.status(500).json({ success: false, error: '更新管理员失败' });
    }
});

// 删除管理员
app.delete('/api/admins/:username', (req, res) => {
    try {
        const { username } = req.params;
        const admins = readAdmins();

        const index = admins.findIndex(admin => admin.username === username);
        if (index === -1) {
            return res.status(404).json({ success: false, error: '管理员不存在' });
        }

        // 不允许删除默认管理员
        if (username === 'admin1' || username === 'admin2') {
            return res.status(403).json({ success: false, error: '不能删除默认管理员' });
        }

        admins.splice(index, 1);
        if (saveAdmins(admins)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: '删除管理员失败' });
        }
    } catch (err) {
        console.error('删除管理员失败:', err);
        res.status(500).json({ success: false, error: '删除管理员失败' });
    }
});

// 获取船期表列表
app.get('/api/schedules', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
        return res.json({ 
            success: true,
            schedules: [],
            totalPages: 1,
            currentPage: 1
        });
    }

    const files = fs.readdirSync(uploadDir);
    const activeSchedule = getActiveSchedule();
    
    // 获取日期筛选参数
    console.log('筛选参数:', { startDate, endDate });

    const schedules = files
        .filter(file => file !== 'active-schedule.txt') // 排除激活状态文件
        .map(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            const uploadTime = stats.mtime;
            
            console.log('文件:', file, '上传时间:', uploadTime.toISOString());
            
            // 根据日期筛选
            if (startDate) {
                const startDateStart = new Date(startDate);
                startDateStart.setHours(0, 0, 0, 0);
                
                if (uploadTime < startDateStart) {
                    console.log('文件早于开始日期:', file);
                    return null;
                }
            }
            
            if (endDate) {
                const endDateEnd = new Date(endDate);
                endDateEnd.setHours(23, 59, 59, 999);
                
                if (uploadTime > endDateEnd) {
                    console.log('文件晚于结束日期:', file);
                    return null;
                }
            }
            
            return {
                name: file,
                path: `/uploads/${file}`,
                uploadTime: uploadTime.toISOString(),
                isActive: file === activeSchedule
            };
        })
        .filter(schedule => schedule !== null);

    // 按上传时间降序排序
    schedules.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

    const totalItems = schedules.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // 确保页码在有效范围内
    const validPage = Math.max(1, Math.min(page, totalPages));
    
    // 计算当前页的数据范围
    const startIndex = (validPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    
    // 获取当前页的数据
    const currentPageSchedules = schedules.slice(startIndex, endIndex);
    
    console.log('船期表分页信息:', {
        totalItems,
        totalPages,
        currentPage: validPage,
        pageSize,
        startIndex,
        endIndex,
        itemsInCurrentPage: currentPageSchedules.length
    });

    res.json({
        success: true,
        schedules: currentPageSchedules,
        currentPage: validPage,
        totalPages
    });
});

// 上传船期表
app.post('/api/upload', upload.single('schedule'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: '没有上传文件' });
    }

    res.json({
        success: true,
        file: {
            name: req.file.filename,
            path: `/uploads/${req.file.filename}`
        }
    });
});

// 激活船期表
app.post('/api/schedules/:name/activate', (req, res) => {
    try {
        const { name } = req.params;
        const uploadDir = 'public/uploads';
        const filePath = path.join(uploadDir, name);

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: '文件不存在' });
        }

        // 更新当前使用的船期表
        const activeSchedulePath = path.join(uploadDir, 'active-schedule.txt');
        fs.writeFileSync(activeSchedulePath, name);

        res.json({ success: true });
    } catch (err) {
        console.error('激活船期表失败:', err);
        res.status(500).json({ success: false, error: '激活船期表失败' });
    }
});

// 获取当前使用的船期表
function getActiveSchedule() {
    try {
        const activeSchedulePath = path.join('public/uploads', 'active-schedule.txt');
        if (fs.existsSync(activeSchedulePath)) {
            return fs.readFileSync(activeSchedulePath, 'utf8').trim();
        }
        return null;
    } catch (err) {
        console.error('获取当前使用的船期表失败:', err);
        return null;
    }
}

// 创建上传目录
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 