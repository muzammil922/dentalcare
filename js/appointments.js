// Appointments Management Module
class AppointmentsManager {
    constructor() {
        this.appointments = [];
        this.currentAppointment = null;
        this.isEditing = false;
        
        this.init();
    }

    init() {
        this.loadAppointments();
        this.setupEventListeners();
        this.renderAppointments();
        this.loadPatientOptions();
    }

    setupEventListeners() {
        // Add new appointment button
        const addAppointmentBtn = document.getElementById('add-new-appointment-btn');
        if (addAppointmentBtn) {
            addAppointmentBtn.addEventListener('click', () => {
                this.showForm();
            });
        }

        // Appointment form submission
        const appointmentForm = document.getElementById('appointment-form');
        if (appointmentForm) {
            appointmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAppointment();
            });
        }

        // Modal close handlers
        const closeBtn = document.getElementById('appointment-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const cancelBtn = document.getElementById('appointment-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Modal backdrop click
        const modal = document.getElementById('appointment-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Filter handlers
        const appointmentFilter = document.getElementById('appointment-filter');
        if (appointmentFilter) {
            appointmentFilter.addEventListener('change', () => {
                this.filterAppointments();
            });
        }

        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterAppointments();
            });
        }

        // Set minimum date to today
        const dateInput = document.getElementById('appointment-date');
        if (dateInput) {
            dateInput.min = new Date().toISOString().split('T')[0];
        }
    }

    showForm(appointment = null) {
        this.currentAppointment = appointment;
        this.isEditing = !!appointment;
        
        const modal = document.getElementById('appointment-modal');
        const modalTitle = document.getElementById('appointment-modal-title');
        const form = document.getElementById('appointment-form');
        
        if (modal && modalTitle && form) {
            modalTitle.textContent = this.isEditing ? 'Edit Appointment' : 'Schedule New Appointment';
            
            form.reset();
            
            if (this.isEditing && appointment) {
                this.fillForm(appointment);
            }
            
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            setTimeout(() => {
                const firstInput = form.querySelector('select, input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
    }

    fillForm(appointment) {
        const fields = {
            'appointment-patient': appointment.patientId,
            'appointment-date': appointment.date,
            'appointment-time': appointment.time,
            'appointment-duration': appointment.duration,
            'appointment-treatment': appointment.treatment,
            'appointment-priority': appointment.priority || 'normal',
            'appointment-reminder': appointment.reminder || 'none',
            'appointment-notes': appointment.notes
        };
        
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('appointment-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        this.currentAppointment = null;
        this.isEditing = false;
    }

    saveAppointment() {
        const form = document.getElementById('appointment-form');
        if (!form) return;

        const formData = new FormData(form);
        const appointmentData = {
            patientId: formData.get('patientId'),
            date: formData.get('date'),
            time: formData.get('time'),
            duration: parseInt(formData.get('duration')) || 30,
            treatment: formData.get('treatment'),
            priority: formData.get('priority') || 'normal',
            reminder: formData.get('reminder') || 'none',
            notes: formData.get('notes')?.trim(),
            status: 'scheduled'
        };

        // Validation
        if (!appointmentData.patientId || !appointmentData.date || !appointmentData.time) {
            this.showError('Please fill in all required fields');
            return;
        }

        // Ensure selected patient exists
        const patients = this.getPatients();
        const patientExists = patients.some(p => p.id === appointmentData.patientId);
        if (!patientExists) {
            this.showError('Please select a valid patient');
            return;
        }

        // Validate date/time
        const now = new Date();
        now.setSeconds(0, 0);
        const startDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
        if (isNaN(startDateTime.getTime())) {
            this.showError('Invalid appointment date or time');
            return;
        }
        if (startDateTime < now) {
            this.showError('Appointment time cannot be in the past');
            return;
        }

        // Validate duration
        if (!Number.isFinite(appointmentData.duration) || appointmentData.duration <= 0) {
            this.showError('Invalid appointment duration');
            return;
        }

        // Prevent duplicate (same patient, same date/time, not cancelled)
        const isDuplicate = this.appointments.some(a => {
            if (this.isEditing && this.currentAppointment && a.id === this.currentAppointment.id) return false;
            return a.patientId === appointmentData.patientId &&
                   a.date === appointmentData.date &&
                   a.time === appointmentData.time &&
                   a.status !== 'cancelled';
        });
        if (isDuplicate) {
            this.showError('An appointment for this patient already exists at the selected time');
            return;
        }

        // Check for conflicts
        if (this.hasTimeConflict(appointmentData)) {
            this.showError('This time slot conflicts with another appointment');
            return;
        }

        try {
            if (this.isEditing && this.currentAppointment) {
                appointmentData.id = this.currentAppointment.id;
                appointmentData.createdAt = this.currentAppointment.createdAt;
                appointmentData.updatedAt = new Date().toISOString();
                
                const index = this.appointments.findIndex(a => a.id === this.currentAppointment.id);
                if (index !== -1) {
                    this.appointments[index] = appointmentData;
                }
                
                this.showSuccess('Appointment updated successfully');
            } else {
                appointmentData.id = window.dentalApp ? window.dentalApp.generateId('appointment') : this.generateId();
                appointmentData.createdAt = new Date().toISOString();
                appointmentData.updatedAt = new Date().toISOString();
                
                this.appointments.push(appointmentData);
                this.showSuccess('Appointment scheduled successfully');
            }

            this.saveToStorage();
            
            // Use the main app's display function to ensure consistent styling
            if (window.dentalApp) {
                // Get current active filters
                const activeTimeFilter = document.querySelector('[data-type="appointment"].dropdown-filter-option.active');
                const activeStatusFilter = document.querySelector('[data-type="appointment-status"].dropdown-filter-option.active');
                
                let timeFilter = 'all';
                let statusFilter = 'all';
                
                if (activeTimeFilter) {
                    timeFilter = activeTimeFilter.getAttribute('data-filter');
                }
                if (activeStatusFilter) {
                    statusFilter = activeStatusFilter.getAttribute('data-filter');
                }
                
                // Re-apply current filters
                if (statusFilter !== 'all') {
                    window.dentalApp.filterAppointmentsByStatus(statusFilter);
                } else {
                    window.dentalApp.filterAppointments(timeFilter);
                }
            } else {
                this.renderAppointments();
            }
            
            this.updateDashboard();
            this.closeModal();
            
        } catch (error) {
            console.error('Error saving appointment:', error);
            this.showError('Failed to save appointment');
        }
    }

    hasTimeConflict(newAppointment) {
        const newStart = new Date(`${newAppointment.date}T${newAppointment.time}`);
        const newEnd = new Date(newStart.getTime() + newAppointment.duration * 60000);
        
        return this.appointments.some(appointment => {
            if (this.isEditing && appointment.id === this.currentAppointment.id) {
                return false; // Skip current appointment when editing
            }
            
            if (appointment.date !== newAppointment.date || appointment.status === 'cancelled') {
                return false;
            }
            
            const existingStart = new Date(`${appointment.date}T${appointment.time}`);
            const existingEnd = new Date(existingStart.getTime() + appointment.duration * 60000);
            
            return (newStart < existingEnd && newEnd > existingStart);
        });
    }

    updateAppointmentStatus(appointmentId, status) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (appointment) {
            appointment.status = status;
            appointment.updatedAt = new Date().toISOString();
            
            this.saveToStorage();
            
            // Use the main app's display function to ensure consistent styling
            if (window.dentalApp) {
                window.dentalApp.updateAppointmentStatus(appointmentId, status);
            } else {
                this.renderAppointments();
            }
            
            this.updateDashboard();
            
            this.showSuccess(`Appointment marked as ${status}`);
        }
    }

    deleteAppointment(appointmentId) {
        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        this.appointments = this.appointments.filter(a => a.id !== appointmentId);
        this.saveToStorage();
        
        // Use the main app's display function to ensure consistent styling
        if (window.dentalApp) {
            window.dentalApp.deleteAppointment(appointmentId);
        } else {
            this.renderAppointments();
        }
        
        this.updateDashboard();
        this.showSuccess('Appointment deleted successfully');
    }

    filterAppointments() {
        const appointmentFilter = document.getElementById('appointment-filter')?.value || 'all';
        const statusFilter = document.getElementById('status-filter')?.value || 'all';
        
        let filtered = [...this.appointments];
        
        // Date filter
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        switch (appointmentFilter) {
            case 'today':
                const todayStr = new Date().toISOString().split('T')[0];
                filtered = filtered.filter(a => a.date === todayStr);
                break;
            case 'week':
                filtered = filtered.filter(a => new Date(a.date) >= startOfWeek);
                break;
            case 'month':
                filtered = filtered.filter(a => new Date(a.date) >= startOfMonth);
                break;
        }
        
        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(a => a.status === statusFilter);
        }
        
        this.renderAppointments(filtered);
    }

    renderAppointments(appointmentsToRender = null) {
        const appointmentsList = document.getElementById('appointments-list');
        if (!appointmentsList) return;

        const appointments = appointmentsToRender || this.appointments;
        const patients = this.getPatients();

        if (appointments.length === 0) {
            appointmentsList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-calendar-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No appointments found</h3>
                    <p>Schedule your first appointment to get started.</p>
                </div>
            `;
            return;
        }

        // Sort appointments by date and time
        const sortedAppointments = appointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        appointmentsList.innerHTML = sortedAppointments.map(appointment => {
            const patient = patients.find(p => p.id === appointment.patientId);
            const statusColor = this.getStatusColor(appointment.status);
            const isUpcoming = new Date(`${appointment.date}T${appointment.time}`) > new Date();
            
            return `
                <div class="appointment-card" style="background: var(--white); padding: 1.5rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--gray-200); border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                <h3 style="font-size: var(--font-size-lg); font-weight: 600; color: var(--gray-800); margin: 0;">
                                    ${patient ? this.escapeHtml(patient.name) : 'Unknown Patient'}
                                </h3>
                                <span class="status-badge" style="padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; background: ${statusColor}20; color: ${statusColor};">
                                    ${appointment.status}
                                </span>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; color: var(--gray-600); font-size: var(--font-size-sm);">
                                <div><i class="fas fa-calendar" style="margin-right: 0.5rem;"></i>${this.formatDate(appointment.date)}</div>
                                <div><i class="fas fa-clock" style="margin-right: 0.5rem;"></i>${this.formatTime(appointment.time)}</div>
                                <div><i class="fas fa-hourglass-half" style="margin-right: 0.5rem;"></i>${appointment.duration} minutes</div>
                                <div><i class="fas fa-tooth" style="margin-right: 0.5rem;"></i>${this.escapeHtml(appointment.treatment)}</div>
                            </div>
                            
                            ${patient?.phone ? `<div style="margin-top: 0.5rem; color: var(--gray-600); font-size: var(--font-size-sm);"><i class="fas fa-phone" style="margin-right: 0.5rem;"></i>${this.escapeHtml(patient.phone)}</div>` : ''}
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${appointment.status === 'scheduled' && isUpcoming ? `
                                <button class="btn btn-sm btn-primary" onclick="window.appointmentsManager.updateAppointmentStatus('${appointment.id}', 'completed')" title="Mark as Completed">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="window.appointmentsManager.updateAppointmentStatus('${appointment.id}', 'cancelled')" title="Cancel">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-secondary" onclick="window.appointmentsManager.showForm(${this.escapeHtml(JSON.stringify(appointment))})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.appointmentsManager.deleteAppointment('${appointment.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${appointment.notes ? `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
                            <strong style="color: var(--gray-700); font-size: var(--font-size-sm);">Notes:</strong>
                            <p style="margin: 0.25rem 0 0 0; color: var(--gray-600); font-size: var(--font-size-sm);">${this.escapeHtml(appointment.notes)}</p>
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); font-size: var(--font-size-xs); color: var(--gray-500);">
                        Scheduled: ${this.formatDate(appointment.createdAt)}
                        ${appointment.updatedAt !== appointment.createdAt ? ` • Updated: ${this.formatDate(appointment.updatedAt)}` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadPatientOptions() {
        const patientSelect = document.getElementById('appointment-patient');
        if (!patientSelect) return;

        const patients = this.getPatients();
        
        patientSelect.innerHTML = '<option value="">Select Patient</option>' +
            patients.map(patient => 
                `<option value="${patient.id}">${this.escapeHtml(patient.name)} - ${this.escapeHtml(patient.phone)}</option>`
            ).join('');
    }

    getPatients() {
        try {
            const stored = localStorage.getItem('dentalClinic_patients');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading patients:', error);
            return [];
        }
    }

    loadAppointments() {
        try {
            const stored = localStorage.getItem('dentalClinic_appointments');
            this.appointments = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading appointments:', error);
            this.appointments = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('dentalClinic_appointments', JSON.stringify(this.appointments));
        } catch (error) {
            console.error('Error saving appointments:', error);
        }
    }

    updateDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = this.appointments.filter(a => a.date === today && a.status !== 'cancelled');
        
        const todayAppointmentsElement = document.getElementById('today-appointments');
        if (todayAppointmentsElement) {
            todayAppointmentsElement.textContent = todayAppointments.length;
        }
    }

    getStatusColor(status) {
        const colors = {
            scheduled: 'var(--primary-color)',
            completed: 'var(--success-color)',
            cancelled: 'var(--error-color)',
            'no-show': 'var(--warning-color)'
        };
        return colors[status] || 'var(--gray-500)';
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

    formatTime(timeString) {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
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
        }
    }

    showError(message) {
        if (window.dentalApp) {
            window.dentalApp.showToast(message, 'error');
        }
    }

    // Get upcoming appointments
    getUpcomingAppointments(days = 7) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        return this.appointments.filter(appointment => {
            const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
            return appointmentDate >= now && 
                   appointmentDate <= futureDate && 
                   appointment.status === 'scheduled';
        });
    }
}

