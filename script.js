// ==================== API CONFIGURATION ====================
// Dynamic API URL - Local vs Production
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://adv-form-production.up.railway.app/api';

console.log('🔗 API URL:', API_URL);
console.log('📍 Environment:', window.location.hostname === 'localhost' ? 'Development' : 'Production');

// ==================== PHOTO UPLOAD HANDLING ====================
const photoUpload = document.getElementById('photoUpload');
const photoInput = document.getElementById('studentPhoto');
const photoPreview = document.getElementById('photoPreview');

if (photoUpload) {
    photoUpload.addEventListener('click', () => {
        photoInput.click();
    });
}

if (photoInput) {
    photoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                photoPreview.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

// ==================== SHOW MESSAGE FUNCTION ====================
function showMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);
    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

// ==================== FORM SUBMISSION ====================
const registrationForm = document.getElementById('registrationForm');

if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate required fields
        const fullName = document.getElementById('fullName').value.trim();
        const contactNo = document.getElementById('contactNo').value.trim();
        const courseName = document.getElementById('courseName').value.trim();
        const agreeTerms = document.getElementById('agreeTerms').checked;

        if (!fullName) {
            showMessage('Please enter student name', 'error');
            return;
        }
        if (!contactNo) {
            showMessage('Please enter contact number', 'error');
            return;
        }
        if (!courseName) {
            showMessage('Please enter course name', 'error');
            return;
        }
        if (!agreeTerms) {
            showMessage('Please agree to the terms & conditions', 'error');
            return;
        }

        // Collect form data
        const classTimeRadio = document.querySelector('input[name="classTime"]:checked');
        const studentData = {
            fullName: fullName,
            classTime: classTimeRadio ? classTimeRadio.value : '',
            fatherName: document.getElementById('fatherName').value,
            motherName: document.getElementById('motherName').value,
            dobBS: document.getElementById('dobBS').value,
            maritalStatus: document.getElementById('maritalStatus').value,
            gender: document.getElementById('gender').value,
            birthPlace: document.getElementById('birthPlace').value,
            qualification: document.getElementById('qualification').value,
            nationality: document.getElementById('nationality').value,
            courseName: courseName,
            courseDuration: document.getElementById('courseDuration').value,
            contactNo: contactNo,
            email: document.getElementById('email').value,
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            district: document.getElementById('district').value,
            province: document.getElementById('province').value,
            institution: document.getElementById('institution').value,
            referBy: document.getElementById('referBy').value,
            joinDate: document.getElementById('joinDate').value,
            signature: document.getElementById('signature').value
        };

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('studentData', JSON.stringify(studentData));
        if (photoInput.files[0]) {
            formData.append('photo', photoInput.files[0]);
        }

        // Disable submit button while processing
        const submitBtn = document.querySelector('.btn-submit');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ REGISTERING...';

        try {
            const response = await fetch(`${API_URL}/students/register`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('✅ Student registered successfully!', 'success');
                registrationForm.reset();
                photoPreview.innerHTML = '<i class="material-icons">📷</i><span>Click to upload</span>';
                document.querySelectorAll('input[name="classTime"]').forEach(radio => radio.checked = false);
            } else {
                showMessage('Error: ' + (data.message || 'Registration failed'), 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// ==================== CHECK SERVER STATUS ====================
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_URL.replace('/api', '')}/api/status`);
        const data = await response.json();
        console.log('✅ Server Status:', data);
    } catch (error) {
        console.error('❌ Server not reachable:', error);
    }
}

// Check server status on page load
if (window.location.hostname !== 'localhost') {
    checkServerStatus();
}