// Patients Management Module
class PatientsManager {
    constructor() {
        this.patients = [];
        this.currentPatient = null;
        this.isEditing = false;
        
        this.init();
    }

    init() {
        this.loadPatients();
        this.setupEventListeners();
        // Note: Rendering is handled by the main app.js file
    }

    setupEventListeners() {
        // Note: Form submission and search are handled by the main app.js file
        // This prevents conflicts and ensures consistent behavior

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Note: Form display is handled by the main app.js file
    // This prevents conflicts and ensures consistent behavior

    fillForm(patient) {
        const fields = {
            'patient-name': patient.name,
            'patient-phone': patient.phone,
            'patient-email': patient.email,
            'patient-dob': patient.dateOfBirth,
            'patient-address': patient.address,
            'patient-medical-history': patient.medicalHistory
        };
        
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('patient-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        this.currentPatient = null;
        this.isEditing = false;
    }

    // Note: Patient saving is handled by the main app.js file
    // This prevents duplicate submissions and conflicts

    deletePatient(patientId) {
        if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            return;
        }

        try {
            this.patients = this.patients.filter(p => p.id !== patientId);
            this.saveToStorage();
            this.renderPatients();
            this.updateDashboard();
            this.showSuccess('Patient deleted successfully');
        } catch (error) {
            console.error('Error deleting patient:', error);
            this.showError('Failed to delete patient. Please try again.');
        }
    }

    // Note: Search functionality is handled by the main app.js file
    // This prevents conflicts and ensures consistent display style

    renderPatients(patientsToRender = null) {
        const patientsList = document.getElementById('patients-list');
        if (!patientsList) return;

        const patients = patientsToRender || this.patients;

        if (patients.length === 0) {
            patientsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No patients found</h3>
                    <p>Start by adding your first patient to the system.</p>
                </div>
            `;
            return;
        }

        patientsList.innerHTML = patients.map(patient => `
            <div class="patient-card" style="background: var(--white); padding: 1.5rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--gray-200); transition: all var(--transition-fast);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="font-size: var(--font-size-lg); font-weight: 600; color: var(--gray-800); margin-bottom: 0.5rem;">
                            ${this.escapeHtml(patient.name)}
                        </h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 1rem; color: var(--gray-600); font-size: var(--font-size-sm);">
                            <span><i class="fas fa-phone" style="margin-right: 0.5rem;"></i>${this.escapeHtml(patient.phone)}</span>
                            ${patient.email ? `<span><i class="fas fa-envelope" style="margin-right: 0.5rem;"></i>${this.escapeHtml(patient.email)}</span>` : ''}
                            ${patient.dateOfBirth ? `<span><i class="fas fa-birthday-cake" style="margin-right: 0.5rem;"></i>${this.formatDate(patient.dateOfBirth)}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-secondary" onclick="window.patientsManager.showForm(${this.escapeHtml(JSON.stringify(patient))})" title="Edit Patient">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.patientsManager.deletePatient('${patient.id}')" title="Delete Patient">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${patient.address ? `
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: var(--gray-700); font-size: var(--font-size-sm);">Address:</strong>
                        <p style="margin: 0.25rem 0 0 0; color: var(--gray-600); font-size: var(--font-size-sm);">${this.escapeHtml(patient.address)}</p>
                    </div>
                ` : ''}
                
                ${patient.medicalHistory ? `
                    <div>
                        <strong style="color: var(--gray-700); font-size: var(--font-size-sm);">Medical History:</strong>
                        <p style="margin: 0.25rem 0 0 0; color: var(--gray-600); font-size: var(--font-size-sm);">${this.escapeHtml(patient.medicalHistory)}</p>
                    </div>
                ` : ''}
                
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); font-size: var(--font-size-xs); color: var(--gray-500);">
                    Added: ${this.formatDate(patient.createdAt)}
                    ${patient.updatedAt !== patient.createdAt ? ` • Updated: ${this.formatDate(patient.updatedAt)}` : ''}
                </div>
            </div>
        `).join('');

        // Add hover effects
        patientsList.querySelectorAll('.patient-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = 'var(--shadow-lg)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'var(--shadow-md)';
            });
        });
    }

    loadPatients() {
        try {
            const stored = localStorage.getItem('dentalClinic_patients');
            this.patients = stored ? JSON.parse(stored) : [];
            console.log('Loaded patients:', this.patients.length);
        } catch (error) {
            console.error('Error loading patients:', error);
            this.patients = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('dentalClinic_patients', JSON.stringify(this.patients));
            console.log('Patients saved to storage');
        } catch (error) {
            console.error('Error saving patients:', error);
        }
    }

    updateDashboard() {
        // Update dashboard patient count
        const totalPatientsElement = document.getElementById('total-patients');
        if (totalPatientsElement) {
            totalPatientsElement.textContent = this.patients.length;
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) return '';
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        // Remove all non-digit characters for validation
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        if (window.dentalApp) {
            window.dentalApp.showToast(message, 'success');
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (window.dentalApp) {
            window.dentalApp.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // Get patient by ID
    getPatientById(id) {
        return this.patients.find(patient => patient.id === id);
    }

    // Get patients for dropdown/select elements
    getPatientsForSelect() {
        return this.patients.map(patient => ({
            value: patient.id,
            text: patient.name,
            phone: patient.phone
        }));
    }
}

