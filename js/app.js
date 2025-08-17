// Main Application Controller
class DentalClinicApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentTab = 'patient-management'; // Track current tab
        this.currentFilter = 'all'; // Track current filter
        this.currentPatients = []; // Track current filtered patients
        this.currentAppointments = []; // Track current filtered appointments
        this.currentStaff = []; // Track current filtered staff
        this.currentSalaries = []; // Track current filtered salaries
        this.currentBilling = []; // Track current filtered billing
        this.currentAttendance = []; // Track current filtered attendance
        this.isLoading = true;
        this.isMobile = window.innerWidth <= 768;
        this.formSubmissionLock = false;
        this.isEditingStaff = false; // Track if we're editing staff
        this.editingStaffId = null; // Track which staff member we're editing
        this.pakistanTimeZone = 'Asia/Karachi'; // Pakistan timezone
        this.patientsPerPage = 10; // Default patients per page
        this.currentPatientPage = 1; // Track current patient page
        this.appointmentsPerPage = 10; // Default appointments per page
        this.currentAppointmentPage = 1; // Track current appointment page
        this.selectedAppointments = new Set(); // Track selected appointments for bulk actions
        
        this.init();
        this.startDateAutoUpdate(); // Start auto-date update
        
        // Initialize enhanced date pickers after a short delay
        setTimeout(() => {
            this.initializeEnhancedDatePickers();
        }, 500);
    }

    // Security: HTML escaping function to prevent XSS attacks
    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    init() {
        this.setupEventListeners();
        this.setupMobileHandlers();
        this.loadInitialData();
        this.loadEntriesPerPagePreference(); // Load saved preference
        this.hideLoadingSpinner();
        
        // Initialize other modules
        if (typeof PatientsManager !== 'undefined') {
            window.patientsManager = new PatientsManager();
        }
        if (typeof AppointmentsManager !== 'undefined') {
            window.appointmentsManager = new AppointmentsManager();
        }
        if (typeof BillingManager !== 'undefined' && !window.billingManager) {
            console.log('Initializing BillingManager...');
            window.billingManager = new BillingManager();
            window.billingManager.init();
        }
        if (typeof AutomationManager !== 'undefined') {
            window.automationManager = new AutomationManager();
        }
        if (typeof FeedbackManager !== 'undefined') {
            window.feedbackManager = new FeedbackManager();
        }
        

    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });

        // Dropdown filters
        this.setupDropdownFilters();

        // Patient form functionality
        this.setupPatientForm();



        // Add new buttons
        document.getElementById('add-new-patient-btn')?.addEventListener('click', () => {
            this.showAddPatientModal();
            // Double-check date is set after modal opens
            setTimeout(() => {
                const addDateInput = document.getElementById('patient-add-date');
                if (addDateInput && !addDateInput.value) {
                    const today = new Date().toISOString().split('T')[0];
                    addDateInput.value = today;
                    addDateInput.setAttribute('readonly', true);
                }
            }, 10);
        });
        document.getElementById('add-new-appointment-btn')?.addEventListener('click', () => {
            this.showAddAppointmentModal();
            // Ensure appointment date is set after modal opens
            setTimeout(() => {
                this.setAppointmentDateToToday();
            }, 50);
        });
        document.getElementById('add-new-billing-btn')?.addEventListener('click', () => this.showAddBillingModal());

        // Staff section buttons
        const addNewStaffBtn = document.getElementById('add-new-staff-btn');
        if (addNewStaffBtn) {
            addNewStaffBtn.addEventListener('click', () => {
                console.log('Add New Staff button clicked');
                this.showAddStaffModal();
            });
        } else {
            console.log('Add New Staff button not found');
        }
        document.getElementById('add-new-salary-btn')?.addEventListener('click', () => {
            this.showAddSalaryModal();
        });
        
        document.getElementById('staff-header-settings-btn')?.addEventListener('click', () => {
            this.showStaffSettingsModal();
        });



        // Modal close buttons
        document.getElementById('patient-modal-close')?.addEventListener('click', () => this.closePatientModal());
        document.getElementById('patient-cancel-btn')?.addEventListener('click', () => this.closePatientModal());
        document.getElementById('appointment-modal-close')?.addEventListener('click', () => this.closeAppointmentModal());
        document.getElementById('appointment-cancel-btn')?.addEventListener('click', () => this.closeAppointmentModal());
        document.getElementById('staff-modal-close')?.addEventListener('click', () => this.closeStaffModal());
        document.getElementById('staff-cancel-btn')?.addEventListener('click', () => this.closeStaffModal());
        document.getElementById('salary-modal-close')?.addEventListener('click', () => this.closeSalaryModal());
        document.getElementById('salary-cancel-btn')?.addEventListener('click', () => this.closeSalaryModal());
        document.getElementById('attendance-modal-close')?.addEventListener('click', () => this.closeAttendanceModal());
        document.getElementById('attendance-cancel-btn')?.addEventListener('click', () => this.closeAttendanceModal());
        document.getElementById('staff-settings-close')?.addEventListener('click', () => this.closeStaffSettingsModal());
        document.getElementById('staff-settings-cancel')?.addEventListener('click', () => this.closeStaffSettingsModal());

        // Search functionality
        document.getElementById('patient-search')?.addEventListener('input', (e) => this.searchPatients(e.target.value));
        document.getElementById('appointment-search')?.addEventListener('input', (e) => this.searchAppointments(e.target.value));
        document.getElementById('billing-search')?.addEventListener('input', (e) => this.searchBilling(e.target.value));
        document.getElementById('staff-search')?.addEventListener('input', (e) => this.searchStaff(e.target.value));
        document.getElementById('salary-search')?.addEventListener('input', (e) => this.searchSalary(e.target.value));
        document.getElementById('attendance-search')?.addEventListener('input', (e) => this.searchAttendance(e.target.value));

        // Mobile menu toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => this.toggleSidebar());

        // Sidebar close button
        document.getElementById('sidebar-close')?.addEventListener('click', () => this.closeSidebar());

        // Sidebar overlay
        document.getElementById('sidebar-overlay')?.addEventListener('click', () => this.closeSidebar());

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sidebar') && !e.target.closest('#sidebar-toggle')) {
                this.closeSidebar();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        // Staff form submission
        document.getElementById('staff-form')?.addEventListener('submit', (e) => this.handleStaffFormSubmit(e));
        
        // Salary form submission
        document.getElementById('salary-form')?.addEventListener('submit', (e) => this.handleSalaryFormSubmit(e));
        
        // Salary save & print button
        document.getElementById('salary-save-print-btn')?.addEventListener('click', (e) => this.handleSalarySaveAndPrint(e));
        
        // Attendance form submission
        document.getElementById('attendance-form')?.addEventListener('submit', (e) => this.handleAttendanceFormSubmit(e));
        
        // Staff settings form submission
        document.getElementById('staff-settings-form')?.addEventListener('submit', (e) => this.handleStaffSettingsSubmit(e));
        
        // Attendance date filter
        document.getElementById('attendance-date-filter')?.addEventListener('change', (e) => this.filterAttendanceByDate(e.target.value));
        
        // Attendance time change listener for auto-status detection
        document.getElementById('attendance-time')?.addEventListener('change', () => this.autoDetectAttendanceStatus());

        // Setup staff status dropdown
        this.setupStaffStatusDropdown();

        // Event delegation for staff buttons (in case they're loaded dynamically)
        document.addEventListener('click', (e) => {
            if (e.target.closest('#add-new-staff-btn')) {
                console.log('Add New Staff button clicked (delegated)');
                this.showAddStaffModal();
            }
        });



        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }



    setupDropdownFilters() {
        // Setup dropdown filter functionality
        const dropdownFilters = [
            'patient-filter-dropdown',
            'appointment-filter-dropdown',
            'appointment-status-filter-dropdown',
            'billing-filter-dropdown',
            'staff-filter-dropdown',
            'salary-filter-dropdown',
            'attendance-filter-dropdown'
        ];

        dropdownFilters.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;

            const trigger = dropdown.querySelector('.dropdown-filter-trigger');
            const menu = dropdown.querySelector('.dropdown-filter-menu');
            const options = dropdown.querySelectorAll('.dropdown-filter-option');

            // Toggle dropdown on trigger click
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown-filter-menu.show').forEach(openMenu => {
                    if (openMenu !== menu) {
                        openMenu.classList.remove('show');
                        openMenu.closest('.dropdown-filter').querySelector('.dropdown-filter-trigger').classList.remove('active');
                    }
                });

                // Toggle current dropdown
                menu.classList.toggle('show');
                trigger.classList.toggle('active');
            });

            // Handle option selection
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const filterType = option.getAttribute('data-filter');
                    const dataType = option.getAttribute('data-type');
                    const filterText = option.textContent.trim();

                    // Update trigger text and icon
                    const triggerIcon = trigger.querySelector('i:first-child');
                    const triggerText = trigger.querySelector('.filter-text');
                    const optionIcon = option.querySelector('i');

                    if (triggerIcon && optionIcon) {
                        triggerIcon.className = optionIcon.className;
                    }
                    if (triggerText) {
                        triggerText.textContent = filterText;
                    }

                    // Update active states
                    options.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');

                    // Add selection class to trigger to maintain primary color
                    trigger.classList.add('has-selection');

                    // Close dropdown
                    menu.classList.remove('show');
                    trigger.classList.remove('active');

                    // Handle filter
                    this.handleFilter(filterType, dataType);
                });
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-filter')) {
                document.querySelectorAll('.dropdown-filter-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                    menu.closest('.dropdown-filter').querySelector('.dropdown-filter-trigger').classList.remove('active');
                });
            }
        });

        // Close dropdowns on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.dropdown-filter-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                    menu.closest('.dropdown-filter').querySelector('.dropdown-filter-trigger').classList.remove('active');
                });
            }
        });
    }

    getTabShortForm(tabName, filterType = null) {
        const shortForms = {
            'patient-management': {
                'all': 'AP', // All Patients
                'active': 'AP', // Active Patients
                'inactive': 'IP' // Inactive Patients
            },
            'appointment-management': {
                'all': 'AM', // All Appointments
                'today': 'TA', // Today's Appointments
                'week': 'WA', // Week's Appointments
                'month': 'MA' // Month's Appointments
            },
            'appointment-status': {
                'all': 'AS', // All Status
                'scheduled': 'ES', // Scheduled Appointments
                'confirmed': 'EC', // Confirmed Appointments
                'completed': 'ECP', // Completed Appointments
                'cancelled': 'ECAN' // Cancelled Appointments
            },
            'billing-management': {
                'all': 'BM', // All Billing
                'paid': 'PB', // Paid Billing
                'unpaid': 'UB' // Unpaid Billing
            }
        };
        
        if (filterType && shortForms[tabName] && shortForms[tabName][filterType]) {
            return shortForms[tabName][filterType];
        }
        
        // Default to 'all' filter for the tab
        return shortForms[tabName]?.['all'] || 'AP';
    }

    getCurrentTabShortForm() {
        // For appointment tab, check both time and status filters
        if (this.currentTab === 'appointment-management') {
            const activeTimeFilter = document.querySelector('[data-type="appointment"].dropdown-filter-option.active');
            const activeStatusFilter = document.querySelector('[data-type="appointment-status"].dropdown-filter-option.active');
            
            if (activeTimeFilter && activeStatusFilter) {
                const timeFilter = activeTimeFilter.getAttribute('data-filter');
                const statusFilter = activeStatusFilter.getAttribute('data-filter');
                
                // Show only the status filter short form for tooltip
                const statusShort = this.getTabShortForm('appointment-status', statusFilter);
                return statusShort;
            } else if (activeTimeFilter) {
                return this.getTabShortForm('appointment-management', activeTimeFilter.getAttribute('data-filter'));
            } else if (activeStatusFilter) {
                return this.getTabShortForm('appointment-status', activeStatusFilter.getAttribute('data-filter'));
            }
        }
        
        return this.getTabShortForm(this.currentTab, this.currentFilter);
    }







    setupPatientForm() {
        const form = document.getElementById('patient-form');
        const dobInput = document.getElementById('patient-dob');
        const ageInput = document.getElementById('patient-age');
        const addDateInput = document.getElementById('patient-add-date');
        


        // Set current date immediately when form is loaded
        if (addDateInput) {
            const today = new Date().toISOString().split('T')[0];
            addDateInput.value = today;
            addDateInput.setAttribute('readonly', true);
            
            // Add calendar functionality to add date input
            addDateInput.style.backgroundImage = "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3e%3crect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"%3e%3c/rect%3e%3cline x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"%3e%3c/line%3e%3cline x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"%3e%3c/line%3e%3cline x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"%3e%3c/line%3e%3c/svg%3e')";
            addDateInput.style.backgroundRepeat = "no-repeat";
            addDateInput.style.backgroundPosition = "right 0.75rem center";
            addDateInput.style.backgroundSize = "1rem";
            addDateInput.style.paddingRight = "2.5rem";
            addDateInput.style.cursor = "pointer";
            
            addDateInput.addEventListener('click', () => {
                this.showCalendar(addDateInput, addDateInput.value);
            });
        }

        // Calculate age when date of birth changes and add calendar functionality
        if (dobInput && ageInput) {
            dobInput.setAttribute('readonly', true);
            
            // Add calendar icon and styling
            dobInput.style.backgroundImage = "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3e%3crect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"%3e%3c/rect%3e%3cline x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"%3e%3c/line%3e%3cline x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"%3e%3c/line%3e%3cline x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"%3e%3c/line%3e%3c/svg%3e')";
            dobInput.style.backgroundRepeat = "no-repeat";
            dobInput.style.backgroundPosition = "right 0.75rem center";
            dobInput.style.backgroundSize = "1rem";
            dobInput.style.paddingRight = "2.5rem";
            dobInput.style.cursor = "pointer";
            
            dobInput.addEventListener('click', () => {
                this.showCalendar(dobInput, dobInput.value);
            });
            
            dobInput.addEventListener('change', () => {
                const age = this.calculateAge(dobInput.value);
                ageInput.value = age;
            });
        }

        // Handle form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePatientFormSubmit();
            });
        }
    }
    
    setupAppointmentStatusDropdown() {
        const statusInput = document.getElementById('appointment-status');
        const statusOptions = document.getElementById('appointment-status-options');
        const statusOptionElements = document.querySelectorAll('#appointment-status-options .status-option');

        if (statusInput && statusOptions) {
            // Toggle dropdown when clicking status input
            statusInput.addEventListener('click', (e) => {
                e.preventDefault();
                statusOptions.classList.toggle('show');
                this.updateAppointmentStatusOptionActive();
            });

            // Handle option selection
            statusOptionElements.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.getAttribute('data-value');
                    statusInput.value = value;
                    statusOptions.classList.remove('show');
                    this.updateAppointmentStatusOptionActive();
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.status-input-container')) {
                    statusOptions.classList.remove('show');
                }
            });
        }
    }
    
    updateAppointmentStatusOptionActive() {
        const statusInput = document.getElementById('appointment-status');
        const statusOptionElements = document.querySelectorAll('#appointment-status-options .status-option');
        
        if (statusInput) {
            const currentValue = statusInput.value;
            
            statusOptionElements.forEach(option => {
                option.classList.remove('active');
                if (option.getAttribute('data-value') === currentValue) {
                    option.classList.add('active');
                }
            });
        }
    }
    
    populatePatientDropdown() {
        const patientSelect = document.getElementById('appointment-patient');
        const patients = (this.getStoredData('patients') || []).filter(p => (p.status || '').toLowerCase() === 'active');
        
        if (patientSelect) {
            // Clear existing options except the first one
            patientSelect.innerHTML = '<option value="">Select Patient</option>';
            
            // Add patient options
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.name} - ${patient.phone}`;
                patientSelect.appendChild(option);
            });
        }
    }

    showAddPatientModal() {
        const modal = document.getElementById('patient-modal');
        const form = document.getElementById('patient-form');
        const title = document.getElementById('patient-modal-title');
        
        // Show modal instantly (no animation)
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // Set title and button text
        title.textContent = 'Add New Patient';
        const submitBtn = document.querySelector('#patient-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Save Patient';
        }
        
        // Reset form AFTER showing modal
        form.reset();
        form.removeAttribute('data-edit-id');
        
        // Auto-fill current date immediately when form opens
        setTimeout(() => {
            const addDateInput = document.getElementById('patient-add-date');
            if (addDateInput) {
                const today = new Date().toISOString().split('T')[0];
                addDateInput.value = today;
                addDateInput.setAttribute('readonly', true);
            }
            
                    // Set default status to active
        const statusInput = document.getElementById('patient-status');
        if (statusInput) {
            statusInput.value = 'Active';
            this.updateStatusOptionActive();
        }
            
            // Clear age
            const ageInput = document.getElementById('patient-age');
            if (ageInput) {
                ageInput.value = '';
            }
            
            // Focus on first input field
            const firstInput = form.querySelector('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    closePatientModal() {
        const modal = document.getElementById('patient-modal');
        // Close modal instantly (no animation)
        modal.style.display = 'none';
        modal.classList.remove('active');
        
        // Close any open calendar dropdowns
        const calendarDropdown = document.querySelector('.calendar-dropdown');
        if (calendarDropdown) {
            calendarDropdown.remove();
        }
    }
    
    closeAppointmentModal() {
        const modal = document.getElementById('appointment-modal');
        // Close modal instantly (no animation)
        modal.style.display = 'none';
        modal.classList.remove('active');
        
        // Reset form
        const form = document.getElementById('appointment-form');
        if (form) {
            form.reset();
            form.removeAttribute('data-edit-id');
        }
    }

    // Ensure appointments always point to valid patients
    repairAppointmentsWithMissingPatients() {
        try {
            const patients = this.getStoredData('patients') || [];
            const appointments = this.getStoredData('appointments') || [];

            if (appointments.length === 0) return;

            const validPatientIds = new Set(patients.map(p => p.id));
            let didChange = false;

            const repaired = appointments.map(apt => {
                if (!validPatientIds.has(apt.patientId)) {
                    // Try to map by phone/email/name if concatenated strings were accidentally saved
                    const parsed = this.parseConcatenatedPatientString(apt.patientId);
                    if (parsed) {
                        const match = patients.find(p =>
                            (parsed.email && p.email === parsed.email) ||
                            (parsed.phone && p.phone === parsed.phone) ||
                            (parsed.name && p.name === parsed.name)
                        );
                        if (match) {
                            didChange = true;
                            return { ...apt, patientId: match.id };
                        }
                    }
                }
                return apt;
            });

            if (didChange) {
                this.setStoredData('appointments', repaired);
                this.currentAppointments = repaired;
                // Re-render current view
                const activeTimeFilter = document.querySelector('[data-type="appointment"].dropdown-filter-option.active');
                const timeFilter = activeTimeFilter?.getAttribute('data-filter') || 'all';
                this.filterAppointments(timeFilter);
                this.showToast('Fixed appointments with missing patients', 'info');
            }
        } catch (error) {
            console.warn('repairAppointmentsWithMissingPatients failed:', error);
        }
    }

    // Hard rule: remove or block any appointment that resolves to unknown patient
    removeUnknownAppointments() {
        try {
            const patients = this.getStoredData('patients') || [];
            const validIds = new Set(patients.map(p => p.id));
            const appointments = this.getStoredData('appointments') || [];
            const filtered = appointments.filter(a => validIds.has(a.patientId));
            if (filtered.length !== appointments.length) {
                this.setStoredData('appointments', filtered);
                this.currentAppointments = filtered;
                const activeTimeFilter = document.querySelector('[data-type="appointment"].dropdown-filter-option.active');
                const timeFilter = activeTimeFilter?.getAttribute('data-filter') || 'all';
                this.filterAppointments(timeFilter);
                this.showToast('Removed appointments with unknown patients', 'warning');
            }
        } catch (e) {
            console.warn('removeUnknownAppointments failed:', e);
        }
    }

    // Parse strings like: "2025areesha043245...areesha@gmail.com2006-12-06inactiveAugust 2"
    parseConcatenatedPatientString(input) {
        if (typeof input !== 'string') return null;
        try {
            const emailMatch = input.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
            const phoneMatch = input.match(/\b0\d{10,12}\b/);
            const nameMatch = input.match(/[A-Za-z]+\s+[A-Za-z]+/);
            return {
                email: emailMatch ? emailMatch[0] : null,
                phone: phoneMatch ? phoneMatch[0] : null,
                name: nameMatch ? nameMatch[0] : null
            };
        } catch {
            return null;
        }
    }

    // Utilities for import parsing
    parseFlexibleDate(input) {
        if (!input) return null;
        const s = String(input).trim().replace(/[.]/g, '-').replace(/\\/g, '-').replace(/\s+/g, ' ');
        // ISO yyyy-mm-dd
        const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (isoMatch) {
            const y = parseInt(isoMatch[1]);
            const m = parseInt(isoMatch[2]);
            const d = parseInt(isoMatch[3]);
            if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            }
        }
        // dd/mm/yyyy or mm/dd/yyyy with '/'
        const slash = s.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
        if (slash) {
            let d = parseInt(slash[1]);
            let m = parseInt(slash[2]);
            const y = parseInt(slash[3]);
            // if first > 12 assume dd/mm/yyyy, else ambiguous -> assume mm/dd when second > 12
            if (d > 12 || (m <= 12 && slash[2] > 12)) {
                // d/m
            } else if (d <= 12 && m > 12) {
                const tmp = d; d = m; m = tmp; // swap to dd/mm
            }
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
        // dd-mm-yyyy or mm-dd-yyyy with '-'
        const dash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (dash) {
            let d = parseInt(dash[1]);
            let m = parseInt(dash[2]);
            const y = parseInt(dash[3]);
            if (d <= 12 && m > 12) { const t = d; d = m; m = t; }
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
        // Fallback to Date()
        const parsed = new Date(s);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = parsed.getMonth() + 1;
            const d = parsed.getDate();
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
        return null;
    }

    convertTo24HourTime(input) {
        if (!input) return null;
        const s = String(input).trim().toUpperCase();
        const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
        if (!m) return null;
        let h = parseInt(m[1]);
        let min = m[2] ? parseInt(m[2]) : 0;
        const ampm = m[3];
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        if (h > 23 || min > 59) return null;
        return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }

  

    setupMobileHandlers() {
        // Handle mobile-specific interactions
        if (this.isMobile) {
            document.body.classList.add('mobile');
        }
    }

    showSection(sectionName) {
        console.log('Showing section:', sectionName);
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            
            // Trigger animation
            setTimeout(() => {
                targetSection.style.opacity = '1';
            }, 10);
        }
        
        // Update navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Update page title
        const titles = {
            dashboard: 'Dashboard Overview',
            'patient-services': 'Patient Services',
            staff: 'Staff Management',
            automation: 'Automation Settings',
            feedback: 'Patient Feedback'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[sectionName] || 'Dashboard';
        }
        
        // Close sidebar on mobile after navigation
        if (this.isMobile) {
            this.closeSidebar();
        }
        
        // Update current section
        this.currentSection = sectionName;
        
        // Trigger section-specific initialization
        this.initializeSection(sectionName);
    }

    showTab(tabName) {
        console.log('Showing tab:', tabName);
        
        // Update current tab
        this.currentTab = tabName;
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show target tab content
        const targetContent = document.getElementById(tabName);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Activate target tab button
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // Initialize tab-specific functionality
        this.initializeTab(tabName);
        

    }

    initializeSection(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'patient-services':
                // Initialize the first tab by default
                this.showTab('patient-management');
                break;
            case 'staff':
                // Initialize the first tab by default
                this.showTab('staff-management');
                break;
            case 'automation':
                if (window.automationManager) {
                    window.automationManager.loadSettings();
                }
                break;
            case 'feedback':
                if (window.feedbackManager) {
                    window.feedbackManager.loadFeedback();
                }
                break;
        }
    }

    initializeTab(tabName) {
        switch (tabName) {
            case 'patient-management':
                // Load and display all patients by default in custom style
                const patients = this.getStoredData('patients') || [];
                console.log('Initializing patient management tab with', patients.length, 'patients');
                console.log('Patients:', patients);
                
                // Load entries per page preference
                this.loadEntriesPerPagePreference();
                
                // Check and fix data integrity issues
                this.debugPatientData();
                this.fixPatientDataIntegrity();
                
                // Clean up any corrupted patient data
                this.cleanupCorruptedPatients();
                
                // Ensure patient data consistency and fix ID sync issues
                this.ensurePatientDataSync();
                
                // Verify data consistency
                this.verifyPatientDataConsistency();
                
                // Verify data across all pages
                this.verifyPatientDataAcrossPages();
                
                this.currentPatients = patients;
                this.displayPatients(patients, 1);
                break;
            case 'appointment-management':
                // Load and display all appointments by default in card style
                const appointments = this.getStoredData('appointments') || [];
                console.log('Initializing appointment management tab with', appointments.length, 'appointments');
                console.log('Appointments:', appointments);
                this.currentAppointments = appointments;
                this.displayAppointments(appointments, 1); // Always start from page 1
                

                break;
            case 'billing-management':
                // Load and display all invoices by default with pagination
                const invoices = this.getStoredData('invoices') || [];
                console.log('Initializing billing management tab with', invoices.length, 'invoices');
                console.log('Invoices:', invoices);
                this.currentBilling = invoices;
                this.displayBilling(invoices, 1); // Always start from page 1
                

                break;
            case 'staff-management':
                // Load and display all staff by default
                const staff = this.getStoredData('staff') || [];
                console.log('Initializing staff management tab with', staff.length, 'staff members');
                console.log('Staff:', staff);
                this.currentStaff = staff;
                this.displayStaff(staff, 1);
                

                break;
            case 'salary-management':
                // Load and display all salaries by default
                const salaries = this.getStoredData('salaries') || [];
                console.log('Initializing salary management tab with', salaries.length, 'salary records');
                console.log('Salaries:', salaries);
                this.currentSalaries = salaries;
                this.displaySalary(salaries, 1);
                

                break;
            case 'attendance-management':
                // Load and display today's attendance records by default
                console.log('Initializing attendance management tab');
                this.filterAttendance('today'); // This will load today's records and update display
                

                break;
        }
    }

    handleFilter(filterType, dataType) {
        console.log('Filtering', dataType, 'by:', filterType);
        
        // Update current filter
        this.currentFilter = filterType;
        
        // Update dropdown filter option states for the specific type
        document.querySelectorAll(`[data-type="${dataType}"].dropdown-filter-option`).forEach(option => {
            option.classList.remove('active');
        });
        
        const activeFilterOption = document.querySelector(`[data-filter="${filterType}"][data-type="${dataType}"].dropdown-filter-option`);
        if (activeFilterOption) {
            activeFilterOption.classList.add('active');
        }
        
        switch (dataType) {
            case 'patient':
                this.filterPatients(filterType);
                break;
            case 'appointment':
                this.filterAppointments(filterType);
                break;
            case 'appointment-status':
                this.filterAppointmentsByStatus(filterType);
                break;
            case 'billing':
                this.filterBilling(filterType);
                break;
            case 'staff':
                this.filterStaff(filterType);
                break;
            case 'salary':
                this.filterSalary(filterType);
                break;
            case 'attendance':
                this.filterAttendance(filterType);
                break;
        }
        

    }

    filterPatients(filterType, showToast = true, maintainPage = false) {
        try {
            const patients = this.getStoredData('patients') || [];
            let filteredPatients = [];
            
            console.log('Filtering patients by:', filterType);
            console.log('Total patients:', patients.length);
            
            switch (filterType) {
                case 'all':
                    filteredPatients = patients;
                    break;
                case 'active':
                    filteredPatients = patients.filter(p => p.status === 'Active');
                    break;
                case 'inactive':
                    filteredPatients = patients.filter(p => p.status === 'Inactive');
                    break;
                default:
                    filteredPatients = patients;
            }
            
            console.log('Filtered patients:', filteredPatients.length);
            console.log('Filtered patient names:', filteredPatients.map(p => p.name));
            
            // Store current filtered patients
            this.currentPatients = filteredPatients;
            
            // Determine which page to display
            let pageToDisplay = 1;
            if (maintainPage) {
                // Calculate if current page is still valid after filtering
                const totalPages = Math.ceil(filteredPatients.length / this.patientsPerPage);
                pageToDisplay = Math.min(this.currentPatientPage, totalPages);
                if (pageToDisplay < 1) pageToDisplay = 1;
            }
            
            this.displayPatients(filteredPatients, pageToDisplay);
        } catch (error) {
            console.error('Error in filterPatients:', error);
            this.handlePatientTabError(error, 'filterPatients');
        }
    }

    filterAppointments(filterType) {
        const appointments = this.getStoredData('appointments') || [];
        let filteredAppointments = [];
        
        switch (filterType) {
            case 'all':
                filteredAppointments = appointments;
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredAppointments = appointments.filter(apt => apt.date === today);
                break;
            case 'week':
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                filteredAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    return aptDate >= weekStart && aptDate <= weekEnd;
                });
                break;
            case 'month':
                const monthStart = new Date();
                monthStart.setDate(1);
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                filteredAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    return aptDate >= monthStart && aptDate <= monthEnd;
                });
                break;
            default:
                filteredAppointments = appointments;
        }
        
        // Apply status filter if active
        const activeStatusFilter = document.querySelector('[data-type="appointment-status"].dropdown-filter-option.active');
        if (activeStatusFilter && activeStatusFilter.getAttribute('data-filter') !== 'all') {
            const statusFilter = activeStatusFilter.getAttribute('data-filter');
            filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter);
        }
        
        // Store current filtered appointments
        this.currentAppointments = filteredAppointments;
        
        this.displayAppointments(filteredAppointments, 1); // Always start from page 1
        

        
        // Removed toast notification to reduce clutter
        // this.showToast(`Showing ${filteredAppointments.length} ${filterType} appointments`, 'info');
    }

    filterAppointmentsByStatus(filterType) {
        const appointments = this.getStoredData('appointments') || [];
        let filteredAppointments = [];
        
        // First apply time filter if active
        const activeTimeFilter = document.querySelector('[data-type="appointment"].dropdown-filter-option.active');
        if (activeTimeFilter) {
            const timeFilter = activeTimeFilter.getAttribute('data-filter');
            switch (timeFilter) {
                case 'all':
                    filteredAppointments = appointments;
                    break;
                case 'today':
                    const today = new Date().toISOString().split('T')[0];
                    filteredAppointments = appointments.filter(apt => apt.date === today);
                    break;
                case 'week':
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    filteredAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        return aptDate >= weekStart && aptDate <= weekEnd;
                    });
                    break;
                case 'month':
                    const monthStart = new Date();
                    monthStart.setDate(1);
                    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                    filteredAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        return aptDate >= monthStart && aptDate <= monthEnd;
                    });
                    break;
                default:
                    filteredAppointments = appointments;
            }
        } else {
            filteredAppointments = appointments;
        }
        
        // Then apply status filter
        switch (filterType) {
            case 'all':
                // No additional filtering needed
                break;
            case 'scheduled':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'scheduled');
                break;
            case 'confirmed':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'confirmed');
                break;
            case 'completed':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'completed');
                break;
            case 'cancelled':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'cancelled');
                break;
        }
        
        // Store current filtered appointments
        this.currentAppointments = filteredAppointments;
        
        this.displayAppointments(filteredAppointments, 1); // Always start from page 1
        

        
        // Removed toast notification to reduce clutter
        // this.showToast(`Showing ${filteredAppointments.length} ${filterType} appointments`, 'info');
    }

    filterBilling(filterType) {
        console.log('Filtering billing by:', filterType);
        const invoices = this.getStoredData('invoices') || [];
        console.log('Total invoices before filtering:', invoices.length);
        console.log('Invoice statuses:', invoices.map(inv => ({ id: inv.id, status: inv.status })));
        
        let filteredInvoices = [];
        
        switch (filterType) {
            case 'all':
                filteredInvoices = invoices;
                break;
            case 'paid':
                filteredInvoices = invoices.filter(inv => inv.status === 'paid');
                break;
            case 'unpaid':
                filteredInvoices = invoices.filter(inv => inv.status === 'unpaid');
                break;

            default:
                filteredInvoices = invoices;
        }
        
        console.log('Filtered invoices:', filteredInvoices.length);
        console.log('Filtered invoice details:', filteredInvoices.map(inv => ({ id: inv.id, status: inv.status, patientId: inv.patientId })));
        
        // Store current filtered billing
        this.currentBilling = filteredInvoices;
        
        this.displayBilling(filteredInvoices, 1); // Always start from page 1
        

        
        // Removed toast notification to reduce clutter
        // Only show toast for non-default filters to reduce clutter
        // if (filterType !== 'all') {
        //     this.showToast(`Showing ${filteredInvoices.length} ${filterType} invoices`, 'info');
        // }
    }

    filterStaff(filterType) {
        console.log('Filtering staff by:', filterType);
        const staff = this.getStoredData('staff') || [];
        console.log('Total staff before filtering:', staff.length);
        
        let filteredStaff = [];
        
        switch (filterType) {
            case 'all':
                filteredStaff = staff;
                break;
            case 'active':
                filteredStaff = staff.filter(s => s.status === 'active' || s.status === undefined);
                break;
            case 'leave':
                filteredStaff = staff.filter(s => s.status === 'leave');
                break;
            case 'left':
                filteredStaff = staff.filter(s => s.status === 'left');
                break;
            default:
                filteredStaff = staff;
        }
        
        console.log('Filtered staff:', filteredStaff.length);
        this.currentStaff = filteredStaff;
        this.displayStaff(filteredStaff, 1);
        

        
        // Removed toast notification to reduce clutter
        // Only show toast for non-default filters
        // if (filterType !== 'all') {
        //     this.showToast(`Showing ${filteredStaff.length} ${filterType} staff members`, 'info');
        // }
    }

    filterSalary(filterType) {
        console.log('Filtering salary by:', filterType);
        const salaries = this.getStoredData('salaries') || [];
        console.log('Total salaries before filtering:', salaries.length);
        
        let filteredSalaries = [];
        
        switch (filterType) {
            case 'all':
                filteredSalaries = salaries;
                break;
            case 'paid':
                filteredSalaries = salaries.filter(s => s.status === 'paid');
                break;
            case 'pending':
                filteredSalaries = salaries.filter(s => s.status === 'pending' || s.status === undefined);
                break;
            default:
                filteredSalaries = salaries;
        }
        
        console.log('Filtered salaries:', filteredSalaries.length);
        this.currentSalaries = filteredSalaries;
        this.displaySalary(filteredSalaries, 1);
        

        
        // Removed toast notification to reduce clutter
        // Only show toast for non-default filters
        // if (filterType !== 'all') {
        //     this.showToast(`Showing ${filteredSalaries.length} ${filterType} salary records`, 'info');
        // }
    }

    filterAttendance(filterType) {
        console.log('Filtering attendance by:', filterType);
        const attendance = this.getStoredData('attendance') || [];
        console.log('Total attendance records before filtering:', attendance.length);
        
        let filteredAttendance = [];
        const today = this.getPakistanDate(); // Use Pakistan date consistently
        
        switch (filterType) {
            case 'today':
                // For today filter, we want to show all active staff with their attendance status
                // This includes showing "NOT MARKED" for staff without attendance records
                // So we pass an empty array to displayAttendance to trigger the "all staff" display mode
                filteredAttendance = [];
                // Clear selected date when showing today's attendance
                this.selectedAttendanceDate = null;
                break;
            case 'week':
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                filteredAttendance = attendance.filter(a => {
                    const attDate = new Date(a.date);
                    return attDate >= weekStart && attDate <= weekEnd;
                });
                // Clear selected date when using week filter
                this.selectedAttendanceDate = null;
                break;
            case 'month':
                const monthStart = new Date();
                monthStart.setDate(1);
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                filteredAttendance = attendance.filter(a => {
                    const attDate = new Date(a.date);
                    return attDate >= monthStart && attDate <= monthEnd;
                });
                // Clear selected date when using month filter
                this.selectedAttendanceDate = null;
                break;
            case 'all':
            default:
                filteredAttendance = attendance;
                // Clear selected date when using all filter
                this.selectedAttendanceDate = null;
                break;
        }
        
        console.log('Filtered attendance:', filteredAttendance.length);
        this.currentAttendance = filteredAttendance;
        this.displayAttendance(filteredAttendance, 1);
        this.updateAttendanceStats(filteredAttendance);
        
        // Show/hide import button based on filter type
        const attendanceImportBtn = document.getElementById('import-attendance-btn');
        if (attendanceImportBtn) {
            if (filterType === 'all') {
                // Show import button for 'all' filter
                attendanceImportBtn.classList.remove('hidden');
                attendanceImportBtn.classList.add('show-for-all');
                console.log('Showing attendance import button for "all" filter');
            } else {
                // Hide import button for other filters
                attendanceImportBtn.classList.add('hidden');
                attendanceImportBtn.classList.remove('show-for-all');
                console.log('Hiding attendance import button for', filterType, 'filter');
            }
        }
        
        // Removed toast notification to reduce clutter
        // Only show toast for non-default filters
        // if (filterType !== 'today') {
        //     this.showToast(`Showing ${filteredAttendance.length} attendance records for ${filterType}`, 'info');
        // }
    }

    displayPatients(patients, currentPage = 1) {
        try {
            const patientsList = document.getElementById('patients-list');
            if (!patientsList) {
                console.error('Patients list element not found');
                return;
            }
            
            // Update current page tracking
            this.currentPatientPage = currentPage;
            
            console.log('displayPatients called with:', patients.length, 'patients, page:', currentPage);
            console.log('Patients data:', patients);
        
        const patientsPerPage = this.patientsPerPage || 10;
        const totalPages = this.patientsPerPage === 'all' ? 1 : Math.ceil(patients.length / patientsPerPage);
        
        // Fix pagination edge cases
        if (totalPages === 0) {
            patientsList.innerHTML = '<p class="text-center" style="color: var(--gray-500); padding: 2rem;">No patients found</p>';
            return;
        }
        
        // Ensure currentPage is within valid range
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;
        
        const startIndex = this.patientsPerPage === 'all' ? 0 : (currentPage - 1) * patientsPerPage;
        const endIndex = this.patientsPerPage === 'all' ? patients.length : Math.min(startIndex + patientsPerPage, patients.length);
        const currentPatients = this.patientsPerPage === 'all' ? patients : patients.slice(startIndex, endIndex);
        
        console.log('Pagination info:', { totalPages, currentPage, startIndex, endIndex, currentPatientsLength: currentPatients.length });
        console.log('Current patients on this page:', currentPatients);
        
        // Debug pagination for troubleshooting
        this.debugPagination(currentPage, totalPages, patients);
        
        // Validate patient data before display
        const validPatients = currentPatients.filter(patient => {
            if (!patient || typeof patient !== 'object') {
                console.warn('Invalid patient object:', patient);
                return false;
            }
            if (!patient.id || !patient.name) {
                console.warn('Patient missing ID or name:', patient);
                return false;
            }
            return true;
        });
        
        if (validPatients.length !== currentPatients.length) {
            console.warn(`Filtered out ${currentPatients.length - validPatients.length} invalid patients`);
        }
        
        // Store current page in data attribute for easy access
        patientsList.setAttribute('data-current-page', currentPage);
        
        // Create single unified grid container with count, patients, and pagination
        const patientsHTML = `
            <div class="patients-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                            Total Patients: <span style="color: var(--primary-color);">${patients.length}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="color: var(--gray-600); font-size: 0.875rem;">
                            Showing ${startIndex + 1}-${Math.min(endIndex, patients.length)} of ${patients.length} patients
                        </div>
                        
                        <button id="delete-all-btn" onclick="window.dentalApp.showDeleteConfirmationModal()" style="padding: 0.5rem 1rem; background: var(--error-color); color: var(--white); border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500; transition: all 0.2s ease; display: none;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                            <i class="fas fa-trash-alt" style="margin-right: 0.5rem;"></i>
                            Delete Selected
                        </button>
                    </div>
                </div>
                
                <!-- Select All Header -->
                <div style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; background: var(--gray-50); border-bottom: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">
                    <div style="min-width: 120px; display: flex; align-items: center; gap: 1rem;">
                        <input type="checkbox" id="select-all-patients" onchange="window.dentalApp.toggleSelectAllPatients(this.checked)" style="width: 14px; height: 14px; cursor: pointer;">
                        <span style="font-size: 0.875rem; color: var(--primary-color);">Select All</span>
                    </div>
                    <div style="flex: 1; text-align: center; font-size: 0.875rem; color: var(--primary-color);">Patient Information</div>
                    <div style="min-width: 200px; text-align: center; font-size: 0.875rem; color: var(--primary-color);">Actions</div>
                </div>
                
                <!-- Patient Rows -->
                ${currentPatients.map((patient, index) => {
                    const age = patient.age || (patient.dob ? this.calculateAge(patient.dob) : 'N/A');
                    const globalIndex = startIndex + index;
                    
                    // Debug logging for patient IDs
                    console.log(`Patient ${index + 1}: ID="${patient.id}", Name="${patient.name}", Status="${patient.status}"`);
                    
                    return `
                        <div class="patient-row" data-patient-id="${patient.id || 'unknown'}" data-patient-name="${patient.name || 'Unknown Patient'}" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; border-bottom: ${index < currentPatients.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease;" onmouseover="this.style.backgroundColor='var(--gray-100)'" onmouseout="this.style.backgroundColor='transparent'">
                            <!-- Patient Selection Checkbox -->
                            <div style="display: flex; align-items: center; gap: 1rem; min-width: 120px;">
                                <input type="checkbox" class="patient-checkbox" data-patient-id="${patient.id || 'unknown'}" onchange="window.dentalApp.togglePatientSelection('${patient.id || 'unknown'}')" style="width: 14px; height: 14px; cursor: pointer; ">
                                <div class="patient-avatar" style="width: 40px; height: 40px; background: var(--primary-light); border-radius:var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 600; color: var(--primary-color); font-size: var(--font-size-sm); flex-shrink: 0;">
                                    ${globalIndex + 1}
                                </div>
                            </div>
                            <!-- Patient Info -->
                            <div class="patient-info" style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                                <div class="patient-name" style="background: var(--primary-light); color: var(--primary-color); padding: 0.75rem 1.25rem; border-radius: var(--radius-md); font-weight: 500; font-size: 0.875rem; display: inline-block; width: 100%; text-align: left; letter-spacing: 0.025em;">
                                    ${this.escapeHtml(patient.name ? (patient.name.charAt(0).toUpperCase() + patient.name.slice(1).toLowerCase()) : 'Unknown Patient')}
                                </div>
                               
                               
                                                                 <div style="display: flex; gap: 0.5rem; align-items: center;">
                                     <div class="patient-age" style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 500; font-size: var(--font-size-xs); display: inline-block; width: fit-content;">
                                         ${age} year${age !== 'N/A' && age !== 1 ? 's' : ''}
                                     </div>
                                     <div class="patient-gender" style="background: var(--primary-light); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); display: inline-flex; align-items: center; justify-content: center; width: fit-content;">
                                         <i class="fas ${patient.gender === 'Female' ? 'fa-venus' : patient.gender === 'Male' ? 'fa-mars' : 'fa-user'}" style="font-size: 0.875rem; color: ${patient.gender === 'Female' ? '#ec4899' : patient.gender === 'Male' ? 'var(--primary-color)' : 'var(--secondary-color)'};"></i>
                                     </div>
 
                                 </div>
                                 
                            </div>
                            
                            <!-- Phone Number Above Status Toggle -->
                            <div>
                                <div class="patient-phone" style="background: var(--primary-light); color: #1e40af; padding: 0.5rem 1rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem; display: inline-block; width: fit-content; text-align: left; letter-spacing: 0.025em; ">
                                    <i class="fas fa-phone" style="margin-right: 0.5rem; font-size: 0.75rem;"></i>
                                    ${patient.phone || 'N/A'}
                                </div>
                                  <div class="status-toggle" onclick="window.dentalApp.togglePatientStatus('${patient.id}')" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; padding-top: 0.5rem;" title="Click to toggle status">
                                    <!-- Toggle Switch -->
                                    <div style="position: relative; width: 60px; height: 28px; background: var(--white); border-radius: 14px; cursor: pointer; transition: all 0.3s ease-in-out;">
                                        <!-- Sliding Indicator -->
                                        <div style="position: absolute; top: 2px; left: ${patient.status === 'Active' ? '32px' : '2px'}; width: 24px; height: 24px; background: ${patient.status === 'Active' ? 'var(--success-color)' : 'var(--error-color)'}; border-radius: 50%; transition: all 0.3s ease-in-out; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                                    </div>
                                    <!-- Status Text -->
                                    <span style="font-weight: 600; font-size: 0.75rem; color: ${patient.status === 'Active' ? 'var(--success-color)' : 'var(--error-color)'}; text-transform: capitalize;">${patient.status || 'Active'}</span>
                                </div>
                            </div>
                            
                            <!-- Status Toggle and Action Buttons -->
                            <div style="display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;">
                                <!-- Status Toggle -->
                              
                                
                                <!-- Action Buttons -->
                                <button onclick="window.dentalApp.viewPatientDetails('${patient.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="View Details" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="window.dentalApp.editPatient('${patient.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Edit Patient" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="window.dentalApp.printPatient('${patient.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--warning-color); border: 1px solid var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Print" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-print"></i>
                                </button>
                                <button onclick="window.dentalApp.showDeleteConfirmation('${patient.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--error-color); border: 1px solid var(--error-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Delete" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <!-- Pagination Controls -->
                ${this.patientsPerPage !== 'all' ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <!-- Entries Per Page Selector -->
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--gray-600); font-size: 0.875rem;">
                                <span>Show</span>
                                <select id="entries-per-page" style="padding: 0.25rem 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius-md); background: var(--white); color: var(--gray-700); font-size: 0.875rem; cursor: pointer;" onchange="window.dentalApp.changeEntriesPerPage(this.value)">
                                    <option value="10" ${this.patientsPerPage === 10 ? 'selected' : ''}>10</option>
                                    <option value="20" ${this.patientsPerPage === 20 ? 'selected' : ''}>20</option>
                                    <option value="50" ${this.patientsPerPage === 50 ? 'selected' : ''}>50</option>
                                    <option value="100" ${this.patientsPerPage === 100 ? 'selected' : ''}>100</option>
                                    <option value="200" ${this.patientsPerPage === 200 ? 'selected' : ''}>200</option>
                                    <option value="all" ${this.patientsPerPage === 'all' ? 'selected' : ''}>All</option>
                                </select>
                                <span>Patient</span>
                            </div>
                        </div>
                        
                        <!-- Pagination Buttons and Page Info -->
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            ${totalPages > 1 ? `
                                ${currentPage > 1 ? `<button onclick="window.dentalApp.displayPatients(window.dentalApp.currentPatients, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
                                
                                ${this.generateSmartPagination(currentPage, totalPages, 'patients')}
                                
                                ${currentPage < totalPages ? `<button onclick="window.dentalApp.displayPatients(window.dentalApp.currentPatients, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
                            ` : ''}
                            
                            <!-- Page Info -->
                            <div style="color: var(--gray-600); font-size: 0.875rem; margin-left: 1rem;">
                                Page ${currentPage} of ${totalPages}
                            </div>
                        </div>
                    </div>
                ` : ''}
                

                

            </div>
        `;
        
        patientsList.innerHTML = patientsHTML;
        
        // Store current patients for pagination
        this.currentPatients = patients;
        

        } catch (error) {
            console.error('Error in displayPatients:', error);
            this.handlePatientTabError(error, 'displayPatients');
        }
        
        // Initialize patient selection tracking
        this.selectedPatients = new Set();
        this.updateBulkActionsVisibility();
    }

    // Toggle select all patients
    toggleSelectAllPatients(checked) {
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        const patients = this.getStoredData('patients') || [];
        
        if (checked) {
            // Select all patients - add all valid patient IDs
            patients.forEach((patient, index) => {
                if (patient && patient.id) {
                    this.selectedPatients.add(patient.id);
                }
            });
        } else {
            // Deselect all patients
            this.selectedPatients.clear();
        }
        
        // Update checkbox states
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        
        // Update bulk actions visibility
        this.updateBulkActionsVisibility();
        
        console.log('Select all toggled:', checked, 'Selected patients:', this.selectedPatients.size);
    }

    // Toggle individual patient selection
    togglePatientSelection(patientId) {
        const checkbox = document.querySelector(`.patient-checkbox[data-patient-id="${patientId}"]`);
        if (checkbox.checked) {
            this.selectedPatients.add(patientId);
        } else {
            this.selectedPatients.delete(patientId);
        }
        
        // Update select all checkbox state
        this.updateSelectAllCheckbox();
        this.updateBulkActionsVisibility();
    }

    // Update select all checkbox state
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-patients');
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        const checkedCount = document.querySelectorAll('.patient-checkbox:checked').length;
        
        if (checkedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCount === checkboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    // Update bulk actions visibility
    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        const deleteAllBtn = document.getElementById('delete-all-btn');
        
        console.log('Updating bulk actions visibility. Selected patients:', this.selectedPatients.size);
        console.log('Selected patient IDs:', Array.from(this.selectedPatients));
        
        if (this.selectedPatients.size > 0) {
            console.log('Showing bulk actions and delete buttons');
            if (bulkActions) bulkActions.style.display = 'block';
            if (selectedCount) selectedCount.textContent = this.selectedPatients.size;
            if (bulkDeleteBtn) {
                bulkDeleteBtn.style.display = 'inline-block';
                console.log('Bulk delete button shown');
            }
            if (deleteAllBtn) {
                deleteAllBtn.style.display = 'inline-block';
                console.log('Delete all button shown');
            }
        } else {
            console.log('Hiding bulk actions and delete buttons');
            if (bulkActions) bulkActions.style.display = 'none';
            if (bulkDeleteBtn) bulkDeleteBtn.style.display = 'none';
            if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        }
    }

    // Show bulk delete options
    showBulkDeleteOptions() {
        if (this.selectedPatients.size === 0) {
            this.showToast('No patients selected for deletion', 'warning');
            return;
        }
        
        // Scroll to bulk actions section
        const bulkActions = document.getElementById('bulk-actions');
        if (bulkActions) {
            bulkActions.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Delete selected patients
    deleteSelectedPatients(modalElement = null) {
        if (this.selectedPatients.size === 0) {
            this.showToast('No patients selected for deletion', 'warning');
            return;
        }

        const patientNames = [];
        const patients = this.getStoredData('patients') || [];
        
        this.selectedPatients.forEach(patientId => {
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                patientNames.push(patient.name);
            }
        });

        // Close modal if provided
        if (modalElement) {
            modalElement.remove();
        }

        // Remove selected patients from storage
        const updatedPatients = patients.filter(p => !this.selectedPatients.has(p.id));
        this.setStoredData('patients', updatedPatients);
        
        // Clear selection
        this.selectedPatients.clear();
        
        // Hide bulk delete button
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) bulkDeleteBtn.style.display = 'none';
        
        // Hide delete all button
        const deleteAllBtn = document.getElementById('delete-all-btn');
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        
        this.updateBulkActionsVisibility();
        
        // Show success message
        this.showToast(`Successfully deleted ${patientNames.length} patient(s)`, 'success');
        
        // Refresh the display while maintaining current page
        this.currentPatients = updatedPatients;
        this.displayPatients(updatedPatients, this.currentPatientPage);
    }

    // Clear patient selection
    clearPatientSelection() {
        this.selectedPatients.clear();
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Uncheck select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-patients');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        
        // Hide bulk delete button
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) bulkDeleteBtn.style.display = 'none';
        
        // Hide delete all button
        const deleteAllBtn = document.getElementById('delete-all-btn');
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        
        this.updateBulkActionsVisibility();
    }

    // Show delete all confirmation modal
    showDeleteAllConfirmation() {
        const patients = this.getStoredData('patients') || [];
        
        if (patients.length === 0) {
            this.showToast('No patients to delete', 'warning');
            return;
        }

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: var(--white);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-xl);
                width: 100%;
                max-width: 500px;
                position: relative;
                border: 1px solid var(--gray-200);
                overflow: hidden;
            ">
                <!-- Header -->
                <div class="modal-header" style="
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--gray-200);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    
                    color: var(--white);
                ">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; color: var(--primary-color)"></i>
                        <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--gray-800)">Delete All Patients</h2>
                    </div>
                    <button onclick="this.closest('.modal').remove()" style="
                        background: var(--primary-color);
                        color: var(--white);
                        border: none;
                        border-radius: 50%;
                        width: 36px;
                        height: 36px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.125rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='var(--primary-hover)'" onmouseout="this.style.background='var(--primary-hover)'">×</button>
                </div>
                
                <!-- Body -->
                <div class="modal-body" style="padding: 2rem;">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 1rem;"></i>
                        <h3 style="margin: 0 0 1rem 0; color: var(--gray-800); font-size: 1.125rem;">Warning: This action cannot be undone!</h3>
                        <p style="margin: 0; color: var(--gray-600); line-height: 1.6;">
                            You are about to delete <strong>ALL ${patients.length} patients</strong> from the system.<br>
                            This will permanently remove all patient data including medical records, appointments, and billing information.
                        </p>
                    </div>
                    
                    <div style="text-align: center;  background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                        <p style="margin: 0; color: var(--gray-700); font-size: 0.875rem; font-weight: 500;">
                            <strong>Total patients to be deleted:</strong> ${patients.length}
                        </p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="modal-footer" style="
                    padding: 1.5rem 2rem;
                    border-top: 1px solid var(--gray-200);
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    background: var(--gray-50);
                ">
                    <button onclick="this.closest('.modal').remove()" style="
                        padding: 0.75rem 1.5rem;
                        background: var(--gray-500);
                        color: var(--white);
                        border: none;
                        border-radius: var(--radius-md);
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        Cancel
                    </button>
                    <button onclick="window.dentalApp.deleteAllPatients(this.closest('.modal'))" style="
                        padding: 0.75rem 1.5rem;
                        background: var(--error-color);
                        color: var(--white);
                        border: none;
                        border-radius: var(--radius-md);
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        <i class="fas fa-trash-alt" style="margin-right: 0.5rem;"></i>
                        Delete Patients
                    </button>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    // Delete all patients
    deleteAllPatients(modalElement = null) {
        const patients = this.getStoredData('patients') || [];
        
        if (patients.length === 0) {
            this.showToast('No patients to delete', 'warning');
            return;
        }

        // Close modal if provided
        if (modalElement) {
            modalElement.remove();
        }

        // Clear all patients from storage
        this.setStoredData('patients', []);
        
        // Clear current patients
        this.currentPatients = [];
        
        // Clear selection
        this.selectedPatients.clear();
        
        // Hide bulk delete button
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) bulkDeleteBtn.style.display = 'none';
        
        // Hide delete all button
        const deleteAllBtn = document.getElementById('delete-all-btn');
        if (deleteAllBtn) deleteAllBtn.style.display = 'none';
        
        // Update bulk actions visibility
        this.updateBulkActionsVisibility();
        
        // Show success message
        this.showToast(`Successfully deleted all ${patients.length} patients`, 'success');
        
        // Refresh the display
        this.displayPatients([], 1);
    }

    generateSmartPagination(currentPage, totalPages, type) {
        if (totalPages <= 1) return '';
        
        // Ensure currentPage is within valid range
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;
        
        console.log(`Generating pagination for ${type}: currentPage=${currentPage}, totalPages=${totalPages}`);
        
        let paginationHTML = '';
        
        // Map type to correct function names and data properties
        const functionMap = {
            'patients': 'displayPatients',
            'appointments': 'displayAppointments', 
            'billing': 'displayBilling',
            'staff': 'displayStaff',
            'salary': 'displaySalary',
            'attendance': 'displayAttendance'
        };
        
        const dataMap = {
            'patients': 'currentPatients',
            'appointments': 'currentAppointments',
            'billing': 'currentBilling', 
            'staff': 'currentStaff',
            'salary': 'currentSalaries',
            'attendance': 'currentAttendance'
        };
        
        const displayFunction = functionMap[type] || `display${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const dataProperty = dataMap[type] || `current${type.charAt(0).toUpperCase() + type.slice(1)}`;
        
        // For large numbers of pages, use a smarter approach
        if (totalPages <= 10) {
            // Show all pages if 10 or fewer
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `<button onclick="window.dentalApp.${displayFunction}(window.dentalApp.${dataProperty}, ${i})" style="padding: 0.5rem 0.75rem; border: 1px solid ${i === currentPage ? 'var(--primary-color)' : 'var(--gray-300)'}; background: ${i === currentPage ? 'var(--primary-color)' : 'var(--white)'}; color: ${i === currentPage ? 'var(--white)' : 'var(--gray-700)'}; border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease; min-width: 40px;">${i}</button>`;
            }
        } else {
            // For more than 10 pages, use smart pagination
            const maxVisiblePages = 9; // Show more pages for better navigation
            
            // Calculate the range of pages to show
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            // Adjust if we're near the end
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            console.log(`Pagination range: startPage=${startPage}, endPage=${endPage}`);
            
            // Always show first page
            if (startPage > 1) {
                paginationHTML += `<button onclick="window.dentalApp.${displayFunction}(window.dentalApp.${dataProperty}, 1)" style="padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease; min-width: 40px;">1</button>`;
                if (startPage > 2) {
                    paginationHTML += `<span style="padding: 0.5rem 0.25rem; color: var(--gray-500);">...</span>`;
                }
            }
            
            // Show visible page numbers
            for (let i = startPage; i <= endPage; i++) {
                paginationHTML += `<button onclick="window.dentalApp.${displayFunction}(window.dentalApp.${dataProperty}, ${i})" style="padding: 0.5rem 0.75rem; border: 1px solid ${i === currentPage ? 'var(--primary-color)' : 'var(--gray-300)'}; background: ${i === currentPage ? 'var(--primary-color)' : 'var(--white)'}; color: ${i === currentPage ? 'var(--white)' : 'var(--gray-700)'}; border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease; min-width: 40px;">${i}</button>`;
            }
            
            // Always show last page
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    paginationHTML += `<span style="padding: 0.5rem 0.25rem; color: var(--gray-500);">...</span>`;
                }
                paginationHTML += `<button onclick="window.dentalApp.${displayFunction}(window.dentalApp.${dataProperty}, ${totalPages})" style="padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease; min-width: 40px;">${totalPages}</button>`;
            }
        }
        
        console.log(`Generated pagination HTML length: ${paginationHTML.length}`);
        return paginationHTML;
    }

    // Debug pagination issues
    debugPagination(currentPage, totalPages, patients) {
        console.log('=== PAGINATION DEBUG ===');
        console.log('Current Page:', currentPage);
        console.log('Total Pages:', totalPages);
        console.log('Total Patients:', patients.length);
        console.log('Patients Per Page:', 10);
        
        const startIndex = (currentPage - 1) * 10;
        const endIndex = Math.min(startIndex + 10, patients.length);
        
        console.log('Start Index:', startIndex);
        console.log('End Index:', endIndex);
        console.log('Patients on this page:', patients.slice(startIndex, endIndex).length);
        
        // Check if current page is valid
        if (currentPage < 1 || currentPage > totalPages) {
            console.error('INVALID PAGE NUMBER!');
        }
        
        // Check if indices are valid
        if (startIndex < 0 || endIndex > patients.length) {
            console.error('INVALID INDICES!');
        }
        
        return { startIndex, endIndex, isValid: currentPage >= 1 && currentPage <= totalPages };
    }

    // Test specific page navigation
    testPageNavigation(pageNumber) {
        console.log(`=== TESTING PAGE ${pageNumber} ===`);
        
        if (!this.currentPatients) {
            console.error('No current patients available');
            return;
        }
        
        const totalPages = Math.ceil(this.currentPatients.length / 10);
        console.log(`Total pages: ${totalPages}, Requested page: ${pageNumber}`);
        
        if (pageNumber < 1 || pageNumber > totalPages) {
            console.error(`Invalid page number: ${pageNumber}. Must be between 1 and ${totalPages}`);
            return;
        }
        
        console.log(`Navigating to page ${pageNumber}...`);
        this.displayPatients(this.currentPatients, pageNumber);
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    getPatientAppointmentsCount(patientId) {
        const appointments = this.getStoredData('appointments') || [];
        return appointments.filter(apt => apt.patientId === patientId).length;
    }

    getPatientCompletedTreatmentsCount(patientId) {
        const appointments = this.getStoredData('appointments') || [];
        return appointments.filter(apt => apt.patientId === patientId && apt.status === 'completed').length;
    }

    getPatientTotalBilling(patientId) {
        const invoices = this.getStoredData('invoices') || [];
        const patientInvoices = invoices.filter(inv => inv.patientId === patientId);
        const total = patientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        return this.formatCurrency(total);
    }

    getPatientLastVisit(patientId) {
        const appointments = this.getStoredData('appointments') || [];
        const patientAppointments = appointments.filter(apt => apt.patientId === patientId);
        
        if (patientAppointments.length === 0) return 'N/A';
        
        // Sort by date and get the most recent
        const sortedAppointments = patientAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastAppointment = sortedAppointments[0];
        
        return lastAppointment.date || 'N/A';
    }

   

    viewPatientDetails(patientId) {
        // Always get fresh patient data from storage
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === patientId);
        
        if (patient) {
            // Create a modal to show patient details
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 1rem;
            `;
            
            // Calculate age
            const age = patient.age || (patient.dob ? this.calculateAge(patient.dob) : 'N/A');
            const ageText = age !== 'N/A' ? `${age} years` : 'N/A';
            
            modal.innerHTML = `
                <div class="modal-content" style="
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-xl);
                    width: 100%;
                    max-width: 900px;
                    max-height: 85vh;
                    position: relative;
                    border: 1px solid var(--gray-200);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                ">
                    <!-- Header -->
                    <div class="modal-header" style="
                        padding: 1.5rem 2rem;
                        border-bottom: 1px solid var(--gray-200);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                       
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-user-circle" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Patient Details</h2>
                        </div>
                        <button onclick="this.closest('.modal').remove()" style="
                            background: var(--primary-color);
                            color: var(--white);
                            border: none;
                            border-radius: 50%;
                            width: 36px;
                            height: 36px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.125rem;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(10px);
                        " onmouseover="this.style.background='var(--primary-hover)'" onmouseout="this.style.background='var(--primary-color)'">x</button>
                    </div>
                    
                    <!-- Body -->
                    <div class="modal-body" style="
                        padding: 2rem;
                        overflow-y: auto;
                        flex: 1;
                        background: var(--gray-50);
                    ">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                            
                            <!-- Patient Information Card -->
                            <div style="
                                background: var(--white);
                                border-radius: var(--radius-lg);
                                padding: 1.5rem;
                                box-shadow: var(--shadow-md);
                                border: 1px solid var(--gray-200);
                            ">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: ${patient.gender === 'Female' ? 'var(--pink-light)' : 'var(--primary-light)'};
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: ${patient.gender === 'Female' ? 'var(--pink-color)' : 'var(--primary-color)'};
                                    ">
                                        <i class="fas ${patient.gender === 'Female' ? 'fa-user-tie' : 'fa-user'}" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Patient Information</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 1rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Patient Name</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${patient.name}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Phone</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${patient.phone}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Email</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${patient.email || 'N/A'}</span>
                                    </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Status</span>
                                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                            <!-- Toggle Switch -->
                                            <div style="position: relative; width: 60px; height: 28px; background: var(--white); border-radius: 14px; transition: all 0.3s ease-in-out;">
                                                <!-- Sliding Indicator -->
                                                <div style="position: absolute; top: 2px; left: ${patient.status === 'Active' ? '32px' : '2px'}; width: 24px; height: 24px; background: ${patient.status === 'Active' ? 'var(--success-color)' : 'var(--error-color)'}; border-radius: 50%; transition: all 0.3s ease-in-out; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                                            </div>
                                            <!-- Status Text -->
                                            <span style="font-weight: 600; font-size: 0.75rem; color: ${patient.status === 'Active' ? 'var(--success-color)' : 'var(--error-color)'}; text-transform: capitalize;">${patient.status || 'Active'}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            
                            <!-- Personal Details Card -->
                            <div style="
                                background: var(--white);
                                border-radius: var(--radius-lg);
                                padding: 1.5rem;
                                box-shadow: var(--shadow-md);
                                border: 1px solid var(--gray-200);
                            ">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: var(--primary-light);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--primary-color);
                                    ">
                                        <i class="fas fa-id-card" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Personal Details</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 1rem;">

                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Patient ID</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${patient.id}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Age</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${ageText}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Gender</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;">
                                            <i class="fas ${patient.gender === 'Female' ? 'fa-venus' : patient.gender === 'Male' ? 'fa-mars' : 'fa-user'}" style="font-size: 1rem;"></i>
                                            ${patient.gender || 'N/A'}
                                        </span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Address</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem; text-align: right; max-width: 50%;">${patient.address || 'N/A'}</span>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Added Date</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${patient.addDate ? this.formatDate(patient.addDate) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            ${patient.medicalHistory && patient.medicalHistory.trim() !== '' ? `
                            <!-- Medical History Card -->
                            <div style="
                                background: var(--white);
                                border-radius: var(--radius-lg);
                                padding: 1.5rem;
                                box-shadow: var(--shadow-md);
                                border: 1px solid var(--gray-200);
                            ">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: var(--primary-light);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--primary-color);
                                    ">
                                        <i class="fas fa-notes-medical" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Medical History</h3>
                                </div>
                                
                                <div style="
                                    padding: 1rem;
                                    background: var(--gray-50);
                                    border-radius: var(--radius-md);
                                    border-left: 4px solid var(--primary-color);
                                ">
                                    <p style="
                                        margin: 0;
                                        color: var(--gray-700);
                                        font-size: 0.875rem;
                                        line-height: 1.6;
                                        font-style: italic;
                                    ">${patient.medicalHistory}</p>
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Treatment Summary Card -->
                            <div style="
                                background: var(--white);
                                border-radius: var(--radius-lg);
                                padding: 1.5rem;
                                box-shadow: var(--shadow-md);
                                border: 1px solid var(--gray-200);
                            ">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: var(--primary-light);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--primary-color);
                                    ">
                                        <i class="fas fa-chart-bar" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Treatment Summary</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 1rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Total Appointments</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.getPatientAppointmentsCount(patient.id)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Completed Treatments</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.getPatientCompletedTreatmentsCount(patient.id)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Total Billing</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.getPatientTotalBilling(patient.id)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Last Visit</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.getPatientLastVisit(patient.id)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // Close modal with Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }
    }

    editPatient(patientId) {
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === patientId);
        
        if (patient) {
            // Populate the patient form with existing data
            document.getElementById('patient-name').value = patient.name;
            document.getElementById('patient-phone').value = patient.phone;
            document.getElementById('patient-email').value = patient.email || '';
            document.getElementById('patient-dob').value = patient.dob || '';
            document.getElementById('patient-gender').value = patient.gender || '';
            document.getElementById('patient-address').value = patient.address || '';
            document.getElementById('patient-status').value = patient.status || 'Active';
            document.getElementById('patient-medical-history').value = patient.medicalHistory || '';
            
            // Update modal title and button text
            document.getElementById('patient-modal-title').textContent = 'Edit Patient';
            const submitBtn = document.querySelector('#patient-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Update Patient';
            }
            
            // Show the modal
            const modal = document.getElementById('patient-modal');
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Update form submission to handle edit
            const form = document.getElementById('patient-form');
            form.dataset.editId = patientId;
            
            // Focus on first input field
            setTimeout(() => {
                const firstInput = form.querySelector('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
    }

    printPatient(patientId) {
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === patientId);
        
        if (patient) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Patient Record - ${patient.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .patient-info { margin-bottom: 20px; }
                        .info-row { margin: 10px 0; }
                        .label { font-weight: bold; }
                        .medical-history { margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Patient Record</h1>
                        <h2>${patient.name}</h2>
                    </div>
                    <div class="patient-info">
                        <div class="info-row">
                            <span class="label">Patient ID:</span> ${patient.id}
                        </div>
                        <div class="info-row">
                            <span class="label">Name:</span> ${patient.name}
                        </div>
                        <div class="info-row">
                            <span class="label">Phone:</span> 
                            <div class="patient-phone-display" style="background: #e2e8f0; color: #1e40af; padding: 0.5rem 1rem; border-radius: var(--radius-full); font-weight: 600; font-size: 0.875rem; display: inline-block; width: fit-content; text-align: left; letter-spacing: 0.025em; border: 1px solid #cbd5e1;">
                                <i class="fas fa-phone" style="margin-right: 0.5rem; font-size: 0.75rem;"></i>
                                ${patient.phone || 'N/A'}
                            </div>
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span> ${patient.email || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Date of Birth:</span> ${patient.dob || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Age:</span> ${this.calculateAge(patient.dob)} years
                        </div>
                        <div class="info-row">
                            <span class="label">Gender:</span> ${patient.gender || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Address:</span> ${patient.address || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Status:</span> ${patient.status || 'Active'}
                        </div>
                    </div>
                    <div class="medical-history">
                        <h3>Medical History</h3>
                        <p>${patient.medicalHistory || 'No medical history recorded'}</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    deletePatient(patientId) {
        if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            const patients = this.getStoredData('patients') || [];
            const updatedPatients = patients.filter(p => p.id !== patientId);
            
            this.setStoredData('patients', updatedPatients);
            this.showToast('Patient deleted successfully', 'success');
            
            // Refresh the display
            this.displayPatients(updatedPatients);
        }
    }

    updateAppointmentStatus(appointmentId, newStatus) {
        const appointments = this.getStoredData('appointments') || [];
        const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex].status = newStatus;
            this.setStoredData('appointments', appointments);
            
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
            
            // Re-apply current filters to get updated list
            let filteredAppointments = appointments;
            
            // Apply time filter first
            switch (timeFilter) {
                case 'today':
                    const today = new Date().toISOString().split('T')[0];
                    filteredAppointments = appointments.filter(apt => apt.date === today);
                    break;
                case 'week':
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    filteredAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        return aptDate >= weekStart && aptDate <= weekEnd;
                    });
                    break;
                case 'month':
                    const monthStart = new Date();
                    monthStart.setDate(1);
                    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                    filteredAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        return aptDate >= monthStart && aptDate <= monthEnd;
                    });
                    break;
                default:
                    filteredAppointments = appointments;
            }
            
            // Apply status filter
            if (statusFilter !== 'all') {
                filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter);
            }
            
            // Get current page from data attribute
            const appointmentsList = document.getElementById('appointments-list');
            let currentPage = 1;
            if (appointmentsList) {
                const storedPage = appointmentsList.getAttribute('data-current-page');
                if (storedPage) {
                    currentPage = parseInt(storedPage);
                }
            }
            
            // Calculate new page after status change using current per-page setting
            const perPage = this.appointmentsPerPage === 'all' ? filteredAppointments.length : (this.appointmentsPerPage || 10);
            const totalPages = Math.ceil(filteredAppointments.length / perPage);
            
            // If current page is beyond the new total pages, go to the last page
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            
            // Update current appointments list
            this.currentAppointments = filteredAppointments;
            
            // Refresh the display with current page
            this.displayAppointments(filteredAppointments, currentPage);
            
            this.showToast(`Appointment status updated to ${newStatus}`, 'success');
        }
    }

    viewAppointmentDetails(appointmentId) {
        const appointments = this.getStoredData('appointments') || [];
        const appointment = appointments.find(apt => apt.id === appointmentId);
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === appointment?.patientId);
        
        if (appointment) {
            // Create a modal to show appointment details
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 1rem;
            `;
            
            modal.innerHTML = `
                <div class="modal-content" style="
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-xl);
                    width: 100%;
                    max-width: 900px;
                    max-height: 85vh;
                    position: relative;
                    border: 1px solid var(--gray-200);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                ">
                    <!-- Header -->
                    <div class="modal-header" style="
                        padding: 1.5rem 2rem;
                        border-bottom: 1px solid var(--gray-200);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: var(--white);
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-calendar-check" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Appointment Details</h2>
                        </div>
                        <button onclick="this.closest('.modal').remove()" style="
                            background: var(--primary-color);
                            color: var(--white);
                            border: none;
                            border-radius: 50%;
                            width: 36px;
                            height: 36px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.125rem;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(10px);
                        " onmouseover="this.style.background='var(--primary-hover)'" onmouseout="this.style.background='var(--primary-color)'">x</button>
                    </div>
                    
                    <!-- Body -->
                    <div class="modal-body" style="
                        padding: 2rem;
                        overflow-y: auto;
                        flex: 1;
                        background: var(--gray-50);
                    ">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                            
                            <!-- Appointment Information Card -->
                            <div style="
                                background: var(--white);
                                border-radius: var(--radius-lg);
                                padding: 1.5rem;
                                box-shadow: var(--shadow-md);
                                border: 1px solid var(--gray-200);
                            ">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: var(--primary-light);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--primary-color);
                                    ">
                                        <i class="fas fa-calendar-alt" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Appointment Information</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 1rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Patient Name</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.capitalizeWords(patient?.name) || 'Unknown'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Appointment Date</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.formatDate(appointment.date)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Appointment Time</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.time}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Duration</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.duration || 60} minutes</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Treatment Type</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.capitalizeWords(appointment.treatment) || 'General Consultation'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Status</span>
                                        <span style="
                                            color: var(--white);
                                            background: var(--primary-color);
                                            padding: 0.25rem 0.75rem;
                                            border-radius: var(--radius-md);
                                            font-size: 0.875rem;
                                            font-weight: 600;
                                        ">${this.capitalizeWords(appointment.status) || 'Scheduled'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Additional Details Card -->
                            <div style="
                                background: var(--white);
                                border-radius: var(--radius-lg);
                                padding: 1.5rem;
                                box-shadow: var(--shadow-md);
                                border: 1px solid var(--gray-200);
                            ">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: var(--primary-light);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--primary-color);
                                    ">
                                        <i class="fas fa-info-circle" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Additional Details</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 1rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Appointment ID</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.id}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Priority</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.capitalizeWords(appointment.priority) || 'Normal'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Reminder</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.capitalizeWords(appointment.reminder) || 'No Reminder'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Created Date</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.createdAt ? this.formatDate(appointment.createdAt) : 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Last Updated</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.updatedAt ? this.formatDate(appointment.updatedAt) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Notes Section -->
                        ${appointment.notes ? `
                        <div style="
                            background: var(--white);
                            border-radius: var(--radius-lg);
                            padding: 1.5rem;
                            box-shadow: var(--shadow-md);
                            border: 1px solid var(--gray-200);
                            margin-top: 1.5rem;
                        ">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--primary-light);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: var(--primary-color);
                                ">
                                    <i class="fas fa-sticky-note" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Appointment Notes</h3>
                            </div>
                            
                            <div style="
                                background: var(--gray-50);
                                padding: 1rem;
                                border-radius: var(--radius-md);
                                color: var(--gray-700);
                                line-height: 1.6;
                                font-size: 0.875rem;
                            ">
                                ${appointment.notes}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
    }

    editAppointment(appointmentId) {
        const appointments = this.getStoredData('appointments') || [];
        const appointment = appointments.find(apt => apt.id === appointmentId);
        
        if (appointment) {
            // Show the modal first
            this.showAddAppointmentModal();
            
            // Populate the appointment form with existing data
            const form = document.getElementById('appointment-form');
            if (form) {
                // Set form values
                const patientSelect = form.querySelector('#appointment-patient');
                const dateInput = form.querySelector('#appointment-date');
                const timeInput = form.querySelector('#appointment-time');
                const durationInput = form.querySelector('#appointment-duration');
                const treatmentInput = form.querySelector('#appointment-treatment');
                const statusInput = form.querySelector('#appointment-status');
                const notesInput = form.querySelector('#appointment-notes');
                
                if (patientSelect) patientSelect.value = appointment.patientId;
                if (dateInput) dateInput.value = appointment.date;
                if (timeInput) timeInput.value = appointment.time;
                if (durationInput) durationInput.value = appointment.duration || 60;
                if (treatmentInput) treatmentInput.value = appointment.treatment || '';
                if (statusInput) statusInput.value = appointment.status || 'scheduled';
                if (notesInput) notesInput.value = appointment.notes || '';
                
                // Update modal title and button text
                document.getElementById('appointment-modal-title').textContent = 'Edit Appointment';
                const submitBtn = document.querySelector('#appointment-form button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Update Appointment';
                }
                
                // Update form to handle edit mode
                form.dataset.editMode = 'true';
                form.dataset.editId = appointmentId;
                
                // Focus on first input field
                setTimeout(() => {
                    const firstInput = form.querySelector('select, input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="time"], textarea');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }, 100);
            }
        }
    }

    printAppointment(appointmentId) {
        const appointments = this.getStoredData('appointments') || [];
        const appointment = appointments.find(apt => apt.id === appointmentId);
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === appointment?.patientId);
        
        if (appointment && patient) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Appointment Details</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .details { margin-bottom: 20px; }
                        .detail-row { margin: 10px 0; }
                        .label { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Dental Clinic Appointment</h1>
                        <p>Appointment ID: ${appointment.id}</p>
                    </div>
                    <div class="details">
                        <div class="detail-row">
                            <span class="label">Patient Name:</span> ${patient.name}
                        </div>
                        <div class="detail-row">
                            <span class="label">Date:</span> ${this.formatDate(appointment.date)}
                        </div>
                        <div class="detail-row">
                            <span class="label">Time:</span> ${appointment.time}
                        </div>
                        <div class="detail-row">
                            <span class="label">Duration:</span> ${appointment.duration || 60} minutes
                        </div>
                        <div class="detail-row">
                            <span class="label">Treatment:</span> ${appointment.treatment || 'General Consultation'}
                        </div>
                        <div class="detail-row">
                            <span class="label">Status:</span> ${appointment.status || 'Scheduled'}
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    deleteAppointment(appointmentId) {
        this.showDeleteAppointmentConfirmation(appointmentId);
    }

    displayAppointments(appointments, currentPage = 1) {
        const appointmentsList = document.getElementById('appointments-list');
        if (!appointmentsList) return;
        
        // Use configurable page size like patients tab
        const perPage = this.appointmentsPerPage === 'all' ? appointments.length : (this.appointmentsPerPage || 10);
        const totalPages = this.appointmentsPerPage === 'all' ? 1 : Math.ceil(appointments.length / perPage);
        const startIndex = this.appointmentsPerPage === 'all' ? 0 : (currentPage - 1) * perPage;
        const endIndex = this.appointmentsPerPage === 'all' ? appointments.length : Math.min(startIndex + perPage, appointments.length);
        const currentAppointments = this.appointmentsPerPage === 'all' ? appointments : appointments.slice(startIndex, endIndex);
        
        // Store current page in data attribute for easy access
        appointmentsList.setAttribute('data-current-page', currentPage);
        
        if (appointments.length === 0) {
            appointmentsList.innerHTML = '<p class="text-center" style="color: var(--gray-500); padding: 2rem;">No appointments found</p>';
            return;
        }
        
        const patients = this.getStoredData('patients') || [];
        
        // Create single unified grid container with count and appointments (same as patient tab)
        const appointmentsHTML = `
            <div class="appointments-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display at the top of the grid -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                        Total Appointments: <span style="color: var(--primary-color);">${appointments.length}</span>
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        Showing ${startIndex + 1}-${Math.min(endIndex, appointments.length)} of ${appointments.length} appointments
                    </div>
                </div>

                <!-- Select All Header (Appointments) -->
                <div style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; background: var(--gray-50); border-bottom: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">
                    <div style="min-width: 120px; display: flex; align-items: center; gap: 1rem;">
                        <input type="checkbox" id="select-all-patients" onchange="window.dentalApp.toggleSelectAllAppointments(this.checked)" style="width: 14px; height: 14px; cursor: pointer;">
                        <span style="font-size: 0.875rem; color: var(--primary-color);">Select All</span>
                    </div>
                    <div style="flex: 1; text-align: center; font-size: 0.875rem; color: var(--primary-color);">Appointment Information</div>
                    <div style="min-width: 200px; text-align: center; font-size: 0.875rem; color: var(--primary-color);">Actions</div>
                </div>
                
                <!-- Appointment Rows -->
                ${currentAppointments.map((appointment, index) => {
            const patient = patients.find(p => p.id === appointment.patientId);
                    const globalIndex = index + 1;
                    
                    // Get status color
                    let statusColor = 'var(--gray-600)';
                    let statusBgColor = 'var(--gray-100)';
                    switch(appointment.status?.toLowerCase()) {
                        case 'confirmed':
                            statusColor = 'var(--primary-color)';
                            statusBgColor = 'var(--primary-light)';
                            break;
                        case 'scheduled':
                            statusColor = 'var(--warning-color)';
                            statusBgColor = 'var(--warning-light)';
                            break;
                        case 'completed':
                            statusColor = 'var(--success-color)';
                            statusBgColor = 'var(--success-light)';
                            break;
                        case 'cancelled':
                            statusColor = 'var(--danger-color)';
                            statusBgColor = 'var(--danger-light)';
                            break;
                    }
                    
            return `
                <div class="appointment-row" data-appointment-id="${appointment.id}" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; border-bottom: ${index < appointments.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='var(--gray-100)'" onmouseout="this.style.backgroundColor='transparent'">
                    <!-- Selection + Entry Number & Icon -->
                    <div style="display: flex; align-items: center; gap: 1rem; min-width: 120px;">
                        <input type="checkbox" class="appointment-checkbox" data-appointment-id="${appointment.id}" onchange="window.dentalApp.toggleAppointmentSelection('${appointment.id}')" style="width: 14px; height: 14px; cursor: pointer; ">
                        <div style="width: 40px; height: 40px; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: var(--font-size-sm);">${globalIndex}</div>
                        <div style="width: 50px; height: 50px; background: ${patient && patient.gender === 'Female' ? 'var(--pink-light)' : 'var(--primary-light)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${patient && patient.gender === 'Female' ? 'var(--pink-color)' : 'var(--primary-color)'}; font-size: 1.5rem;">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        </div>
                    
                    <!-- Appointment Details (Left Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-weight: 600; font-size: var(--font-size-sm); display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas ${patient && patient.gender === 'Female' ? 'fa-venus' : patient && patient.gender === 'Male' ? 'fa-mars' : 'fa-user'}" style="font-size: 0.875rem;"></i>
                            ${patient ? (patient.name.charAt(0).toUpperCase() + patient.name.slice(1).toLowerCase()) : 'Unknown Patient'}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: var(--font-size-xs); font-weight: 500; width: fit-content;">${this.formatDate(appointment.date)}</div>
                    </div>
                    
                    <!-- Appointment Details (Middle Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>${appointment.time}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-hourglass-half" style="margin-right: 0.5rem;"></i>${appointment.duration || 60} min
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-tooth" style="margin-right: 0.5rem;"></i>${appointment.treatment || 'consultation'}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="background: ${statusColor}; color: var(--white); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center;">
                                ${appointment.status || 'scheduled'}
                            </span>
                            <button onclick="window.dentalApp.updateAppointmentStatus('${appointment.id}', 'confirmed')" style="width: 36px; height: 36px; padding: 0; background: var(--primary-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Confirmed" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <button onclick="window.dentalApp.updateAppointmentStatus('${appointment.id}', 'completed')" style="width: 36px; height: 36px; padding: 0; background: var(--success-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Completed" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="window.dentalApp.updateAppointmentStatus('${appointment.id}', 'cancelled')" style="width: 36px; height: 36px; padding: 0; background: var(--error-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Cancel Appointment" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Action Buttons (Right Block) -->
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button onclick="window.dentalApp.viewAppointmentDetails('${appointment.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="View Details" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="window.dentalApp.editAppointment('${appointment.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Edit Appointment" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.dentalApp.printAppointment('${appointment.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--warning-color); border: 1px solid var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Print" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-print"></i>
                        </button>
                        <button onclick="window.dentalApp.deleteAppointment('${appointment.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--error-color); border: 1px solid var(--error-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Delete" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
                }).join('')}
                
                <!-- Pagination Controls -->
                ${this.appointmentsPerPage !== 'all' ? `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <!-- Entries Per Page Selector for Appointments -->
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--gray-600); font-size: 0.875rem;">
                            <span>Show</span>
                            <select id="appointments-entries-per-page" style="padding: 0.25rem 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius-md); background: var(--white); color: var(--gray-700); font-size: 0.875rem; cursor: pointer;" onchange="window.dentalApp.changeAppointmentsEntriesPerPage(this.value)">
                                <option value="10" ${this.appointmentsPerPage === 10 ? 'selected' : ''}>10</option>
                                <option value="20" ${this.appointmentsPerPage === 20 ? 'selected' : ''}>20</option>
                                <option value="50" ${this.appointmentsPerPage === 50 ? 'selected' : ''}>50</option>
                                <option value="100" ${this.appointmentsPerPage === 100 ? 'selected' : ''}>100</option>
                                <option value="200" ${this.appointmentsPerPage === 200 ? 'selected' : ''}>200</option>
                                <option value="all" ${this.appointmentsPerPage === 'all' ? 'selected' : ''}>All</option>
                            </select>
                            <span>Appointments</span>
                        </div>
                    </div>
                    
                    <!-- Pagination Buttons and Page Info -->
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${totalPages > 1 ? `
                            ${currentPage > 1 ? `<button onclick="window.dentalApp.displayAppointments(window.dentalApp.currentAppointments, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
                            
                            ${this.generateSmartPagination(currentPage, totalPages, 'appointments')}
                            
                            ${currentPage < totalPages ? `<button onclick="window.dentalApp.displayAppointments(window.dentalApp.currentAppointments, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
                        ` : ''}
                        <div style="color: var(--gray-600); font-size: 0.875rem; margin-left: 1rem;">Page ${currentPage} of ${totalPages}</div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        appointmentsList.innerHTML = appointmentsHTML;

        // Initialize selection tracking
        this.selectedAppointments = new Set();
    }

    // Toggle select all appointments
    toggleSelectAllAppointments(checked) {
        const checkboxes = document.querySelectorAll('.appointment-checkbox');
        const appointments = this.getStoredData('appointments') || [];
        if (checked) {
            appointments.forEach(a => { if (a && a.id) this.selectedAppointments.add(a.id); });
        } else {
            this.selectedAppointments.clear();
        }
        checkboxes.forEach(cb => { cb.checked = checked; });
    }

    // Toggle single appointment selection
    toggleAppointmentSelection(appointmentId) {
        if (this.selectedAppointments.has(appointmentId)) {
            this.selectedAppointments.delete(appointmentId);
        } else {
            this.selectedAppointments.add(appointmentId);
        }
    }

    displayBilling(invoices, currentPage = 1) {
        const billingList = document.getElementById('billing-list');
        if (!billingList) {
            console.error('Billing list element not found');
            return;
        }
        
        console.log('Displaying billing with:', invoices.length, 'invoices, page:', currentPage);
        console.log('Invoices data:', invoices);
        
        const invoicesPerPage = 10;
        const totalPages = Math.ceil(invoices.length / invoicesPerPage);
        const startIndex = (currentPage - 1) * invoicesPerPage;
        const endIndex = startIndex + invoicesPerPage;
        const currentInvoices = invoices.slice(startIndex, endIndex);
        
        // Store current page in data attribute for easy access
        billingList.setAttribute('data-current-page', currentPage);
        
        if (invoices.length === 0) {
            billingList.innerHTML = '<p class="text-center" style="color: var(--gray-500); padding: 2rem;">No invoices found</p>';
            return;
        }
        
        const patients = this.getStoredData('patients') || [];
        console.log('Available patients:', patients.length);
        
        // Create single unified grid container with count and invoices (same as patient tab)
        const billingHTML = `
            <div class="billing-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display at the top of the grid -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                        Total Invoices: <span style="color: var(--primary-color);">${invoices.length}</span>
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        Showing ${startIndex + 1}-${Math.min(endIndex, invoices.length)} of ${invoices.length} invoices
                    </div>
                </div>
                
                <!-- Invoice Rows -->
                ${currentInvoices.map((invoice, index) => {
            const patient = patients.find(p => p.id === invoice.patientId);
            const globalIndex = startIndex + index + 1;
            
            // Validate invoice data
            if (!invoice.id) {
                console.error('Invoice missing ID:', invoice);
                return '';
            }
            
            // Helper function to determine display status
            const getDisplayStatus = (invoice) => {
                if (invoice.status === 'paid') return 'paid';
                if (invoice.status === 'unpaid') {
                    const dueDate = new Date(invoice.dueDate || invoice.date);
                    const today = new Date();
                    return dueDate < today ? 'overdue' : 'unpaid';
                }
                return invoice.status || 'unpaid';
            };

            // Get display status and color
            const displayStatus = getDisplayStatus(invoice);
            let statusColor = 'var(--gray-600)';
            let statusBgColor = 'var(--gray-100)';
            
            switch(displayStatus) {
                case 'paid':
                    statusColor = 'var(--success-color)';
                    statusBgColor = 'var(--success-light)';
                    break;
                case 'unpaid':
                    statusColor = 'var(--warning-color)';
                    statusBgColor = 'var(--warning-light)';
                    break;
                case 'overdue':
                    statusColor = 'var(--error-color)';
                    statusBgColor = 'var(--danger-light)';
                    break;
            }
            
            const patientName = patient ? this.capitalizeWords(patient.name) : 'Unknown Patient';
            const invoiceTotal = invoice.total || 0;
            
            return `
                <div class="billing-row" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; border-bottom: ${index < currentInvoices.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='var(--gray-100)'" onmouseout="this.style.backgroundColor='transparent'">
                    <!-- Entry Number & Icon -->
                    <div style="display: flex; align-items: center; gap: 1rem; min-width: 120px;">
                        <div style="width: 40px; height: 40px; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: var(--font-size-sm);">${globalIndex}</div>
                        <div style="width: 50px; height: 50px; background: ${patient && patient.gender === 'Female' ? 'var(--pink-light)' : 'var(--primary-light)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${patient && patient.gender === 'Female' ? 'var(--pink-color)' : 'var(--primary-color)'}; font-size: 1.5rem;">
                            <i class="fas fa-file-invoice-dollar"></i>
                        </div>
                    </div>
                    
                    <!-- Invoice Details (Left Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-weight: 600; font-size: var(--font-size-sm); display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas ${patient && patient.gender === 'Female' ? 'fa-venus' : patient && patient.gender === 'Male' ? 'fa-mars' : 'fa-user'}" style="font-size: 0.875rem;"></i>
                            ${patientName}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: var(--font-size-xs); font-weight: 500; width: fit-content;">${invoice.date ? this.formatDate(invoice.date) : 'No date'}</div>
                    </div>
                    
                    <!-- Invoice Details (Middle Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-hashtag" style="margin-right: 0.5rem;"></i>${invoice.id}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-money-bill-wave" style="margin-right: 0.5rem;"></i>${this.formatCurrency(invoiceTotal)}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="background: ${statusColor}; color: var(--white); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center;">
                                ${displayStatus}
                            </span>
                            <button onclick="window.dentalApp.updateInvoiceStatus('${invoice.id}', 'paid')" style="width: 36px; height: 36px; padding: 0; background: var(--success-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Paid" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <button onclick="window.dentalApp.updateInvoiceStatus('${invoice.id}', 'unpaid')" style="width: 36px; height: 36px; padding: 0px; background: var(--warning-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: 0.2s ease-in-out; transform: scale(1);" title="Mark as Unpaid" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-clock"></i>
                            </button>

                        </div>
                    </div>
                    
                    <!-- Action Buttons (Right Block) -->
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button onclick="window.dentalApp.viewInvoiceDetails('${invoice.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="View Details" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="window.dentalApp.editInvoice('${invoice.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Update Invoice" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.dentalApp.printInvoice('${invoice.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--warning-color); border: 1px solid var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Print" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-print"></i>
                        </button>
                        <button onclick="window.dentalApp.deleteInvoice('${invoice.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--error-color); border: 1px solid var(--error-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Delete" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('')}
        
        <!-- Pagination Controls -->
        <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap;">
            <div style="color: var(--gray-600); font-size: 0.875rem; margin-right: 1rem;">
                Page ${currentPage} of ${totalPages}
            </div>
            
            ${currentPage > 1 ? `<button onclick="window.dentalApp.displayBilling(window.dentalApp.currentBilling, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
            
            ${this.generateSmartPagination(currentPage, totalPages, 'billing')}
            
            ${currentPage < totalPages ? `<button onclick="window.dentalApp.displayBilling(window.dentalApp.currentBilling, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
        </div>
    </div>
`;
        
        billingList.innerHTML = billingHTML;
        console.log('Billing display completed successfully');
    }

    deleteInvoice(invoiceId) {
        this.showDeleteInvoiceConfirmation(invoiceId);
    }

    updateInvoiceStatus(invoiceId, newStatus) {
        console.log('updateInvoiceStatus called with:', invoiceId, newStatus);
        // Get current page for pagination maintenance
        const billingList = document.getElementById('billing-list');
        const currentPage = parseInt(billingList?.getAttribute('data-current-page') || '1');
        
        // Update in storage
        const invoices = this.getStoredData('invoices') || [];
        const invoiceIndex = invoices.findIndex(invoice => invoice.id === invoiceId);
        
        if (invoiceIndex !== -1) {
            const invoice = invoices[invoiceIndex];
            invoice.status = newStatus;
            
            if (newStatus === 'paid') {
                invoice.paidDate = new Date().toISOString();
                
                // For online payments, open form to enter receipt number
                if (invoice.paymentMethod === 'online') {
                    console.log('Opening form for online payment receipt number');
                    console.log('Invoice details:', invoice);
                    
                    setTimeout(() => {
                        if (window.billingManager) {
                            // Set editing mode and show form for this specific invoice
                            window.billingManager.isEditing = true;
                            window.billingManager.currentInvoice = invoice;
                            window.billingManager.showForm(invoice);
                            
                            // Ensure receipt number field is visible for online payment
                            setTimeout(() => {
                                window.billingManager.toggleReceiptNumberField();
                            }, 100);
                        }
                    }, 500);
                } else {
                    // For cash payments, directly update status without opening form
                    console.log('Cash payment - directly updating status to paid');
                    this.setStoredData('invoices', invoices);
                    this.currentBilling = invoices;
                    
                    const currentFilter = this.currentFilter || 'all';
                    let filteredInvoices = [...invoices];
                    if (currentFilter !== 'all') {
                        filteredInvoices = filteredInvoices.filter(inv => inv.status === currentFilter);
                    }
                    
                    const invoicesPerPage = 10;
                    const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);
                    let newCurrentPage = currentPage;
                    if (currentPage > totalPages && totalPages > 0) {
                        newCurrentPage = totalPages;
                    }
                    
                    this.displayBilling(filteredInvoices, newCurrentPage);
                    console.log('Cash invoice status updated successfully to:', newStatus);
                    this.showToast(`Invoice status updated to ${newStatus}`, 'success');
                    return; // Exit early for cash payments
                }
            }
            
            this.setStoredData('invoices', invoices);
            this.currentBilling = invoices;
            
            const currentFilter = this.currentFilter || 'all';
            let filteredInvoices = [...invoices];
            if (currentFilter !== 'all') {
                filteredInvoices = filteredInvoices.filter(invoice => invoice.status === currentFilter);
            }
            
            const invoicesPerPage = 10;
            const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);
            let newCurrentPage = currentPage;
            if (currentPage > totalPages && totalPages > 0) {
                newCurrentPage = totalPages;
            }
            
            this.displayBilling(filteredInvoices, newCurrentPage);
            console.log('Invoice status updated successfully to:', newStatus);
            this.showToast(`Invoice status updated to ${newStatus}`, 'success');
        } else {
            console.log('Invoice not found for status update');
        }
    }

    viewInvoiceDetails(invoiceId) {
        console.log('viewInvoiceDetails called with:', invoiceId);
        const invoices = this.getStoredData('invoices') || [];
        const invoice = invoices.find(inv => inv.id === invoiceId);
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === invoice?.patientId);
        
        if (!invoice) {
            this.showToast('Invoice not found', 'error');
            return;
        }
        
        console.log('Found invoice:', invoice);
        console.log('Found patient:', patient);
        
        // Create a modal to display invoice details (matching appointment details style)
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: var(--white);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-xl);
                width: 100%;
                max-width: 900px;
                max-height: 85vh;
                position: relative;
                border: 1px solid var(--gray-200);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <!-- Header -->
                <div class="modal-header" style="
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--gray-200);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--white);
                ">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-file-invoice-dollar" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Invoice Details</h2>
                    </div>
                    <button onclick="this.closest('.modal').remove()" style="
                        background: var(--primary-color);
                        color: var(--white);
                        border: none;
                        border-radius: 50%;
                        width: 36px;
                        height: 36px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.125rem;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='var(--primary-hover)'" onmouseout="this.style.background='var(--primary-color)'">x</button>
                </div>
                
                <!-- Body -->
                <div class="modal-body" style="
                    padding: 2rem;
                    overflow-y: auto;
                    flex: 1;
                    background: var(--gray-50);
                ">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                        
                        <!-- Invoice Information Card -->
                        <div style="
                            background: var(--white);
                            border-radius: var(--radius-lg);
                            padding: 1.5rem;
                            box-shadow: var(--shadow-md);
                            border: 1px solid var(--gray-200);
                        ">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--primary-light);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: var(--primary-color);
                                ">
                                    <i class="fas fa-file-invoice" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Invoice Information</h3>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Invoice ID:</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${invoice.id}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Invoice Number:</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${invoice.invoiceNumber}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Date:</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${this.formatDate(invoice.date)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Due Date:</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${this.formatDate(invoice.dueDate)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Status:</span>
                                    <span style="
                                        color: var(--white);
                                        background: ${(() => {
                                            if (invoice.status === 'paid') return 'var(--success-color)';
                                            if (invoice.status === 'unpaid') {
                                                const dueDate = new Date(invoice.dueDate || invoice.date);
                                                const today = new Date();
                                                return dueDate < today ? 'var(--error-color)' : 'var(--warning-color)';
                                            }
                                            return 'var(--warning-color)';
                                        })()};
                                        padding: 0.25rem 0.75rem;
                                        border-radius: var(--radius-md);
                                        font-size: 0.875rem;
                                        font-weight: 600;
                                    ">${(() => {
                                        if (invoice.status === 'paid') return 'paid';
                                        if (invoice.status === 'unpaid') {
                                            const dueDate = new Date(invoice.dueDate || invoice.date);
                                            const today = new Date();
                                            return dueDate < today ? 'overdue' : 'unpaid';
                                        }
                                        return invoice.status || 'unpaid';
                                    })()}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Payment Method:</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${invoice.paymentMethod}</span>
                                </div>
                                ${invoice.receiptNumber ? `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                        <span style="color: var(--gray-600); font-weight: 500;">Receipt Number:</span>
                                        <span style="color: var(--primary-color); font-weight: 600;">${invoice.receiptNumber}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Patient Information Card -->
                        <div style="
                            background: var(--white);
                            border-radius: var(--radius-lg);
                            padding: 1.5rem;
                            box-shadow: var(--shadow-md);
                            border: 1px solid var(--gray-200);
                        ">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--primary-light);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: var(--primary-color);
                                ">
                                    <i class="fas fa-user" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Patient Information</h3>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Name:</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${patient ? patient.name : 'Unknown'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Phone:</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${patient ? patient.phone : 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
                                    <span style="color: var(--gray-600); font-weight: 500;">Email:</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${patient ? patient.email : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Treatments Card -->
                    <div style="
                        background: var(--white);
                        border-radius: var(--radius-lg);
                        padding: 1.5rem;
                        box-shadow: var(--shadow-md);
                        border: 1px solid var(--gray-200);
                        margin-top: 1.5rem;
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                            <div style="
                                width: 40px;
                                height: 40px;
                                background: var(--primary-light);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: var(--primary-color);
                            ">
                                <i class="fas fa-stethoscope" style="font-size: 1rem;"></i>
                            </div>
                            <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Treatments</h3>
                        </div>
                        
                        <div style="background: var(--gray-50); border-radius: var(--radius-md); padding: 1rem;">
                            ${invoice.treatments?.map(treatment => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--gray-200); background: var(--white); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
                                    <div>
                                        <div style="font-weight: 600; color: var(--gray-800); margin-bottom: 0.25rem;">${treatment.type}</div>
                                        ${treatment.discount > 0 ? `<div style="color: var(--gray-600); font-size: 0.875rem;">Discount: ${treatment.discount}%</div>` : ''}
                                    </div>
                                    <div style="font-weight: 600; color: var(--primary-color); font-size: 1.125rem;">Rs. ${treatment.amount}</div>
                                </div>
                            `).join('') || '<div style="text-align: center; color: var(--gray-500); padding: 1rem;">No treatments found</div>'}
                        </div>
                    </div>
                    
                    <!-- Summary Card -->
                    <div style="
                        background: var(--white);
                        border-radius: var(--radius-lg);
                        padding: 1.5rem;
                        box-shadow: var(--shadow-md);
                        border: 1px solid var(--gray-200);
                        margin-top: 1.5rem;
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                            <div style="
                                width: 40px;
                                height: 40px;
                                background: var(--primary-light);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: var(--primary-color);
                            ">
                                <i class="fas fa-receipt" style="font-size: 1rem;"></i>
                            </div>
                            <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Invoice Summary</h3>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-200);">
                                <span style="color: var(--gray-600); font-weight: 500;">Subtotal:</span>
                                <span style="color: var(--primary-color); font-weight: 600;">Rs. ${invoice.subtotal}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-200);">
                                <span style="color: var(--gray-600); font-weight: 500;">Total Discount:</span>
                                <span style="color: var(--primary-color); font-weight: 600;">Rs. ${invoice.totalDiscount}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0;  margin-top: 0.5rem;">
                                <span style="color: var(--primary-color); font-weight: 600; font-size: 1.125rem;">Total Amount:</span>
                                <span style="color: var(--primary-color); font-weight: 700; font-size: 1.25rem;">Rs. ${invoice.total}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${invoice.notes ? `
                        <!-- Notes Card -->
                        <div style="
                            background: var(--white);
                            border-radius: var(--radius-lg);
                            padding: 1.5rem;
                            box-shadow: var(--shadow-md);
                            border: 1px solid var(--gray-200);
                            margin-top: 1.5rem;
                        ">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--primary-light);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: var(--primary-color);
                                ">
                                    <i class="fas fa-sticky-note" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Notes</h3>
                            </div>
                            
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); color: var(--gray-700); line-height: 1.5;">
                                ${invoice.notes}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('Invoice details modal created');
    }

    editInvoice(invoiceId) {
        console.log('editInvoice called with:', invoiceId);
        // Open the billing form with the invoice data for editing
        if (window.billingManager) {
            const invoices = this.getStoredData('invoices') || [];
            const invoice = invoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                console.log('Found invoice for editing:', invoice);
                window.billingManager.showForm(invoice);
            } else {
                console.log('Invoice not found for editing');
                this.showToast('Invoice not found', 'error');
            }
        } else {
            console.log('Billing manager not available');
            this.showToast('Billing manager not available', 'error');
        }
    }

    printInvoice(invoiceId) {
        console.log('printInvoice called with:', invoiceId);
        const invoices = this.getStoredData('invoices') || [];
        const invoice = invoices.find(inv => inv.id === invoiceId);
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === invoice?.patientId);
        
        if (!invoice) {
            console.log('Invoice not found for printing');
            this.showToast('Invoice not found', 'error');
            return;
        }
        
        console.log('Found invoice for printing:', invoice);
        console.log('Found patient for printing:', patient);
        
        // Create print-friendly content
        const printContent = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 2rem;">
                    <h1 style="color: #333; margin: 0;">Dental Clinic Invoice</h1>
                    <p style="color: #666; margin: 0.5rem 0;">Professional Dental Services</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                    <div>
                        <h3 style="color: #333; margin-bottom: 1rem;">Invoice Details</h3>
                        <p><strong>Invoice ID:</strong> ${invoice.id}</p>
                        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                        <p><strong>Date:</strong> ${this.formatDate(invoice.date)}</p>
                        <p><strong>Due Date:</strong> ${this.formatDate(invoice.dueDate)}</p>
                        <p><strong>Status:</strong> ${(() => {
                            if (invoice.status === 'paid') return 'paid';
                            if (invoice.status === 'unpaid') {
                                const dueDate = new Date(invoice.dueDate || invoice.date);
                                const today = new Date();
                                return dueDate < today ? 'overdue' : 'unpaid';
                            }
                            return invoice.status || 'unpaid';
                        })()}</p>
                        <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
                    </div>
                    <div>
                        <h3 style="color: #333; margin-bottom: 1rem;">Patient Information</h3>
                        <p><strong>Name:</strong> ${patient ? patient.name : 'Unknown'}</p>
                        <p><strong>Phone:</strong> ${patient ? patient.phone : 'N/A'}</p>
                        <p><strong>Email:</strong> ${patient ? patient.email : 'N/A'}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #333; margin-bottom: 1rem;">Treatments</h3>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="border: 1px solid #ddd; padding: 0.75rem; text-align: left;">Treatment</th>
                                <th style="border: 1px solid #ddd; padding: 0.75rem; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.treatments?.map(treatment => `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 0.75rem;">${treatment.type}</td>
                                    <td style="border: 1px solid #ddd; padding: 0.75rem; text-align: right;">Rs. ${treatment.amount}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="2" style="border: 1px solid #ddd; padding: 0.75rem; text-align: center;">No treatments found</td></tr>'}
                        </tbody>
                    </table>
                </div>
                
                <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span><strong>Subtotal:</strong></span>
                        <span>Rs. ${invoice.subtotal}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span><strong>Total Discount:</strong></span>
                        <span>Rs. ${invoice.totalDiscount}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; border-top: 1px solid #ddd; padding-top: 0.5rem;">
                        <span>Total Amount:</span>
                        <span>Rs. ${invoice.total}</span>
                    </div>
                </div>
                
                ${invoice.notes ? `
                    <div style="margin-bottom: 2rem;">
                        <h3 style="color: #333; margin-bottom: 1rem;">Notes</h3>
                        <p style="background: #f9f9f9; padding: 1rem; border-radius: 8px;">${invoice.notes}</p>
                    </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #333;">
                    <p style="color: #666; margin: 0;">Thank you for choosing our dental services!</p>
                </div>
            </div>
        `;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice - ${invoice.id}</title>
                    <style>
                        body { margin: 0; padding: 0; }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
        
        console.log('Print window opened');
        this.showToast('Print window opened', 'success');
    }

    importPatients() {
        // Create a file input for CSV import
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv,.xlsx,.json';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    exportPatients() {
        // Always export ALL patients regardless of current filter
        let patientsToExport = this.getStoredData('patients') || [];
        
        if (patientsToExport.length === 0) {
            this.showToast('No patients to export', 'warning');
            return;
        }
        
        // Prepare data for Excel export
        const headers = ['Name', 'Phone', 'Email', 'Date of Birth', 'Address', 'Gender', 'Status', 'Created Date'];
        const data = patientsToExport.map(patient => [
            patient.name,
            patient.phone,
            patient.email || '',
            patient.dob || '',
            patient.address || '',
            patient.gender || '',
            patient.status || 'active',
            patient.createdAt ? this.formatDate(patient.createdAt) : ''
        ]);
        
        // Export to Excel - always use 'all' in filename since we're exporting all patients
        const filename = `patients_all_export_${new Date().toISOString().split('T')[0]}`;
        const success = this.exportToExcel(data, headers, filename, 'Patients');
        
        if (success) {
            this.showToast(`${patientsToExport.length} all patients exported to Excel successfully`, 'success');
        }
    }

    importAppointments() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv,.xlsx,.json';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportAppointmentsFile(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    exportAppointments() {
        // Use filtered appointments if available, otherwise use all appointments
        let appointmentsToExport = this.currentAppointments || this.getStoredData('appointments') || [];
        
        if (appointmentsToExport.length === 0) {
            this.showToast('No appointments to export', 'warning');
            return;
        }
        
        // Get filter info for filename using the new short form system
        const filterShortForm = this.getCurrentTabShortForm();
        
        const patients = this.getStoredData('patients') || [];
        const headers = ['Patient Name', 'Patient Gender', 'Date', 'Time', 'Treatment', 'Duration', 'Status', 'Priority', 'Notes', 'Created Date'];
        const data = appointmentsToExport.map(appointment => {
            const patient = patients.find(p => p.id === appointment.patientId);
            return [
                patient ? patient.name : 'Unknown',
                patient ? (patient.gender || '') : '',
                appointment.date ? this.formatDate(appointment.date) : '',
                appointment.time || '',
                appointment.treatment || '',
                appointment.duration || '',
                appointment.status || 'scheduled',
                appointment.priority || '',
                appointment.notes || '',
                appointment.createdAt ? this.formatDate(appointment.createdAt) : ''
            ];
        });
        
        // Export to Excel
        const filename = `appointments_${filterShortForm}_export_${new Date().toISOString().split('T')[0]}`;
        const success = this.exportToExcel(data, headers, filename, 'Appointments');
        
        if (success) {
            this.showToast(`${appointmentsToExport.length} ${filterShortForm} appointments exported to Excel successfully`, 'success');
        }
    }

    importBilling() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv,.xlsx,.json';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportBillingFile(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    exportBilling() {
        // Always export ALL billing regardless of current filter
        let billingToExport = this.getStoredData('invoices') || [];
        
        if (billingToExport.length === 0) {
            this.showToast('No invoices to export', 'warning');
            return;
        }
        
        const patients = this.getStoredData('patients') || [];
        const headers = ['Invoice ID', 'Invoice Number', 'Patient Name', 'Patient Gender', 'Date', 'Due Date', 'Total Amount', 'Status', 'Payment Method', 'Receipt Number', 'Created Date'];
        const data = billingToExport.map(invoice => {
            const patient = patients.find(p => p.id === invoice.patientId);
            return [
                invoice.id || '',
                invoice.invoiceNumber || '',
                patient ? patient.name : 'Unknown',
                patient ? (patient.gender || '') : '',
                invoice.date ? this.formatDate(invoice.date) : '',
                invoice.dueDate ? this.formatDate(invoice.dueDate) : '',
                invoice.total || 0,
                invoice.status || 'unpaid',
                invoice.paymentMethod || '',
                invoice.receiptNumber || '',
                invoice.createdAt ? this.formatDate(invoice.createdAt) : ''
            ];
        });
        
        // Export to Excel - always use 'all' in filename since we're exporting all billing
        const filename = `billing_all_export_${new Date().toISOString().split('T')[0]}`;
        const success = this.exportToExcel(data, headers, filename, 'Billing');
        
        if (success) {
            this.showToast(`${billingToExport.length} all billing records exported to Excel successfully`, 'success');
        }
    }

    processImportFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // Handle Excel file
            this.importFromExcel(file)
                .then(data => {
                    try {
                        const patients = this.parseImportExcelFile(data, file.name);
                        
                        if (patients.length > 0) {
                            // Merge with existing patients
                            const existingPatients = this.getStoredData('patients') || [];
                            const mergedPatients = [...existingPatients, ...patients];
                            this.setStoredData('patients', mergedPatients);
                            
                            this.showToast(`Successfully imported ${patients.length} patients from Excel`, 'success');
                            
                            // Refresh the patients list
                            this.displayPatients(mergedPatients);
                        } else {
                            this.showToast('No valid patient data found in Excel file', 'error');
                        }
                    } catch (error) {
                        console.error('Error processing Excel file:', error);
                        this.showToast('Error processing Excel file', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error reading Excel file:', error);
                    this.showToast('Error reading Excel file', 'error');
                });
        } else {
            // Handle CSV/JSON file
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const patients = this.parseImportFile(content, file.name);
                    
                    if (patients.length > 0) {
                        // Merge with existing patients
                        const existingPatients = this.getStoredData('patients') || [];
                        const mergedPatients = [...existingPatients, ...patients];
                        this.setStoredData('patients', mergedPatients);
                        
                        this.showToast(`Successfully imported ${patients.length} patients`, 'success');
                        
                        // Refresh the patients list
                        this.displayPatients(mergedPatients);
                    } else {
                        this.showToast('No valid patient data found in file', 'error');
                    }
                } catch (error) {
                    console.error('Error processing import file:', error);
                    this.showToast('Error processing import file', 'error');
                }
            };
            reader.readAsText(file);
        }
    }

    processImportAppointmentsFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const appointments = this.parseImportAppointmentsFile(content, file.name);
                
                if (appointments.length > 0) {
                    // Merge with existing appointments
                    const existingAppointments = this.getStoredData('appointments') || [];
                    const mergedAppointments = [...existingAppointments, ...appointments];
                    this.setStoredData('appointments', mergedAppointments);
                    
                    this.showToast(`Successfully imported ${appointments.length} appointments`, 'success');
                    
                    // Refresh the appointments list
                    if (window.appointmentsManager) {
                        window.appointmentsManager.loadAppointments();
                    }
                } else {
                    this.showToast('No valid appointment data found in file', 'error');
                }
            } catch (error) {
                console.error('Error processing import file:', error);
                this.showToast('Error processing import file', 'error');
            }
        };
        reader.readAsText(file);
    }

    processImportBillingFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const invoices = this.parseImportBillingFile(content, file.name);
                
                if (invoices.length > 0) {
                    // Merge with existing invoices
                    const existingInvoices = this.getStoredData('invoices') || [];
                    const mergedInvoices = [...existingInvoices, ...invoices];
                    this.setStoredData('invoices', mergedInvoices);
                    
                    this.showToast(`Successfully imported ${invoices.length} invoices`, 'success');
                    
                    // Refresh the billing list
                    this.currentBilling = mergedInvoices;
                    this.displayBilling(mergedInvoices, 1);
                } else {
                    this.showToast('No valid billing data found in file', 'error');
                }
            } catch (error) {
                console.error('Error processing import file:', error);
                this.showToast('Error processing import file', 'error');
            }
        };
        reader.readAsText(file);
    }

    parseImportFile(content, filename) {
        // Simple CSV parser
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const patients = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim());
            const patient = {
                id: this.generateId(),
                name: values[0] || '',
                phone: values[1] || '',
                email: values[2] || '',
                dob: values[3] || '',
                address: values[4] || '',
                status: values[5] || 'active',
                createdAt: new Date().toISOString()
            };
            
            if (patient.name && patient.phone) {
                patients.push(patient);
            }
        }
        
        return patients;
    }

    parseImportExcelFile(data, filename) {
        const patients = [];
        
        // Skip header row (first row)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row && row.length >= 3) {
                const patient = {
                    id: this.generateId('patient'),
                    name: row[0] || '',
                    phone: row[1] || '',
                    email: row[2] || '',
                    dob: row[3] || '',
                    address: row[4] || '',
                    gender: row[5] || '',
                    status: row[6] || 'active',
                    createdAt: new Date().toISOString()
                };
                
                if (patient.name && patient.phone) {
                    patients.push(patient);
                }
            }
        }
        
        return patients;
    }

    parseImportAppointmentsFile(content, filename) {
        // Support CSV or JSON array
        if (content.trim().startsWith('[')) {
            try {
                const json = JSON.parse(content);
                if (Array.isArray(json)) {
                    // Map JSON objects using flexible patient matching
                    const patients = this.getStoredData('patients') || [];
                    const normalizeStatus = (s) => {
                        const v = (s || '').toString().toLowerCase();
                        return ['scheduled','confirmed','completed','cancelled','no-show'].includes(v) ? v : 'scheduled';
                    };
                    const findPatientIdFromObj = (obj) => {
                        const byId = patients.find(p => p.id === obj.patientId);
                        if (byId) return byId.id;
                        if (obj.email) {
                            const byEmail = patients.find(p => (p.email || '').toLowerCase() === String(obj.email).toLowerCase());
                            if (byEmail) return byEmail.id;
                        }
                        if (obj.phone) {
                            const digits = String(obj.phone).replace(/\D/g, '');
                            const byPhone = patients.find(p => (p.phone || '').replace(/\D/g, '') === digits);
                            if (byPhone) return byPhone.id;
                        }
                        if (obj.patient || obj.name) {
                            const name = String(obj.patient || obj.name);
                            const byName = patients.filter(p => (p.name || '').toLowerCase() === name.toLowerCase());
                            if (byName.length === 1) return byName[0].id;
                        }
                        return '';
                    };

                    const out = [];
                    for (const row of json) {
                        const pid = findPatientIdFromObj(row);
                        const dateStr = this.parseFlexibleDate(row.date || row.Date);
                        const timeStr = this.convertTo24HourTime(row.time || row.Time);
                        if (!pid || !dateStr || !timeStr) continue;
                        out.push({
                            id: this.generateId(),
                            patientId: pid,
                            date: dateStr,
                            time: timeStr,
                            treatment: row.treatment || 'consultation',
                            duration: Number.isFinite(parseInt(row.duration)) ? parseInt(row.duration) : 60,
                            status: normalizeStatus(row.status),
                            priority: row.priority || 'normal',
                            notes: row.notes || '',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                    }
                    return out;
                }
            } catch (e) {
                console.warn('JSON appointment import parse failed, falling back to CSV:', e);
            }
        }

        const lines = content.split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        const headersLower = headers.map(h => h.toLowerCase());

        // Basic format validation: must contain date and time columns
        const dateIdx = headersLower.indexOf('date');
        const timeIdx = headersLower.indexOf('time');
        if (dateIdx === -1 || timeIdx === -1) {
            // Not an appointment file
            console.warn('Import cancelled: Missing required date/time headers for appointments');
            return [];
        }

        // Possible patient fields
        const patientIdIdx = headersLower.indexOf('patientid') !== -1 ? headersLower.indexOf('patientid') : headersLower.indexOf('patient_id');
        const patientNameIdx = headersLower.indexOf('patient') !== -1 ? headersLower.indexOf('patient') : headersLower.indexOf('patient name');
        const nameIdx = headersLower.indexOf('name');
        const emailIdx = headersLower.indexOf('email');
        const phoneIdx = headersLower.indexOf('phone');
        const treatmentIdx = headersLower.indexOf('treatment');
        const durationIdx = headersLower.indexOf('duration');
        const statusIdx = headersLower.indexOf('status');
        const priorityIdx = headersLower.indexOf('priority');
        const notesIdx = headersLower.indexOf('notes');

        const patients = this.getStoredData('patients') || [];

        const findPatientId = (rowValues) => {
            const tryValue = (idx) => (idx !== -1 && rowValues[idx] ? rowValues[idx].trim() : '');
            const rawId = tryValue(patientIdIdx);
            const rawName = tryValue(patientNameIdx) || tryValue(nameIdx);
            const rawEmail = tryValue(emailIdx);
            const rawPhone = tryValue(phoneIdx).replace(/\D/g, '');

            // Match by exact id
            if (rawId) {
                const byId = patients.find(p => p.id === rawId);
                if (byId) return byId.id;
            }
            // If the cell contains a concatenated mess, try to parse it
            if (!rawId && rawName && !emailIdx && !phoneIdx) {
                const parsed = this.parseConcatenatedPatientString(rawName);
                if (parsed) {
                    if (parsed.email) {
                        const byEmail = patients.find(p => (p.email || '').toLowerCase() === parsed.email.toLowerCase());
                        if (byEmail) return byEmail.id;
                    }
                    if (parsed.phone) {
                        const byPhone = patients.find(p => (p.phone || '').replace(/\D/g, '') === parsed.phone.replace(/\D/g, ''));
                        if (byPhone) return byPhone.id;
                    }
                    if (parsed.name) {
                        const byName = patients.filter(p => (p.name || '').toLowerCase() === parsed.name.toLowerCase());
                        if (byName.length === 1) return byName[0].id;
                    }
                }
            }
            // Match by email
            if (rawEmail) {
                const byEmail = patients.find(p => (p.email || '').toLowerCase() === rawEmail.toLowerCase());
                if (byEmail) return byEmail.id;
            }
            // Match by phone (digits only)
            if (rawPhone) {
                const byPhone = patients.find(p => (p.phone || '').replace(/\D/g, '') === rawPhone);
                if (byPhone) return byPhone.id;
            }
            // Match by exact name (case-insensitive) if unique
            if (rawName) {
                const byName = patients.filter(p => (p.name || '').toLowerCase() === rawName.toLowerCase());
                if (byName.length === 1) return byName[0].id;
            }
            return '';
        };

        const normalizeStatus = (s) => {
            const v = (s || '').toString().toLowerCase();
            if (['scheduled','confirmed','completed','cancelled','no-show'].includes(v)) return v;
            return 'scheduled';
        };

        const appointments = [];
        let skipped = 0;
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());

            const patientId = findPatientId(values);
            const rawDate = values[dateIdx];
            const rawTime = values[timeIdx];
            const rawPriority = priorityIdx !== -1 ? values[priorityIdx] : '';
            // Enforce rule: must have PRIORITY defined to import
            if (!rawPriority) { skipped++; continue; }

            const dateStr = this.parseFlexibleDate(rawDate);
            const timeStr = this.convertTo24HourTime(rawTime);
            const dateOk = !!dateStr;
            const timeOk = !!timeStr;

            if (!patientId || !dateOk || !timeOk) {
                skipped++;
                continue;
            }

            const appointment = {
                id: this.generateId(),
                patientId,
                date: dateStr,
                time: timeStr,
                treatment: treatmentIdx !== -1 ? values[treatmentIdx] : 'consultation',
                duration: durationIdx !== -1 ? parseInt(values[durationIdx]) || 60 : 60,
                status: normalizeStatus(statusIdx !== -1 ? values[statusIdx] : 'scheduled'),
                priority: rawPriority || 'normal',
                notes: notesIdx !== -1 ? values[notesIdx] : '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            appointments.push(appointment);
        }

        if (skipped > 0) {
            console.warn(`Skipped ${skipped} appointment row(s) due to invalid format or unknown patient`);
        }
        return appointments;
    }

    parseImportBillingFile(content, filename) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const invoices = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const invoice = {
                id: this.generateId(),
                patientId: values[0] || '', // Assuming patient ID is in the first column
                date: values[1] || '',
                total: parseFloat(values[2] || 0),
                status: values[3] || 'unpaid',
                notes: values[4] || '',
                createdAt: new Date().toISOString()
            };

            if (invoice.patientId && invoice.date && invoice.total !== 0) {
                invoices.push(invoice);
            }
        }
        return invoices;
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            if (!this.isMobile) {
                // Switched to desktop
                this.closeSidebar();
                document.body.classList.remove('mobile');
            } else {
                // Switched to mobile
                document.body.classList.add('mobile');
            }
        }
    }

    handleKeyboardNavigation(e) {
        // ESC key to close modals and sidebar
        if (e.key === 'Escape') {
            this.closeSidebar();
            this.closeAllModals();
        }
        
        // Alt + number keys for quick navigation
        if (e.altKey && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const sections = ['dashboard', 'patient-services', 'automation', 'feedback'];
            const index = parseInt(e.key) - 1;
            if (sections[index]) {
                this.showSection(sections[index]);
            }
        }
        
        // Tab navigation within Patient Services (Alt + T + number)
        if (e.altKey && e.key === 't' && this.currentSection === 'patient-services') {
            e.preventDefault();
            const tabNumber = e.shiftKey ? 3 : 1; // Default to first tab
            const tabs = ['patient-management', 'appointment-management', 'billing-management'];
            if (tabs[tabNumber - 1]) {
                this.showTab(tabs[tabNumber - 1]);
            }
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
            modal.style.display = 'none';
        });
        
        // Close all calendar dropdowns
        document.querySelectorAll('.calendar-dropdown').forEach(calendar => {
            calendar.remove();
        });
    }

    loadInitialData() {
        // Load dashboard statistics
        this.loadDashboardData();
        
        // Load any cached data
        this.loadCachedData();
        
        // Initialize sample data if no patients exist
        this.initializeSampleData();

        // Repair any appointments that reference missing patients
        this.repairAppointmentsWithMissingPatients();

        // Remove any appointments that still reference unknown patients
        this.removeUnknownAppointments();
    }

    initializeSampleData() {
        const patients = this.getStoredData('patients') || [];
        let samplePatients = this.getStoredData('patients') || [];
        
        if (patients.length === 0) {
            // Create sample patients if they don't exist
            samplePatients = this.getStoredData('patients') || [];
            if (samplePatients.length === 0) {
                samplePatients = [
                    {
                        id: this.generateId('patient'),
                        name: 'Kainat Rasees',
                        phone: '03192206693',
                        email: 'kainat@example.com',
                        dob: '2004-07-18',
                        address: 'B/224 Sector 31-D P&T Society',
                        medicalHistory: 'Dental sensitivity',
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: this.generateId('patient'),
                        name: 'Afzal',
                        phone: '03360121211',
                        email: 'afzal@example.com',
                        dob: '1975-11-10',
                        address: 'A/123 Sector 15-E',
                        medicalHistory: 'No known allergies',
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ];
                this.setStoredData('patients', samplePatients);
                console.log('Sample patient data initialized with', samplePatients.length, 'patients');
            }
            
            // Create sample invoices
            const sampleInvoices = [
                {
                    id: 'b-01',
                    invoiceNumber: 'INV-001',
                    patientId: samplePatients[0]?.id || 'p-01',
                    date: new Date().toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'unpaid',
                    paymentMethod: 'cash',
                    receiptNumber: '',
                    totalDiscount: 0,
                    treatments: [
                        {
                            type: 'consultation',
                            amount: 1000,
                            discount: 0
                        }
                    ],
                    subtotal: 1000,
                    total: 1000,
                    notes: 'Initial consultation',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'b-02',
                    invoiceNumber: 'INV-002',
                    patientId: samplePatients[1]?.id || 'p-02',
                    date: new Date().toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'paid',
                    paymentMethod: 'online',
                    receiptNumber: 'RCPT-001',
                    totalDiscount: 200,
                    treatments: [
                        {
                            type: 'cleaning',
                            amount: 2000,
                            discount: 10
                        }
                    ],
                    subtotal: 2000,
                    total: 1800,
                    notes: 'Dental cleaning session',
                    paidDate: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            this.setStoredData('invoices', sampleInvoices);
            console.log('Sample billing data initialized with', sampleInvoices.length, 'invoices');
            console.log('Sample invoices:', sampleInvoices);
        }
        
        // Create sample appointments if they don't exist
        const appointments = this.getStoredData('appointments') || [];
        if (appointments.length === 0) {
            const sampleAppointments = [
                {
                    id: this.generateId('appointment'),
                    patientId: samplePatients[0]?.id || 'p-01',
                    date: new Date().toISOString().split('T')[0],
                    time: '10:00',
                    duration: 60,
                    treatment: 'Dental Cleaning',
                    priority: 'urgent',
                    reminder: '1',
                    notes: 'Patient has sensitivity',
                    status: 'scheduled',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId('appointment'),
                    patientId: samplePatients[1]?.id || 'p-02',
                    date: new Date().toISOString().split('T')[0],
                    time: '14:00',
                    duration: 30,
                    treatment: 'Consultation',
                    priority: 'normal',
                    reminder: 'none',
                    notes: 'Regular checkup',
                    status: 'confirmed',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId('appointment'),
                    patientId: samplePatients[0]?.id || 'p-01',
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
                    time: '09:00',
                    duration: 90,
                    treatment: 'Root Canal',
                    priority: 'emergency',
                    reminder: '2',
                    notes: 'Emergency treatment needed',
                    status: 'scheduled',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            this.setStoredData('appointments', sampleAppointments);
            console.log('Sample appointments initialized with', sampleAppointments.length, 'appointments');
            console.log('Sample appointments:', sampleAppointments);
        }

        // Create sample staff if they don't exist
        const staff = this.getStoredData('staff') || [];
        if (staff.length === 0) {
            const sampleStaff = [
                {
                    id: this.generateId('staff'),
                    name: 'Dr. Sarah Ahmed',
                    email: 'sarah.ahmed@clinic.com',
                    phone: '0300-1234567',
                    gender: 'Female',
                    role: 'Dentist',
                    qualification: 'BDS, MDS',
                    experience: '8 years',
                    jobTerm: 'Permanent',
                    joinDate: '2023-01-15',
                    status: 'active',
                    dob: '1985-06-15',
                    age: '38 years',
                    address: 'House 123, Street 5, Islamabad',
                    notes: 'Specializes in cosmetic dentistry and orthodontics. Excellent patient rapport.',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId('staff'),
                    name: 'Fatima Khan',
                    email: 'fatima.khan@clinic.com',
                    phone: '0300-7654321',
                    gender: 'Female',
                    role: 'Dental Hygienist',
                    qualification: 'Diploma in Dental Hygiene',
                    experience: '5 years',
                    jobTerm: 'Permanent',
                    joinDate: '2023-03-20',
                    status: 'leave',
                    dob: '1990-03-22',
                    age: '33 years',
                    address: 'Apartment 45, Block C, Rawalpindi',
                    notes: 'Expert in dental cleaning and preventive care. Currently on maternity leave.',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId('staff'),
                    name: 'Ali Hassan',
                    email: 'ali.hassan@clinic.com',
                    phone: '0300-9876543',
                    gender: 'Male',
                    role: 'Receptionist',
                    qualification: 'Bachelor in Business Administration',
                    experience: '3 years',
                    jobTerm: 'Contract',
                    joinDate: '2023-02-10',
                    status: 'left',
                    dob: '1995-11-08',
                    age: '28 years',
                    address: 'House 78, Street 12, Islamabad',
                    notes: 'Former receptionist. Left for better opportunities. Good customer service skills.',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            this.setStoredData('staff', sampleStaff);
            console.log('Sample staff initialized with', sampleStaff.length, 'staff members');
            console.log('Sample staff:', sampleStaff);
        }

        // Create sample salaries if they don't exist
        const salaries = this.getStoredData('salaries') || [];
        const hasInitializedSalaries = this.getStoredData('hasInitializedSalaries') || false;
        console.log('Salary initialization check:', { salariesLength: salaries.length, hasInitializedSalaries });
        if (salaries.length === 0 && !hasInitializedSalaries) {
            const sampleSalaries = [
                {
                    id: this.generateId('salary'),
                    staffId: staff[0]?.id || 's-01',
                    month: '2024-01',
                    amount: 85000,
                    status: 'paid',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId('salary'),
                    staffId: staff[1]?.id || 's-02',
                    month: '2024-01',
                    amount: 65000,
                    status: 'paid',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId('salary'),
                    staffId: staff[2]?.id || 's-03',
                    month: '2024-01',
                    amount: 45000,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            this.setStoredData('salaries', sampleSalaries);
            this.setStoredData('hasInitializedSalaries', true);
            console.log('Sample salaries initialized with', sampleSalaries.length, 'salary records');
            console.log('Sample salaries:', sampleSalaries);
        }

        // Create sample attendance if it doesn't exist
        const attendance = this.getStoredData('attendance') || [];
        if (attendance.length === 0) {
            const today = this.getPakistanDate();
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString("en-US", {
                timeZone: this.pakistanTimeZone
            });
            const yesterdayDate = new Date(yesterday).toISOString().split('T')[0];
            const staff = this.getStoredData('staff') || [];
            
            const sampleAttendance = [
                {
                    id: this.generateId('attendance'),
                    staffId: staff[0]?.id || 's-01',
                    date: today,
                    time: '09:00',
                    status: 'present',
                    notes: 'On time',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId('attendance'),
                    staffId: staff[1]?.id || 's-02',
                    date: today,
                    time: '09:15',
                    status: 'late',
                    notes: 'Traffic delay',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId('attendance'),
                    staffId: staff[2]?.id || 's-03',
                    date: today,
                    time: null,
                    status: 'absent',
                    notes: 'Called in sick',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId('attendance'),
                    staffId: staff[0]?.id || 's-01',
                    date: yesterdayDate,
                    time: '09:00',
                    status: 'present',
                    notes: 'Regular attendance',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId('attendance'),
                    staffId: staff[1]?.id || 's-02',
                    date: yesterdayDate,
                    time: '09:00',
                    status: 'present',
                    notes: 'On time',
                    createdAt: new Date().toISOString()
                }
            ];
            
            this.setStoredData('attendance', sampleAttendance);
            console.log('Sample attendance initialized with', sampleAttendance.length, 'attendance records');
            console.log('Sample attendance:', sampleAttendance);
        }
    }



    loadDashboardData() {
        // Get data from localStorage or Firebase
        const patients = this.getStoredData('patients') || [];
        const appointments = this.getStoredData('appointments') || [];
        const invoices = this.getStoredData('invoices') || [];
        
        // Calculate statistics
        const todayAppointments = this.getTodayAppointments(appointments);
        const completedAppointments = appointments.filter(apt => apt.status === 'completed');
        const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');
        const monthlyPayment = this.calculateMonthlyRevenue(invoices);
        const paymentDues = this.calculatePaymentDues(invoices);
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
        
        // Update dashboard statistics
        this.updateDashboardStats({
            totalPatients: patients.length,
            todayAppointments: todayAppointments.length,
            appointmentsCompleted: completedAppointments.length,
            appointmentsCancelled: cancelledAppointments.length,
            monthlyPayment: monthlyPayment,
            paymentDues: paymentDues,
            paidInvoices: paidInvoices.length,
            unpaidInvoices: unpaidInvoices.length
        });
        
        // Load today's appointments
        this.loadTodayAppointments();
    }

    updateDashboardStats(stats) {
        const elements = {
            'total-patients': stats.totalPatients,
            'today-appointments': stats.todayAppointments,
            'appointments-completed': stats.appointmentsCompleted,
            'appointments-cancelled': stats.appointmentsCancelled,
            'monthly-payment': `Rs.${stats.monthlyPayment.toLocaleString()}`,
            'payment-dues': `Rs.${stats.paymentDues.toLocaleString()}`,
            'paid-invoices': stats.paidInvoices,
            'unpaid-invoices': stats.unpaidInvoices
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    getTodayAppointments(appointments) {
        const today = this.getPakistanDate();
        return appointments.filter(apt => apt.date === today);
    }

    calculateMonthlyRevenue(invoices) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return invoices
            .filter(invoice => {
                const invoiceDate = new Date(invoice.date);
                return invoiceDate.getMonth() === currentMonth && 
                       invoiceDate.getFullYear() === currentYear &&
                       invoice.status === 'paid';
            })
            .reduce((total, invoice) => total + (invoice.total || 0), 0);
    }

    calculatePaymentDues(invoices) {
        const today = new Date();
        return invoices
            .filter(invoice => {
                const dueDate = new Date(invoice.dueDate || invoice.date);
                return invoice.status === 'unpaid' && dueDate < today;
            })
            .reduce((total, invoice) => total + (invoice.total || 0), 0);
    }

    calculateAverageRating(feedback) {
        if (feedback.length === 0) return 0;
        const totalRating = feedback.reduce((sum, item) => sum + (item.rating || 0), 0);
        return totalRating / feedback.length;
    }

    loadTodayAppointments() {
        const appointments = this.getStoredData('appointments') || [];
        const patients = this.getStoredData('patients') || [];
        const todayAppointments = this.getTodayAppointments(appointments);
        
        const appointmentsList = document.getElementById('today-appointments-list');
        if (appointmentsList) {
            if (todayAppointments.length === 0) {
                appointmentsList.innerHTML = '<p class="text-center" style="color: var(--gray-500); padding: 2rem;">No appointments scheduled for today</p>';
            } else {
                appointmentsList.innerHTML = todayAppointments.map(appointment => {
                    const patient = patients.find(p => p.id === appointment.patientId);
                    
                    // Get status color for the left border
                    let statusColor = 'var(--success-color)';
                    let statusBgColor = 'var(--success-light)';
                    
                    switch(appointment.status?.toLowerCase()) {
                        case 'confirmed':
                            statusColor = 'var(--primary-color)';
                            statusBgColor = 'var(--primary-light)';
                            break;
                        case 'scheduled':
                            statusColor = 'var(--warning-color)';
                            statusBgColor = 'var(--warning-light)';
                            break;
                        case 'completed':
                            statusColor = 'var(--success-color)';
                            statusBgColor = 'var(--success-light)';
                            break;
                        case 'cancelled':
                            statusColor = 'var(--danger-color)';
                            statusBgColor = 'var(--danger-light)';
                            break;
                    }
                    
                    return `
                        <div class="appointment-item" style="padding: 1rem; background: ${statusBgColor}; border-radius: var(--radius-lg); margin-bottom: 0.5rem; border-left: 4px solid ${statusColor}; opacity: 0.8; transition: all 0.2s ease-in-out;" onmouseover="this.style.opacity='1'; this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity='0.8'; this.style.transform='translateY(0)'">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                        <strong style="color: ${statusColor}; font-size: 1rem;">${patient ? patient.name : 'Unknown Patient'}</strong>
                                        ${appointment.priority && appointment.priority !== 'normal' ? `
                                            <span style="background: ${appointment.priority === 'urgent' ? 'var(--warning-color)' : 'var(--error-color)'}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; display: inline-block;">
                                                ${appointment.priority.toUpperCase()}
                                            </span>
                                        ` : ''}
                                    </div>
                                    <p style="margin: 0; color: var(--gray-600); font-size: 0.875rem;">${appointment.treatment || 'General Consultation'}</p>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-weight: 600; color: ${statusColor}; font-size: 1rem;">${appointment.time}</span>
                                    <p style="margin: 0; color: var(--gray-600); font-size: 0.875rem;">${appointment.duration || 60} min</p>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    loadCachedData() {
        // Load any cached data from localStorage
        try {
            const cachedData = localStorage.getItem('dentalClinicData');
            if (cachedData) {
                const data = JSON.parse(cachedData);
                console.log('Loaded cached data:', data);
            }
        } catch (error) {
            console.error('Error loading cached data:', error);
        }
    }

    getStoredData(key) {
        try {
            const data = localStorage.getItem(`dentalClinic_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error getting stored data for ${key}:`, error);
            return null;
        }
    }

    setStoredData(key, data) {
        try {
            localStorage.setItem(`dentalClinic_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error storing data for ${key}:`, error);
            return false;
        }
    }

    hideLoadingSpinner() {
        setTimeout(() => {
            const spinner = document.getElementById('loading-spinner');
            const mainContainer = document.getElementById('main-container');
            
            if (spinner && mainContainer) {
                spinner.style.display = 'none';
                mainContainer.style.display = 'flex';
                
                // Trigger initial animation
                setTimeout(() => {
                    mainContainer.style.opacity = '1';
                }, 50);
            }
            
            this.isLoading = false;
        }, 1000); // Show loading for at least 1 second
    }

    showToast(message, type = 'info', duration = 3000) {
        // Debounce repeated messages to prevent spam
        const messageKey = `${message}-${type}`;
        if (this.toastDebounce && this.toastDebounce[messageKey]) {
            console.log('Toast message debounced:', message);
            return;
        }
        
        // Initialize debounce object if it doesn't exist
        if (!this.toastDebounce) {
            this.toastDebounce = {};
        }
        
        // Set debounce flag
        this.toastDebounce[messageKey] = true;
        
        // Clear debounce after 10 seconds
        setTimeout(() => {
            if (this.toastDebounce) {
                delete this.toastDebounce[messageKey];
            }
        }, 10000);
        
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease-in-out forwards';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }
        }, duration);
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.remove();
        });
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Excel Import/Export Helper Methods
    exportToExcel(data, headers, filename, sheetName = 'Data') {
        try {
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            // Generate Excel file
            XLSX.writeFile(wb, `${filename}.xlsx`);
            
            return true;
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.showToast('Error exporting to Excel', 'error');
            return false;
        }
    }

    importFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    resolve(jsonData);
                } catch (error) {
                    console.error('Error importing from Excel:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Utility methods
    generateId(type = 'patient') {
        const prefix = type === 'patient' ? 'p' : type === 'appointment' ? 'a' : type === 'billing' ? 'b' : type === 'staff' ? 's' : type === 'salary' ? 'sal' : type === 'attendance' ? 'att' : 'p';
        const dataKey = type === 'patient' ? 'patients' : type === 'appointment' ? 'appointments' : type === 'billing' ? 'invoices' : type === 'staff' ? 'staff' : type === 'salary' ? 'salaries' : type === 'attendance' ? 'attendance' : 'patients';
        const existingData = this.getStoredData(dataKey) || [];
        
        console.log(`Generating ID for ${type}, checking ${dataKey} data:`, existingData.length, 'items');
        
        // Find the highest existing ID number
        let maxNumber = 0;
        existingData.forEach(item => {
            const idMatch = item.id?.match(new RegExp(`^${prefix}-(\\d+)$`));
            if (idMatch) {
                const num = parseInt(idMatch[1]);
                if (num > maxNumber) maxNumber = num;
            }
        });
        
        // Generate next sequential ID
        const nextNumber = maxNumber + 1;
        const newId = `${prefix}-${String(nextNumber).padStart(2, '0')}`;
        console.log(`Generated ID: ${newId} (max found: ${maxNumber})`);
        return newId;
    }

    formatDate(date) {
        if (!date) return 'N/A';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'N/A';
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatMonthName(monthNumber) {
        if (!monthNumber) return '';
        
        // Convert month number to month name
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        // Handle both string and number formats
        const monthIndex = parseInt(monthNumber) - 1;
        return monthNames[monthIndex] || monthNumber;
    }

    formatTime(time) {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/\s/g, ''));
    }

    capitalizeWords(text) {
        if (!text) return '';
        return text.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    searchPatients(query) {
        const patients = this.getStoredData('patients') || [];
        const filteredPatients = patients.filter(patient => 
            patient.name.toLowerCase().includes(query.toLowerCase()) ||
            patient.phone.includes(query) ||
            (patient.email && patient.email.toLowerCase().includes(query.toLowerCase())) ||
            (patient.gender && patient.gender.toLowerCase().includes(query.toLowerCase()))
        );
        this.currentPatients = filteredPatients;
        this.displayPatients(filteredPatients, 1); // Always start from page 1
    }

    searchAppointments(query) {
        console.log('Searching appointments with query:', query);
        const appointments = this.getStoredData('appointments') || [];
        const patients = this.getStoredData('patients') || [];
        
        // If query is empty, show all appointments
        if (!query.trim()) {
            console.log('Empty query, showing all appointments');
            this.currentAppointments = appointments;
            this.displayAppointments(appointments, 1);
            return;
        }
        
        const filteredAppointments = appointments.filter(appointment => {
            const patient = patients.find(p => p.id === appointment.patientId);
            const patientName = patient ? patient.name.toLowerCase() : '';
            const patientGender = patient ? (patient.gender ? patient.gender.toLowerCase() : '') : '';
            const treatment = appointment.treatment ? appointment.treatment.toLowerCase() : '';
            const date = appointment.date || '';
            const time = appointment.time || '';
            const status = appointment.status ? appointment.status.toLowerCase() : '';
            const priority = appointment.priority ? appointment.priority.toLowerCase() : '';
            
            const searchQuery = query.toLowerCase();
            
            return patientName.includes(searchQuery) ||
                   patientGender.includes(searchQuery) ||
                   treatment.includes(searchQuery) ||
                   date.includes(searchQuery) ||
                   time.includes(searchQuery) ||
                   status.includes(searchQuery) ||
                   priority.includes(searchQuery);
        });
        
        console.log('Found', filteredAppointments.length, 'appointments matching query');
        this.currentAppointments = filteredAppointments;
        this.displayAppointments(filteredAppointments, 1); // Always start from page 1
    }

    searchBilling(query) {
        console.log('Searching billing with query:', query);
        const invoices = this.getStoredData('invoices') || [];
        const patients = this.getStoredData('patients') || [];
        
        // If query is empty, show all invoices
        if (!query.trim()) {
            console.log('Empty query, showing all invoices');
            this.currentBilling = invoices;
            this.displayBilling(invoices, 1);
            return;
        }
        
        const filteredInvoices = invoices.filter(invoice => {
            const patient = patients.find(p => p.id === invoice.patientId);
            const patientName = patient ? patient.name.toLowerCase() : '';
            const patientGender = patient ? (patient.gender ? patient.gender.toLowerCase() : '') : '';
            const invoiceId = invoice.id ? invoice.id.toLowerCase() : '';
            const invoiceNumber = invoice.invoiceNumber ? invoice.invoiceNumber.toLowerCase() : '';
            const date = invoice.date || '';
            const status = invoice.status ? invoice.status.toLowerCase() : '';
            const paymentMethod = invoice.paymentMethod ? invoice.paymentMethod.toLowerCase() : '';
            const total = invoice.total ? invoice.total.toString() : '';
            
            const searchQuery = query.toLowerCase();
            
            return patientName.includes(searchQuery) ||
                   patientGender.includes(searchQuery) ||
                   invoiceId.includes(searchQuery) ||
                   invoiceNumber.includes(searchQuery) ||
                   date.includes(searchQuery) ||
                   status.includes(searchQuery) ||
                   paymentMethod.includes(searchQuery) ||
                   total.includes(searchQuery);
        });
        
        console.log('Found', filteredInvoices.length, 'invoices matching query');
        this.currentBilling = filteredInvoices;
        this.displayBilling(filteredInvoices, 1); // Always start from page 1
    }

    searchStaff(query) {
        console.log('Searching staff with query:', query);
        const staff = this.getStoredData('staff') || [];
        
        // If query is empty, show all staff
        if (!query.trim()) {
            console.log('Empty query, showing all staff');
            this.currentStaff = staff;
            this.displayStaff(staff, 1);
            return;
        }
        
        const searchQuery = query.toLowerCase().trim();
        console.log('Search query:', searchQuery);
        
        // First filter staff members that match the query
        const filteredStaff = staff.filter(staffMember => {
            const name = staffMember.name ? staffMember.name.toLowerCase() : '';
            const role = staffMember.role ? staffMember.role.toLowerCase() : '';
            const phone = staffMember.phone ? staffMember.phone.toLowerCase() : '';
            const joinDate = staffMember.joinDate || '';
            
            // Search in name, role, phone, and join date
            const matches = name.includes(searchQuery) ||
                   role.includes(searchQuery) ||
                   phone.includes(searchQuery) ||
                   joinDate.includes(searchQuery);
            
            if (matches) {
                console.log('Staff match found:', {
                    name: staffMember.name,
                    role: staffMember.role,
                    phone: staffMember.phone,
                    joinDate: staffMember.joinDate
                });
            }
            
            return matches;
        });
        
        // Sort the filtered results to prioritize better matches
        const sortedStaff = filteredStaff.sort((a, b) => {
            const aName = a.name ? a.name.toLowerCase() : '';
            const bName = b.name ? b.name.toLowerCase() : '';
            const aRole = a.role ? a.role.toLowerCase() : '';
            const bRole = b.role ? b.role.toLowerCase() : '';
            
            // Priority 1: Exact name match
            const aExactName = aName === searchQuery;
            const bExactName = bName === searchQuery;
            if (aExactName && !bExactName) return -1;
            if (!aExactName && bExactName) return 1;
            
            // Priority 2: Name starts with search query
            const aNameStartsWith = aName.startsWith(searchQuery);
            const bNameStartsWith = bName.startsWith(searchQuery);
            if (aNameStartsWith && !bNameStartsWith) return -1;
            if (!aNameStartsWith && bNameStartsWith) return 1;
            
            // Priority 3: Name contains search query (already filtered)
            // Priority 4: Role starts with search query
            const aRoleStartsWith = aRole.startsWith(searchQuery);
            const bRoleStartsWith = bRole.startsWith(searchQuery);
            if (aRoleStartsWith && !bRoleStartsWith) return -1;
            if (!aRoleStartsWith && bRoleStartsWith) return 1;
            
            // Priority 5: Alphabetical order by name
            return aName.localeCompare(bName);
        });
        
        console.log('Found', sortedStaff.length, 'staff members matching query');
        console.log('Sorted results:', sortedStaff.map(s => s.name));
        this.currentStaff = sortedStaff;
        this.displayStaff(sortedStaff, 1);
        
        // Show toast only if no results found and query is longer than 2 characters
        if (sortedStaff.length === 0 && searchQuery.length > 2) {
            this.showToast(`No staff members found for "${query}"`, 'info');
        }
    }

    searchSalary(query) {
        console.log('Searching salary with query:', query);
        const salaries = this.getStoredData('salaries') || [];
        const staff = this.getStoredData('staff') || [];
        
        // If query is empty, show all salaries
        if (!query.trim()) {
            console.log('Empty query, showing all salaries');
            this.currentSalaries = salaries;
            this.displaySalary(salaries, 1);
            return;
        }
        
        const filteredSalaries = salaries.filter(salary => {
            const staffMember = staff.find(s => s.id === salary.staffId);
            const staffName = staffMember ? staffMember.name.toLowerCase() : '';
            const month = salary.month || '';
            const amount = salary.amount ? salary.amount.toString() : '';
            const status = salary.status ? salary.status.toLowerCase() : '';
            
            const searchQuery = query.toLowerCase();
            
            return staffName.includes(searchQuery) ||
                   month.includes(searchQuery) ||
                   amount.includes(searchQuery) ||
                   status.includes(searchQuery);
        });
        
        console.log('Found', filteredSalaries.length, 'salary records matching query');
        this.currentSalaries = filteredSalaries;
        this.displaySalary(filteredSalaries, 1);
    }

    searchAttendance(query) {
        console.log('Searching attendance records for:', query);
        const attendance = this.getStoredData('attendance') || [];
        const staff = this.getStoredData('staff') || [];
        
        if (!query.trim()) {
            console.log('Empty query, showing all attendance records');
            this.currentAttendance = attendance;
            this.displayAttendance(attendance, 1);
            return;
        }
        
        const searchQuery = query.toLowerCase().trim();
        console.log('Search query:', searchQuery);
        
        // Filter attendance records based on search query
        const filteredAttendance = attendance.filter(record => {
            const staffMember = staff.find(s => s.id === record.staffId);
            const staffName = staffMember ? staffMember.name.toLowerCase() : '';
            const staffRole = staffMember ? staffMember.role.toLowerCase() : '';
            const status = record.status ? record.status.toLowerCase() : '';
            const date = record.date || '';
            const time = record.time || '';
            
            // Search in staff name, role, status, date, and time
            const matches = staffName.includes(searchQuery) ||
                           staffRole.includes(searchQuery) ||
                           status.includes(searchQuery) ||
                           date.includes(searchQuery) ||
                           time.includes(searchQuery);
            
            if (matches) {
                console.log('Match found:', {
                    staffName: staffMember?.name,
                    staffRole: staffMember?.role,
                    status: record.status,
                    date: record.date,
                    time: record.time
                });
            }
            
            return matches;
        });
        
        // Sort the filtered attendance records to prioritize better matches
        const sortedAttendance = filteredAttendance.sort((a, b) => {
            const staffMemberA = staff.find(s => s.id === a.staffId);
            const staffMemberB = staff.find(s => s.id === b.staffId);
            
            const aName = staffMemberA ? staffMemberA.name.toLowerCase() : '';
            const bName = staffMemberB ? staffMemberB.name.toLowerCase() : '';
            const aRole = staffMemberA ? staffMemberA.role.toLowerCase() : '';
            const bRole = staffMemberB ? staffMemberB.role.toLowerCase() : '';
            
            // Priority 1: Exact name match
            const aExactName = aName === searchQuery;
            const bExactName = bName === searchQuery;
            if (aExactName && !bExactName) return -1;
            if (!aExactName && bExactName) return 1;
            
            // Priority 2: Name starts with search query
            const aNameStartsWith = aName.startsWith(searchQuery);
            const bNameStartsWith = bName.startsWith(searchQuery);
            if (aNameStartsWith && !bNameStartsWith) return -1;
            if (!aNameStartsWith && bNameStartsWith) return 1;
            
            // Priority 3: Name contains search query (already filtered)
            // Priority 4: Role starts with search query
            const aRoleStartsWith = aRole.startsWith(searchQuery);
            const bRoleStartsWith = bRole.startsWith(searchQuery);
            if (aRoleStartsWith && !bRoleStartsWith) return -1;
            if (!aRoleStartsWith && bRoleStartsWith) return 1;
            
            // Priority 5: Most recent attendance first
            const aDate = new Date(a.date || 0);
            const bDate = new Date(b.date || 0);
            if (aDate > bDate) return -1;
            if (aDate < bDate) return 1;
            
            // Priority 6: Alphabetical order by name
            return aName.localeCompare(bName);
        });
        
        console.log('Search results:', sortedAttendance.length, 'records found');
        console.log('Sorted attendance results:', sortedAttendance.map(record => {
            const staffMember = staff.find(s => s.id === record.staffId);
            return staffMember?.name;
        }));
        this.currentAttendance = sortedAttendance;
        this.displayAttendance(sortedAttendance, 1);
        
        // Only show toast if there are no results (to avoid spam)
        if (sortedAttendance.length === 0 && searchQuery.length > 2) {
            this.showToast(`No attendance records found for "${query}"`, 'info');
        }
    }

    showAddAppointmentModal() {
        const modal = document.getElementById('appointment-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Set default date to today with proper formatting
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayString = `${year}-${month}-${day}`;
            
            const dateInput = document.getElementById('appointment-date');
            if (dateInput) {
                dateInput.value = todayString;
                dateInput.setAttribute('value', todayString);
            }
            
            // Set default time to next hour
            const nextHour = new Date();
            nextHour.setHours(nextHour.getHours() + 1);
            const timeString = nextHour.toTimeString().slice(0, 5);
            const timeInput = document.getElementById('appointment-time');
            if (timeInput) {
                timeInput.value = timeString;
                timeInput.setAttribute('value', timeString);
            }
            
            // Populate patient dropdown
            this.populatePatientDropdown();
            
            // Setup appointment status dropdown
            this.setupAppointmentStatusDropdown();
            
            // Setup dropdown click functionality for all select elements
            this.setupDropdownClicks();
            
            // Force a small delay to ensure the modal is fully rendered
            setTimeout(() => {
                if (dateInput) {
                    dateInput.value = todayString;
                    dateInput.setAttribute('value', todayString);
                    console.log('Date set to:', todayString);
                }
            }, 100);
            
            // Also set the date when the modal becomes visible
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (dateInput && dateInput.value !== todayString) {
                            dateInput.value = todayString;
                            dateInput.setAttribute('value', todayString);
                        }
                    }
                });
            });
            
            observer.observe(modal, { attributes: true });
            
            // Additional method to ensure date is set
            this.setAppointmentDateToToday();
            
            // Add event listener for date changes
            const appointmentDateInput = document.getElementById('appointment-date');
            if (appointmentDateInput) {
                appointmentDateInput.addEventListener('change', (e) => {
                    this.setSmartAppointmentTime(e.target.value);
                });
            }
            
            // Focus on first input field
            setTimeout(() => {
                const form = document.getElementById('appointment-form');
                if (form) {
                    const firstInput = form.querySelector('select, input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="time"], textarea');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }
            }, 100);
        }
    }

    setAppointmentDateToToday() {
        const dateInput = document.getElementById('appointment-date');
        if (dateInput) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayString = `${year}-${month}-${day}`;
            
            dateInput.value = todayString;
            dateInput.setAttribute('value', todayString);
            dateInput.defaultValue = todayString;
            
            console.log('setAppointmentDateToToday called, date set to:', todayString);
            
            // Auto-set smart time after date is set
            this.setSmartAppointmentTime(todayString);
        }
    }

    setSmartAppointmentTime(selectedDate) {
        const timeInput = document.getElementById('appointment-time');
        if (!timeInput) return;

        const appointments = this.getStoredData('appointments') || [];
        const durationInput = document.getElementById('appointment-duration');
        const duration = durationInput ? parseInt(durationInput.value) || 60 : 60; // Default 60 minutes

        // Get appointments for the selected date
        const dayAppointments = appointments.filter(apt => apt.date === selectedDate);
        
        if (dayAppointments.length === 0) {
            // No appointments for this day, set to 10:00 AM (business hours start)
            timeInput.value = '10:00';
            timeInput.setAttribute('value', '10:00');
            console.log('No appointments today, setting time to 10:00');
            return;
        }

        // Sort appointments by time
        dayAppointments.sort((a, b) => {
            const timeA = new Date(`2000-01-01T${a.time}`);
            const timeB = new Date(`2000-01-01T${b.time}`);
            return timeA - timeB;
        });

        // Find the best available time slot
        const businessStart = 10; // 10 AM
        const businessEnd = 18; // 6 PM
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        // Start checking from current time or business start, whichever is later
        let startHour = Math.max(businessStart, currentHour);
        if (startHour === currentHour && currentMinute > 0) {
            startHour++; // Move to next hour if we're past the current hour
        }

        // First, try to find gaps between existing appointments based on their durations
        let nextAvailableTime = null;
        
        for (let i = 0; i < dayAppointments.length; i++) {
            const currentApt = dayAppointments[i];
            const currentAptStart = new Date(`2000-01-01T${currentApt.time}`);
            const currentAptEnd = new Date(`2000-01-01T${currentApt.time}`);
            currentAptEnd.setMinutes(currentAptEnd.getMinutes() + (currentApt.duration || 60));
            
            // Add 15 minutes gap after current appointment
            const gapAfterCurrent = new Date(currentAptEnd);
            gapAfterCurrent.setMinutes(gapAfterCurrent.getMinutes() + 15);
            
            // Check if this slot fits before the next appointment
            if (i < dayAppointments.length - 1) {
                const nextApt = dayAppointments[i + 1];
                const nextAptStart = new Date(`2000-01-01T${nextApt.time}`);
                
                const proposedEnd = new Date(gapAfterCurrent);
                proposedEnd.setMinutes(proposedEnd.getMinutes() + duration);
                
                // Check if this slot fits between current and next appointment
                if (gapAfterCurrent < nextAptStart && proposedEnd <= nextAptStart) {
                    nextAvailableTime = gapAfterCurrent;
                    break;
                }
            } else {
                // This is the last appointment, check if we can fit after it
                const proposedEnd = new Date(gapAfterCurrent);
                proposedEnd.setMinutes(proposedEnd.getMinutes() + duration);
                
                if (proposedEnd.getHours() < businessEnd) {
                    nextAvailableTime = gapAfterCurrent;
                    break;
                }
            }
        }
        
        if (nextAvailableTime) {
            const timeString = nextAvailableTime.toTimeString().slice(0, 5);
            timeInput.value = timeString;
            timeInput.setAttribute('value', timeString);
            console.log(`Time set after appointment with duration consideration: ${timeString}`);
            return;
        }

        // If no gaps found, try hourly slots
        for (let hour = startHour; hour < businessEnd; hour++) {
            const proposedTime = `${String(hour).padStart(2, '0')}:00`;
            const proposedEnd = new Date(`2000-01-01T${proposedTime}`);
            proposedEnd.setMinutes(proposedEnd.getMinutes() + duration);

            // Check if this time slot conflicts with existing appointments
            let hasConflict = false;
            for (const apt of dayAppointments) {
                const aptStart = new Date(`2000-01-01T${apt.time}`);
                const aptEnd = new Date(`2000-01-01T${apt.time}`);
                aptEnd.setMinutes(aptEnd.getMinutes() + (apt.duration || 60));

                // Check for overlap
                if (proposedTime < aptEnd.toTimeString().slice(0, 5) && 
                    proposedEnd.toTimeString().slice(0, 5) > apt.time) {
                    hasConflict = true;
                    break;
                }
            }

            if (!hasConflict) {
                timeInput.value = proposedTime;
                timeInput.setAttribute('value', proposedTime);
                console.log(`Smart time set to: ${proposedTime}`);
                return;
            }
        }



        // If no slot found, try after the last appointment
        const lastAppointment = dayAppointments[dayAppointments.length - 1];
        const lastAppointmentTime = new Date(`2000-01-01T${lastAppointment.time}`);
        lastAppointmentTime.setMinutes(lastAppointmentTime.getMinutes() + (lastAppointment.duration || 60));
        
        const fallbackTime = new Date(lastAppointmentTime);
        fallbackTime.setMinutes(fallbackTime.getMinutes() + 15); // 15 min gap

        if (fallbackTime.getHours() < businessEnd) {
            const timeString = fallbackTime.toTimeString().slice(0, 5);
            timeInput.value = timeString;
            timeInput.setAttribute('value', timeString);
            console.log(`Time set after last appointment: ${timeString}`);
        } else {
            // If after business hours, set to next day 10 AM
            timeInput.value = '10:00';
            timeInput.setAttribute('value', '10:00');
            console.log('After business hours, setting to 10:00');
        }
    }

    setupDropdownClicks() {
        // Make all select elements clickable to show dropdown
        const selectElements = document.querySelectorAll('select');
        selectElements.forEach(select => {
            select.addEventListener('click', (e) => {
                e.preventDefault();
                // Trigger the native dropdown
                select.focus();
                // Create a click event to open the dropdown
                const event = new MouseEvent('mousedown');
                select.dispatchEvent(event);
            });
        });
    }

    showAddBillingModal() {
        if (window.billingManager) {
            window.billingManager.showForm();
        } else {
            // Fallback: directly show the modal
            const modal = document.getElementById('billing-modal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('active');
                
                // Set default date
                const dateInput = document.getElementById('billing-date');
                if (dateInput) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
                
                // Focus first input
                setTimeout(() => {
                    const firstInput = modal.querySelector('select, input');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }, 100);
            } else {
                this.showToast('Billing modal not found', 'error');
            }
        }
    }

    // Staff Section Methods
    showAddStaffModal() {
        const modal = document.getElementById('staff-modal');
        const modalTitle = document.getElementById('staff-modal-title');
        const form = document.getElementById('staff-form');
        
        if (!modal || !modalTitle || !form) {
            this.showToast('Staff modal elements not found', 'error');
            return;
        }
        
        // Reset form and set default values
        form.reset();
        modalTitle.textContent = 'Add New Staff';
        
        // Reset button text to default
        const submitButton = document.getElementById('staff-submit-btn');
        if (submitButton) {
            submitButton.textContent = 'Save Staff';
        }
        
        // Set default join date to today
        const joinDateInput = document.getElementById('staff-join-date');
        if (joinDateInput) {
            joinDateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Set default status to Active
        const statusInput = document.getElementById('staff-status');
        if (statusInput) {
            statusInput.value = 'Active';
        }
        
        // Show modal
        modal.classList.add('active');
        
        // Focus on first input
        const nameInput = document.getElementById('staff-name');
        if (nameInput) {
            nameInput.focus();
        }
        
        // Setup age calculation for staff
        this.setupStaffAgeCalculation();
    }

    closeStaffModal() {
        const modal = document.getElementById('staff-modal');
        const submitButton = document.getElementById('staff-submit-btn');
        if (modal) {
            modal.classList.remove('active');
        }
        // Reset button text to default
        if (submitButton) {
            submitButton.textContent = 'Save Staff';
        }
        // Reset edit mode flags
        this.isEditingStaff = false;
        this.editingStaffId = null;
    }

    setupStaffAgeCalculation() {
        const dobInput = document.getElementById('staff-dob');
        const ageInput = document.getElementById('staff-age');
        
        if (dobInput && ageInput) {
            dobInput.addEventListener('change', () => {
                if (dobInput.value) {
                    const birthDate = new Date(dobInput.value);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    
                    ageInput.value = age + ' years';
                } else {
                    ageInput.value = '';
                }
            });
        }
    }

    setupStaffStatusDropdown() {
        const statusInput = document.getElementById('staff-status');
        const statusOptions = document.getElementById('staff-status-options');
        
        if (!statusInput || !statusOptions) return;

        // Toggle dropdown on input click
        statusInput.addEventListener('click', (e) => {
            e.preventDefault();
            statusOptions.classList.toggle('show');
        });

        // Handle option selection
        statusOptions.querySelectorAll('.status-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const value = option.getAttribute('data-value');
                statusInput.value = value;
                statusOptions.classList.remove('show');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.status-input-container')) {
                statusOptions.classList.remove('show');
            }
        });
    }

    handleStaffFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Check if we're in edit mode
        if (this.isEditingStaff && this.editingStaffId) {
            // Update existing staff member
            const staff = this.getStoredData('staff') || [];
            const staffMember = staff.find(s => s.id === this.editingStaffId);
            
            if (!staffMember) {
                this.showToast('Staff member not found', 'error');
                return;
            }
            
            const updatedData = {
                ...staffMember,
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                gender: formData.get('gender'),
                role: formData.get('role'),
                qualification: formData.get('qualification'),
                experience: formData.get('experience'),
                jobTerm: formData.get('jobTerm'),
                joinDate: formData.get('joinDate'),
                status: formData.get('status').toLowerCase(),
                dob: formData.get('dob'),
                age: formData.get('age'),
                address: formData.get('address'),
                salary: parseFloat(formData.get('salary')) || 0,
                workingDays: formData.get('workingDays'),
                updatedAt: new Date().toISOString()
            };
            
            // Validate required fields
            if (!updatedData.name || !updatedData.phone || !updatedData.joinDate || !updatedData.role) {
                this.showToast('Please fill in all required fields', 'error');
                return;
            }
            
            // Validate email if provided
            if (updatedData.email && !this.validateEmail(updatedData.email)) {
                this.showToast('Please enter a valid email address', 'error');
                return;
            }
            
            // Validate phone number
            if (!this.validatePhone(updatedData.phone)) {
                this.showToast('Please enter a valid phone number', 'error');
                return;
            }
            
            // Update staff data
            const updatedStaff = staff.map(s => s.id === this.editingStaffId ? updatedData : s);
            this.setStoredData('staff', updatedStaff);
            
            this.closeStaffModal();
            this.showToast(`Staff member ${this.capitalizeWords(updatedData.name)} updated successfully`, 'success');
            
            // Get current active filter
            const activeFilterOption = document.querySelector('.dropdown-filter-option.active[data-type="staff"]');
            const currentFilter = activeFilterOption ? activeFilterOption.getAttribute('data-filter') : 'all';
            
            // Re-apply current filter to get updated list
            let filteredStaff = updatedStaff;
            
            switch (currentFilter) {
                case 'active':
                    filteredStaff = updatedStaff.filter(s => s.status === 'active' || s.status === undefined);
                    break;
                case 'leave':
                    filteredStaff = updatedStaff.filter(s => s.status === 'leave');
                    break;
                case 'left':
                    filteredStaff = updatedStaff.filter(s => s.status === 'left');
                    break;
                default:
                    filteredStaff = updatedStaff;
            }
            
            // Get current page from data attribute
            const staffList = document.getElementById('staff-list');
            let currentPage = 1;
            if (staffList) {
                const storedPage = staffList.getAttribute('data-current-page');
                if (storedPage) {
                    currentPage = parseInt(storedPage);
                }
            }
            
            // Update current staff list
            this.currentStaff = filteredStaff;
            
            // Refresh the display with current page
            this.displayStaff(filteredStaff, currentPage);
            
            // Reset edit mode
            this.isEditingStaff = false;
            this.editingStaffId = null;
            
            // Reset button text
            const submitButton = document.getElementById('staff-submit-btn');
            if (submitButton) {
                submitButton.textContent = 'Save Staff';
            }
            
            return;
        }
        
        // Add new staff member
        const staffData = {
            id: this.generateId('staff'),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            gender: formData.get('gender'),
            joinDate: formData.get('joinDate'),
            role: formData.get('role'),
            qualification: formData.get('qualification'),
            experience: formData.get('experience'),
            jobTerm: formData.get('jobTerm'),
            status: formData.get('status').toLowerCase(),
            dob: formData.get('dob'),
            age: formData.get('age'),
            address: formData.get('address'),
            salary: parseFloat(formData.get('salary')) || 0,
            workingDays: formData.get('workingDays'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!staffData.name || !staffData.phone || !staffData.joinDate || !staffData.role) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate email if provided
        if (staffData.email && !this.validateEmail(staffData.email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Validate phone number
        if (!this.validatePhone(staffData.phone)) {
            this.showToast('Please enter a valid phone number', 'error');
            return;
        }

        // Save staff member
        const staff = this.getStoredData('staff') || [];
        staff.push(staffData);
        this.setStoredData('staff', staff);

        // Close modal
        this.closeStaffModal();

        // Show success message
        this.showToast(`Staff member ${this.capitalizeWords(staffData.name)} added successfully`, 'success');

        // Update current staff and refresh staff display
        this.currentStaff = staff;
        this.displayStaff(staff, 1);
    }

    handleSalaryFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Collect allowances
        const allowances = [];
        const allowanceRows = document.querySelectorAll('.allowance-row');
        allowanceRows.forEach(row => {
            const name = row.querySelector('.allowance-name').value;
            const amount = parseFloat(row.querySelector('.allowance-amount').value) || 0;
            if (name && amount > 0) {
                allowances.push({ name, amount });
            }
        });
        

        
        const salaryData = {
            id: this.isEditingSalary ? this.editingSalaryId : this.generateId('salary'),
            staffId: formData.get('staffId'),
            month: formData.get('month'),
            year: formData.get('year'),
            paymentDate: formData.get('paymentDate'),
            department: formData.get('department'),
            workingDays: parseFloat(formData.get('workingDays')) || 0,
            presentDays: parseFloat(formData.get('presentDays')) || 0,
            leaveDays: parseFloat(formData.get('leaveDays')) || 0,
            absentDays: parseFloat(formData.get('absentDays')) || 0,
            lateDays: parseFloat(formData.get('lateDays')) || 0,
            halfLeaveDays: parseFloat(formData.get('halfLeaveDays')) || 0,
            bonusDays: parseFloat(formData.get('bonusDays')) || 0,
            encashmentDays: parseFloat(formData.get('encashmentDays')) || 0,
            basicSalary: parseFloat(formData.get('basicSalary')) || 0,
            totalAllowance: parseFloat(formData.get('totalAllowance')) || 0,
            grossSalary: parseFloat(formData.get('grossSalary')) || 0,
            totalDeduction: parseFloat(formData.get('totalDeduction')) || 0,
            grossPayable: parseFloat(formData.get('grossPayable')) || 0,
            netSalary: parseFloat(formData.get('netSalary')) || 0,
            amount: parseFloat(formData.get('netSalary')) || 0, // Add amount field for compatibility
            salaryFrom: formData.get('salaryFrom'),
            notes: formData.get('notes'),
            allowances: allowances,
            status: formData.get('status') || 'pending',
            createdAt: this.isEditingSalary ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('Salary data being saved:', salaryData);

        // Validate required fields
        if (!salaryData.staffId || !salaryData.month || !salaryData.year) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate net salary
        if (salaryData.netSalary <= 0) {
            this.showToast('Net salary must be greater than 0', 'error');
            return;
        }

        // Save salary record
        const salaries = this.getStoredData('salaries') || [];
        
        if (this.isEditingSalary) {
            // Update existing salary
            const index = salaries.findIndex(s => s.id === this.editingSalaryId);
            if (index !== -1) {
                // Preserve original creation date
                salaryData.createdAt = salaries[index].createdAt;
                salaries[index] = salaryData;
            }
        } else {
            // Add new salary
            salaries.push(salaryData);
        }
        
        this.setStoredData('salaries', salaries);

        // Show success message
        const action = this.isEditingSalary ? 'updated' : 'added';
        this.showToast(`Salary record ${action} successfully`, 'success');

        // Close modal
        this.closeSalaryModal();

        // Reset edit mode
        this.isEditingSalary = false;
        this.editingSalaryId = null;

        // Update current salaries and refresh display
        this.currentSalaries = salaries;
        this.displaySalary(salaries, 1);
    }

    handleSalarySaveAndPrint(e) {
        e.preventDefault();
        
        // First save the salary (reuse the existing logic)
        const form = document.getElementById('salary-form');
        if (form) {
            // Create a synthetic submit event
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
            
            // Wait a moment for the save to complete, then print
            setTimeout(() => {
                // Get the saved salary ID
                const staffId = document.getElementById('salary-staff').value;
                const month = document.getElementById('salary-month').value;
                const year = document.getElementById('salary-year').value;
                
                if (staffId && month && year) {
                    const salaries = this.getStoredData('salaries') || [];
                    const savedSalary = salaries.find(s => 
                        s.staffId === staffId && 
                        s.month === month && 
                        s.year === year
                    );
                    
                    if (savedSalary) {
                        // Print the salary
                        this.printSalary(savedSalary.id);
                    } else {
                        this.showToast('Salary saved but could not find for printing', 'warning');
                    }
                }
            }, 500);
        }
    }

    showAddSalaryModal() {
        const modal = document.getElementById('salary-modal');
        const staffNameSpan = document.getElementById('salary-staff-name');
        const currentDateSpan = document.getElementById('salary-current-date');
        
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Set staff name and current date
            if (staffNameSpan) staffNameSpan.textContent = 'Select Staff Member';
            if (currentDateSpan) {
                currentDateSpan.textContent = new Date().toLocaleDateString('en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                });
            }
            
            // Populate dropdowns
            this.populateSalaryStaffDropdown();
            this.populateSalaryYearDropdown();
            
            // Setup functionality
            this.setupCalculateSalaryButton();
            this.setupAddAllowanceButton();
            this.setupDropdownClicks();
            

            
            // Only reset form if not in edit mode
            if (!this.isEditingSalary) {
                // Reset form first
                this.resetSalaryForm();
                
                // Set default month to current month only for new records
                const monthInput = document.getElementById('salary-month');
                if (monthInput) {
                    const today = new Date();
                    monthInput.value = String(today.getMonth() + 1).padStart(2, '0');
                }
                
                // Set default payment date to today for new records
                const paymentDateInput = document.getElementById('salary-payment-date');
                if (paymentDateInput) {
                    const today = new Date();
                    paymentDateInput.value = today.toISOString().split('T')[0];
                }
                
                // Set default year to current year for new records
                const yearInput = document.getElementById('salary-year');
                if (yearInput) {
                    const currentYear = new Date().getFullYear();
                    yearInput.value = currentYear;
                }
            }
            
            // Ensure auto-pick works with a small delay
            setTimeout(() => {
                if (!this.isEditingSalary) {
                    // Double-check and set defaults if not already set
                    const paymentDateInput = document.getElementById('salary-payment-date');
                    if (paymentDateInput && !paymentDateInput.value) {
                        const today = new Date();
                        paymentDateInput.value = today.toISOString().split('T')[0];
                    }
                    
                    const yearInput = document.getElementById('salary-year');
                    if (yearInput && !yearInput.value) {
                        const currentYear = new Date().getFullYear();
                        yearInput.value = currentYear;
                    }
                }
            }, 100);
        }
    }

    showAddAttendanceModal(staffId = null) {
        const modal = document.getElementById('attendance-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Set default date to today (Pakistan time)
            const pakistanDate = this.getPakistanDate();
            const dateInput = document.getElementById('attendance-date');
            if (dateInput) {
                dateInput.value = pakistanDate;
            }
            
            // Set default time to current Pakistan time in 24-hour format for input
            const pakistanTime24 = this.getPakistanTime24Hour();
            const timeInput = document.getElementById('attendance-time');
            if (timeInput) {
                timeInput.value = pakistanTime24;
            }
            
            // Populate staff dropdown and auto-select staff member if provided
            this.populateAttendanceStaffDropdown(staffId);
            
            // Setup dropdown clicks
            this.setupDropdownClicks();
            
            // Auto-detect status based on time with a small delay to ensure DOM is ready
            setTimeout(() => {
                this.autoDetectAttendanceStatus();
            }, 200);
        }
    }

    autoDetectAttendanceStatus() {
        const timeInput = document.getElementById('attendance-time');
        const statusSelect = document.getElementById('attendance-status');
        
        if (timeInput && statusSelect) {
            const currentTime = timeInput.value;
            
            // Handle empty time value
            if (!currentTime) {
                return;
            }
            
            const [hours, minutes] = currentTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            
            // Get late threshold from staff settings
            const lateThreshold = this.getLateThresholdFromSettings();
            
            // Auto-select status based on time
            let autoStatus = 'present';
            if (totalMinutes > lateThreshold) {
                autoStatus = 'late';
            }
            
            statusSelect.value = autoStatus;
            
            // Update quick status button visual feedback
            this.updateQuickStatusButtons(autoStatus);
            
            // Update the auto-detection info display
                                const autoDetectionStatus = document.getElementById('auto-detection-status');
                    if (autoDetectionStatus) {
                        const time12Hour = this.formatTimeTo12Hour(currentTime);
                        const threshold12Hour = this.formatThresholdTo12Hour(lateThreshold);
                        const statusText = autoStatus === 'late' ? 'LATE' : 'PRESENT';
                        autoDetectionStatus.textContent = `Time: ${time12Hour} (PKT) | Threshold: ${threshold12Hour} | Status: ${statusText}`;
                    }
        }
    }

    updateQuickStatusButtons(activeStatus) {
        // Remove active class from all buttons
        document.querySelectorAll('.quick-status-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to the current status button
        const activeBtn = document.querySelector(`.quick-status-btn.${activeStatus}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    setQuickStatus(status) {
        const statusSelect = document.getElementById('attendance-status');
        if (statusSelect) {
            statusSelect.value = status;
            
            // Update visual feedback on quick status buttons
            this.updateQuickStatusButtons(status);
        }
    }

    closeAttendanceModal() {
        const modal = document.getElementById('attendance-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        
        // Reset form
        const form = document.getElementById('attendance-form');
        if (form) {
            form.reset();
        }
    }

    populateAttendanceStaffDropdown(staffId = null) {
        const staffSelect = document.getElementById('attendance-staff');
        if (!staffSelect) return;
        
        const staff = this.getStoredData('staff') || [];
        const activeStaff = staff.filter(s => s.status === 'active' || s.status === 'leave' || s.status === undefined);
        
        // Clear existing options except the first one
        staffSelect.innerHTML = '<option value="">Select Staff Member</option>';
        
        // Add staff options
        activeStaff.forEach(staffMember => {
            const option = document.createElement('option');
            option.value = staffMember.id;
            option.textContent = `${staffMember.name} (${staffMember.role})`;
            staffSelect.appendChild(option);
        });
        
        // Auto-select staff member if provided, otherwise first staff member
        if (staffId && activeStaff.find(s => s.id === staffId)) {
            staffSelect.value = staffId;
        } else if (activeStaff.length > 0) {
            staffSelect.value = activeStaff[0].id;
        }
    }

    handleAttendanceFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const attendanceData = {
            id: this.isEditingAttendance ? this.editingAttendanceId : this.generateId('attendance'),
            staffId: formData.get('staffId'),
            date: formData.get('date'),
            time: formData.get('time'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            createdAt: this.isEditingAttendance ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!attendanceData.staffId || !attendanceData.date || !attendanceData.time) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Save attendance record
        const attendance = this.getStoredData('attendance') || [];
        
        if (this.isEditingAttendance) {
            // Update existing attendance
            const index = attendance.findIndex(a => a.id === this.editingAttendanceId);
            if (index !== -1) {
                // Preserve original creation date
                attendanceData.createdAt = attendance[index].createdAt;
                attendance[index] = attendanceData;
            }
        } else {
            // Add new attendance
            attendance.push(attendanceData);
        }
        
        this.setStoredData('attendance', attendance);
        
        // Special handling for leave status - update staff status
        if (attendanceData.status === 'leave') {
            this.handleLeaveStatusFromAttendance(attendanceData.staffId);
        }

        // Show success message
        const action = this.isEditingAttendance ? 'updated' : 'added';
        this.showToast(`Attendance record ${action} successfully`, 'success');
        
        // Refresh displays
        this.currentAttendance = attendance;
        this.displayAttendance(attendance, 1);
        this.updateAttendanceStats(attendance);

        // Close modal
        this.closeAttendanceModal();

        // Reset edit mode
        this.isEditingAttendance = false;
        this.editingAttendanceId = null;
    }
    
    // Handle leave status from attendance form submission
    handleLeaveStatusFromAttendance(staffId) {
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (staffMember) {
            // Update staff status to leave
            staffMember.status = 'leave';
            staffMember.leaveStartDate = this.getPakistanDate();
            staffMember.updatedAt = new Date().toISOString();
            
            // Save updated staff data
            this.setStoredData('staff', staff);
            
            // Show additional success message
            this.showToast(`${staffMember.name} status updated to leave - checkout available`, 'info');
            
            // Refresh staff display if on staff management tab
            if (this.currentSection === 'patient-services' && 
                document.querySelector('.tab-content.active')?.id === 'staff-management') {
                const currentPage = parseInt(document.querySelector('#staff-list')?.getAttribute('data-current-page') || '1');
                this.displayStaff(staff, currentPage);
            }
        }
    }
    
    // Handle leave status from attendance form submission
    handleLeaveStatusFromAttendance(staffId) {
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (staffMember) {
            // Update staff status to leave
            staffMember.status = 'leave';
            staffMember.leaveStartDate = this.getPakistanDate();
            staffMember.updatedAt = new Date().toISOString();
            
            // Save updated staff data
            this.setStoredData('staff', staff);
            
            // Show additional success message
            this.showToast(`${staffMember.name} status updated to leave - checkout available`, 'info');
            
            // Refresh staff display if on staff management tab
            if (this.currentSection === 'patient-services' && 
                document.querySelector('.tab-content.active')?.id === 'staff-management') {
                const currentPage = parseInt(document.querySelector('#staff-list')?.getAttribute('data-current-page') || '1');
                this.displayStaff(staff, currentPage);
            }
        }
    }

    init() {
        this.setupEventListeners();
        this.setupMobileHandlers();
        this.loadInitialData();
        this.hideLoadingSpinner();
        
        // Initialize other modules
        if (typeof PatientsManager !== 'undefined') {
            window.patientsManager = new PatientsManager();
        }
        if (typeof AppointmentsManager !== 'undefined') {
            window.appointmentsManager = new AppointmentsManager();
        }
        if (typeof BillingManager !== 'undefined' && !window.billingManager) {
            console.log('Initializing BillingManager...');
            window.billingManager = new BillingManager();
            window.billingManager.init();
        }
        if (typeof AutomationManager !== 'undefined') {
            window.automationManager = new AutomationManager();
        }
        if (typeof FeedbackManager !== 'undefined') {
            window.feedbackManager = new FeedbackManager();
        }
        
        // Setup tooltips after everything is loaded
        setTimeout(() => {
            this.setupImportExportTooltips();
            
            // Set initial import/export button visibility
            const currentTab = this.currentTab;
            const dataType = currentTab.replace('-management', '');
            const currentFilter = this.getCurrentFilterForTab(dataType);
            this.toggleImportExportButtons(dataType, currentFilter);
            
            // Show import buttons by default since 'all' is the default filter
            const patientImportBtn = document.getElementById('import-patients-btn');
            const appointmentImportBtn = document.getElementById('import-appointments-btn');
            const billingImportBtn = document.getElementById('import-billing-btn');
            const staffImportBtn = document.getElementById('import-staff-btn');
            const attendanceImportBtn = document.getElementById('import-attendance-btn');
            const salaryImportBtn = document.getElementById('import-salary-btn');
            
            if (patientImportBtn) {
                patientImportBtn.classList.remove('hidden');
                patientImportBtn.classList.add('show-for-all');
                console.log('Showing patient import button on init (default "all" filter)');
            }
            
            if (appointmentImportBtn) {
                appointmentImportBtn.classList.remove('hidden');
                appointmentImportBtn.classList.add('show-for-all');
                console.log('Showing appointment import button on init (default "all" filter)');
            }
            
            if (billingImportBtn) {
                billingImportBtn.classList.remove('hidden');
                billingImportBtn.classList.add('show-for-all');
                console.log('Showing billing import button on init (default "all" filter)');
            }
            
            if (staffImportBtn) {
                staffImportBtn.classList.remove('hidden');
                staffImportBtn.classList.add('show-for-all');
                console.log('Showing staff import button on init (default "all" filter)');
            }
            
            if (attendanceImportBtn) {
                attendanceImportBtn.classList.remove('hidden');
                attendanceImportBtn.classList.add('show-for-all');
                console.log('Showing attendance import button on init (default "all" filter)');
            }
            
            if (salaryImportBtn) {
                salaryImportBtn.classList.remove('hidden');
                salaryImportBtn.classList.add('show-for-all');
                console.log('Showing salary import button on init (default "all" filter)');
            }
        }, 100);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });

        // Dropdown filters
        this.setupDropdownFilters();

        // Patient form functionality
        this.setupPatientForm();

        // Import/Export buttons
        document.getElementById('import-patients-btn')?.addEventListener('click', () => this.importPatients());
        document.getElementById('export-patients-btn')?.addEventListener('click', () => this.exportPatients());
        document.getElementById('import-appointments-btn')?.addEventListener('click', () => this.importAppointments());
        document.getElementById('export-appointments-btn')?.addEventListener('click', () => this.exportAppointments());
        document.getElementById('import-billing-btn')?.addEventListener('click', () => this.importBilling());
        document.getElementById('export-billing-btn')?.addEventListener('click', () => this.exportBilling());

        // Add new buttons
        document.getElementById('add-new-patient-btn')?.addEventListener('click', () => {
            this.showAddPatientModal();
            // Double-check date is set after modal opens
            setTimeout(() => {
                const addDateInput = document.getElementById('patient-add-date');
                if (addDateInput && !addDateInput.value) {
                    const today = new Date().toISOString().split('T')[0];
                    addDateInput.value = today;
                    addDateInput.setAttribute('readonly', true);
                }
            }, 10);
        });
        document.getElementById('add-new-appointment-btn')?.addEventListener('click', () => {
            this.showAddAppointmentModal();
            // Ensure appointment date is set after modal opens
            setTimeout(() => {
                this.setAppointmentDateToToday();
            }, 50);
        });
        document.getElementById('add-new-billing-btn')?.addEventListener('click', () => this.showAddBillingModal());

        // Staff section buttons
        const addNewStaffBtn = document.getElementById('add-new-staff-btn');
        if (addNewStaffBtn) {
            addNewStaffBtn.addEventListener('click', () => {
                console.log('Add New Staff button clicked');
                this.showAddStaffModal();
            });
        } else {
            console.log('Add New Staff button not found');
        }
        document.getElementById('add-new-salary-btn')?.addEventListener('click', () => {
            this.showAddSalaryModal();
        });
        
        document.getElementById('staff-header-settings-btn')?.addEventListener('click', () => {
            this.showStaffSettingsModal();
        });

        // Staff import/export buttons
        document.getElementById('import-staff-btn')?.addEventListener('click', () => this.importStaff());
        document.getElementById('export-staff-btn')?.addEventListener('click', () => this.exportStaff());
        document.getElementById('import-salary-btn')?.addEventListener('click', () => this.importSalary());
        document.getElementById('export-salary-btn')?.addEventListener('click', () => this.exportSalary());
        document.getElementById('import-attendance-btn')?.addEventListener('click', () => this.importAttendance());
        document.getElementById('export-attendance-btn')?.addEventListener('click', () => this.exportAttendance());

        // Modal close buttons
        document.getElementById('patient-modal-close')?.addEventListener('click', () => this.closePatientModal());
        document.getElementById('patient-cancel-btn')?.addEventListener('click', () => this.closePatientModal());
        document.getElementById('appointment-modal-close')?.addEventListener('click', () => this.closeAppointmentModal());
        document.getElementById('appointment-cancel-btn')?.addEventListener('click', () => this.closeAppointmentModal());
        document.getElementById('staff-modal-close')?.addEventListener('click', () => this.closeStaffModal());
        document.getElementById('staff-cancel-btn')?.addEventListener('click', () => this.closeStaffModal());
        document.getElementById('salary-modal-close')?.addEventListener('click', () => this.closeSalaryModal());
        document.getElementById('salary-cancel-btn')?.addEventListener('click', () => this.closeSalaryModal());
        document.getElementById('attendance-modal-close')?.addEventListener('click', () => this.closeAttendanceModal());
        document.getElementById('attendance-cancel-btn')?.addEventListener('click', () => this.closeAttendanceModal());
        document.getElementById('staff-settings-close')?.addEventListener('click', () => this.closeStaffSettingsModal());
        document.getElementById('staff-settings-cancel')?.addEventListener('click', () => this.closeStaffSettingsModal());

        // Search functionality
        document.getElementById('patient-search')?.addEventListener('input', (e) => this.searchPatients(e.target.value));
        document.getElementById('appointment-search')?.addEventListener('input', (e) => this.searchAppointments(e.target.value));
        document.getElementById('billing-search')?.addEventListener('input', (e) => this.searchBilling(e.target.value));
        document.getElementById('staff-search')?.addEventListener('input', (e) => this.searchStaff(e.target.value));
        document.getElementById('salary-search')?.addEventListener('input', (e) => this.searchSalary(e.target.value));
        document.getElementById('attendance-search')?.addEventListener('input', (e) => this.searchAttendance(e.target.value));

        // Mobile menu toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => this.toggleSidebar());

        // Sidebar close button
        document.getElementById('sidebar-close')?.addEventListener('click', () => this.closeSidebar());

        // Sidebar overlay
        document.getElementById('sidebar-overlay')?.addEventListener('click', () => this.closeSidebar());

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sidebar') && !e.target.closest('#sidebar-toggle')) {
                this.closeSidebar();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        // Staff form submission
        document.getElementById('staff-form')?.addEventListener('submit', (e) => this.handleStaffFormSubmit(e));
        
        // Salary form submission
        document.getElementById('salary-form')?.addEventListener('submit', (e) => this.handleSalaryFormSubmit(e));
        
        // Salary save & print button
        document.getElementById('salary-save-print-btn')?.addEventListener('click', (e) => this.handleSalarySaveAndPrint(e));
        
        // Attendance form submission
        document.getElementById('attendance-form')?.addEventListener('submit', (e) => this.handleAttendanceFormSubmit(e));
        
        // Staff settings form submission
        document.getElementById('staff-settings-form')?.addEventListener('submit', (e) => this.handleStaffSettingsSubmit(e));
        
        // Attendance date filter
        document.getElementById('attendance-date-filter')?.addEventListener('change', (e) => this.filterAttendanceByDate(e.target.value));
        
        // Attendance time change listener for auto-status detection
        document.getElementById('attendance-time')?.addEventListener('change', () => this.autoDetectAttendanceStatus());

        // Setup staff status dropdown
        this.setupStaffStatusDropdown();

        // Event delegation for staff buttons (in case they're loaded dynamically)
        document.addEventListener('click', (e) => {
            if (e.target.closest('#add-new-staff-btn')) {
                console.log('Add New Staff button clicked (delegated)');
                this.showAddStaffModal();
            }
        });



        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    setupImportExportTooltips() {
        console.log('Setting up import/export tooltips...');
        
        // Setup tooltips for import/export buttons
        const importButtons = [
            'import-patients-btn',
            'import-appointments-btn', 
            'import-billing-btn'
        ];
        
        const exportButtons = [
            'export-patients-btn',
            'export-appointments-btn',
            'export-billing-btn'
        ];
        
        // Add tooltip functionality to import buttons
        importButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            console.log(`Looking for button: ${btnId}`, btn);
            if (btn) {
                // Add title attribute as fallback
                const tabShortForm = this.getCurrentTabShortForm();
                btn.title = `Import ${tabShortForm}`;
                
                btn.addEventListener('mouseenter', (e) => {
                    console.log('Import button hovered:', btnId);
                    this.showImportTooltip(btn);
                });
                btn.addEventListener('mouseleave', (e) => {
                    console.log('Import button left:', btnId);
                    this.hideTooltip();
                });
            }
        });
        
        // Add tooltip functionality to export buttons
        exportButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            console.log(`Looking for button: ${btnId}`, btn);
            if (btn) {
                // Add title attribute as fallback
                if (btnId === 'export-patients-btn') {
                    // Always show "Export All Patients" for patient export button
                    btn.title = 'Export All Patients';
                } else {
                    // For other export buttons, use the current tab short form
                    const tabShortForm = this.getCurrentTabShortForm();
                    btn.title = `Export ${tabShortForm}`;
                }
                
                btn.addEventListener('mouseenter', (e) => {
                    console.log('Export button hovered:', btnId);
                    this.showExportTooltip(btn);
                });
                btn.addEventListener('mouseleave', (e) => {
                    console.log('Export button left:', btnId);
                    this.hideTooltip();
                });
            }
        });
        
        console.log('Import/export tooltips setup complete');
    }

    setupDropdownFilters() {
        // Setup dropdown filter functionality
        const dropdownFilters = [
            'patient-filter-dropdown',
            'appointment-filter-dropdown',
            'appointment-status-filter-dropdown',
            'billing-filter-dropdown',
            'staff-filter-dropdown',
            'salary-filter-dropdown',
            'attendance-filter-dropdown'
        ];

        dropdownFilters.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;

            const trigger = dropdown.querySelector('.dropdown-filter-trigger');
            const menu = dropdown.querySelector('.dropdown-filter-menu');
            const options = dropdown.querySelectorAll('.dropdown-filter-option');

            // Toggle dropdown on trigger click
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown-filter-menu.show').forEach(openMenu => {
                    if (openMenu !== menu) {
                        openMenu.classList.remove('show');
                        openMenu.closest('.dropdown-filter').querySelector('.dropdown-filter-trigger').classList.remove('active');
                    }
                });

                // Toggle current dropdown
                menu.classList.toggle('show');
                trigger.classList.toggle('active');
            });

            // Handle option selection
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const filterType = option.getAttribute('data-filter');
                    const dataType = option.getAttribute('data-type');
                    const filterText = option.textContent.trim();

                    // Update trigger text and icon
                    const triggerIcon = trigger.querySelector('i:first-child');
                    const triggerText = trigger.querySelector('.filter-text');
                    const optionIcon = option.querySelector('i');

                    if (triggerIcon && optionIcon) {
                        triggerIcon.className = optionIcon.className;
                    }
                    if (triggerText) {
                        triggerText.textContent = filterText;
                    }

                    // Update active states
                    options.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');

                    // Add selection class to trigger to maintain primary color
                    trigger.classList.add('has-selection');

                    // Close dropdown
                    menu.classList.remove('show');
                    trigger.classList.remove('active');

                    // Handle filter
                    this.handleFilter(filterType, dataType);
                });
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-filter')) {
                document.querySelectorAll('.dropdown-filter-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                    menu.closest('.dropdown-filter').querySelector('.dropdown-filter-trigger').classList.remove('active');
                });
            }
        });

        // Close dropdowns on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.dropdown-filter-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                    menu.closest('.dropdown-filter').querySelector('.dropdown-filter-trigger').classList.remove('active');
                });
            }
        });
    }

    getTabShortForm(tabName, filterType = null) {
        const shortForms = {
            'patient-management': {
                'all': 'AP', // All Patients
                'active': 'AP', // Active Patients
                'inactive': 'IP' // Inactive Patients
            },
            'appointment-management': {
                'all': 'AM', // All Appointments
                'today': 'TA', // Today's Appointments
                'week': 'WA', // Week's Appointments
                'month': 'MA' // Month's Appointments
            },
            'appointment-status': {
                'all': 'AS', // All Status
                'scheduled': 'ES', // Scheduled Appointments
                'confirmed': 'EC', // Confirmed Appointments
                'completed': 'ECP', // Completed Appointments
                'cancelled': 'ECAN' // Cancelled Appointments
            },
            'billing-management': {
                'all': 'BM', // All Billing
                'paid': 'PB', // Paid Billing
                'unpaid': 'UB' // Unpaid Billing
            }
        };
        
        if (filterType && shortForms[tabName] && shortForms[tabName][filterType]) {
            return shortForms[tabName][filterType];
        }
        
        // Default to 'all' filter for the tab
        return shortForms[tabName]?.['all'] || 'AP';
    }

    getCurrentTabShortForm() {
        // For appointment tab, check both time and status filters
        if (this.currentTab === 'appointment-management') {
            const activeTimeFilter = document.querySelector('[data-type="appointment"].dropdown-filter-option.active');
            const activeStatusFilter = document.querySelector('[data-type="appointment-status"].dropdown-filter-option.active');
            
            if (activeTimeFilter && activeStatusFilter) {
                const timeFilter = activeTimeFilter.getAttribute('data-filter');
                const statusFilter = activeStatusFilter.getAttribute('data-filter');
                
                // Show only the status filter short form for tooltip
                const statusShort = this.getTabShortForm('appointment-status', statusFilter);
                return statusShort;
            } else if (activeTimeFilter) {
                return this.getTabShortForm('appointment-management', activeTimeFilter.getAttribute('data-filter'));
            } else if (activeStatusFilter) {
                return this.getTabShortForm('appointment-status', activeStatusFilter.getAttribute('data-filter'));
            }
        }
        
        return this.getTabShortForm(this.currentTab, this.currentFilter);
    }

    showImportTooltip(button) {
        console.log('Showing import tooltip for current tab:', this.currentTab);
        const tabShortForm = this.getCurrentTabShortForm();
        const tooltipText = `Import ${tabShortForm}`;
        console.log('Tooltip text:', tooltipText);
        this.showTooltip(button, tooltipText);
    }

    showExportTooltip(button) {
        console.log('Showing export tooltip for current tab:', this.currentTab);
        const tabShortForm = this.getCurrentTabShortForm();
        const tooltipText = `Export ${tabShortForm}`;
        console.log('Tooltip text:', tooltipText);
        this.showTooltip(button, tooltipText);
    }

    showTooltip(button, text) {
        console.log('Creating tooltip with text:', text);
        
        // Remove existing tooltip
        this.hideTooltip();
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.id = 'import-export-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: var(--gray-800);
            color: var(--white);
            padding: 0.5rem 0.75rem;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            font-weight: 500;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--gray-700);
        `;
        
        // Position tooltip above the button
        const rect = button.getBoundingClientRect();
        console.log('Button position:', rect);
        
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        
        // Add to body
        document.body.appendChild(tooltip);
        console.log('Tooltip added to body');
        
        // Adjust position after rendering
        setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
            tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
            console.log('Tooltip positioned at:', tooltipRect);
        }, 0);
    }

    hideTooltip() {
        const existingTooltip = document.getElementById('import-export-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    updateTooltips() {
        console.log('Updating tooltips for current tab:', this.currentTab);
        const tabShortForm = this.getCurrentTabShortForm();
        
        // Update import buttons
        const importButtons = [
            'import-patients-btn',
            'import-appointments-btn', 
            'import-billing-btn'
        ];
        
        importButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.title = `Import ${tabShortForm}`;
            }
        });
        
        // Update export buttons
        const exportButtons = [
            'export-patients-btn',
            'export-appointments-btn',
            'export-billing-btn'
        ];
        
        exportButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                if (btnId === 'export-patients-btn') {
                    // Always show "Export All Patients" for patient export button
                    btn.title = 'Export All Patients';
                } else {
                    // For other export buttons, use the current tab short form
                    btn.title = `Export ${tabShortForm}`;
                }
            }
        });
    }

    toggleImportExportButtons(dataType, filterType) {
        console.log('Toggle buttons called:', dataType, filterType);
        
        // Define which filters should hide import/export buttons
        const hideButtonsForFilters = {
            'patient': ['active', 'inactive'], // Hide import on 'active' and 'inactive' patient filters only
            'appointment': ['all'],
            'billing': ['all'],
            'staff': ['active', 'leave', 'left'], // For staff, hide on 'active', 'leave', and 'left' filters
            'attendance': ['today', 'week', 'month'], // For attendance, hide on 'today', 'week', and 'month' filters
            'salary': ['paid', 'pending'] // For salary, hide on 'paid' and 'pending' filters
        };

        // Get the buttons for this data type
        const importBtn = document.getElementById(`import-${dataType}-btn`);
        const exportBtn = document.getElementById(`export-${dataType}-btn`);

        console.log('Found buttons:', importBtn, exportBtn);

        if (!importBtn || !exportBtn) {
            console.log('Buttons not found for:', dataType);
            return;
        }

        // Check if current filter should hide buttons
        const shouldHide = hideButtonsForFilters[dataType] && hideButtonsForFilters[dataType].includes(filterType);
        
        console.log('Should hide buttons:', shouldHide);
        console.log('Current filter type:', filterType);
        console.log('Available filters for this type:', hideButtonsForFilters[dataType]);

        if (shouldHide) {
            // Hide import button, keep export button visible
            importBtn.classList.add('hidden');
            importBtn.style.visibility = 'hidden';
            importBtn.style.display = 'none';
            importBtn.style.opacity = '0';
            importBtn.style.pointerEvents = 'none';
            exportBtn.classList.remove('hidden');
            exportBtn.style.visibility = 'visible';
            exportBtn.style.display = 'inline-flex';
            exportBtn.style.opacity = '1';
            exportBtn.style.pointerEvents = 'auto';
            console.log('Hiding import button for:', dataType, filterType);
        } else {
            // Show both buttons
            importBtn.classList.remove('hidden');
            importBtn.style.visibility = 'visible';
            importBtn.style.display = 'inline-flex';
            importBtn.style.opacity = '1';
            importBtn.style.pointerEvents = 'auto';
            exportBtn.classList.remove('hidden');
            exportBtn.style.visibility = 'visible';
            exportBtn.style.display = 'inline-flex';
            exportBtn.style.opacity = '1';
            exportBtn.style.pointerEvents = 'auto';
            console.log('Showing both buttons for:', dataType, filterType);
        }
    }

    getCurrentFilterForTab(dataType) {
        // Get the currently active filter for the given data type
        const activeFilterOption = document.querySelector(`[data-type="${dataType}"].dropdown-filter-option.active`);
        if (activeFilterOption) {
            return activeFilterOption.getAttribute('data-filter');
        }
        
        // Default filters for each tab
        const defaultFilters = {
            'patient': 'all',
            'appointment': 'all',
            'billing': 'all',
            'staff': 'active',
            'attendance': 'today',
            'salary': 'all'
        };
        
        return defaultFilters[dataType] || 'all';
    }

    setupPatientForm() {
        const form = document.getElementById('patient-form');
        const dobInput = document.getElementById('patient-dob');
        const ageInput = document.getElementById('patient-age');
        const addDateInput = document.getElementById('patient-add-date');
        


        // Set current date immediately when form is loaded
        if (addDateInput) {
            const today = new Date().toISOString().split('T')[0];
            addDateInput.value = today;
            addDateInput.setAttribute('readonly', true);
            
            // Add calendar functionality to add date input
            addDateInput.style.backgroundImage = "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3e%3crect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"%3e%3c/rect%3e%3cline x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"%3e%3c/line%3e%3cline x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"%3e%3c/line%3e%3cline x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"%3e%3c/line%3e%3c/svg%3e')";
            addDateInput.style.backgroundRepeat = "no-repeat";
            addDateInput.style.backgroundPosition = "right 0.75rem center";
            addDateInput.style.backgroundSize = "1rem";
            addDateInput.style.paddingRight = "2.5rem";
            addDateInput.style.cursor = "pointer";
            
            addDateInput.addEventListener('click', () => {
                this.showCalendar(addDateInput, addDateInput.value);
            });
        }

        // Calculate age when date of birth changes and add calendar functionality
        if (dobInput && ageInput) {
            dobInput.setAttribute('readonly', true);
            
            // Add calendar icon and styling
            dobInput.style.backgroundImage = "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3e%3crect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"%3e%3c/rect%3e%3cline x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"%3e%3c/line%3e%3cline x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"%3e%3c/line%3e%3cline x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"%3e%3c/line%3e%3c/svg%3e')";
            dobInput.style.backgroundRepeat = "no-repeat";
            dobInput.style.backgroundPosition = "right 0.75rem center";
            dobInput.style.backgroundSize = "1rem";
            dobInput.style.paddingRight = "2.5rem";
            dobInput.style.cursor = "pointer";
            
            dobInput.addEventListener('click', () => {
                this.showCalendar(dobInput, dobInput.value);
            });
            
            dobInput.addEventListener('change', () => {
                const age = this.calculateAge(dobInput.value);
                ageInput.value = age;
            });
        }

        // Handle form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePatientFormSubmit();
            });
        }
    }
    
    setupAppointmentStatusDropdown() {
        const statusInput = document.getElementById('appointment-status');
        const statusOptions = document.getElementById('appointment-status-options');
        const statusOptionElements = document.querySelectorAll('#appointment-status-options .status-option');

        if (statusInput && statusOptions) {
            // Toggle dropdown when clicking status input
            statusInput.addEventListener('click', (e) => {
                e.preventDefault();
                statusOptions.classList.toggle('show');
                this.updateAppointmentStatusOptionActive();
            });

            // Handle option selection
            statusOptionElements.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.getAttribute('data-value');
                    statusInput.value = value;
                    statusOptions.classList.remove('show');
                    this.updateAppointmentStatusOptionActive();
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.status-input-container')) {
                    statusOptions.classList.remove('show');
                }
            });
        }
    }
    
    updateAppointmentStatusOptionActive() {
        const statusInput = document.getElementById('appointment-status');
        const statusOptionElements = document.querySelectorAll('#appointment-status-options .status-option');
        
        if (statusInput) {
            const currentValue = statusInput.value;
            
            statusOptionElements.forEach(option => {
                option.classList.remove('active');
                if (option.getAttribute('data-value') === currentValue) {
                    option.classList.add('active');
                }
            });
        }
    }
    
    populatePatientDropdown() {
        const patientSelect = document.getElementById('appointment-patient');
        const patients = (this.getStoredData('patients') || []).filter(p => (p.status || '').toLowerCase() === 'active');
        
        if (patientSelect) {
            // Clear existing options except the first one
            patientSelect.innerHTML = '<option value="">Select Patient</option>';
            
            // Add patient options
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.name} - ${patient.phone}`;
                patientSelect.appendChild(option);
            });
        }
    }

    showAddPatientModal() {
        const modal = document.getElementById('patient-modal');
        const form = document.getElementById('patient-form');
        const title = document.getElementById('patient-modal-title');
        
        // Show modal instantly (no animation)
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // Set title and button text
        title.textContent = 'Add New Patient';
        const submitBtn = document.querySelector('#patient-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Save Patient';
        }
        
        // Reset form AFTER showing modal
        form.reset();
        form.removeAttribute('data-edit-id');
        
        // Auto-fill current date immediately when form opens
        setTimeout(() => {
            const addDateInput = document.getElementById('patient-add-date');
            if (addDateInput) {
                const today = new Date().toISOString().split('T')[0];
                addDateInput.value = today;
                addDateInput.setAttribute('readonly', true);
            }
            
                    // Set default status to active
        const statusInput = document.getElementById('patient-status');
        if (statusInput) {
            statusInput.value = 'Active';
            this.updateStatusOptionActive();
        }
            
            // Clear age
            const ageInput = document.getElementById('patient-age');
            if (ageInput) {
                ageInput.value = '';
            }
            
            // Focus on first input field
            const firstInput = form.querySelector('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    updateStatusOptionActive() {
        const statusInput = document.getElementById('patient-status');
        const statusOptionElements = document.querySelectorAll('.status-option');
        
        if (statusInput) {
            const currentValue = statusInput.value;
            
            statusOptionElements.forEach(option => {
                option.classList.remove('active');
                if (option.getAttribute('data-value') === currentValue) {
                    option.classList.add('active');
                }
            });
        }
    }

    closePatientModal() {
        const modal = document.getElementById('patient-modal');
        // Close modal instantly (no animation)
        modal.style.display = 'none';
        modal.classList.remove('active');
        
        // Close any open calendar dropdowns
        const calendarDropdown = document.querySelector('.calendar-dropdown');
        if (calendarDropdown) {
            calendarDropdown.remove();
        }
    }
    
    closeAppointmentModal() {
        const modal = document.getElementById('appointment-modal');
        // Close modal instantly (no animation)
        modal.style.display = 'none';
        modal.classList.remove('active');
        
        // Reset form
        const form = document.getElementById('appointment-form');
        if (form) {
            form.reset();
            form.removeAttribute('data-edit-id');
        }
    }

    handlePatientFormSubmit() {
        // Prevent multiple submissions with stronger lock
        if (this.formSubmissionLock) {
            console.log('Form submission blocked - already in progress');
            return;
        }
        this.formSubmissionLock = true;

        const form = document.getElementById('patient-form');
        const formData = new FormData(form);
        
        const patientData = {
            id: form.dataset.editId || this.generateId('patient'),
            name: formData.get('name'),
            email: formData.get('email'),
            dob: formData.get('dob'),
            gender: formData.get('gender'),
            age: formData.get('dob') ? this.calculateAge(formData.get('dob')) : 'N/A',
            phone: formData.get('phone'),
            addDate: formData.get('addDate'),
            status: formData.get('status') || 'Active', // Get status from form
            address: formData.get('address'),
            medicalHistory: formData.get('medicalHistory'),
            createdAt: form.dataset.editId ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!patientData.name || !patientData.dob || !patientData.gender || !patientData.phone || !patientData.addDate) {
            this.showToast('Please fill in all required fields', 'error');
            this.formSubmissionLock = false;
            return;
        }

        const patients = this.getStoredData('patients') || [];
        
        if (form.dataset.editId) {
            // Update existing patient
            const index = patients.findIndex(p => p.id === form.dataset.editId);
            if (index !== -1) {
                patients[index] = { ...patients[index], ...patientData };
                this.showToast('Patient updated successfully', 'success');
            }
        } else {
            // Check if patient already exists (by phone number)
            const existingPatient = patients.find(p => p.phone === patientData.phone);
            if (existingPatient) {
                this.showToast('Patient with this phone number already exists', 'error');
                this.formSubmissionLock = false;
                return;
            }
            
            // Add new patient
            patients.push(patientData);
            this.showToast('Patient added successfully', 'success');
        }

        this.setStoredData('patients', patients);
        this.closePatientModal();
        
        // Refresh the display with current filter and maintain current page
        if (document.getElementById('patient-management').classList.contains('active')) {
            // Get current active filter option to re-apply the filter
            const activeFilterOption = document.querySelector('[data-type="patient"].dropdown-filter-option.active');
            let currentFilter = 'all'; // default to all
            
            if (activeFilterOption) {
                currentFilter = activeFilterOption.getAttribute('data-filter');
            }
            
            // Re-apply the current filter to refresh the display while maintaining current page
            this.filterPatients(currentFilter, false, true);
        }

        // Reset submission lock after a delay
        setTimeout(() => {
            this.formSubmissionLock = false;
        }, 2000);
    }

    setupMobileHandlers() {
        // Handle mobile-specific interactions
        if (this.isMobile) {
            document.body.classList.add('mobile');
        }
    }

    showSection(sectionName) {
        console.log('Showing section:', sectionName);
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            
            // Trigger animation
            setTimeout(() => {
                targetSection.style.opacity = '1';
            }, 10);
        }
        
        // Update navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Update page title
        const titles = {
            dashboard: 'Dashboard Overview',
            'patient-services': 'Patient Services',
            staff: 'Staff Management',
            automation: 'Automation Settings',
            feedback: 'Patient Feedback'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[sectionName] || 'Dashboard';
        }
        
        // Close sidebar on mobile after navigation
        if (this.isMobile) {
            this.closeSidebar();
        }
        
        // Update current section
        this.currentSection = sectionName;
        
        // Trigger section-specific initialization
        this.initializeSection(sectionName);
    }

    showTab(tabName) {
        console.log('Showing tab:', tabName);
        
        // Update current tab
        this.currentTab = tabName;
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show target tab content
        const targetContent = document.getElementById(tabName);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Activate target tab button
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // Initialize tab-specific functionality
        this.initializeTab(tabName);
        
        // Set initial import/export button visibility based on current filter
        const dataType = tabName.replace('-management', '');
        const currentFilter = this.getCurrentFilterForTab(dataType);
        this.toggleImportExportButtons(dataType, currentFilter);
        
        // Update tooltips for new tab
        this.updateTooltips();
    }

    initializeSection(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'patient-services':
                // Initialize the first tab by default
                this.showTab('patient-management');
                break;
            case 'staff':
                // Initialize the first tab by default
                this.showTab('staff-management');
                break;
            case 'automation':
                if (window.automationManager) {
                    window.automationManager.loadSettings();
                }
                break;
            case 'feedback':
                if (window.feedbackManager) {
                    window.feedbackManager.loadFeedback();
                }
                break;
        }
    }

    initializeTab(tabName) {
        switch (tabName) {
            case 'patient-management':
                // Load and display all patients by default in custom style
                const patients = this.getStoredData('patients') || [];
                console.log('Initializing patient management tab with', patients.length, 'patients');
                console.log('Patients:', patients);
                this.currentPatients = patients;
                this.displayPatients(patients, 1);
                
                // Force toggle buttons for patient tab and show import button for 'all' filter
                setTimeout(() => {
                    this.toggleImportExportButtons('patient', 'all');
                    const patientImportBtn = document.getElementById('import-patients-btn');
                    if (patientImportBtn) {
                        patientImportBtn.classList.remove('hidden');
                        patientImportBtn.classList.add('show-for-all');
                    }
                }, 100);
                break;
            case 'appointment-management':
                // Load and display all appointments by default in card style
                const appointments = this.getStoredData('appointments') || [];
                console.log('Initializing appointment management tab with', appointments.length, 'appointments');
                console.log('Appointments:', appointments);
                this.currentAppointments = appointments;
                this.displayAppointments(appointments, 1); // Always start from page 1
                
                // Force toggle buttons for appointment tab and show import button for 'all' filter
                setTimeout(() => {
                    this.toggleImportExportButtons('appointment', 'all');
                    const appointmentImportBtn = document.getElementById('import-appointments-btn');
                    if (appointmentImportBtn) {
                        appointmentImportBtn.classList.remove('hidden');
                        appointmentImportBtn.classList.add('show-for-all');
                    }
                }, 100);
                break;
            case 'billing-management':
                // Load and display all invoices by default with pagination
                const invoices = this.getStoredData('invoices') || [];
                console.log('Initializing billing management tab with', invoices.length, 'invoices');
                console.log('Invoices:', invoices);
                this.currentBilling = invoices;
                this.displayBilling(invoices, 1); // Always start from page 1
                
                // Force toggle buttons for billing tab and show import button for 'all' filter
                setTimeout(() => {
                    this.toggleImportExportButtons('billing', 'all');
                    const billingImportBtn = document.getElementById('import-billing-btn');
                    if (billingImportBtn) {
                        billingImportBtn.classList.remove('hidden');
                        billingImportBtn.classList.add('show-for-all');
                    }
                }, 100);
                break;
            case 'staff-management':
                // Load and display all staff by default
                const staff = this.getStoredData('staff') || [];
                console.log('Initializing staff management tab with', staff.length, 'staff members');
                console.log('Staff:', staff);
                this.currentStaff = staff;
                this.displayStaff(staff, 1);
                
                // Force toggle buttons for staff tab and show import button for 'all' filter
                setTimeout(() => {
                    this.toggleImportExportButtons('staff', 'all');
                    const staffImportBtn = document.getElementById('import-staff-btn');
                    if (staffImportBtn) {
                        staffImportBtn.classList.remove('hidden');
                        staffImportBtn.classList.add('show-for-all');
                    }
                }, 100);
                break;
            case 'salary-management':
                // Load and display all salaries by default
                const salaries = this.getStoredData('salaries') || [];
                console.log('Initializing salary management tab with', salaries.length, 'salary records');
                console.log('Salaries:', salaries);
                this.currentSalaries = salaries;
                this.displaySalary(salaries, 1);
                
                // Force toggle buttons for salary tab and show import button for 'all' filter
                setTimeout(() => {
                    this.toggleImportExportButtons('salary', 'all');
                    const salaryImportBtn = document.getElementById('import-salary-btn');
                    if (salaryImportBtn) {
                        salaryImportBtn.classList.remove('hidden');
                        salaryImportBtn.classList.add('show-for-all');
                    }
                }, 100);
                break;
            case 'attendance-management':
                // Load and display today's attendance records by default
                console.log('Initializing attendance management tab');
                this.filterAttendance('today'); // This will load today's records and update display
                
                // Force toggle buttons for attendance tab and show import button for 'all' filter
                setTimeout(() => {
                    this.toggleImportExportButtons('attendance', 'today');
                    const attendanceImportBtn = document.getElementById('import-attendance-btn');
                    if (attendanceImportBtn) {
                        // Hide import button since default is 'today' filter
                        attendanceImportBtn.classList.add('hidden');
                        attendanceImportBtn.classList.remove('show-for-all');
                    }
                }, 100);
                break;
        }
    }

    handleFilter(filterType, dataType) {
        console.log('Filtering', dataType, 'by:', filterType);
        
        // Update current filter
        this.currentFilter = filterType;
        
        // Update dropdown filter option states for the specific type
        document.querySelectorAll(`[data-type="${dataType}"].dropdown-filter-option`).forEach(option => {
            option.classList.remove('active');
        });
        
        const activeFilterOption = document.querySelector(`[data-filter="${filterType}"][data-type="${dataType}"].dropdown-filter-option`);
        if (activeFilterOption) {
            activeFilterOption.classList.add('active');
        }
        
        switch (dataType) {
            case 'patient':
                this.filterPatients(filterType);
                break;
            case 'appointment':
                this.filterAppointments(filterType);
                break;
            case 'appointment-status':
                this.filterAppointmentsByStatus(filterType);
                break;
            case 'billing':
                this.filterBilling(filterType);
                break;
            case 'staff':
                this.filterStaff(filterType);
                break;
            case 'salary':
                this.filterSalary(filterType);
                break;
            case 'attendance':
                this.filterAttendance(filterType);
                break;
        }
        
        // Toggle import/export buttons visibility based on filter
        this.toggleImportExportButtons(dataType, filterType);
        
        // Update tooltips after filter change
        this.updateTooltips();
    }



    filterAppointments(filterType) {
        const appointments = this.getStoredData('appointments') || [];
        let filteredAppointments = [];
        
        switch (filterType) {
            case 'all':
                filteredAppointments = appointments;
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredAppointments = appointments.filter(apt => apt.date === today);
                break;
            case 'week':
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                filteredAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    return aptDate >= weekStart && aptDate <= weekEnd;
                });
                break;
            case 'month':
                const monthStart = new Date();
                monthStart.setDate(1);
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                filteredAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    return aptDate >= monthStart && aptDate <= monthEnd;
                });
                break;
            default:
                filteredAppointments = appointments;
        }
        
        // Apply status filter if active
        const activeStatusFilter = document.querySelector('[data-type="appointment-status"].dropdown-filter-option.active');
        if (activeStatusFilter && activeStatusFilter.getAttribute('data-filter') !== 'all') {
            const statusFilter = activeStatusFilter.getAttribute('data-filter');
            filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter);
        }
        
        // Store current filtered appointments
        this.currentAppointments = filteredAppointments;
        
        this.displayAppointments(filteredAppointments, 1); // Always start from page 1
        
        // Show/hide import button based on filter type
        const appointmentImportBtn = document.getElementById('import-appointments-btn');
        if (appointmentImportBtn) {
            if (filterType === 'all') {
                // Show import button for 'all' filter
                appointmentImportBtn.classList.remove('hidden');
                appointmentImportBtn.classList.add('show-for-all');
                console.log('Showing appointment import button for "all" filter');
            } else {
                // Hide import button for other filters
                appointmentImportBtn.classList.add('hidden');
                appointmentImportBtn.classList.remove('show-for-all');
                console.log('Hiding appointment import button for', filterType, 'filter');
            }
        }
        
        // Removed toast notification to reduce clutter
        // this.showToast(`Showing ${filteredAppointments.length} ${filterType} appointments`, 'info');
    }

    filterAppointmentsByStatus(filterType) {
        const appointments = this.getStoredData('appointments') || [];
        let filteredAppointments = [];
        
        // First apply time filter if active
        const activeTimeFilter = document.querySelector('[data-type="appointment"].dropdown-filter-option.active');
        if (activeTimeFilter) {
            const timeFilter = activeTimeFilter.getAttribute('data-filter');
            switch (timeFilter) {
                case 'all':
                    filteredAppointments = appointments;
                    break;
                case 'today':
                    const today = new Date().toISOString().split('T')[0];
                    filteredAppointments = appointments.filter(apt => apt.date === today);
                    break;
                case 'week':
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    filteredAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        return aptDate >= weekStart && aptDate <= weekEnd;
                    });
                    break;
                case 'month':
                    const monthStart = new Date();
                    monthStart.setDate(1);
                    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                    filteredAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        return aptDate >= monthStart && aptDate <= monthEnd;
                    });
                    break;
                default:
                    filteredAppointments = appointments;
            }
        } else {
            filteredAppointments = appointments;
        }
        
        // Then apply status filter
        switch (filterType) {
            case 'all':
                // No additional filtering needed
                break;
            case 'scheduled':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'scheduled');
                break;
            case 'confirmed':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'confirmed');
                break;
            case 'completed':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'completed');
                break;
            case 'cancelled':
                filteredAppointments = filteredAppointments.filter(apt => apt.status === 'cancelled');
                break;
        }
        
        // Store current filtered appointments
        this.currentAppointments = filteredAppointments;
        
        this.displayAppointments(filteredAppointments, 1); // Always start from page 1
        
        // Show/hide import button based on status filter type
        const appointmentImportBtn = document.getElementById('import-appointments-btn');
        if (appointmentImportBtn) {
            if (filterType === 'all') {
                // Show import button for 'all' status filter
                appointmentImportBtn.classList.remove('hidden');
                appointmentImportBtn.classList.add('show-for-all');
                console.log('Showing appointment import button for "all" status filter');
            } else {
                // Hide import button for other status filters
                appointmentImportBtn.classList.add('hidden');
                appointmentImportBtn.classList.remove('show-for-all');
                console.log('Hiding appointment import button for', filterType, 'status filter');
            }
        }
        
        // Removed toast notification to reduce clutter
        // this.showToast(`Showing ${filteredAppointments.length} ${filterType} appointments`, 'info');
    }

    filterBilling(filterType) {
        console.log('Filtering billing by:', filterType);
        const invoices = this.getStoredData('invoices') || [];
        console.log('Total invoices before filtering:', invoices.length);
        console.log('Invoice statuses:', invoices.map(inv => ({ id: inv.id, status: inv.status })));
        
        let filteredInvoices = [];
        
        switch (filterType) {
            case 'all':
                filteredInvoices = invoices;
                break;
            case 'paid':
                filteredInvoices = invoices.filter(inv => inv.status === 'paid');
                break;
            case 'unpaid':
                filteredInvoices = invoices.filter(inv => inv.status === 'unpaid');
                break;

            default:
                filteredInvoices = invoices;
        }
        
        console.log('Filtered invoices:', filteredInvoices.length);
        console.log('Filtered invoice details:', filteredInvoices.map(inv => ({ id: inv.id, status: inv.status, patientId: inv.patientId })));
        
        // Store current filtered billing
        this.currentBilling = filteredInvoices;
        
        this.displayBilling(filteredInvoices, 1); // Always start from page 1
        
        // Show/hide import button based on filter type
        const billingImportBtn = document.getElementById('import-billing-btn');
        if (billingImportBtn) {
            if (filterType === 'all') {
                // Show import button for 'all' filter
                billingImportBtn.classList.remove('hidden');
                billingImportBtn.classList.add('show-for-all');
                console.log('Showing billing import button for "all" filter');
            } else {
                // Hide import button for other filters
                billingImportBtn.classList.add('hidden');
                billingImportBtn.classList.remove('show-for-all');
                console.log('Hiding billing import button for', filterType, 'filter');
            }
        }
        
        // Removed toast notification to reduce clutter
        // Only show toast for non-default filters to reduce clutter
        // if (filterType !== 'all') {
        //     this.showToast(`Showing ${filteredInvoices.length} ${filterType} invoices`, 'info');
        // }
    }

    filterStaff(filterType) {
        console.log('Filtering staff by:', filterType);
        const staff = this.getStoredData('staff') || [];
        console.log('Total staff before filtering:', staff.length);
        
        let filteredStaff = [];
        
        switch (filterType) {
            case 'all':
                filteredStaff = staff;
                break;
            case 'active':
                filteredStaff = staff.filter(s => s.status === 'active' || s.status === undefined);
                break;
            case 'leave':
                filteredStaff = staff.filter(s => s.status === 'leave');
                break;
            case 'left':
                filteredStaff = staff.filter(s => s.status === 'left');
                break;
            default:
                filteredStaff = staff;
        }
        
        console.log('Filtered staff:', filteredStaff.length);
        this.currentStaff = filteredStaff;
        this.displayStaff(filteredStaff, 1);
        
        // Show/hide import button based on filter type
        const staffImportBtn = document.getElementById('import-staff-btn');
        if (staffImportBtn) {
            if (filterType === 'all') {
                // Show import button for 'all' filter
                staffImportBtn.classList.remove('hidden');
                staffImportBtn.classList.add('show-for-all');
                console.log('Showing staff import button for "all" filter');
            } else {
                // Hide import button for other filters
                staffImportBtn.classList.add('hidden');
                staffImportBtn.classList.remove('show-for-all');
                console.log('Hiding staff import button for', filterType, 'filter');
            }
        }
        
        // Removed toast notification to reduce clutter
        // Only show toast for non-default filters
        // if (filterType !== 'all') {
        //     this.showToast(`Showing ${filteredStaff.length} ${filterType} staff members`, 'info');
        // }
    }

    filterSalary(filterType) {
        console.log('Filtering salary by:', filterType);
        const salaries = this.getStoredData('salaries') || [];
        console.log('Total salaries before filtering:', salaries.length);
        
        let filteredSalaries = [];
        
        switch (filterType) {
            case 'all':
                filteredSalaries = salaries;
                break;
            case 'paid':
                filteredSalaries = salaries.filter(s => s.status === 'paid');
                break;
            case 'pending':
                filteredSalaries = salaries.filter(s => s.status === 'pending' || s.status === undefined);
                break;
            default:
                filteredSalaries = salaries;
        }
        
        console.log('Filtered salaries:', filteredSalaries.length);
        this.currentSalaries = filteredSalaries;
        this.displaySalary(filteredSalaries, 1);
        
        // Show/hide import button based on filter type
        const salaryImportBtn = document.getElementById('import-salary-btn');
        if (salaryImportBtn) {
            if (filterType === 'all') {
                // Show import button for 'all' filter
                salaryImportBtn.classList.remove('hidden');
                salaryImportBtn.classList.add('show-for-all');
                console.log('Showing salary import button for "all" filter');
            } else {
                // Hide import button for other filters
                salaryImportBtn.classList.add('hidden');
                salaryImportBtn.classList.remove('show-for-all');
                console.log('Hiding salary import button for', filterType, 'filter');
            }
        }
        
        // Removed toast notification to reduce clutter
        // Only show toast for non-default filters
        // if (filterType !== 'all') {
        //     this.showToast(`Showing ${filteredSalaries.length} ${filterType} salary records`, 'info');
        // }
    }

    filterAttendance(filterType) {
        console.log('Filtering attendance by:', filterType);
        const attendance = this.getStoredData('attendance') || [];
        console.log('Total attendance records before filtering:', attendance.length);
        
        let filteredAttendance = [];
        const today = this.getPakistanDate(); // Use Pakistan date consistently
        
        switch (filterType) {
            case 'today':
                // For today filter, we want to show all active staff with their attendance status
                // This includes showing "NOT MARKED" for staff without attendance records
                // So we pass an empty array to displayAttendance to trigger the "all staff" display mode
                filteredAttendance = [];
                // Clear selected date when showing today's attendance
                this.selectedAttendanceDate = null;
                break;
            case 'week':
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                filteredAttendance = attendance.filter(a => {
                    const attDate = new Date(a.date);
                    return attDate >= weekStart && attDate <= weekEnd;
                });
                // Clear selected date when using week filter
                this.selectedAttendanceDate = null;
                break;
            case 'month':
                const monthStart = new Date();
                monthStart.setDate(1);
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                filteredAttendance = attendance.filter(a => {
                    const attDate = new Date(a.date);
                    return attDate >= monthStart && attDate <= monthEnd;
                });
                // Clear selected date when using month filter
                this.selectedAttendanceDate = null;
                break;
            case 'all':
            default:
                filteredAttendance = attendance;
                // Clear selected date when using all filter
                this.selectedAttendanceDate = null;
                break;
        }
        
        console.log('Filtered attendance:', filteredAttendance.length);
        this.currentAttendance = filteredAttendance;
        this.displayAttendance(filteredAttendance, 1);
        this.updateAttendanceStats(filteredAttendance);
        
        // Show/hide import button based on filter type
        const attendanceImportBtn = document.getElementById('import-attendance-btn');
        if (attendanceImportBtn) {
            if (filterType === 'all') {
                // Show import button for 'all' filter
                attendanceImportBtn.classList.remove('hidden');
                attendanceImportBtn.classList.add('show-for-all');
                console.log('Showing attendance import button for "all" filter');
            } else {
                // Hide import button for other filters
                attendanceImportBtn.classList.add('hidden');
                attendanceImportBtn.classList.remove('show-for-all');
                console.log('Hiding attendance import button for', filterType, 'filter');
            }
        }
        
        // Removed toast notification to reduce clutter
        // Only show toast for non-default filters
        // if (filterType !== 'today') {
        //     this.showToast(`Showing ${filteredAttendance.length} attendance records for ${filterType}`, 'info');
        // }
    }



    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    getPatientAppointmentsCount(patientId) {
        const appointments = this.getStoredData('appointments') || [];
        return appointments.filter(apt => apt.patientId === patientId).length;
    }

    getPatientCompletedTreatmentsCount(patientId) {
        const appointments = this.getStoredData('appointments') || [];
        return appointments.filter(apt => apt.patientId === patientId && apt.status === 'completed').length;
    }

    getPatientTotalBilling(patientId) {
        const invoices = this.getStoredData('invoices') || [];
        const patientInvoices = invoices.filter(inv => inv.patientId === patientId);
        const total = patientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
        return this.formatCurrency(total);
    }

    getPatientLastVisit(patientId) {
        const appointments = this.getStoredData('appointments') || [];
        const patientAppointments = appointments.filter(apt => apt.patientId === patientId);
        
        if (patientAppointments.length === 0) return 'N/A';
        
        // Sort by date and get the most recent
        const sortedAppointments = patientAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastAppointment = sortedAppointments[0];
        
        return lastAppointment.date || 'N/A';
    }

   


  

    printPatient(patientId) {
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === patientId);
        
        if (patient) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Patient Record - ${patient.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .patient-info { margin-bottom: 20px; }
                        .info-row { margin: 10px 0; }
                        .label { font-weight: bold; }
                        .medical-history { margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Patient Record</h1>
                        <h2>${patient.name}</h2>
                    </div>
                    <div class="patient-info">
                        <div class="info-row">
                            <span class="label">Patient ID:</span> ${patient.id}
                        </div>
                        <div class="info-row">
                            <span class="label">Name:</span> ${patient.name}
                        </div>
                        <div class="info-row">
                            <span class="label">Phone:</span> ${patient.phone}
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span> ${patient.email || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Date of Birth:</span> ${patient.dob || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Age:</span> ${this.calculateAge(patient.dob)} years
                        </div>
                        <div class="info-row">
                            <span class="label">Gender:</span> ${patient.gender || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Address:</span> ${patient.address || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Status:</span> ${patient.status || 'active'}
                        </div>
                    </div>
                    <div class="medical-history">
                        <h3>Medical History</h3>
                        <p>${patient.medicalHistory || 'No medical history recorded'}</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    deletePatient(patientId) {
        if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            const patients = this.getStoredData('patients') || [];
            const updatedPatients = patients.filter(p => p.id !== patientId);
            
            this.setStoredData('patients', updatedPatients);
            this.showToast('Patient deleted successfully', 'success');
            
            // Refresh the display
            this.displayPatients(updatedPatients);
        }
    }

    updateAppointmentStatus(appointmentId, newStatus) {
        const appointments = this.getStoredData('appointments') || [];
        const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex].status = newStatus;
            this.setStoredData('appointments', appointments);
            
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
            
            // Re-apply current filters to get updated list
            let filteredAppointments = appointments;
            
            // Apply time filter first
            switch (timeFilter) {
                case 'today':
                    const today = new Date().toISOString().split('T')[0];
                    filteredAppointments = appointments.filter(apt => apt.date === today);
                    break;
                case 'week':
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    filteredAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        return aptDate >= weekStart && aptDate <= weekEnd;
                    });
                    break;
                case 'month':
                    const monthStart = new Date();
                    monthStart.setDate(1);
                    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                    filteredAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.date);
                        return aptDate >= monthStart && aptDate <= monthEnd;
                    });
                    break;
                default:
                    filteredAppointments = appointments;
            }
            
            // Apply status filter
            if (statusFilter !== 'all') {
                filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter);
            }
            
            // Get current page from data attribute
            const appointmentsList = document.getElementById('appointments-list');
            let currentPage = 1;
            if (appointmentsList) {
                const storedPage = appointmentsList.getAttribute('data-current-page');
                if (storedPage) {
                    currentPage = parseInt(storedPage);
                }
            }
            
            // Calculate new page after status change using current per-page setting
            const perPage2 = this.appointmentsPerPage === 'all' ? filteredAppointments.length : (this.appointmentsPerPage || 10);
            const totalPages = Math.ceil(filteredAppointments.length / perPage2);
            
            // If current page is beyond the new total pages, go to the last page
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            
            // Update current appointments list
            this.currentAppointments = filteredAppointments;
            
            // Refresh the display with current page
            this.displayAppointments(filteredAppointments, currentPage);
            
            this.showToast(`Appointment status updated to ${newStatus}`, 'success');
        }
    }

    viewAppointmentDetails(appointmentId) {
        const appointments = this.getStoredData('appointments') || [];
        const appointment = appointments.find(apt => apt.id === appointmentId);
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === appointment?.patientId);
        
        if (appointment) {
            // Create a modal to show appointment details
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 1rem;
            `;
            
            modal.innerHTML = `
                <div class="modal-content" style="
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-xl);
                    width: 100%;
                    max-width: 900px;
                    max-height: 85vh;
                    position: relative;
                    border: 1px solid var(--gray-200);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                ">
                    <!-- Header -->
                    <div class="modal-header" style="
                        padding: 1.5rem 2rem;
                        border-bottom: 1px solid var(--gray-200);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: var(--white);
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-calendar-check" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Appointment Details</h2>
                        </div>
                        <button onclick="this.closest('.modal').remove()" style="
                            background: var(--primary-color);
                            color: var(--white);
                            border: none;
                            border-radius: 50%;
                            width: 36px;
                            height: 36px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.125rem;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(10px);
                        " onmouseover="this.style.background='var(--primary-hover)'" onmouseout="this.style.background='var(--primary-color)'">x</button>
                    </div>
                    
                    <!-- Body -->
                    <div class="modal-body" style="
                        padding: 2rem;
                        overflow-y: auto;
                        flex: 1;
                        background: var(--gray-50);
                    ">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                            
                            <!-- Appointment Information Card -->
                            <div style="
                                background: var(--white);
                                border-radius: var(--radius-lg);
                                padding: 1.5rem;
                                box-shadow: var(--shadow-md);
                                border: 1px solid var(--gray-200);
                            ">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: var(--primary-light);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--primary-color);
                                    ">
                                        <i class="fas fa-calendar-alt" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Appointment Information</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 1rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Patient Name</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.capitalizeWords(patient?.name) || 'Unknown'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Appointment Date</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.formatDate(appointment.date)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Appointment Time</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.time}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Duration</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.duration || 60} minutes</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Treatment Type</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.capitalizeWords(appointment.treatment) || 'General Consultation'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Status</span>
                                        <span style="
                                            color: var(--white);
                                            background: var(--primary-color);
                                            padding: 0.25rem 0.75rem;
                                            border-radius: var(--radius-md);
                                            font-size: 0.875rem;
                                            font-weight: 600;
                                        ">${this.capitalizeWords(appointment.status) || 'Scheduled'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Additional Details Card -->
                            <div style="
                                background: var(--white);
                                border-radius: var(--radius-lg);
                                padding: 1.5rem;
                                box-shadow: var(--shadow-md);
                                border: 1px solid var(--gray-200);
                            ">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: var(--primary-light);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--primary-color);
                                    ">
                                        <i class="fas fa-info-circle" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Additional Details</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 1rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Appointment ID</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.id}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Priority</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.capitalizeWords(appointment.priority) || 'Normal'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Reminder</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.capitalizeWords(appointment.reminder) || 'No Reminder'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Created Date</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.createdAt ? this.formatDate(appointment.createdAt) : 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Last Updated</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${appointment.updatedAt ? this.formatDate(appointment.updatedAt) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Notes Section -->
                        ${appointment.notes ? `
                        <div style="
                            background: var(--white);
                            border-radius: var(--radius-lg);
                            padding: 1.5rem;
                            box-shadow: var(--shadow-md);
                            border: 1px solid var(--gray-200);
                            margin-top: 1.5rem;
                        ">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--primary-light);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: var(--primary-color);
                                ">
                                    <i class="fas fa-sticky-note" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Appointment Notes</h3>
                            </div>
                            
                            <div style="
                                background: var(--gray-50);
                                padding: 1rem;
                                border-radius: var(--radius-md);
                                color: var(--gray-700);
                                line-height: 1.6;
                                font-size: 0.875rem;
                            ">
                                ${appointment.notes}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        }
    }

    editAppointment(appointmentId) {
        const appointments = this.getStoredData('appointments') || [];
        const appointment = appointments.find(apt => apt.id === appointmentId);
        
        if (appointment) {
            // Show the modal first
            this.showAddAppointmentModal();
            
            // Populate the appointment form with existing data
            const form = document.getElementById('appointment-form');
            if (form) {
                // Set form values
                const patientSelect = form.querySelector('#appointment-patient');
                const dateInput = form.querySelector('#appointment-date');
                const timeInput = form.querySelector('#appointment-time');
                const durationInput = form.querySelector('#appointment-duration');
                const treatmentInput = form.querySelector('#appointment-treatment');
                const statusInput = form.querySelector('#appointment-status');
                const notesInput = form.querySelector('#appointment-notes');
                
                if (patientSelect) patientSelect.value = appointment.patientId;
                if (dateInput) dateInput.value = appointment.date;
                if (timeInput) timeInput.value = appointment.time;
                if (durationInput) durationInput.value = appointment.duration || 60;
                if (treatmentInput) treatmentInput.value = appointment.treatment || '';
                if (statusInput) statusInput.value = appointment.status || 'scheduled';
                if (notesInput) notesInput.value = appointment.notes || '';
                
                // Update modal title and button text
                document.getElementById('appointment-modal-title').textContent = 'Edit Appointment';
                const submitBtn = document.querySelector('#appointment-form button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Update Appointment';
                }
                
                // Update form to handle edit mode
                form.dataset.editMode = 'true';
                form.dataset.editId = appointmentId;
                
                // Focus on first input field
                setTimeout(() => {
                    const firstInput = form.querySelector('select, input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="time"], textarea');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }, 100);
            }
        }
    }

    printAppointment(appointmentId) {
        const appointments = this.getStoredData('appointments') || [];
        const appointment = appointments.find(apt => apt.id === appointmentId);
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === appointment?.patientId);
        
        if (appointment && patient) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Appointment Details</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .details { margin-bottom: 20px; }
                        .detail-row { margin: 10px 0; }
                        .label { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Dental Clinic Appointment</h1>
                        <p>Appointment ID: ${appointment.id}</p>
                    </div>
                    <div class="details">
                        <div class="detail-row">
                            <span class="label">Patient Name:</span> ${patient.name}
                        </div>
                        <div class="detail-row">
                            <span class="label">Date:</span> ${this.formatDate(appointment.date)}
                        </div>
                        <div class="detail-row">
                            <span class="label">Time:</span> ${appointment.time}
                        </div>
                        <div class="detail-row">
                            <span class="label">Duration:</span> ${appointment.duration || 60} minutes
                        </div>
                        <div class="detail-row">
                            <span class="label">Treatment:</span> ${appointment.treatment || 'General Consultation'}
                        </div>
                        <div class="detail-row">
                            <span class="label">Status:</span> ${appointment.status || 'Scheduled'}
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    deleteAppointment(appointmentId) {
        this.showDeleteAppointmentConfirmation(appointmentId);
    }

    displayAppointments(appointments, currentPage = 1) {
        const appointmentsList = document.getElementById('appointments-list');
        if (!appointmentsList) return;
        
        const perPage = this.appointmentsPerPage === 'all' ? appointments.length : (this.appointmentsPerPage || 10);
        const totalPages = this.appointmentsPerPage === 'all' ? 1 : Math.ceil(appointments.length / perPage);
        const startIndex = this.appointmentsPerPage === 'all' ? 0 : (currentPage - 1) * perPage;
        const endIndex = this.appointmentsPerPage === 'all' ? appointments.length : Math.min(startIndex + perPage, appointments.length);
        const currentAppointments = this.appointmentsPerPage === 'all' ? appointments : appointments.slice(startIndex, endIndex);
        
        // Store current page in data attribute for easy access
        appointmentsList.setAttribute('data-current-page', currentPage);
        
        if (appointments.length === 0) {
            appointmentsList.innerHTML = '<p class="text-center" style="color: var(--gray-500); padding: 2rem;">No appointments found</p>';
            return;
        }
        
        const patients = this.getStoredData('patients') || [];
        
        // Create single unified grid container with count and appointments (same as patient tab)
        const appointmentsHTML = `
            <div class="appointments-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display at the top of the grid -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                        Total Appointments: <span style="color: var(--primary-color);">${appointments.length}</span>
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        Showing ${startIndex + 1}-${Math.min(endIndex, appointments.length)} of ${appointments.length} appointments
                    </div>
                </div>
                
                <!-- Appointment Rows -->
                ${currentAppointments.map((appointment, index) => {
            const patient = patients.find(p => p.id === appointment.patientId);
                    const globalIndex = index + 1;
                    
                    // Get status color
                    let statusColor = 'var(--gray-600)';
                    let statusBgColor = 'var(--gray-100)';
                    switch(appointment.status?.toLowerCase()) {
                        case 'confirmed':
                            statusColor = 'var(--primary-color)';
                            statusBgColor = 'var(--primary-light)';
                            break;
                        case 'scheduled':
                            statusColor = 'var(--warning-color)';
                            statusBgColor = 'var(--warning-light)';
                            break;
                        case 'completed':
                            statusColor = 'var(--success-color)';
                            statusBgColor = 'var(--success-light)';
                            break;
                        case 'cancelled':
                            statusColor = 'var(--danger-color)';
                            statusBgColor = 'var(--danger-light)';
                            break;
                    }
                    
            return `
                <div class="appointment-row" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; border-bottom: ${index < appointments.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='var(--gray-100)'" onmouseout="this.style.backgroundColor='transparent'">
                    <!-- Entry Number & Icon -->
                    <div style="display: flex; align-items: center; gap: 1rem; min-width: 120px;">
                        <div style="width: 40px; height: 40px; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: var(--font-size-sm);">${globalIndex}</div>
                        <div style="width: 50px; height: 50px; background: ${patient && patient.gender === 'Female' ? 'var(--pink-light)' : 'var(--primary-light)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${patient && patient.gender === 'Female' ? 'var(--pink-color)' : 'var(--primary-color)'}; font-size: 1.5rem;">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        </div>
                    
                    <!-- Appointment Details (Left Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-weight: 600; font-size: var(--font-size-sm); display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas ${patient && patient.gender === 'Female' ? 'fa-venus' : patient && patient.gender === 'Male' ? 'fa-mars' : 'fa-user'}" style="font-size: 0.875rem;"></i>
                            ${patient ? (patient.name.charAt(0).toUpperCase() + patient.name.slice(1).toLowerCase()) : 'Unknown Patient'}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: var(--font-size-xs); font-weight: 500; width: fit-content;">${this.formatDate(appointment.date)}</div>
                    </div>
                    
                    <!-- Appointment Details (Middle Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>${appointment.time}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-hourglass-half" style="margin-right: 0.5rem;"></i>${appointment.duration || 60} min
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-tooth" style="margin-right: 0.5rem;"></i>${appointment.treatment || 'consultation'}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="background: ${statusColor}; color: var(--white); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center;">
                                ${appointment.status || 'scheduled'}
                            </span>
                            <button onclick="window.dentalApp.updateAppointmentStatus('${appointment.id}', 'confirmed')" style="width: 36px; height: 36px; padding: 0; background: var(--primary-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Confirmed" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <button onclick="window.dentalApp.updateAppointmentStatus('${appointment.id}', 'completed')" style="width: 36px; height: 36px; padding: 0; background: var(--success-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Completed" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="window.dentalApp.updateAppointmentStatus('${appointment.id}', 'cancelled')" style="width: 36px; height: 36px; padding: 0; background: var(--error-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Cancel Appointment" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Action Buttons (Right Block) -->
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button onclick="window.dentalApp.viewAppointmentDetails('${appointment.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="View Details" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="window.dentalApp.editAppointment('${appointment.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Edit Appointment" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.dentalApp.printAppointment('${appointment.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--warning-color); border: 1px solid var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Print" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-print"></i>
                        </button>
                        <button onclick="window.dentalApp.deleteAppointment('${appointment.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--error-color); border: 1px solid var(--error-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Delete" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
                }).join('')}
                
                <!-- Pagination Controls -->
                ${this.appointmentsPerPage !== 'all' ? `
                <div style=\"display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap;\"> 
                    <div style=\"display: flex; align-items: center; gap: 1rem;\"> 
                        <div style=\"display: flex; align-items: center; gap: 0.5rem; color: var(--gray-600); font-size: 0.875rem;\"> 
                            <span>Show</span> 
                            <select id=\"appointments-entries-per-page\" style=\"padding: 0.25rem 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius-md); background: var(--white); color: var(--gray-700); font-size: 0.875rem; cursor: pointer;\" onchange=\"window.dentalApp.changeAppointmentsEntriesPerPage(this.value)\"> 
                                <option value=\"10\" ${this.appointmentsPerPage === 10 ? 'selected' : ''}>10</option> 
                                <option value=\"20\" ${this.appointmentsPerPage === 20 ? 'selected' : ''}>20</option> 
                                <option value=\"50\" ${this.appointmentsPerPage === 50 ? 'selected' : ''}>50</option> 
                                <option value=\"100\" ${this.appointmentsPerPage === 100 ? 'selected' : ''}>100</option> 
                                <option value=\"200\" ${this.appointmentsPerPage === 200 ? 'selected' : ''}>200</option> 
                                <option value=\"all\" ${this.appointmentsPerPage === 'all' ? 'selected' : ''}>All</option> 
                            </select> 
                            <span>Appointments</span> 
                        </div> 
                    </div> 
                    <div style=\"display: flex; align-items: center; gap: 0.5rem;\"> 
                        ${totalPages > 1 ? ` 
                            ${currentPage > 1 ? `<button onclick=\"window.dentalApp.displayAppointments(window.dentalApp.currentAppointments, ${currentPage - 1})\" style=\"padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;\">Previous</button>` : ''} 
                            ${this.generateSmartPagination(currentPage, totalPages, 'appointments')} 
                            ${currentPage < totalPages ? `<button onclick=\"window.dentalApp.displayAppointments(window.dentalApp.currentAppointments, ${currentPage + 1})\" style=\"padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;\">Next</button>` : ''} 
                        ` : ''} 
                        <div style=\"color: var(--gray-600); font-size: 0.875rem; margin-left: 1rem;\">Page ${currentPage} of ${totalPages}</div> 
                    </div> 
                </div>
                ` : ''}
            </div>
        `;
        
        appointmentsList.innerHTML = appointmentsHTML;
    }

    displayBilling(invoices, currentPage = 1) {
        const billingList = document.getElementById('billing-list');
        if (!billingList) {
            console.error('Billing list element not found');
            return;
        }
        
        console.log('Displaying billing with:', invoices.length, 'invoices, page:', currentPage);
        console.log('Invoices data:', invoices);
        
        const invoicesPerPage = 10;
        const totalPages = Math.ceil(invoices.length / invoicesPerPage);
        const startIndex = (currentPage - 1) * invoicesPerPage;
        const endIndex = startIndex + invoicesPerPage;
        const currentInvoices = invoices.slice(startIndex, endIndex);
        
        // Store current page in data attribute for easy access
        billingList.setAttribute('data-current-page', currentPage);
        
        if (invoices.length === 0) {
            billingList.innerHTML = '<p class="text-center" style="color: var(--gray-500); padding: 2rem;">No invoices found</p>';
            return;
        }
        
        const patients = this.getStoredData('patients') || [];
        console.log('Available patients:', patients.length);
        
        // Create single unified grid container with count and invoices (same as patient tab)
        const billingHTML = `
            <div class="billing-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display at the top of the grid -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                        Total Invoices: <span style="color: var(--primary-color);">${invoices.length}</span>
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        Showing ${startIndex + 1}-${Math.min(endIndex, invoices.length)} of ${invoices.length} invoices
                    </div>
                </div>
                
                <!-- Invoice Rows -->
                ${currentInvoices.map((invoice, index) => {
            const patient = patients.find(p => p.id === invoice.patientId);
            const globalIndex = startIndex + index + 1;
            
            // Validate invoice data
            if (!invoice.id) {
                console.error('Invoice missing ID:', invoice);
                return '';
            }
            
            // Helper function to determine display status
            const getDisplayStatus = (invoice) => {
                if (invoice.status === 'paid') return 'paid';
                if (invoice.status === 'unpaid') {
                    const dueDate = new Date(invoice.dueDate || invoice.date);
                    const today = new Date();
                    return dueDate < today ? 'overdue' : 'unpaid';
                }
                return invoice.status || 'unpaid';
            };

            // Get display status and color
            const displayStatus = getDisplayStatus(invoice);
            let statusColor = 'var(--gray-600)';
            let statusBgColor = 'var(--gray-100)';
            
            switch(displayStatus) {
                case 'paid':
                    statusColor = 'var(--success-color)';
                    statusBgColor = 'var(--success-light)';
                    break;
                case 'unpaid':
                    statusColor = 'var(--warning-color)';
                    statusBgColor = 'var(--warning-light)';
                    break;
                case 'overdue':
                    statusColor = 'var(--error-color)';
                    statusBgColor = 'var(--danger-light)';
                    break;
            }
            
            const patientName = patient ? this.capitalizeWords(patient.name) : 'Unknown Patient';
            const invoiceTotal = invoice.total || 0;
            
            return `
                <div class="billing-row" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; border-bottom: ${index < currentInvoices.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='var(--gray-100)'" onmouseout="this.style.backgroundColor='transparent'">
                    <!-- Entry Number & Icon -->
                    <div style="display: flex; align-items: center; gap: 1rem; min-width: 120px;">
                        <div style="width: 40px; height: 40px; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: var(--font-size-sm);">${globalIndex}</div>
                        <div style="width: 50px; height: 50px; background: ${patient && patient.gender === 'Female' ? 'var(--pink-light)' : 'var(--primary-light)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${patient && patient.gender === 'Female' ? 'var(--pink-color)' : 'var(--primary-color)'}; font-size: 1.5rem;">
                            <i class="fas fa-file-invoice-dollar"></i>
                        </div>
                    </div>
                    
                    <!-- Invoice Details (Left Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-weight: 600; font-size: var(--font-size-sm); display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas ${patient && patient.gender === 'Female' ? 'fa-venus' : patient && patient.gender === 'Male' ? 'fa-mars' : 'fa-user'}" style="font-size: 0.875rem;"></i>
                            ${patientName}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: var(--font-size-xs); font-weight: 500; width: fit-content;">${invoice.date ? this.formatDate(invoice.date) : 'No date'}</div>
                    </div>
                    
                    <!-- Invoice Details (Middle Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-hashtag" style="margin-right: 0.5rem;"></i>${invoice.id}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-money-bill-wave" style="margin-right: 0.5rem;"></i>${this.formatCurrency(invoiceTotal)}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="background: ${statusColor}; color: var(--white); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center;">
                                ${displayStatus}
                            </span>
                            <button onclick="window.dentalApp.updateInvoiceStatus('${invoice.id}', 'paid')" style="width: 36px; height: 36px; padding: 0; background: var(--success-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Paid" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <button onclick="window.dentalApp.updateInvoiceStatus('${invoice.id}', 'unpaid')" style="width: 36px; height: 36px; padding: 0px; background: var(--warning-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: 0.2s ease-in-out; transform: scale(1);" title="Mark as Unpaid" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-clock"></i>
                            </button>

                        </div>
                    </div>
                    
                    <!-- Action Buttons (Right Block) -->
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button onclick="window.dentalApp.viewInvoiceDetails('${invoice.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="View Details" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="window.dentalApp.editInvoice('${invoice.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Update Invoice" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.dentalApp.printInvoice('${invoice.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--warning-color); border: 1px solid var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Print" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-print"></i>
                        </button>
                        <button onclick="window.dentalApp.deleteInvoice('${invoice.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--error-color); border: 1px solid var(--error-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Delete" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('')}
        
        <!-- Pagination Controls -->
        <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap;">
            <div style="color: var(--gray-600); font-size: 0.875rem; margin-right: 1rem;">
                Page ${currentPage} of ${totalPages}
            </div>
            
            ${currentPage > 1 ? `<button onclick="window.dentalApp.displayBilling(window.dentalApp.currentBilling, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
            
                                ${this.generateSmartPagination(currentPage, totalPages, 'billing')}
            
      