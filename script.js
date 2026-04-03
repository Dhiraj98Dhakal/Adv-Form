// API Configuration
const API_URL = 'http://localhost:5000/api';

// Photo Upload Handling
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

// Show message function
function showMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);
    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

// Form Submission
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
                showMessage('Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Network error. Please make sure the backend server is running on port 5000', 'error');
        }
    });
}