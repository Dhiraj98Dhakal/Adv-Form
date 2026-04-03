// ==================== CONFIGURATION ====================
const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';
let authToken = localStorage.getItem('adminToken');
let currentStudents = [];
let currentStudentData = null;

// ==================== DOM ELEMENTS ====================
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const studentTableBody = document.getElementById('studentTableBody');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('studentModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');
const downloadPDFBtn = document.getElementById('downloadPDFBtn');
const totalStudentsEl = document.getElementById('totalStudents');
const monthlyCountEl = document.getElementById('monthlyCount');
const courseCountEl = document.getElementById('courseCount');
const loginError = document.getElementById('loginError');

// ==================== HELPER FUNCTIONS ====================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="material-icons" style="font-size: 16px; margin-right: 8px; vertical-align: middle;">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '—';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try { return new Date(dateString).toLocaleDateString('en-NP'); }
    catch { return dateString; }
}

function getPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return photoUrl;
    }
    let cleanPath = photoUrl;
    if (cleanPath.startsWith('/uploads')) {
        cleanPath = cleanPath;
    } else if (cleanPath.startsWith('uploads')) {
        cleanPath = '/' + cleanPath;
    } else {
        cleanPath = '/uploads/' + cleanPath;
    }
    return `${BASE_URL}${cleanPath}`;
}

// ==================== UPDATE STATISTICS ====================
function updateStats() {
    if (totalStudentsEl) totalStudentsEl.textContent = currentStudents.length;
    
    if (monthlyCountEl) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthly = currentStudents.filter(s => {
            const d = new Date(s.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
        monthlyCountEl.textContent = monthly;
    }
    
    if (courseCountEl) {
        const uniqueCourses = new Set(currentStudents.map(s => s.courseName).filter(c => c));
        courseCountEl.textContent = uniqueCourses.size;
    }
}

// ==================== RENDER STUDENT TABLE ====================
function renderStudentTable(students) {
    if (!studentTableBody) return;
    
    if (students.length === 0) {
        studentTableBody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="material-icons" style="font-size: 48px;">sentiment_dissatisfied</i><p>No students found</p></div></td></tr>';
        return;
    }
    
    studentTableBody.innerHTML = students.map(student => {
        const photoUrl = getPhotoUrl(student.photoUrl);
        return `
            <tr>
                <td class="photo-cell">
                    ${photoUrl ? 
                        `<img src="${photoUrl}" class="student-photo" alt="photo" 
                            onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div class=\'no-photo\'><i class=\'material-icons\'>person</i></div>';">` : 
                        `<div class="no-photo"><i class="material-icons">person</i></div>`}
                 </td>
                 <td><strong>${escapeHtml(student.fullName)}</strong></td>
                 <td>${escapeHtml(student.courseName)}</td>
                 <td>${escapeHtml(student.contactNo)}</td>
                 <td>${student.joinDate || formatDate(student.createdAt)}</td>
                <td class="action-buttons">
                    <button class="btn-view" onclick="viewStudent('${student._id}')">
                        <i class="material-icons" style="font-size: 14px;">visibility</i> View
                    </button>
                    <button class="btn-delete" onclick="deleteStudent('${student._id}')">
                        <i class="material-icons" style="font-size: 14px;">delete</i> Delete
                    </button>
                 </td>
            </tr>
        `;
    }).join('');
}

// ==================== LOAD STUDENTS FROM API ====================
async function loadStudents() {
    if (!studentTableBody) return;
    
    try {
        const response = await fetch(`${API_URL}/students`, {
            headers: { 'x-auth-token': authToken }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load students');
        }

        currentStudents = await response.json();
        updateStats();
        renderStudentTable(currentStudents);
    } catch (error) {
        console.error('Error loading students:', error);
        studentTableBody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="material-icons">error</i><p>Error loading students. Make sure backend is running.</p></div></td></tr>';
    }
}

// ==================== PRINT-FRIENDLY CYBER THEME PDF ====================
// ==================== FULL-PAGE BALANCED PRINT-FRIENDLY PDF ====================
function generatePDF() {
    if (!currentStudentData) return;
    
    const s = currentStudentData;
    const photoUrl = getPhotoUrl(s.photoUrl);
    const currentDate = new Date().toLocaleDateString('en-NP', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const pdfHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
            
            .a4-container {
                width: 210mm;
                height: 297mm;
                padding: 18mm; 
                background: #fff;
                position: relative;
                color: #1a1f3a;
                display: flex;
                flex-direction: column;
                overflow: hidden; /* Watermark overflow handle garna */
            }

            /* Watermark Style */
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                width: 450px; /* Logo size */
                opacity: 0.05; /* Halka matra dekhine (0.05 - 0.1 best hunchha) */
                z-index: 0;
                pointer-events: none;
            }

            .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding-bottom: 15px;
                border-bottom: 4px solid #00d4ff;
                margin-bottom: 40px;
                position: relative;
                z-index: 1;
            }

            .logo-section { display: flex; align-items: center; gap: 18px; }
            .institute-logo-img {
                width: 75px; height: 75px;
                object-fit: contain;
                border: 2px solid #00d4ff;
                padding: 3px;
                border-radius: 10px;
            }

            .institute-info h1 {
                font-size: 24px; font-weight: 800; color: #0a0e27;
                line-height: 1.1; margin-bottom: 5px;
                letter-spacing: -0.5px;
            }
            .institute-info p { font-size: 11px; color: #64748b; font-weight: 500; }

            .form-type { text-align: right; }
            .form-title-badge {
                background: #0a0e27;
                padding: 8px 16px; border-radius: 5px;
                font-weight: 700; font-size: 11px;
                color: #00d4ff; text-transform: uppercase;
                display: inline-block; margin-bottom: 5px;
            }
            .reg-no { font-size: 10px; color: #94a3b8; font-weight: 600; display: block; }

            .photo-box {
                width: 40mm; height: 45mm;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                overflow: hidden;
                position: absolute; 
                top: 105px; right: 18mm;
                background: #f8fafc;
                display: flex; align-items: center; justify-content: center;
                z-index: 10;
            }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }

            main { flex-grow: 1; position: relative; z-index: 1; }

            .section { margin-bottom: 35px; }
            .section-title {
                font-size: 12px; font-weight: 800;
                color: #7c3aed; text-transform: uppercase;
                margin-bottom: 18px; display: flex; align-items: center; gap: 10px;
                border-left: 5px solid #00d4ff;
                padding-left: 10px;
            }

            .grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px 40px; 
            }
            
            .top-section-grid { width: 62%; }

            .field { 
                display: flex; 
                flex-direction: column;
                gap: 4px;
                border-bottom: 1px solid #f1f5f9;
                padding-bottom: 6px;
            }
            .label { 
                font-size: 9px; font-weight: 700; color: #94a3b8; 
                text-transform: uppercase; letter-spacing: 0.5px;
            }
            .value { font-size: 13px; font-weight: 600; color: #1e293b; min-height: 18px; }

            .footer-container {
                margin-top: auto;
                padding-top: 20px;
                position: relative;
                z-index: 1;
            }

            .declaration {
                padding: 15px;
                background: #f8fafc; border-radius: 8px;
                font-size: 10px; line-height: 1.6; color: #475569;
                border: 1px dashed #cbd5e1;
                margin-bottom: 50px;
            }

            .signature-row {
                display: flex; justify-content: space-between;
                padding: 0 10px;
            }
            .sig-box { text-align: center; width: 160px; }
            .sig-line { border-top: 1.5px solid #1e293b; margin-bottom: 8px; }
            .sig-text { font-size: 11px; font-weight: 700; color: #1e293b; }

            .print-footer {
                margin-top: 30px;
                text-align: center; font-size: 9px; color: #cbd5e1;
                border-top: 1px solid #f1f5f9; padding-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="a4-container">
            <img src="adv.jpg" alt="Watermark" class="watermark">

            <header class="header">
                <div class="logo-section">
                    <img src="adv.jpg" alt="Logo" class="institute-logo-img">
                    <div class="institute-info">
                        <h1>ADVANCE COMPUTER CENTER</h1>
                        <p>Belbari-11, Laxmimarga, Morang | Phone: 9842153293</p>
                    </div>
                </div>
                <div class="form-type">
                    <span class="form-title-badge">Enrollment Form</span>
                    <span class="reg-no">Reg No: ACC-${s._id.slice(-6).toUpperCase()}</span>
                </div>
            </header>

            <div class="photo-box">
                ${photoUrl ? `<img src="${photoUrl}" alt="Student">` : `<div style="font-size:10px; color:#94a3b8;">PP Size Photo</div>`}
            </div>

            <main>
                <section class="section">
                    <h2 class="section-title">Course & Batch Details</h2>
                    <div class="grid top-section-grid">
                        <div class="field"><span class="label">Applying for Course</span><span class="value">${s.courseName}</span></div>
                        <div class="field"><span class="label">Course Duration</span><span class="value">${s.courseDuration || '—'}</span></div>
                        <div class="field"><span class="label">Preferred Batch Time</span><span class="value">${s.classTime || '—'}</span></div>
                        <div class="field"><span class="label">Admission Date</span><span class="value">${s.joinDate || formatDate(s.createdAt)}</span></div>
                    </div>
                </section>

                <section class="section">
                    <h2 class="section-title">Personal Information</h2>
                    <div class="grid">
                        <div class="field"><span class="label">Student's Full Name</span><span class="value">${s.fullName}</span></div>
                        <div class="field"><span class="label">Date of Birth (B.S.)</span><span class="value">${s.dobBS || '—'}</span></div>
                        <div class="field"><span class="label">Father's Name</span><span class="value">${s.fatherName || '—'}</span></div>
                        <div class="field"><span class="label">Mother's Name</span><span class="value">${s.motherName || '—'}</span></div>
                        <div class="field"><span class="label">Gender</span><span class="value">${s.gender || '—'}</span></div>
                        <div class="field"><span class="label">Marital Status</span><span class="value">${s.maritalStatus || '—'}</span></div>
                        <div class="field"><span class="label">Academic Qualification</span><span class="value">${s.qualification || '—'}</span></div>
                        <div class="field"><span class="label">Nationality</span><span class="value">${s.nationality || '—'}</span></div>
                    </div>
                </section>

                <section class="section">
                    <h2 class="section-title">Contact & Location Details</h2>
                    <div class="grid">
                        <div class="field"><span class="label">Mobile Number</span><span class="value">${s.contactNo}</span></div>
                        <div class="field"><span class="label">Email Address</span><span class="value">${s.email || '—'}</span></div>
                        <div class="field" style="grid-column: span 2;">
                            <span class="label">Permanent Address</span>
                            <span class="value">${s.street || ''}, ${s.city || ''}, ${s.district || ''}, ${s.province || ''}</span>
                        </div>
                        <div class="field"><span class="label">Birth Place</span><span class="value">${s.birthPlace || '—'}</span></div>
                        <div class="field"><span class="label">Refer By / Source</span><span class="value">${s.referBy || 'Self'}</span></div>
                    </div>
                </section>
            </main>

            <div class="footer-container">
                <div class="declaration">
                    <strong>Declaration:</strong> I hereby certify that the above information is true to the best of my knowledge. I agree to abide by the rules, regulations, and discipline of Advance Computer Center. I understand that the fee once paid is non-refundable.
                </div>

                <div class="signature-row">
                    <div class="sig-box"><div class="sig-line"></div><div class="sig-text">Student's Signature</div></div>
                    <div class="sig-box"><div class="sig-line"></div><div class="sig-text">Authorized Signature</div></div>
                </div>

                <div class="print-footer">
                    Advance Computer Center Management System | Online Registered | ${currentDate}
                </div>
            </div>
        </div>
    </body>
    </html>`;

    const element = document.createElement('div');
    element.innerHTML = pdfHtml;
    document.body.appendChild(element);

    const opt = {
        margin: 0,
        filename: `ACC_Form_${s.fullName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#FFFFFF' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(element);
        showToast('PDF with Watermark Generated!', 'success');
    });
}
// ==================== VIEW STUDENT DETAILS ====================
window.viewStudent = async (id) => {
    try {
        const response = await fetch(`${API_URL}/students/${id}`, {
            headers: { 'x-auth-token': authToken }
        });
        
        if (!response.ok) throw new Error('Failed to load student details');
        
        const student = await response.json();
        currentStudentData = student;
        const photoUrl = getPhotoUrl(student.photoUrl);
        
        modalBody.innerHTML = `
            <div class="detail-grid">
                <div class="detail-label">Full Name:</div>
                <div class="detail-value"><strong>${escapeHtml(student.fullName)}</strong></div>
                
                ${photoUrl ? `
                    <div class="detail-label">Photo:</div>
                    <div class="detail-value">
                        <img src="${photoUrl}" class="student-photo-large" alt="Student Photo" 
                            onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\'padding:8px\'>No photo available</div>'">
                    </div>
                ` : '<div class="detail-label">Photo:</div><div class="detail-value">No photo uploaded</div>'}
                
                <div class="detail-label">Class Time:</div>
                <div class="detail-value">${student.classTime || '—'}</div>
                <div class="detail-label">Father's Name:</div>
                <div class="detail-value">${escapeHtml(student.fatherName) || '—'}</div>
                <div class="detail-label">Mother's Name:</div>
                <div class="detail-value">${escapeHtml(student.motherName) || '—'}</div>
                <div class="detail-label">Date of Birth (BS):</div>
                <div class="detail-value">${student.dobBS || '—'}</div>
                <div class="detail-label">Marital Status:</div>
                <div class="detail-value">${student.maritalStatus || '—'}</div>
                <div class="detail-label">Gender:</div>
                <div class="detail-value">${student.gender || '—'}</div>
                <div class="detail-label">Place of Birth:</div>
                <div class="detail-value">${escapeHtml(student.birthPlace) || '—'}</div>
                <div class="detail-label">Qualification:</div>
                <div class="detail-value">${escapeHtml(student.qualification) || '—'}</div>
                <div class="detail-label">Nationality:</div>
                <div class="detail-value">${escapeHtml(student.nationality) || '—'}</div>
                <div class="detail-label">Course Name:</div>
                <div class="detail-value"><strong>${escapeHtml(student.courseName)}</strong> (${student.courseDuration || '—'})</div>
                <div class="detail-label">Contact Number:</div>
                <div class="detail-value">${escapeHtml(student.contactNo)}</div>
                <div class="detail-label">Email:</div>
                <div class="detail-value">${escapeHtml(student.email) || '—'}</div>
                <div class="detail-label">Address:</div>
                <div class="detail-value">${escapeHtml(student.street) || ''} ${escapeHtml(student.city) || ''} ${escapeHtml(student.district) || ''} ${escapeHtml(student.province) || ''}</div>
                <div class="detail-label">Related Institution:</div>
                <div class="detail-value">${escapeHtml(student.institution) || '—'}</div>
                <div class="detail-label">Refer By:</div>
                <div class="detail-value">${escapeHtml(student.referBy) || '—'}</div>
                <div class="detail-label">Join Date:</div>
                <div class="detail-value">${student.joinDate || '—'}</div>
                <div class="detail-label">Signature:</div>
                <div class="detail-value">${escapeHtml(student.signature) || '—'}</div>
                <div class="detail-label">Registered On:</div>
                <div class="detail-value">${new Date(student.createdAt).toLocaleString()}</div>
            </div>
        `;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        showToast('Error loading student details', 'error');
    }
};

// ==================== DELETE STUDENT ====================
window.deleteStudent = async (id) => {
    if (confirm('⚠️ Are you sure you want to delete this student record? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API_URL}/students/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': authToken }
            });

            if (response.ok) {
                showToast('✅ Student deleted successfully', 'success');
                await loadStudents();
            } else {
                showToast('Error deleting student', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error while deleting', 'error');
        }
    }
};

// ==================== SEARCH FUNCTIONALITY ====================
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = currentStudents.filter(s => 
            (s.fullName && s.fullName.toLowerCase().includes(searchTerm)) ||
            (s.courseName && s.courseName.toLowerCase().includes(searchTerm)) ||
            (s.contactNo && s.contactNo.includes(searchTerm))
        );
        renderStudentTable(filtered);
    });
}

// ==================== LOGOUT FUNCTION ====================
function logout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    if (loginSection) loginSection.style.display = 'flex';
    if (dashboardSection) dashboardSection.style.display = 'none';
    showToast('Logged out successfully', 'success');
}

// ==================== SHOW DASHBOARD ====================
async function showDashboard() {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    await loadStudents();
}

// ==================== CHECK AUTH ON LOAD ====================
if (authToken) {
    showDashboard();
}

// ==================== LOGIN FORM HANDLER ====================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        if (!email || !password) {
            if (loginError) {
                loginError.style.display = 'block';
                loginError.textContent = 'Please enter both email and password';
            }
            return;
        }
        
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = '⏳ Logging in...';
        }
        
        if (loginError) loginError.style.display = 'none';
        
        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            if (response.ok) {
                authToken = data.token;
                localStorage.setItem('adminToken', authToken);
                showToast('Login successful!', 'success');
                showDashboard();
            } else {
                if (loginError) {
                    loginError.style.display = 'block';
                    loginError.textContent = 'Login failed: ' + (data.message || 'Invalid credentials');
                }
                showToast('Login failed: ' + (data.message || 'Invalid credentials'), 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (loginError) {
                loginError.style.display = 'block';
                loginError.textContent = 'Network error. Make sure backend is running on port 5000';
            }
            showToast('Network error. Make sure backend is running on port 5000', 'error');
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = '🔐 Login to Dashboard';
            }
        }
    });
}

// ==================== LOGOUT BUTTON ====================
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// ==================== MODAL CLOSE HANDLERS ====================
if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

if (downloadPDFBtn) {
    downloadPDFBtn.addEventListener('click', generatePDF);
}

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
};

// Debug function to check server status
async function checkServerStatus() {
    try {
        const response = await fetch(`${BASE_URL}/`);
        const data = await response.json();
        console.log('Server status:', data);
    } catch (error) {
        console.error('Server not reachable:', error);
    }
}
checkServerStatus();