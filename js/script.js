// User Database (Simulated with LocalStorage)
class UserDatabase {
    constructor() {
        this.users = this.loadUsers();
    }

    loadUsers() {
        const stored = localStorage.getItem('users');
        return stored ? JSON.parse(stored) : [];
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    userExists(email) {
        return this.users.some(user => user.email === email);
    }

    addUser(userData) {
        if (this.userExists(userData.email)) {
            return { success: false, message: 'Email đã tồn tại!' };
        }

        const newUser = {
            id: Date.now(),
            ...userData,
            createdAt: new Date().toISOString(),
            joinedCourses: [],
            achievements: []
        };

        this.users.push(newUser);
        this.saveUsers();
        return { success: true, message: 'Đăng kí thành công!', user: newUser };
    }

    getUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    verifyPassword(user, password) {
        // Simple password verification (in production, use hashing)
        return user.password === password;
    }
}

// Initialize Database
const db = new UserDatabase();

// Classes and Materials Database
class ClassDatabase {
    constructor() {
        this.classes = this.loadClasses();
        this.materials = this.loadMaterials();
    }

    loadClasses() {
        const stored = localStorage.getItem('classes');
        return stored ? JSON.parse(stored) : [];
    }

    saveClasses() {
        localStorage.setItem('classes', JSON.stringify(this.classes));
    }

    loadMaterials() {
        const stored = localStorage.getItem('materials');
        return stored ? JSON.parse(stored) : [];
    }

    saveMaterials() {
        localStorage.setItem('materials', JSON.stringify(this.materials));
    }

    generateClassCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Check if code already exists
        if (this.classes.find(c => c.classCode === code)) {
            return this.generateClassCode();
        }
        return code;
    }

    addClass(classData) {
        const newClass = {
            id: Date.now(),
            ...classData,
            classCode: this.generateClassCode(),
            createdAt: new Date().toISOString(),
            students: [],
            materialsCount: 0
        };
        this.classes.push(newClass);
        this.saveClasses();
        return newClass;
    }

    addMaterial(materialData) {
        const newMaterial = {
            id: Date.now(),
            ...materialData,
            createdAt: new Date().toISOString()
        };
        this.materials.push(newMaterial);
        this.saveMaterials();
        
        // Update materials count for class
        const classObj = this.classes.find(c => c.id === materialData.classId);
        if (classObj) {
            classObj.materialsCount++;
            this.saveClasses();
        }
        
        return newMaterial;
    }

    getClassesByTeacher(teacherId) {
        return this.classes.filter(c => c.teacherId === teacherId);
    }

    getMaterialsByClass(classId) {
        return this.materials.filter(m => m.classId === classId);
    }

    getClassByCode(code) {
        return this.classes.find(c => c.classCode === code.toUpperCase());
    }

    addStudentToClass(classId, studentId, studentName) {
        const classObj = this.classes.find(c => c.id === classId);
        if (classObj && !classObj.students.find(s => s.id === studentId)) {
            classObj.students.push({ id: studentId, name: studentName, joinedAt: new Date().toISOString() });
            this.saveClasses();
            return true;
        }
        return false;
    }

    getClassesByStudent(studentId) {
        return this.classes.filter(c => c.students.some(s => s.id === studentId));
    }
}

const classDB = new ClassDatabase();

// Current Logged-in User
let currentUser = null;

// Form Navigation
function navigateTo(form) {
    console.log('navigateTo called with:', form);
    if (form === 'login') {
        switchForm('login');
    } else if (form === 'register') {
        switchForm('register');
    }
}

function switchForm(formType) {
    console.log('switchForm called with:', formType);
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (formType === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        clearForm('login-form');
    } else if (formType === 'register') {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        clearForm('register-form');
    }
}

// Clear Form
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.querySelector('form').reset();
    }
}

// Show Alert
function showAlert(message, type = 'error') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <strong>${type === 'error' ? '⚠️' : '✅'}</strong> ${message}
    `;

    const authSection = document.getElementById('auth-section');
    authSection.insertBefore(alert, authSection.firstChild);

    // Auto remove after 4 seconds
    setTimeout(() => {
        alert.remove();
    }, 4000);
}

// Validate Email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate Password Strength
function getPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', score: 1 };
    if (strength <= 3) return { level: 'medium', score: 2 };
    return { level: 'strong', score: 3 };
}

// Update Password Strength Indicator
function updatePasswordStrength(passwordInput) {
    const password = passwordInput.value;
    const strength = getPasswordStrength(password);

    // Create strength bar if it doesn't exist
    let strengthBar = passwordInput.parentElement.querySelector('.password-strength');
    if (!strengthBar) {
        strengthBar = document.createElement('div');
        strengthBar.className = 'password-strength';
        strengthBar.innerHTML = '<div class="strength-bar"></div>';
        passwordInput.parentElement.appendChild(strengthBar);
    }

    if (password.length > 0) {
        strengthBar.classList.add('show');
        const bar = strengthBar.querySelector('.strength-bar');
        bar.className = `strength-bar ${strength.level}`;
    } else {
        strengthBar.classList.remove('show');
    }
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    console.log('handleLogin called');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log('Login attempt:', email);

    // Validate inputs
    if (!email || !password) {
        showAlert('Vui lòng nhập email và mật khẩu!', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showAlert('Email không hợp lệ!', 'error');
        return;
    }

    // Check user exists
    const user = db.getUserByEmail(email);
    if (!user) {
        showAlert('Email hoặc mật khẩu không chính xác!', 'error');
        return;
    }

    // Verify password
    if (!db.verifyPassword(user, password)) {
        showAlert('Email hoặc mật khẩu không chính xác!', 'error');
        return;
    }

    // Login successful
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    showAlert(`Chào mừng trở lại, ${user.name}! 🎉`, 'success');

    // Update navbar to show user info
    updateNavbarForLoggedInUser(user);

    // Redirect to dashboard after 1 second
    setTimeout(() => {
        showDashboard();
    }, 1500);
}

// Handle Register
function handleRegister(event) {
    event.preventDefault();
    console.log('handleRegister called');

    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const age = parseInt(document.getElementById('reg-age').value);
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm').value;
    const termsAccepted = document.getElementById('terms').checked;

    console.log('Register attempt:', name, email);

    // Validate inputs
    if (!name || !email || !age || !password || !confirmPassword) {
        showAlert('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showAlert('Email không hợp lệ!', 'error');
        return;
    }

    if (age < 5 || age > 18) {
        showAlert('Tuổi phải từ 5 đến 18 tuổi!', 'error');
        return;
    }

    if (password.length < 8) {
        showAlert('Mật khẩu phải có ít nhất 8 ký tự!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Mật khẩu không khớp!', 'error');
        return;
    }

    const strength = getPasswordStrength(password);
    if (strength.score < 2) {
        showAlert('Mật khẩu quá yếu! Vui lòng sử dụng chữ hoa, chữ số và ký tự đặc biệt.', 'error');
        return;
    }

    if (!termsAccepted) {
        showAlert('Vui lòng chấp nhận điều khoản dịch vụ!', 'error');
        return;
    }

    // Check if email exists
    if (db.userExists(email)) {
        showAlert('Email này đã được đăng kí. Vui lòng chọn email khác!', 'error');
        return;
    }

    // Register user
    const result = db.addUser({
        name,
        email,
        age,
        password
    });

    if (result.success) {
        showAlert('🎉 Đăng kí thành công! Chào mừng bạn đến với Leaf Village!', 'success');

        // Auto login
        currentUser = result.user;
        localStorage.setItem('currentUser', JSON.stringify(result.user));

        // Update navbar to show user info
        updateNavbarForLoggedInUser(result.user);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            showDashboard();
        }, 2000);
    } else {
        showAlert(result.message, 'error');
    }
}

// Show Dashboard
function showDashboard() {
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');

    authSection.style.display = 'none';
    dashboardSection.classList.remove('hidden');

    // Update user name
    document.getElementById('user-name').textContent = currentUser.name;

    // Animate course cards
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Handle Logout
function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');

        // Update navbar back to login buttons
        updateNavbarForLoggedOutUser();

        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');

        dashboardSection.classList.add('hidden');
        authSection.style.display = 'flex';

        // Clear all forms
        clearForm('login-form');
        clearForm('register-form');

        // Show login form
        switchForm('login');

        showAlert('Đã đăng xuất thành công! Hẹn gặp lại bạn! 👋', 'success');
    }
}

// Check if user is already logged in
function checkLogin() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        showDashboard();
    }
}

// Event Listeners for Password Strength
document.addEventListener('DOMContentLoaded', function() {
    // Password strength listener
    const regPasswordInput = document.getElementById('reg-password');
    if (regPasswordInput) {
        regPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this);
        });
    }

    // Check login on page load
    checkLogin();

    // Add Enter key support for forms
    document.getElementById('login-form').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });

    document.getElementById('register-form').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleRegister(e);
        }
    });

    // Add course button listeners
    const courseButtons = document.querySelectorAll('.btn-course');
    courseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseName = this.parentElement.querySelector('h3').textContent;
            showAlert(`Bạn sắp bắt đầu khóa học: ${courseName}! 🚀`, 'success');
        });
    });
});

// Prevent form submission with Enter on input fields
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.ninja-form input');
    inputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !this.closest('form').querySelector('button[type="submit"]').contains(this)) {
                e.preventDefault();
            }
        });
    });

    // Initialize Flying Ninjas with images
    initializeNinjas();
    
    // Create shuriken elements
    createShuriken();
});

// Initialize Flying Ninjas with Character Images
function initializeNinjas() {
    const ninjaImages = [
        'images/00.png',
        'images/01.png',
        'images/10.png',
        'images/11.png',
        'images/20.png',
        'images/21.png',
        'images/00.jpg',
        'images/10.jpg',
        'images/20.jpg'
    ];

    // For 'star' behavior: use gentle starMotion with twinkle effect
    ninjaImages.forEach((imgSrc, idx) => {
        const ninja = document.createElement('div');
        ninja.className = 'flying-ninja';
        ninja.style.opacity = '0.98';

        // create an <img> inside to guarantee rendering
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `ninja-${idx}`;
        ninja.appendChild(img);

        // set starting position (off-screen left) and a random vertical position
        ninja.style.left = '-140px';
        ninja.style.top = `${10 + Math.floor(Math.random() * 70)}%`;
        ninja.style.pointerEvents = 'none';

        // durations and delays tuned for star-like movement
        const duration = (10 + Math.random() * 18).toFixed(1); // 10 - 28s
        const twinkleDur = (2 + Math.random() * 2).toFixed(2); // 2 - 4s
        const delay = (Math.random() * 6).toFixed(2);

        // Use starMotion + twinkle
        ninja.style.animation = `starMotion ${duration}s linear ${delay}s infinite, twinkle ${twinkleDur}s ease-in-out ${delay}s infinite`;

        // slight scale variation for depth
        const scale = 0.8 + Math.random() * 0.6; // 0.8 - 1.4
        ninja.style.transform = `scale(${scale})`;

        // hint to browser for smoother transforms
        ninja.style.willChange = 'transform, opacity, left, top';

        // z-index for layering - ensure above shuriken
        ninja.style.zIndex = 10 + Math.floor(Math.random() * 10);

        document.body.appendChild(ninja);
    });
}

// Create Shuriken Elements
function createShuriken() {
    for (let i = 0; i < 3; i++) {
        const shuriken = document.createElement('div');
        shuriken.className = 'shuriken';
        shuriken.innerHTML = '⭐';
        shuriken.style.fontSize = '40px';
        shuriken.style.animationDelay = `${i * 3}s`;
        document.body.appendChild(shuriken);
    }
}

// Update Navbar for Logged In User
function updateNavbarForLoggedInUser(user) {
    const navButtons = document.getElementById('nav-buttons');
    const userInfo = document.getElementById('user-info');
    
    // Hide login/register buttons
    navButtons.style.display = 'none';
    
    // Show user info
    userInfo.style.display = 'flex';
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
}

// Update Navbar for Logged Out User
function updateNavbarForLoggedOutUser() {
    const navButtons = document.getElementById('nav-buttons');
    const userInfo = document.getElementById('user-info');
    
    // Show login/register buttons
    navButtons.style.display = 'flex';
    
    // Hide user info
    userInfo.style.display = 'none';
}
// Teacher Dashboard Functions
function showTeacherDashboard() {
    if (!currentUser) {
        showAlert('Vui lòng đăng nhập trước!', 'error');
        return;
    }

    // Hide dashboard and auth sections
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'none';
    
    // Show teacher section
    document.getElementById('teacher-section').style.display = 'block';
    
    // Load teacher's classes
    loadTeacherClasses();
    populateClassSelectors();
}

function backToDashboard() {
    // Hide teacher section
    document.getElementById('teacher-section').style.display = 'none';
    
    // Show dashboard
    document.getElementById('dashboard-section').style.display = 'block';
}

function createClass(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showAlert('Vui lòng đăng nhập!', 'error');
        return;
    }
    
    const className = document.getElementById('class-name').value;
    const subject = document.getElementById('class-subject').value;
    const description = document.getElementById('class-description').value;
    
    const newClass = classDB.addClass({
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        className,
        subject,
        description
    });
    
    showAlert(`Lớp "${className}" đã được tạo thành công! 🎉\nMã lớp: ${newClass.classCode}`, 'success');
    
    // Reset form
    event.target.reset();
    
    // Reload classes display
    loadTeacherClasses();
    populateClassSelectors();
}

function switchUploadTab(type) {
    const videoTab = document.getElementById('video-tab');
    const docTab = document.getElementById('doc-tab');
    const videoForm = document.getElementById('video-upload-form');
    const docForm = document.getElementById('doc-upload-form');
    
    if (type === 'video') {
        videoTab.classList.add('active');
        docTab.classList.remove('active');
        videoForm.style.display = 'block';
        docForm.style.display = 'none';
    } else {
        docTab.classList.add('active');
        videoTab.classList.remove('active');
        docForm.style.display = 'block';
        videoForm.style.display = 'none';
    }
}

function uploadVideo(event) {
    event.preventDefault();
    
    const classId = parseInt(document.getElementById('video-class').value);
    const title = document.getElementById('video-title').value;
    const url = document.getElementById('video-url').value;
    const description = document.getElementById('video-description').value;
    
    if (!classId) {
        showAlert('Vui lòng chọn lớp học!', 'error');
        return;
    }
    
    // Validate YouTube URL
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        showAlert('Vui lòng nhập link YouTube hợp lệ!', 'error');
        return;
    }
    
    classDB.addMaterial({
        classId,
        type: 'video',
        title,
        url,
        description,
        uploadedBy: currentUser.name
    });
    
    showAlert(`Video "${title}" đã được thêm thành công! 📹`, 'success');
    
    // Reset form
    event.target.reset();
    
    // Reload classes
    loadTeacherClasses();
}

function uploadDocument(event) {
    event.preventDefault();
    
    const classId = parseInt(document.getElementById('doc-class').value);
    const title = document.getElementById('doc-title').value;
    const fileInput = document.getElementById('doc-file');
    const description = document.getElementById('doc-description').value;
    
    if (!classId) {
        showAlert('Vui lòng chọn lớp học!', 'error');
        return;
    }
    
    if (!fileInput.files || !fileInput.files[0]) {
        showAlert('Vui lòng chọn file!', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Read file as base64 for storage
    const reader = new FileReader();
    reader.onload = function(e) {
        classDB.addMaterial({
            classId,
            type: 'document',
            title,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: e.target.result,
            description,
            uploadedBy: currentUser.name
        });
        
        showAlert(`Tài liệu "${title}" đã được tải lên thành công! 📄`, 'success');
        
        // Reset form
        event.target.reset();
        
        // Reload classes
        loadTeacherClasses();
    };
    
    reader.readAsDataURL(file);
}

function loadTeacherClasses() {
    if (!currentUser) return;
    
    const classes = classDB.getClassesByTeacher(currentUser.id);
    const classesGrid = document.getElementById('classes-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (classes.length === 0) {
        classesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    classesGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    classesGrid.innerHTML = classes.map(classObj => `
        <div class="class-card">
            <div class="class-card-header">
                <h3>${classObj.className}</h3>
                <span class="class-subject">${classObj.subject}</span>
            </div>
            <p class="class-description">${classObj.description}</p>
            <div class="class-code-display">
                <span>Mã lớp: <strong>${classObj.classCode}</strong></span>
            </div>
            <div class="class-stats">
                <span>👥 ${classObj.students.length} học sinh</span>
                <span>📚 ${classObj.materialsCount} tài liệu</span>
            </div>
            <button class="btn-primary" onclick="viewClassDetails(${classObj.id})">
                Xem Chi Tiết
            </button>
        </div>
    `).join('');
}

function populateClassSelectors() {
    if (!currentUser) return;
    
    const classes = classDB.getClassesByTeacher(currentUser.id);
    const videoClassSelect = document.getElementById('video-class');
    const docClassSelect = document.getElementById('doc-class');
    
    const options = classes.map(c => 
        `<option value="${c.id}">${c.className} (${c.subject})</option>`
    ).join('');
    
    videoClassSelect.innerHTML = '<option value="">-- Chọn lớp --</option>' + options;
    docClassSelect.innerHTML = '<option value="">-- Chọn lớp --</option>' + options;
}

function viewClassDetails(classId) {
    const classObj = classDB.classes.find(c => c.id === classId);
    if (!classObj) return;
    
    const materials = classDB.getMaterialsByClass(classId);
    
    alert(`Lớp: ${classObj.className}\nMôn: ${classObj.subject}\nHọc sinh: ${classObj.students.length}\nTài liệu: ${materials.length}\n\nClick OK để xem chi tiết tài liệu!`);
    
    if (materials.length > 0) {
        const materialsList = materials.map(m => 
            `${m.type === 'video' ? '📹' : '📄'} ${m.title} (${new Date(m.createdAt).toLocaleDateString('vi-VN')})`
        ).join('\n');
        alert(`Danh sách tài liệu:\n\n${materialsList}`);
    }
}

// Student Dashboard Functions
function showStudentDashboard() {
    if (!currentUser) {
        showAlert('Vui lòng đăng nhập trước!', 'error');
        return;
    }

    // Hide dashboard and auth sections
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'none';
    
    // Show student section
    document.getElementById('student-section').style.display = 'block';
    
    // Load student's classes
    loadStudentClasses();
}

function joinClass(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showAlert('Vui lòng đăng nhập!', 'error');
        return;
    }
    
    const classCode = document.getElementById('join-code').value.toUpperCase();
    
    if (!classCode) {
        showAlert('Vui lòng nhập mã lớp!', 'error');
        return;
    }
    
    const classObj = classDB.getClassByCode(classCode);
    
    if (!classObj) {
        showAlert('Mã lớp không đúng! Vui lòng kiểm tra lại.', 'error');
        return;
    }
    
    // Check if already joined
    if (classObj.students.some(s => s.id === currentUser.id)) {
        showAlert('Bạn đã tham gia lớp này rồi!', 'error');
        return;
    }
    
    classDB.addStudentToClass(classObj.id, currentUser.id, currentUser.name);
    
    showAlert(`Đã tham gia lớp "${classObj.className}" thành công! 🎉`, 'success');
    
    // Reset form
    event.target.reset();
    
    // Reload classes
    loadStudentClasses();
}

function loadStudentClasses() {
    if (!currentUser) return;
    
    const classes = classDB.getClassesByStudent(currentUser.id);
    const classesGrid = document.getElementById('student-classes-grid');
    const emptyState = document.getElementById('student-empty-state');
    
    if (classes.length === 0) {
        classesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    classesGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    classesGrid.innerHTML = classes.map(classObj => {
        const materials = classDB.getMaterialsByClass(classObj.id);
        return `
            <div class="class-card">
                <div class="class-card-header">
                    <h3>${classObj.className}</h3>
                    <span class="class-subject">${classObj.subject}</span>
                </div>
                <p class="class-description">${classObj.description}</p>
                <div class="class-info">
                    <span>👨‍🏫 GV: ${classObj.teacherName}</span>
                </div>
                <div class="class-stats">
                    <span>👥 ${classObj.students.length} học sinh</span>
                    <span>📚 ${materials.length} tài liệu</span>
                </div>
                <button class="btn-primary" onclick="viewStudentClassDetails(${classObj.id})">
                    Vào Lớp
                </button>
            </div>
        `;
    }).join('');
}

function viewStudentClassDetails(classId) {
    const classObj = classDB.classes.find(c => c.id === classId);
    if (!classObj) return;
    
    const materials = classDB.getMaterialsByClass(classId);
    
    if (materials.length === 0) {
        alert(`Lớp: ${classObj.className}\nGiáo viên: ${classObj.teacherName}\n\nChưa có tài liệu nào!`);
        return;
    }
    
    const materialsList = materials.map(m => {
        if (m.type === 'video') {
            return `📹 ${m.title}\n   Link: ${m.url}`;
        } else {
            return `📄 ${m.title}\n   File: ${m.fileName}`;
        }
    }).join('\n\n');
    
    alert(`Lớp: ${classObj.className}\nGiáo viên: ${classObj.teacherName}\n\nTài liệu:\n\n${materialsList}`);
}
// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateNavbarForLoggedInUser(currentUser);
    }
});


