// Automation Management Module
class AutomationManager {
    constructor() {
        this.settings = {
            emailNotifications: true,
            smsNotifications: false,
            appointmentConfirmations: true,
            reminder24h: true,
            autoInvoicing: true,
            feedbackRequests: true,
            clinicEmail: '',
            clinicPhone: '',
            webhookUrl: ''
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.renderSettings();
    }

    setupEventListeners() {
        // Save settings button
        const saveBtn = document.getElementById('save-automation-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Toggle switches
        const toggles = [
            'email-notifications',
            'sms-notifications',
            'appointment-confirmations',
            'reminder-24h',
            'auto-invoicing',
            'feedback-requests'
        ];

        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.updateSetting(toggleId, e.target.checked);
                });
            }
        });

        // Input fields
        const inputs = [
            'clinic-email',
            'clinic-phone',
            'webhook-url'
        ];

        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('blur', (e) => {
                    this.updateInputSetting(inputId, e.target.value);
                });
            }
        });

        // Test webhook button (if we add one)
        this.addTestWebhookButton();
    }

    addTestWebhookButton() {
        const webhookInput = document.getElementById('webhook-url');
        if (!webhookInput) return;

        const testButton = document.createElement('button');
        testButton.type = 'button';
        testButton.className = 'btn btn-sm btn-secondary';
        testButton.innerHTML = '<i class="fas fa-test-tube"></i> Test';
        testButton.style.marginLeft = '0.5rem';
        testButton.onclick = () => this.testWebhook();

        const webhookContainer = webhookInput.parentElement;
        if (webhookContainer) {
            webhookContainer.style.display = 'flex';
            webhookContainer.style.alignItems = 'end';
            webhookContainer.style.gap = '0.5rem';
            webhookContainer.appendChild(testButton);
        }
    }

    updateSetting(toggleId, value) {
        const settingMap = {
            'email-notifications': 'emailNotifications',
            'sms-notifications': 'smsNotifications',
            'appointment-confirmations': 'appointmentConfirmations',
            'reminder-24h': 'reminder24h',
            'auto-invoicing': 'autoInvoicing',
            'feedback-requests': 'feedbackRequests'
        };

        const settingKey = settingMap[toggleId];
        if (settingKey) {
            this.settings[settingKey] = value;
            this.showSuccess(`${this.getSettingDisplayName(settingKey)} ${value ? 'enabled' : 'disabled'}`);
        }
    }

    updateInputSetting(inputId, value) {
        const settingMap = {
            'clinic-email': 'clinicEmail',
            'clinic-phone': 'clinicPhone',
            'webhook-url': 'webhookUrl'
        };

        const settingKey = settingMap[inputId];
        if (settingKey) {
            // Validate input
            if (settingKey === 'clinicEmail' && value && !this.validateEmail(value)) {
                this.showError('Please enter a valid email address');
                return;
            }

            if (settingKey === 'webhookUrl' && value && !this.validateUrl(value)) {
                this.showError('Please enter a valid webhook URL');
                return;
            }

            this.settings[settingKey] = value;
        }
    }

    getSettingDisplayName(settingKey) {
        const displayNames = {
            emailNotifications: 'Email Notifications',
            smsNotifications: 'SMS Notifications',
            appointmentConfirmations: 'Appointment Confirmations',
            reminder24h: '24-Hour Reminders',
            autoInvoicing: 'Auto Invoice Generation',
            feedbackRequests: 'Feedback Requests'
        };
        return displayNames[settingKey] || settingKey;
    }

    saveSettings() {
        // Get current values from form
        this.settings.clinicEmail = document.getElementById('clinic-email')?.value || '';
        this.settings.clinicPhone = document.getElementById('clinic-phone')?.value || '';
        this.settings.webhookUrl = document.getElementById('webhook-url')?.value || '';

        // Validate required fields
        if (this.settings.emailNotifications && !this.settings.clinicEmail) {
            this.showError('Clinic email is required when email notifications are enabled');
            return;
        }

        if (this.settings.smsNotifications && !this.settings.clinicPhone) {
            this.showError('Clinic phone is required when SMS notifications are enabled');
            return;
        }

        if ((this.settings.emailNotifications || this.settings.smsNotifications) && !this.settings.webhookUrl) {
            this.showError('Webhook URL is required for automation features');
            return;
        }

        try {
            this.saveToStorage();
            this.showSuccess('Automation settings saved successfully');
            
            // Update global automation settings for other modules
            window.automationSettings = { ...this.settings };
            
        } catch (error) {
            console.error('Error saving automation settings:', error);
            this.showError('Failed to save settings');
        }
    }

    renderSettings() {
        // Update toggle switches
        const toggleMap = {
            'email-notifications': this.settings.emailNotifications,
            'sms-notifications': this.settings.smsNotifications,
            'appointment-confirmations': this.settings.appointmentConfirmations,
            'reminder-24h': this.settings.reminder24h,
            'auto-invoicing': this.settings.autoInvoicing,
            'feedback-requests': this.settings.feedbackRequests
        };

        Object.entries(toggleMap).forEach(([id, value]) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.checked = value;
            }
        });

        // Update input fields
        const inputMap = {
            'clinic-email': this.settings.clinicEmail,
            'clinic-phone': this.settings.clinicPhone,
            'webhook-url': this.settings.webhookUrl
        };

        Object.entries(inputMap).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input) {
                input.value = value || '';
            }
        });

        // Update automation status indicators
        this.updateStatusIndicators();
    }

    updateStatusIndicators() {
        // Add status indicators to automation cards
        const automationCards = document.querySelectorAll('.automation-card');
        
        automationCards.forEach(card => {
            const toggle = card.querySelector('input[type="checkbox"]');
            if (toggle) {
                const isEnabled = toggle.checked;
                const header = card.querySelector('.automation-header');
                
                // Remove existing indicator
                const existingIndicator = header.querySelector('.status-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }
                
                // Add new indicator
                const indicator = document.createElement('div');
                indicator.className = 'status-indicator';
                indicator.style.cssText = `
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${isEnabled ? 'var(--success-color)' : 'var(--gray-400)'};
                    margin-right: 0.5rem;
                `;
                
                header.insertBefore(indicator, header.firstChild);
            }
        });
    }

    async testWebhook() {
        const webhookUrl = document.getElementById('webhook-url')?.value;
        
        if (!webhookUrl) {
            this.showError('Please enter a webhook URL first');
            return;
        }

        if (!this.validateUrl(webhookUrl)) {
            this.showError('Please enter a valid webhook URL');
            return;
        }

        try {
            this.showInfo('Testing webhook connection...');
            
            const testData = {
                test: true,
                timestamp: new Date().toISOString(),
                message: 'Test webhook from DentalCare Pro',
                settings: this.settings
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                this.showSuccess('Webhook test successful! Connection is working.');
            } else {
                this.showError(`Webhook test failed: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('Webhook test error:', error);
            this.showError('Webhook test failed: Unable to connect to the URL');
        }
    }

    // Automation trigger methods
    async triggerAppointmentConfirmation(appointmentData) {
        if (!this.settings.appointmentConfirmations || !this.settings.webhookUrl) {
            return;
        }

        try {
            const payload = {
                type: 'appointment_confirmation',
                data: appointmentData,
                settings: {
                    emailEnabled: this.settings.emailNotifications,
                    smsEnabled: this.settings.smsNotifications,
                    clinicEmail: this.settings.clinicEmail,
                    clinicPhone: this.settings.clinicPhone
                },
                timestamp: new Date().toISOString()
            };

            await this.sendWebhook(payload);
            console.log('Appointment confirmation triggered');
            
        } catch (error) {
            console.error('Error triggering appointment confirmation:', error);
        }
    }

    async triggerAppointmentReminder(appointmentData) {
        if (!this.settings.reminder24h || !this.settings.webhookUrl) {
            return;
        }

        try {
            const payload = {
                type: 'appointment_reminder',
                data: appointmentData,
                settings: {
                    emailEnabled: this.settings.emailNotifications,
                    smsEnabled: this.settings.smsNotifications,
                    clinicEmail: this.settings.clinicEmail,
                    clinicPhone: this.settings.clinicPhone
                },
                timestamp: new Date().toISOString()
            };

            await this.sendWebhook(payload);
            console.log('Appointment reminder triggered');
            
        } catch (error) {
            console.error('Error triggering appointment reminder:', error);
        }
    }

    async triggerAutoInvoicing(appointmentData) {
        if (!this.settings.autoInvoicing || !this.settings.webhookUrl) {
            return;
        }

        try {
            const payload = {
                type: 'auto_invoicing',
                data: appointmentData,
                settings: {
                    emailEnabled: this.settings.emailNotifications,
                    clinicEmail: this.settings.clinicEmail
                },
                timestamp: new Date().toISOString()
            };

            await this.sendWebhook(payload);
            console.log('Auto invoicing triggered');
            
        } catch (error) {
            console.error('Error triggering auto invoicing:', error);
        }
    }

    async triggerFeedbackRequest(appointmentData) {
        if (!this.settings.feedbackRequests || !this.settings.webhookUrl) {
            return;
        }

        try {
            const payload = {
                type: 'feedback_request',
                data: appointmentData,
                settings: {
                    emailEnabled: this.settings.emailNotifications,
                    smsEnabled: this.settings.smsNotifications,
                    clinicEmail: this.settings.clinicEmail,
                    clinicPhone: this.settings.clinicPhone
                },
                timestamp: new Date().toISOString()
            };

            await this.sendWebhook(payload);
            console.log('Feedback request triggered');
            
        } catch (error) {
            console.error('Error triggering feedback request:', error);
        }
    }

    async sendWebhook(payload) {
        if (!this.settings.webhookUrl) {
            throw new Error('Webhook URL not configured');
        }

        const response = await fetch(this.settings.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }

        return response;
    }

    // Scheduled automation checks
    startAutomationScheduler() {
        // Check for reminders every hour
        setInterval(() => {
            this.checkAppointmentReminders();
        }, 60 * 60 * 1000); // 1 hour

        // Check for feedback requests daily
        setInterval(() => {
            this.checkFeedbackRequests();
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Initial check
        setTimeout(() => {
            this.checkAppointmentReminders();
            this.checkFeedbackRequests();
        }, 5000); // 5 seconds after startup
    }

    checkAppointmentReminders() {
        if (!this.settings.reminder24h) return;

        try {
            const appointments = this.getAppointments();
            const patients = this.getPatients();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            const tomorrowAppointments = appointments.filter(apt => 
                apt.date === tomorrowStr && 
                apt.status === 'scheduled'
            );

            tomorrowAppointments.forEach(appointment => {
                const patient = patients.find(p => p.id === appointment.patientId);
                if (patient) {
                    this.triggerAppointmentReminder({
                        ...appointment,
                        patient: patient
                    });
                }
            });

            if (tomorrowAppointments.length > 0) {
                console.log(`Sent ${tomorrowAppointments.length} appointment reminders`);
            }

        } catch (error) {
            console.error('Error checking appointment reminders:', error);
        }
    }

    checkFeedbackRequests() {
        if (!this.settings.feedbackRequests) return;

        try {
            const appointments = this.getAppointments();
            const patients = this.getPatients();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const completedAppointments = appointments.filter(apt => 
                apt.date === yesterdayStr && 
                apt.status === 'completed'
            );

            completedAppointments.forEach(appointment => {
                const patient = patients.find(p => p.id === appointment.patientId);
                if (patient) {
                    this.triggerFeedbackRequest({
                        ...appointment,
                        patient: patient
                    });
                }
            });

            if (completedAppointments.length > 0) {
                console.log(`Sent ${completedAppointments.length} feedback requests`);
            }

        } catch (error) {
            console.error('Error checking feedback requests:', error);
        }
    }

    getAppointments() {
        try {
            const stored = localStorage.getItem('dentalClinic_appointments');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading appointments:', error);
            return [];
        }
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

    loadSettings() {
        try {
            const stored = localStorage.getItem('dentalClinic_automationSettings');
            if (stored) {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            }
            
            // Make settings globally available
            window.automationSettings = { ...this.settings };
            
        } catch (error) {
            console.error('Error loading automation settings:', error);
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('dentalClinic_automationSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving automation settings:', error);
            throw error;
        }
    }

    // Validation methods
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validateUrl(url) {
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    }

    // Notification methods
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

    showInfo(message) {
        if (window.dentalApp) {
            window.dentalApp.showToast(message, 'info');
        }
    }

    // Get automation status summary
    getAutomationStatus() {
        const enabledFeatures = [];
        const disabledFeatures = [];
        
        const features = {
            emailNotifications: 'Email Notifications',
            smsNotifications: 'SMS Notifications',
            appointmentConfirmations: 'Appointment Confirmations',
            reminder24h: '24-Hour Reminders',
            autoInvoicing: 'Auto Invoice Generation',
            feedbackRequests: 'Feedback Requests'
        };
        
        Object.entries(features).forEach(([key, name]) => {
            if (this.settings[key]) {
                enabledFeatures.push(name);
            } else {
                disabledFeatures.push(name);
            }
        });
        
        return {
            enabled: enabledFeatures,
            disabled: disabledFeatures,
            totalFeatures: Object.keys(features).length,
            enabledCount: enabledFeatures.length,
            isFullyConfigured: !!(this.settings.clinicEmail && this.settings.webhookUrl)
        };
    }
}

