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
        const patients = this.getStoredData('patients') || [];
        
        if (patientSelect) {
            // Clear existing options except the first one
            patientSelect.innerHTML = '<option value="">Select Patient</option>';
            
            // Add patient options
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                const genderIcon = patient.gender === 'Female' ? '?' : patient.gender === 'Male' ? '?' : '?';
                option.textContent = `${genderIcon} ${patient.name} - ${patient.phone}`;
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
            
            // Calculate new page after status change
            const appointmentsPerPage = 10;
            const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
            
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
        
        const appointmentsPerPage = 10;
        const totalPages = Math.ceil(appointments.length / appointmentsPerPage);
        const startIndex = (currentPage - 1) * appointmentsPerPage;
        const endIndex = startIndex + appointmentsPerPage;
        const currentAppointments = appointments.slice(startIndex, endIndex);
        
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
                <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap;">
                    <div style="color: var(--gray-600); font-size: 0.875rem; margin-right: 1rem;">
                        Page ${currentPage} of ${totalPages}
                    </div>
                    
                    ${currentPage > 1 ? `<button onclick="window.dentalApp.displayAppointments(window.dentalApp.currentAppointments, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
                    
                    ${this.generateSmartPagination(currentPage, totalPages, 'appointments')}
                    
                    ${currentPage < totalPages ? `<button onclick="window.dentalApp.displayAppointments(window.dentalApp.currentAppointments, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
                </div>
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
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const appointments = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const appointment = {
                id: this.generateId(),
                patientId: values[0] || '', // Assuming patient ID is in the first column
                date: values[1] || '',
                time: values[2] || '',
                treatment: values[3] || '',
                duration: values[4] || '',
                status: values[5] || 'scheduled',
                notes: values[6] || '',
                createdAt: new Date().toISOString()
            };

            if (appointment.patientId && appointment.date && appointment.time) {
                appointments.push(appointment);
            }
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
        const patients = this.getStoredData('patients') || [];
        
        if (patientSelect) {
            // Clear existing options except the first one
            patientSelect.innerHTML = '<option value="">Select Patient</option>';
            
            // Add patient options
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                const genderIcon = patient.gender === 'Female' ? '?' : patient.gender === 'Male' ? '?' : '?';
                option.textContent = `${genderIcon} ${patient.name} - ${patient.phone}`;
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
            
            // Calculate new page after status change
            const appointmentsPerPage = 10;
            const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
            
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
        
        const appointmentsPerPage = 10;
        const totalPages = Math.ceil(appointments.length / appointmentsPerPage);
        const startIndex = (currentPage - 1) * appointmentsPerPage;
        const endIndex = startIndex + appointmentsPerPage;
        const currentAppointments = appointments.slice(startIndex, endIndex);
        
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
                <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap;">
                    <div style="color: var(--gray-600); font-size: 0.875rem; margin-right: 1rem;">
                        Page ${currentPage} of ${totalPages}
                    </div>
                    
                    ${currentPage > 1 ? `<button onclick="window.dentalApp.displayAppointments(window.dentalApp.currentAppointments, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
                    
                    ${this.generateSmartPagination(currentPage, totalPages, 'appointments')}
                    
                    ${currentPage < totalPages ? `<button onclick="window.dentalApp.displayAppointments(window.dentalApp.currentAppointments, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
                </div>
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
        // Always export ALL billing from storage, not just filtered ones
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
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const appointments = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            const appointment = {
                id: this.generateId(),
                patientId: values[0] || '', // Assuming patient ID is in the first column
                date: values[1] || '',
                time: values[2] || '',
                treatment: values[3] || '',
                duration: values[4] || '',
                status: values[5] || 'scheduled',
                notes: values[6] || '',
                createdAt: new Date().toISOString()
            };

            if (appointment.patientId && appointment.date && appointment.time) {
                appointments.push(appointment);
            }
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
            id: this.generateId('attendance'),
            staffId: formData.get('staffId'),
            date: formData.get('date'),
            time: formData.get('time'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            createdAt: new Date().toISOString()
        };
        
        // Validate required fields
        if (!attendanceData.staffId || !attendanceData.date || !attendanceData.status) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Check if it's a working day
        const attendanceDate = new Date(attendanceData.date);
        if (!this.isWorkingDay(attendanceDate)) {
            // Auto-set status to holiday for non-working days
            attendanceData.status = 'holiday';
            this.showToast('Non-working day detected. Status set to Holiday.', 'info');
        }
        
        // Check if attendance already exists for this staff member on this date
        const attendance = this.getStoredData('attendance') || [];
        const existingAttendance = attendance.find(record => 
            record.staffId === attendanceData.staffId && record.date === attendanceData.date
        );
        
        if (existingAttendance) {
            this.showToast('Attendance already marked for this staff member on this date', 'error');
            return;
        }
        
        // Save attendance record
        attendance.push(attendanceData);
        this.setStoredData('attendance', attendance);
        
        // Close modal
        this.closeAttendanceModal();
        
        // Show success message
        this.showToast(`Attendance marked successfully`, 'success');
        
        // Update current attendance and refresh display
        this.currentAttendance = attendance;
        this.displayAttendance(attendance, 1);
        this.updateAttendanceStats(attendance);
    }

    displayAttendance(attendance, currentPage = 1) {
        console.log('Displaying attendance:', attendance.length, 'records, page:', currentPage);
        const attendanceList = document.getElementById('attendance-list');
        if (!attendanceList) {
            console.log('Attendance list container not found');
            return;
        }

        // Get all staff members (active and inactive)
        const staff = this.getStoredData('staff') || [];
        const today = this.getPakistanDate();
        
        // Check if this is a search result (filtered attendance) or all staff display
        const isSearchResult = attendance.length > 0 && attendance.length < staff.length;
        
        // Determine the target date - if we have filtered attendance, use the date from the first record
        let targetDate = today;
        if (isSearchResult && attendance.length > 0) {
            targetDate = attendance[0].date;
        }
        
        let staffWithAttendance;
        
        if (isSearchResult) {
            // This is a search result - show only the filtered attendance records
            staffWithAttendance = attendance.map(record => {
                const staffMember = staff.find(s => s.id === record.staffId);
                return {
                    staffMember: staffMember || { name: 'Unknown Staff', role: 'Unknown Role' },
                    attendanceRecord: record,
                    hasAttendance: true
                };
            });
        } else {
            // This is the normal display - show all active staff (excluding only left status) with their attendance status for the target date
            const activeStaff = staff.filter(staffMember => staffMember.status !== 'left');
            
            // Get all attendance records for the target date (not just the filtered ones)
            const allAttendance = this.getStoredData('attendance') || [];
            const targetDateAttendance = allAttendance.filter(record => record.date === targetDate);
            
            console.log('Normal display for date:', targetDate);
            console.log('Total attendance records for this date:', targetDateAttendance.length);
            
            // Show all active staff (for today or when no specific date is selected)
            staffWithAttendance = activeStaff.map(staffMember => {
                // Find attendance record for this staff member on the target date
                const attendanceRecord = targetDateAttendance.find(record => 
                    record.staffId === staffMember.id
                );
                
                // Check if staff is on leave
                const isOnLeave = staffMember.status === 'leave';
                
                console.log(`Staff ${staffMember.name}:`, {
                    hasAttendanceRecord: !!attendanceRecord,
                    attendanceStatus: attendanceRecord?.status,
                    isOnLeave: isOnLeave,
                    finalStatus: attendanceRecord ? attendanceRecord.status : (isOnLeave ? 'ON LEAVE' : 'NOT MARKED')
                });
                
                return {
                    staffMember: staffMember,
                    attendanceRecord: attendanceRecord,
                    hasAttendance: !!attendanceRecord || isOnLeave
                };
            });
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(staffWithAttendance.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentStaffWithAttendance = staffWithAttendance.slice(startIndex, endIndex);

        if (staffWithAttendance.length === 0) {
            attendanceList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Staff Members</h3>
                    <p>No staff members found. Add staff members to see them in attendance.</p>
                </div>
            `;
            return;
        }

        const attendanceHTML = `
            <div class="attendance-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                        ${isSearchResult ? 'Search Results' : 'Active Staff'}: <span style="color: var(--primary-color);">${staffWithAttendance.length}</span>
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        Showing ${startIndex + 1}-${Math.min(endIndex, staffWithAttendance.length)} of ${staffWithAttendance.length} ${isSearchResult ? 'attendance records' : 'active staff members'}
                    </div>
                </div>
                
                <!-- Staff Attendance Rows -->
                ${currentStaffWithAttendance.map((item, index) => {
                    const { staffMember, attendanceRecord, hasAttendance } = item;
                    const globalIndex = startIndex + index;
                    
                    return `
                        <div class="attendance-row" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; border-bottom: ${index < currentStaffWithAttendance.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='var(--gray-100)'" onmouseout="this.style.backgroundColor='transparent'">
                            <!-- Staff Avatar -->
                            <div style="display: flex; align-items: center; gap: 1rem; min-width: 120px;">
                                <div class="attendance-avatar" style="width: 40px; height: 40px; background: var(--primary-light); border-radius:var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 600; color: var(--primary-color); font-size: var(--font-size-sm); flex-shrink: 0;">
                                    ${globalIndex + 1}
                                </div>
                                <div style="width: 50px; height: 50px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 1.5rem;">
                                    <i class="fas fa-user" style="font-size: 1rem;"></i>
                                </div>
                            </div>
                            
                            <!-- Staff Info -->
                            <div class="attendance-info" style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                                <div class="attendance-staff-name" style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-md); font-weight: 600; font-size: var(--font-size-sm); display: inline-block; width: 100%;">
                                    ${staffMember.name.charAt(0).toUpperCase() + staffMember.name.slice(1).toLowerCase()}
                                </div>
                                <div class="attendance-staff-role" style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 500; font-size: var(--font-size-xs); display: inline-block; width: fit-content;">
                                    ${staffMember.role}
                                </div>
                            </div>
                            
                            <!-- Attendance Status Section -->
                            <div class="attendance-status-section" style="text-align: center; margin-left: auto; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                <div class="attendance-date-display" style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600; display: inline-block;">
                                    ${this.formatDate(targetDate)}
                                </div>
                                ${hasAttendance ? `
                                    ${attendanceRecord ? `
                                        <div class="attendance-status ${attendanceRecord.status}" style="padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; background: ${this.getAttendanceStatusBackground(attendanceRecord.status)}; color: ${this.getAttendanceStatusColor(attendanceRecord.status)};">
                                            ${attendanceRecord.status.toUpperCase()} ${attendanceRecord.time ? `(${this.formatTimeTo12Hour(attendanceRecord.time)})` : ''}
                                        </div>
                                        ${attendanceRecord.checkoutTime ? `
                                            <div style="color: var(--warning-color);background: var(--warning-light); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 500;">
                                                Checked out: ${this.formatTimeTo12Hour(attendanceRecord.checkoutTime)}
                                            </div>
                                        ` : ''}
                                    ` : `
                                        <div class="attendance-status leave" style="padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; background: var(--warning-light); color: var(--warning-color);">
                                            ON LEAVE
                                        </div>
                                    `}
                                ` : `
                                    <div class="attendance-status not-marked" style="padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; background: var(--gray-100); color: var(--gray-500);">
                                        NOT MARKED
                                    </div>
                                `}
                            </div>
                            
                            <!-- Action Buttons -->
                            <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                                ${hasAttendance && (!attendanceRecord || !attendanceRecord.checkoutTime) ? `
                                    <button onclick="window.dentalApp.checkoutStaff('${staffMember.id}')" style="width: 40px; height: 40px; padding: 0px; background: var(--warning-light); color: var(--warning-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: 0.2s ease-in-out; transform: scale(1);" title="Checkout" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                        <i class="fas fa-sign-out-alt"></i>
                                    </button>
                                ` : `
                                    <button onclick="window.dentalApp.showAddAttendanceModal('${staffMember.id}')" style="width: 40px; height: 40px; padding: 0px; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: 0.2s ease-in-out; transform: scale(1);" title="Mark Attendance" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                `}
                                <button onclick="window.dentalApp.viewStaffAttendanceCalendar('${staffMember.id}')" style="width: 40px; height: 40px; padding: 0px; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: 0.2s ease-in-out; transform: scale(1);" title="View Details" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="window.dentalApp.printStaffAttendance('${staffMember.id}')" style="width: 40px; height: 40px; padding: 0px; background: var(--white); color: var(--warning-color); border: 1px solid var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: 0.2s ease-in-out; transform: scale(1);" title="Print" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-print"></i>
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
                    
                    ${currentPage > 1 ? `<button onclick="window.dentalApp.displayAttendance(window.dentalApp.currentAttendance, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
                    
                    ${this.generateSmartPagination(currentPage, totalPages, 'attendance')}
                    
                    ${currentPage < totalPages ? `<button onclick="window.dentalApp.displayAttendance(window.dentalApp.currentAttendance, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
                </div>
            </div>
        `;
        
        attendanceList.innerHTML = attendanceHTML;
    }

    updateAttendanceStats(attendance) {
        const today = this.getPakistanDate(); // Use Pakistan date consistently
        
        // Determine the target date for stats
        let targetDate = today;
        if (attendance.length > 0) {
            // If we have filtered attendance, use the date from the first record
            targetDate = attendance[0].date;
        }
        
        // Get attendance records for the target date
        let targetDateAttendance;
        if (attendance.length === 0) {
            // This is the "today" filter - get all attendance records for today
            const allAttendance = this.getStoredData('attendance') || [];
            targetDateAttendance = allAttendance.filter(a => a.date === targetDate);
        } else {
            // This is a filtered result - get records for the target date
            targetDateAttendance = attendance.filter(a => a.date === targetDate);
        }
        
        const presentCount = targetDateAttendance.filter(a => a.status === 'present').length;
        const absentCount = targetDateAttendance.filter(a => a.status === 'absent').length;
        const lateCount = targetDateAttendance.filter(a => a.status === 'late').length;
        
        // Count leave from both attendance records and staff status
        const leaveFromAttendance = targetDateAttendance.filter(a => a.status === 'leave').length;
        const staff = this.getStoredData('staff') || [];
        const leaveFromStaff = staff.filter(s => s.status === 'leave').length;
        const leaveCount = Math.max(leaveFromAttendance, leaveFromStaff);
        
        // Update stats in the UI with animation
        this.updateAttendanceStatElement('present-count', presentCount);
        this.updateAttendanceStatElement('absent-count', absentCount);
        this.updateAttendanceStatElement('late-count', lateCount);
        this.updateAttendanceStatElement('leave-count', leaveCount);
        
        // Store current stats for comparison
        this.lastAttendanceStats = {
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            leave: leaveCount,
            timestamp: Date.now()
        };
    }
    
    updateAttendanceStatElement(elementId, newCount) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentCount = parseInt(element.textContent) || 0;
        
        if (currentCount !== newCount) {
            // Add animation class for visual feedback
            element.classList.add('stat-updated');
            
            // Update the count
            element.textContent = newCount;
            
            // Remove animation class after animation completes
            setTimeout(() => {
                element.classList.remove('stat-updated');
            }, 1000);
        }
    }





    editAttendance(attendanceId) {
        // Placeholder for edit functionality
        this.showToast('Edit attendance functionality coming soon', 'info');
    }

    checkoutStaff(staffId) {
        const attendance = this.getStoredData('attendance') || [];
        const today = this.getPakistanDate(); // Use Pakistan date consistently
        
        // Find today's attendance record for this staff member
        const attendanceRecord = attendance.find(record => 
            record.staffId === staffId && record.date === today
        );
        
        if (!attendanceRecord) {
            this.showToast('No check-in record found for today', 'error');
            return;
        }
        
        if (attendanceRecord.checkoutTime) {
            this.showToast('Already checked out for today', 'info');
            return;
        }
        
        // Special handling for leave status
        if (attendanceRecord.status === 'leave') {
            this.handleLeaveCheckout(staffId, attendanceRecord);
            return;
        }
        
        // Record checkout time (Pakistan time)
        const checkoutTime = this.getPakistanTime24Hour();
        
        // Update the attendance record
        attendanceRecord.checkoutTime = checkoutTime;
        attendanceRecord.updatedAt = new Date().toISOString();
        
        // Save updated attendance
        this.setStoredData('attendance', attendance);
        
        // Get staff member name for success message
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        const staffName = staffMember ? staffMember.name : 'Staff member';
        
        // Show success message
        this.showToast(`${staffName} checked out at ${this.formatTimeTo12Hour(checkoutTime)}`, 'success');
        
        // Refresh display
        this.currentAttendance = attendance;
        this.displayAttendance(attendance, 1);
        this.updateAttendanceStats(attendance);
    }
    
    // Handle checkout for staff on leave
    handleLeaveCheckout(staffId, attendanceRecord) {
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (!staffMember) {
            this.showToast('Staff member not found', 'error');
            return;
        }
        
        // Record checkout time (Pakistan time)
        const checkoutTime = this.getPakistanTime24Hour();
        
        // Update the attendance record
        attendanceRecord.checkoutTime = checkoutTime;
        attendanceRecord.updatedAt = new Date().toISOString();
        
        // Update staff status back to active
        staffMember.status = 'active';
        staffMember.leaveEndDate = this.getPakistanDate();
        staffMember.updatedAt = new Date().toISOString();
        
        // Save updated data
        const attendance = this.getStoredData('attendance') || [];
        this.setStoredData('attendance', attendance);
        this.setStoredData('staff', staff);
        
        // Show success message
        this.showToast(`${staffMember.name} leave ended and checked out at ${this.formatTimeTo12Hour(checkoutTime)}`, 'success');
        
        // Refresh displays
        this.currentAttendance = attendance;
        this.displayAttendance(attendance, 1);
        this.updateAttendanceStats(attendance);
        
        // Refresh staff display if on staff management tab
        if (this.currentSection === 'patient-services' && 
            document.querySelector('.tab-content.active')?.id === 'staff-management') {
            const currentPage = parseInt(document.querySelector('#staff-list')?.getAttribute('data-current-page') || '1');
            this.displayStaff(staff, currentPage);
        }
    }

    formatTimeTo12Hour(time24) {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    // Get current Pakistan time
    getPakistanTime() {
        return new Date().toLocaleString("en-US", {
            timeZone: this.pakistanTimeZone,
            hour12: false
        });
    }

    // Get current Pakistan date
    getPakistanDate() {
        const pakistanTime = new Date().toLocaleString("en-US", {
            timeZone: this.pakistanTimeZone
        });
        return new Date(pakistanTime).toISOString().split('T')[0];
    }

    // Get current Pakistan time in 12-hour format
    getPakistanTime12Hour() {
        return new Date().toLocaleString("en-US", {
            timeZone: this.pakistanTimeZone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // Get current Pakistan time in 24-hour format (HH:MM)
    getPakistanTime24Hour() {
        return new Date().toLocaleString("en-US", {
            timeZone: this.pakistanTimeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // Format date for display (Pakistan timezone)
    formatDatePakistan(dateStr = null) {
        const date = dateStr ? new Date(dateStr) : new Date();
        return date.toLocaleDateString("en-US", {
            timeZone: this.pakistanTimeZone,
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getAttendanceStatusBackground(status) {
        switch (status) {
            case 'present':
                return 'var(--success-light)';
            case 'absent':
                return 'var(--danger-light)';
            case 'late':
                return 'var(--warning-light)';
            case 'leave':
                return 'var(--warning-light)';
            case 'half-day':
                return 'var(--purple-light)';
            case 'holiday':
                return 'var(--gray-light)';
            default:
                return 'var(--gray-light)';
        }
    }

    getAttendanceStatusColor(status) {
        switch (status) {
            case 'present':
                return 'var(--success-color)';
            case 'absent':
                return 'var(--danger-color)';
            case 'late':
                return 'var(--warning-color)';
            case 'leave':
                return 'var(--warning-color)';
            case 'half-day':
                return 'var(--purple-color)';
            case 'holiday':
                return 'var(--gray-color)';
            default:
                return 'var(--gray-color)';
        }
    }

    // Start auto-date update at midnight Pakistan time
    startDateAutoUpdate() {
        // Prevent multiple instances from running
        if (this.dateUpdateStarted) {
            console.log('Date auto-update already started, skipping...');
            return;
        }
        this.dateUpdateStarted = true;
        
        // Flag to prevent multiple notifications for the same date change
        let lastNotifiedDate = this.getPakistanDate();
        let isProcessingDateChange = false;
        let dateUpdateInterval = null; // Store interval reference for cleanup

        const updateDateDisplays = () => {
            // Update all date displays in the attendance section
            const dateDisplays = document.querySelectorAll('.attendance-date-display, .current-date-display');
            const currentPakistanDate = this.formatDatePakistan();
            const currentPakistanTime = this.getPakistanTime24Hour();
            
            dateDisplays.forEach(display => {
                if (display) {
                    display.textContent = currentPakistanDate;
                }
            });

            // Handle automatic leave continuation at midnight
            this.handleAutomaticLeaveContinuation();
            
            // Handle automatic attendance reset at midnight
            this.handleAutomaticAttendanceReset();

            // Refresh attendance display if we're on attendance tab - this will show "NOT MARKED" for new day
            if (this.currentSection === 'patient-services' && 
                document.querySelector('.tab-content.active')?.id === 'attendance-management') {
                // Filter to today's records only to show "NOT MARKED" for new day
                this.filterAttendance('today');
            }

            // Also refresh staff management if it's active (to update attendance status there too)
            if (this.currentSection === 'patient-services' && 
                document.querySelector('.tab-content.active')?.id === 'staff-management') {
                const staff = this.getStoredData('staff') || [];
                const currentPage = parseInt(document.querySelector('#staff-list')?.getAttribute('data-current-page') || '1');
                this.displayStaff(staff, currentPage);
            }

            console.log('Date updated at Pakistan midnight:', currentPakistanDate, 'Time:', currentPakistanTime);
        };

        // Calculate milliseconds until next midnight Pakistan time
        const calculateNextMidnight = () => {
            const now = new Date();
            
            // Get current Pakistan time as a Date object
            const pakistanNow = new Date(now.toLocaleString("en-US", { timeZone: this.pakistanTimeZone }));
            
            // Calculate next midnight in Pakistan time
            const nextMidnight = new Date(pakistanNow);
            nextMidnight.setDate(nextMidnight.getDate() + 1);
            nextMidnight.setHours(0, 0, 0, 0);
            
            // Calculate the difference in milliseconds using Pakistan time
            const msUntilMidnight = nextMidnight.getTime() - pakistanNow.getTime();
            
            // Ensure we don't return negative values and add some buffer
            const safeDelay = Math.max(msUntilMidnight, 60000); // Minimum 1 minute
            
            // Debug logging for troubleshooting
            if (msUntilMidnight <= 0) {
                console.log('Warning: Negative time calculation detected:', {
                    now: now.toISOString(),
                    pakistanNow: pakistanNow.toISOString(),
                    nextMidnight: nextMidnight.toISOString(),
                    msUntilMidnight,
                    safeDelay
                });
            }
            
            return safeDelay;
        };

        const scheduleNextUpdate = () => {
            const msUntilMidnight = calculateNextMidnight();
            
            // Prevent negative or very small values that cause immediate re-scheduling
            if (msUntilMidnight <= 0 || msUntilMidnight < 60000) {
                console.log('Invalid midnight calculation, using 1 hour delay');
                setTimeout(() => {
                    scheduleNextUpdate();
                }, 3600000); // 1 hour delay
                return;
            }
            
            console.log(`Next Pakistan midnight update in: ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
            
            setTimeout(() => {
                if (!isProcessingDateChange) {
                    isProcessingDateChange = true;
                    
                updateDateDisplays();
                
                // Show toast notification when date changes at midnight
                const pakistanTime = new Date().toLocaleString("en-US", {
                    timeZone: this.pakistanTimeZone,
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                
                this.showToast(`?? New day started: ${this.formatDatePakistan()} at ${pakistanTime}`, 'info');
                    
                    // Update the last notified date
                    lastNotifiedDate = this.getPakistanDate();
                    
                    // Reset the processing flag after a short delay
                    setTimeout(() => {
                        isProcessingDateChange = false;
                    }, 5000); // 5 second cooldown
                }
                
                // Schedule the next update
                scheduleNextUpdate();
            }, msUntilMidnight);
        };

        // Update immediately on load
        updateDateDisplays();
        
        // Schedule first midnight update
        scheduleNextUpdate();
        
        // Backup method: Check every minute if it's a new day (Pakistan time)
        let lastKnownDate = this.getPakistanDate();
        dateUpdateInterval = setInterval(() => {
            const currentDate = this.getPakistanDate();
            const currentTime = this.getPakistanTime24Hour();
            
            // Only log if there's an actual change to reduce console spam
            if (currentDate !== lastKnownDate) {
                console.log('Date change detected via backup method:', lastKnownDate, '->', currentDate, 'Time:', currentTime, 'Processing:', isProcessingDateChange, 'Last notified:', lastNotifiedDate);
                
                if (!isProcessingDateChange && currentDate !== lastNotifiedDate) {
                    isProcessingDateChange = true;
                updateDateDisplays();
                lastKnownDate = currentDate;
                    lastNotifiedDate = currentDate;
                
                    // Show notification for backup date change (only if primary method didn't trigger)
                const pakistanTime = this.getPakistanTime12Hour();
                this.showToast(`New day started: ${this.formatDatePakistan()}`, 'success');
                    
                    // Reset the processing flag after a short delay
                    setTimeout(() => {
                        isProcessingDateChange = false;
                    }, 5000); // 5 second cooldown
                } else {
                    // Update lastKnownDate even if we don't process to prevent repeated checks
                    lastKnownDate = currentDate;
                }
            }
        }, 60000); // Check every minute
        
        // Debug function to test attendance system
        window.testAttendanceSystem = () => {
            console.log('=== Attendance System Debug Info ===');
            console.log('Pakistan Date:', this.getPakistanDate());
            console.log('Pakistan Time (24h):', this.getPakistanTime24Hour());
            console.log('Pakistan Time (12h):', this.getPakistanTime12Hour());
            console.log('Current Section:', this.currentSection);
            console.log('Active Tab:', document.querySelector('.tab-content.active')?.id);
            
            const attendance = this.getStoredData('attendance') || [];
            const staff = this.getStoredData('staff') || [];
            const today = this.getPakistanDate();
            
            console.log('Total Staff:', staff.length);
            console.log('Total Attendance Records:', attendance.length);
            console.log('Today\'s Attendance Records:', attendance.filter(a => a.date === today).length);
            
            // Test the display logic
            this.filterAttendance('today');
            console.log('=== End Debug Info ===');
        };




        
        // Function to manually trigger midnight update for testing
        window.triggerMidnightUpdate = () => {
            console.log('Manually triggering midnight update...');
            updateDateDisplays();
            this.showToast('Manual midnight update triggered - Attendance reset to "NOT MARKED"', 'info');
        };
        
        // Cleanup function to prevent memory leaks
        window.cleanupDateUpdate = () => {
            if (dateUpdateInterval) {
                clearInterval(dateUpdateInterval);
                dateUpdateInterval = null;
                console.log('Date update interval cleaned up');
            }
        };
        
        // Store reference for cleanup
        this.dateUpdateInterval = dateUpdateInterval;
        
        // Start real-time attendance sync
        this.startAttendanceSync();
    }

    // Handle automatic leave continuation at midnight
    handleAutomaticLeaveContinuation() {
        const staff = this.getStoredData('staff') || [];
        const attendance = this.getStoredData('attendance') || [];
        const today = this.getPakistanDate();
        const yesterday = this.getPreviousDay(today);
        
        console.log('Handling automatic leave continuation for:', today);
        
        // Find staff who were on leave yesterday
        const staffOnLeaveYesterday = staff.filter(s => s.status === 'leave');
        
        if (staffOnLeaveYesterday.length === 0) {
            console.log('No staff on leave yesterday, skipping automatic continuation');
            return;
        }
        
        let continuationCount = 0;
        
        staffOnLeaveYesterday.forEach(staffMember => {
            // Check if they already have attendance for today
            const todayAttendance = attendance.find(a => 
                a.staffId === staffMember.id && a.date === today
            );
            
            if (!todayAttendance) {
                // Create automatic leave attendance record for today
                const leaveAttendanceRecord = {
                    id: this.generateId('attendance'),
                    staffId: staffMember.id,
                    date: today,
                    time: '00:00', // Midnight
                    status: 'leave',
                    autoContinued: true, // Flag to indicate this was auto-continued
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Add to attendance records
                attendance.push(leaveAttendanceRecord);
                continuationCount++;
                
                console.log(`Auto-continued leave for ${staffMember.name} on ${today}`);
            }
        });
        
        // Save updated attendance data
        if (continuationCount > 0) {
            this.setStoredData('attendance', attendance);
            console.log(`Auto-continued leave for ${continuationCount} staff members`);
            
            // Show notification
            this.showToast(`?? Auto-continued leave for ${continuationCount} staff member(s)`, 'info');
        }
    }

    // Helper function to get previous day
    getPreviousDay(dateString) {
        const date = new Date(dateString);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    }



    // Handle automatic attendance reset at midnight
    handleAutomaticAttendanceReset() {
        const staff = this.getStoredData('staff') || [];
        const attendance = this.getStoredData('attendance') || [];
        const today = this.getPakistanDate();
        
        console.log('Handling automatic attendance reset for:', today);
        
        // Get all active staff (excluding left status)
        const activeStaff = staff.filter(s => s.status !== 'left');
        
        let resetCount = 0;
        
        activeStaff.forEach(staffMember => {
            // Check if they have attendance for today
            const todayAttendance = attendance.find(a => 
                a.staffId === staffMember.id && a.date === today
            );
            
            // If they have attendance for today, it means they checked in
            // We don't need to do anything - their attendance is already recorded
            if (todayAttendance) {
                console.log(`${staffMember.name} already has attendance for ${today}, no reset needed`);
                return;
            }
            
            // If they don't have attendance for today, they will show as "NOT MARKED"
            // This is the expected behavior for new day
            console.log(`${staffMember.name} has no attendance for ${today}, will show as "NOT MARKED"`);
        });
        
        // Update attendance stats to reflect new day
        this.updateAttendanceStats([]);
        
        console.log('Automatic attendance reset completed for new day');
        
        // Show notification about new day
        this.showToast(`?? New day started: ${this.formatDate(today)} - All staff reset to "NOT MARKED"`, 'info');
    }

    // Start real-time attendance synchronization
    startAttendanceSync() {
        // Prevent multiple instances
        if (this.attendanceSyncStarted) {
            console.log('Attendance sync already started, skipping...');
            return;
        }
        this.attendanceSyncStarted = true;
        
        // Sync every 30 seconds when on attendance tab
        this.attendanceSyncInterval = setInterval(() => {
            // Only sync if we're on the attendance management tab
            if (this.currentSection === 'patient-services' && 
                document.querySelector('.tab-content.active')?.id === 'attendance-management') {
                
                this.syncAttendanceData();
            }
        }, 30000); // 30 seconds
        
        // Also sync when tab becomes visible (for when user switches back to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && 
                this.currentSection === 'patient-services' && 
                document.querySelector('.tab-content.active')?.id === 'attendance-management') {
                this.syncAttendanceData();
            }
        });
        
        console.log('Real-time attendance sync started');
    }
    
    // Sync attendance data in real-time
    syncAttendanceData() {
        const currentFilter = this.getCurrentAttendanceFilter();
        const attendance = this.getStoredData('attendance') || [];
        
        // Get current attendance data based on filter
        let filteredAttendance;
        switch (currentFilter) {
            case 'today':
                const today = this.getPakistanDate();
                filteredAttendance = attendance.filter(a => a.date === today);
                break;
            case 'yesterday':
                const yesterday = this.getPakistanDate(-1);
                filteredAttendance = attendance.filter(a => a.date === yesterday);
                break;
            case 'this-week':
                const weekStart = this.getWeekStartDate();
                const weekEnd = this.getWeekEndDate();
                filteredAttendance = attendance.filter(a => {
                    const date = new Date(a.date);
                    return date >= weekStart && date <= weekEnd;
                });
                break;
            case 'this-month':
                const monthStart = this.getMonthStartDate();
                const monthEnd = this.getMonthEndDate();
                filteredAttendance = attendance.filter(a => {
                    const date = new Date(a.date);
                    return date >= monthStart && date <= monthEnd;
                });
                break;
            default:
                filteredAttendance = attendance;
        }
        
        // Update display and stats
        this.currentAttendance = filteredAttendance;
        this.displayAttendance(filteredAttendance, 1);
        this.updateAttendanceStats(filteredAttendance);
        
        // Check for changes and show notifications
        this.checkAttendanceChanges();
    }
    
    // Check for attendance changes and show notifications
    checkAttendanceChanges() {
        if (!this.lastAttendanceStats) return;
        
        const currentStats = {
            present: parseInt(document.getElementById('present-count')?.textContent) || 0,
            absent: parseInt(document.getElementById('absent-count')?.textContent) || 0,
            late: parseInt(document.getElementById('late-count')?.textContent) || 0,
            leave: parseInt(document.getElementById('leave-count')?.textContent) || 0
        };
        
        // Check for changes
        const changes = [];
        if (currentStats.present !== this.lastAttendanceStats.present) {
            changes.push(`Present: ${this.lastAttendanceStats.present} ? ${currentStats.present}`);
        }
        if (currentStats.absent !== this.lastAttendanceStats.absent) {
            changes.push(`Absent: ${this.lastAttendanceStats.absent} ? ${currentStats.absent}`);
        }
        if (currentStats.late !== this.lastAttendanceStats.late) {
            changes.push(`Late: ${this.lastAttendanceStats.late} ? ${currentStats.late}`);
        }
        if (currentStats.leave !== this.lastAttendanceStats.leave) {
            changes.push(`Leave: ${this.lastAttendanceStats.leave} ? ${currentStats.leave}`);
        }
        
        // Show notification for changes
        if (changes.length > 0) {
            console.log('Attendance changes detected:', changes);
            // Uncomment the line below if you want toast notifications for changes
            // this.showToast(`Attendance updated: ${changes.join(', ')}`, 'info');
        }
    }
    
    // Get current attendance filter
    getCurrentAttendanceFilter() {
        const activeFilter = document.querySelector('.attendance-filter-dropdown .dropdown-filter-option.active');
        return activeFilter ? activeFilter.getAttribute('data-filter') : 'today';
    }
    
    // Helper functions for date calculations
    getWeekStartDate() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    }
    
    getWeekEndDate() {
        const weekStart = this.getWeekStartDate();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return weekEnd;
    }
    
    getMonthStartDate() {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    getMonthEndDate() {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    getStaffAttendanceStatus(staffId) {
        const attendance = this.getStoredData('attendance') || [];
        const staff = this.getStoredData('staff') || [];
        
        // Determine the target date - use selected date if available, otherwise use today
        let targetDate = this.getPakistanDate();
        if (this.selectedAttendanceDate) {
            targetDate = this.selectedAttendanceDate;
        }
        
        // Find attendance record for this staff member on the target date
        const attendanceRecord = attendance.find(record => 
            record.staffId === staffId && record.date === targetDate
        );
        
        // Check staff status for leave
        const staffMember = staff.find(s => s.id === staffId);
        const isOnLeave = staffMember && staffMember.status === 'leave';
        
        if (attendanceRecord) {
            // Staff has attendance record for this date
            return `
                <div style="background: ${this.getAttendanceStatusBackground(attendanceRecord.status)}; color: ${this.getAttendanceStatusColor(attendanceRecord.status)}; padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>
                    ${attendanceRecord.status.toUpperCase()}
                    ${attendanceRecord.time ? ` (${this.formatTimeTo12Hour(attendanceRecord.time)})` : ''}
                </div>
            `;
        } else if (isOnLeave) {
            // Staff is on leave but no attendance record yet
            return `
                <div style="background: var(--warning-light); color: var(--warning-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-user-clock" style="margin-right: 0.5rem;"></i>
                    ON LEAVE
                </div>
            `;
        } else {
            // Staff has no attendance record for this date
            return `
                <div style="background: var(--gray-100); color: var(--gray-500); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>
                    NOT MARKED
                </div>
            `;
        }
    }

    updateDeductionRateDisplay(absentRate, lateRate, leaveRate, halfDayRate) {
        // Update the info text in the form labels to show current deduction rates
        const absentLabel = document.querySelector('label[for="absent-days"]');
        const lateLabel = document.querySelector('label[for="late-days"]');
        const leaveLabel = document.querySelector('label[for="leave-days"]');
        const halfLeaveLabel = document.querySelector('label[for="half-leave-days"]');
        
        if (absentLabel) {
            const infoSpan = absentLabel.querySelector('.info-text');
            if (infoSpan) {
                infoSpan.textContent = `(Rs.${absentRate} deductible)`;
            } else {
                absentLabel.innerHTML += ` <span class="info-text">(Rs.${absentRate} deductible)</span>`;
            }
        }
        
        if (lateLabel) {
            const infoSpan = lateLabel.querySelector('.info-text');
            if (infoSpan) {
                infoSpan.textContent = `(Rs.${lateRate} deductible)`;
            } else {
                lateLabel.innerHTML += ` <span class="info-text">(Rs.${lateRate} deductible)</span>`;
            }
        }
        
        if (leaveLabel) {
            const infoSpan = leaveLabel.querySelector('.info-text');
            if (infoSpan) {
                infoSpan.textContent = `(Rs.${leaveRate} deductible)`;
            } else {
                leaveLabel.innerHTML += ` <span class="info-text">(Rs.${leaveRate} deductible)</span>`;
            }
        }
        
        if (halfLeaveLabel) {
            const infoSpan = halfLeaveLabel.querySelector('.info-text');
            if (infoSpan) {
                infoSpan.textContent = `(Rs.${halfDayRate} deductible)`;
            } else {
                halfLeaveLabel.innerHTML += ` <span class="info-text">(Rs.${halfDayRate} deductible)</span>`;
            }
        }
    }

    deleteAttendance(attendanceId) {
        this.showDeleteAttendanceConfirmation(attendanceId);
    }

    printAttendance(attendanceId) {
        // Placeholder for print functionality
        this.showToast('Print attendance functionality coming soon', 'info');
    }

    viewStaffAttendanceCalendar(staffId) {
        const staff = this.getStoredData('staff') || [];
        const attendance = this.getStoredData('attendance') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (!staffMember) {
            this.showToast('Staff member not found', 'error');
            return;
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Get all attendance records for this staff member in current month
        const monthAttendance = attendance.filter(record => {
            const recordDate = new Date(record.date);
            return record.staffId === staffId && 
                   recordDate.getMonth() === currentMonth && 
                   recordDate.getFullYear() === currentYear;
        });

        // Create attendance map for quick lookup
        const attendanceMap = {};
        monthAttendance.forEach(record => {
            const day = new Date(record.date).getDate();
            attendanceMap[day] = {
                status: record.status,
                checkInTime: record.time,
                checkoutTime: record.checkoutTime
            };
        });

        // Generate calendar HTML
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        let calendarHTML = '';
        let dayCount = 1;

        for (let week = 0; week < 6; week++) {
            calendarHTML += '<tr>';
            for (let day = 0; day < 7; day++) {
                if (week === 0 && day < startingDay) {
                    calendarHTML += '<td style="padding: 0.5rem; text-align: center; border: 1px solid var(--gray-200); background: var(--gray-50);"></td>';
                } else if (dayCount > daysInMonth) {
                    calendarHTML += '<td style="padding: 0.5rem; text-align: center; border: 1px solid var(--gray-200); background: var(--gray-50);"></td>';
                } else {
                    const attendanceData = attendanceMap[dayCount];
                    let statusDisplay = '';
                    let statusColor = 'var(--gray-100)';
                    let textColor = 'var(--gray-500)';
                    let timeDisplay = '';
                    
                    if (attendanceData) {
                        const status = attendanceData.status;
                        switch (status) {
                            case 'present':
                                statusDisplay = 'P';
                                statusColor = 'var(--success-light)';
                                textColor = 'var(--success-color)';
                                break;
                            case 'absent':
                                statusDisplay = 'A';
                                statusColor = 'var(--danger-light)';
                                textColor = 'var(--danger-color)';
                                break;
                            case 'leave':
                                statusDisplay = 'L';
                                statusColor = 'var(--info-light)';
                                textColor = 'var(--info-color)';
                                break;
                            case 'half-day':
                                statusDisplay = 'HD';
                                statusColor = 'var(--purple-light)';
                                textColor = 'var(--purple-color)';
                                break;
                            case 'late':
                                statusDisplay = 'L';
                                statusColor = 'var(--warning-light)';
                                textColor = 'var(--warning-color)';
                                break;
                        }
                        
                        // Show check-in and checkout times
                        if (attendanceData.checkInTime) {
                            timeDisplay += `<div style="font-size: 0.6rem; color: ${textColor}; margin-top: 0.125rem;">In: ${this.formatTimeTo12Hour(attendanceData.checkInTime)}</div>`;
                        }
                        if (attendanceData.checkoutTime) {
                            timeDisplay += `<div style="font-size: 0.6rem; color: ${textColor};">Out: ${this.formatTimeTo12Hour(attendanceData.checkoutTime)}</div>`;
                        }
                    }
                    
                    calendarHTML += `
                        <td style="padding: 0.5rem; text-align: center; border: 1px solid var(--gray-200); background: ${statusColor}; position: relative; min-height: 60px; vertical-align: top;">
                            <div style="font-weight: 600; color: var(--gray-700);">${dayCount}</div>
                            ${statusDisplay ? `<div style="font-size: 0.75rem; font-weight: 700; color: ${textColor}; margin-top: 0.25rem;">${statusDisplay}</div>` : ''}
                            ${timeDisplay}
                        </td>
                    `;
                    dayCount++;
                }
            }
            calendarHTML += '</tr>';
        }

        const detailsHTML = `
            <div class="modal-content" style="max-width: 800px; width: 95%;">
                <div class="modal-header">
                    <h3>${staffMember.name} - Attendance Calendar</h3>
                    <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                        <div style="background: var(--primary-light); padding: 1rem; border-radius: var(--radius-md);">
                            <h4 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px;">Staff Information</h4>
                            <p style="margin: 0.25rem 0; color: var(--gray-700);"><strong>Name:</strong> ${staffMember.name}</p>
                            <p style="margin: 0.25rem 0; color: var(--gray-700);"><strong>Role:</strong> ${staffMember.role}</p>
                            <p style="margin: 0.25rem 0; color: var(--gray-700);"><strong>Month:</strong> ${monthNames[currentMonth]} ${currentYear}</p>
                        </div>
                        <div style="background: var(--success-light); padding: 1rem; border-radius: var(--radius-md);">
                            <h4 style="color: var(--success-color); margin: 0 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px;">Attendance Legend</h4>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div style="width: 20px; height: 20px; background: var(--success-light); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--success-color);">P</div>
                                    <span style="font-size: 0.875rem; color: var(--gray-700);">Present</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div style="width: 20px; height: 20px; background: var(--danger-light); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--danger-color);">A</div>
                                    <span style="font-size: 0.875rem; color: var(--gray-700);">Absent</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div style="width: 20px; height: 20px; background: var(--info-light); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--info-color);">L</div>
                                    <span style="font-size: 0.875rem; color: var(--gray-700);">Leave</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div style="width: 20px; height: 20px; background: var(--purple-light); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--purple-color);">HD</div>
                                    <span style="font-size: 0.875rem; color: var(--gray-700);">Half Day</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: var(--white); border-radius: var(--radius-md); border: 1px solid var(--gray-200); overflow: hidden;">
                        <div style="background: var(--primary-color); color: var(--white); padding: 1rem; text-align: center; font-weight: 600; font-size: 1.125rem;">
                            ${monthNames[currentMonth]} ${currentYear}
                        </div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--gray-50);">
                                    <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">Sun</th>
                                    <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">Mon</th>
                                    <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">Tue</th>
                                    <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">Wed</th>
                                    <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">Thu</th>
                                    <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">Fri</th>
                                    <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700);">Sat</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${calendarHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = detailsHTML;
        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close modal on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    printStaffAttendance(staffId) {
        const staff = this.getStoredData('staff') || [];
        const attendance = this.getStoredData('attendance') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (!staffMember) {
            this.showToast('Staff member not found', 'error');
            return;
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Get all attendance records for this staff member in current month
        const monthAttendance = attendance.filter(record => {
            const recordDate = new Date(record.date);
            return record.staffId === staffId && 
                   recordDate.getMonth() === currentMonth && 
                   recordDate.getFullYear() === currentYear;
        });

        // Create attendance map for quick lookup
        const attendanceMap = {};
        monthAttendance.forEach(record => {
            const day = new Date(record.date).getDate();
            attendanceMap[day] = record.status;
        });

        // Generate calendar HTML for print
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        let calendarHTML = '';
        let dayCount = 1;

        for (let week = 0; week < 6; week++) {
            calendarHTML += '<tr>';
            for (let day = 0; day < 7; day++) {
                if (week === 0 && day < startingDay) {
                    calendarHTML += '<td style="padding: 0.5rem; text-align: center; border: 1px solid #000; background: #f5f5f5;"></td>';
                } else if (dayCount > daysInMonth) {
                    calendarHTML += '<td style="padding: 0.5rem; text-align: center; border: 1px solid #000; background: #f5f5f5;"></td>';
                } else {
                    const attendanceStatus = attendanceMap[dayCount];
                    let statusDisplay = '';
                    let statusColor = '#f5f5f5';
                    let textColor = '#666';
                    
                    if (attendanceStatus) {
                        switch (attendanceStatus) {
                            case 'present':
                                statusDisplay = 'P';
                                statusColor = '#d4edda';
                                textColor = '#155724';
                                break;
                            case 'absent':
                                statusDisplay = 'A';
                                statusColor = '#f8d7da';
                                textColor = '#721c24';
                                break;
                            case 'leave':
                                statusDisplay = 'L';
                                statusColor = '#d1ecf1';
                                textColor = '#0c5460';
                                break;
                            case 'half-day':
                                statusDisplay = 'HD';
                                statusColor = '#e2d9f3';
                                textColor = '#6f42c1';
                                break;
                            case 'late':
                                statusDisplay = 'L';
                                statusColor = '#fff3cd';
                                textColor = '#856404';
                                break;
                        }
                    }
                    
                    calendarHTML += `
                        <td style="padding: 0.5rem; text-align: center; border: 1px solid #000; background: ${statusColor};">
                            <div style="font-weight: 600; color: #333;">${dayCount}</div>
                            ${statusDisplay ? `<div style="font-size: 0.75rem; font-weight: 700; color: ${textColor}; margin-top: 0.25rem;">${statusDisplay}</div>` : ''}
                        </td>
                    `;
                    dayCount++;
                }
            }
            calendarHTML += '</tr>';
        }

        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${staffMember.name} - Attendance Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .staff-info { margin-bottom: 20px; }
                    .legend { margin-bottom: 20px; }
                    .legend-item { display: inline-block; margin-right: 20px; }
                    .calendar { width: 100%; border-collapse: collapse; }
                    .calendar th, .calendar td { border: 1px solid #000; padding: 8px; text-align: center; }
                    .calendar th { background: #f0f0f0; font-weight: bold; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Staff Attendance Report</h1>
                    <h2>${monthNames[currentMonth]} ${currentYear}</h2>
                </div>
                
                <div class="staff-info">
                    <h3>Staff Information</h3>
                    <p><strong>Name:</strong> ${staffMember.name}</p>
                    <p><strong>Role:</strong> ${staffMember.role}</p>
                    <p><strong>Month:</strong> ${monthNames[currentMonth]} ${currentYear}</p>
                </div>
                
                <div class="legend">
                    <h3>Attendance Legend</h3>
                    <div class="legend-item">
                        <span style="background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; font-weight: bold;">P</span> Present
                    </div>
                    <div class="legend-item">
                        <span style="background: #f8d7da; color: #721c24; padding: 2px 6px; border-radius: 3px; font-weight: bold;">A</span> Absent
                    </div>
                    <div class="legend-item">
                        <span style="background: #d1ecf1; color: #0c5460; padding: 2px 6px; border-radius: 3px; font-weight: bold;">L</span> Leave
                    </div>
                    <div class="legend-item">
                        <span style="background: #e2d9f3; color: #6f42c1; padding: 2px 6px; border-radius: 3px; font-weight: bold;">HD</span> Half Day
                    </div>
                </div>
                
                <table class="calendar">
                    <thead>
                        <tr>
                            <th>Sun</th>
                            <th>Mon</th>
                            <th>Tue</th>
                            <th>Wed</th>
                            <th>Thu</th>
                            <th>Fri</th>
                            <th>Sat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${calendarHTML}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
                    <p>Generated on: ${this.formatDate(new Date())}</p>
                </div>
                
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            </body>
            </html>
        `;

        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
    }

    displayStaff(staff, currentPage = 1) {
        console.log('Displaying staff:', staff.length, 'members, page:', currentPage);
        const staffList = document.getElementById('staff-list');
        if (!staffList) {
            console.log('Staff list container not found');
            return;
        }

        // Show all staff including those on leave
        const filteredStaff = staff;
        
        const itemsPerPage = 10;
        const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentStaff = filteredStaff.slice(startIndex, endIndex);

        if (currentStaff.length === 0) {
            staffList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Staff Found</h3>
                    <p>No staff members match your current filters.</p>
                </div>
            `;
            return;
        }

        // Create single unified grid container with count and staff (same as appointment tab)
        const staffHTML = `
            <div class="staff-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display at the top of the grid -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                        Total Staff: <span style="color: var(--primary-color);">${filteredStaff.length}</span>
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        Showing ${startIndex + 1}-${Math.min(endIndex, filteredStaff.length)} of ${filteredStaff.length} staff members
                    </div>
                </div>
                
                <!-- Staff Rows -->
                ${currentStaff.map((staffMember, index) => {
            const globalIndex = startIndex + index + 1;
            const initials = staffMember.name ? staffMember.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'ST';
            
            return `
                <div class="staff-row" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; border-bottom: ${index < currentStaff.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='var(--gray-100)'" onmouseout="this.style.backgroundColor='transparent'">
                    <!-- Entry Number & Icon -->
                    <div style="display: flex; align-items: center; gap: 1rem; min-width: 120px;">
                        <div style="width: 40px; height: 40px; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: var(--font-size-sm);">${globalIndex}</div>
                                            <div style="width: 50px; height: 50px; background: ${staffMember.gender === 'Female' ? 'var(--pink-light)' : 'var(--primary-light)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${staffMember.gender === 'Female' ? 'var(--pink-color)' : 'var(--primary-color)'}; font-size: 1.5rem;">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    </div>
                    
                    <!-- Staff Details (Left Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-weight: 600; font-size: var(--font-size-sm);">${this.capitalizeWords(staffMember.name || 'Unknown')}</div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: var(--font-size-xs); font-weight: 500; width: fit-content;">${staffMember.age || 'N/A'}</div>
                            <div style="width: 15px; height: 15px; background: ${staffMember.gender === 'Female' ? 'var(--pink-light)' : 'var(--primary-light)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${staffMember.gender === 'Female' ? 'var(--pink-color)' : 'var(--primary-color)'}; font-size: 1rem; padding: 15px;">
                                <i class="fas fa-${staffMember.gender === 'Female' ? 'venus' : 'mars'}"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Staff Details (Middle Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-briefcase" style="margin-right: 0.5rem;"></i>${this.capitalizeWords(staffMember.role || 'N/A')}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-phone" style="margin-right: 0.5rem;"></i>${staffMember.phone || 'N/A'}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-calendar-alt" style="margin-right: 0.5rem;"></i>${staffMember.joinDate ? this.formatDate(staffMember.joinDate) : 'N/A'}
                        </div>

                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="background: ${staffMember.status === 'active' ? 'var(--success-color)' : staffMember.status === 'leave' ? 'var(--warning-color)' : 'var(--error-color)'}; color: var(--white); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-${staffMember.status === 'active' ? 'user-check' : staffMember.status === 'leave' ? 'user-clock' : 'user-times'}"></i>
                                ${this.capitalizeWords(staffMember.status || 'active')}
                            </span>
                            <button onclick="window.dentalApp.updateStaffStatus('${staffMember.id}', 'active')" style="width: 36px; height: 36px; padding: 0; background: var(--success-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Active" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-user-check"></i>
                            </button>
                            <button onclick="window.dentalApp.updateStaffStatus('${staffMember.id}', 'leave')" style="width: 36px; height: 36px; padding: 0; background: var(--warning-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Leave" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-user-clock"></i>
                            </button>
                            <button onclick="window.dentalApp.updateStaffStatus('${staffMember.id}', 'left')" style="width: 36px; height: 36px; padding: 0; background: var(--error-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Left" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-user-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Action Buttons (Right Block) -->
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button onclick="window.dentalApp.viewStaffDetails('${staffMember.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="View Details" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="window.dentalApp.editStaff('${staffMember.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Edit Staff" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.dentalApp.printStaff('${staffMember.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--warning-color); border: 1px solid var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Print" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-print"></i>
                        </button>
                        <button onclick="window.dentalApp.showDeleteStaffConfirmation('${staffMember.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--error-color); border: 1px solid var(--error-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Delete" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
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
                    
                    ${currentPage > 1 ? `<button onclick="window.dentalApp.displayStaff(window.dentalApp.currentStaff, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
                    
                    ${this.generateSmartPagination(currentPage, totalPages, 'staff')}
                    
                    ${currentPage < totalPages ? `<button onclick="window.dentalApp.displayStaff(window.dentalApp.currentStaff, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
                </div>
            </div>
        `;

        staffList.innerHTML = staffHTML;
        
        // Store current page in data attribute for easy access
        staffList.setAttribute('data-current-page', currentPage);
    }

    populateSalaryStaffDropdown() {
        const staffDropdown = document.getElementById('salary-staff');
        if (!staffDropdown) return;
        
        const staff = this.getStoredData('staff') || [];
        staffDropdown.innerHTML = '<option value="">Select a staff member</option>';
        
        staff.forEach(staffMember => {
            const option = document.createElement('option');
            option.value = staffMember.id;
            option.textContent = `${staffMember.name} (${staffMember.role})`;
            staffDropdown.appendChild(option);
        });
    }

    setupSalaryStatusDropdown() {
        const statusInput = document.getElementById('salary-status');
        const statusOptions = document.getElementById('salary-status-options');
        
        if (!statusInput || !statusOptions) return;
        
        // Show/hide options on input click
        statusInput.addEventListener('click', () => {
            statusOptions.classList.toggle('show');
        });
        
        // Handle option selection
        statusOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-option')) {
                const value = e.target.getAttribute('data-value');
                statusInput.value = value;
                statusOptions.classList.remove('show');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.status-input-container')) {
                statusOptions.classList.remove('show');
            }
        });
    }

    setupSalaryTotalCalculation() {
        const amountInput = document.getElementById('salary-amount');
        const bonusInput = document.getElementById('salary-bonus');
        const deductionsInput = document.getElementById('salary-deductions');
        const totalInput = document.getElementById('salary-total');
        
        if (!amountInput || !bonusInput || !deductionsInput || !totalInput) return;
        
        const calculateTotal = () => {
            const amount = parseFloat(amountInput.value) || 0;
            const bonus = parseFloat(bonusInput.value) || 0;
            const deductions = parseFloat(deductionsInput.value) || 0;
            const total = amount + bonus - deductions;
            totalInput.value = total.toFixed(2);
        };
        
        amountInput.addEventListener('input', calculateTotal);
        bonusInput.addEventListener('input', calculateTotal);
        deductionsInput.addEventListener('input', calculateTotal);
    }

    resetSalaryForm() {
        const form = document.getElementById('salary-form');
        if (form) {
            form.reset();
            
            // Reset total
            const totalInput = document.getElementById('salary-total');
            if (totalInput) {
                totalInput.value = '0.00';
            }
            
            // Reset status
            const statusInput = document.getElementById('salary-status');
            if (statusInput) {
                statusInput.value = 'Pending';
            }
        }
    }

    closeSalaryModal() {
        const modal = document.getElementById('salary-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        
        // Reset edit mode
        this.isEditingSalary = false;
        this.editingSalaryId = null;
        
        // Reset modal title
        const modalTitle = document.querySelector('#salary-modal .modal-header h3');
        if (modalTitle) {
            modalTitle.innerHTML = 'Create Salary';
        }
        
        // Reset save button text
        const saveBtn = document.getElementById('salary-save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        }
        
        // Reset form
        this.resetSalaryForm();
    }

    populateSalaryYearDropdown() {
        const yearSelect = document.getElementById('salary-year');
        if (yearSelect) {
            yearSelect.innerHTML = '<option value="">Select Year</option>';
            const currentYear = new Date().getFullYear();
            
            // Add years from current year to 5 years back
            for (let year = currentYear; year >= currentYear - 5; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            }
            
            // Set current year as default
            yearSelect.value = currentYear;
        }
    }



    setupCalculateSalaryButton() {
        const calculateBtn = document.getElementById('calculate-salary-btn');
        if (calculateBtn && !calculateBtn.hasAttribute('data-listener-attached')) {
            calculateBtn.setAttribute('data-listener-attached', 'true');
            calculateBtn.addEventListener('click', () => {
                this.calculateSalary();
            });
        }
        
        // Setup staff member selection change event
        const staffSelect = document.getElementById('salary-staff');
        if (staffSelect && !staffSelect.hasAttribute('data-listener-attached')) {
            staffSelect.setAttribute('data-listener-attached', 'true');
            staffSelect.addEventListener('change', () => this.onSalaryStaffChange());
        }
    }

    calculateSalary() {
        // Get attendance values
        const workingDays = parseFloat(document.getElementById('working-days').value) || 0;
        const presentDays = parseFloat(document.getElementById('present-days').value) || 0;
        const leaveDays = parseFloat(document.getElementById('leave-days').value) || 0;
        const absentDays = parseFloat(document.getElementById('absent-days').value) || 0;
        const lateDays = parseFloat(document.getElementById('late-days').value) || 0;
        const halfLeaveDays = parseFloat(document.getElementById('half-leave-days').value) || 0;
        const bonusDays = parseFloat(document.getElementById('bonus-days').value) || 0;
        const encashmentDays = parseFloat(document.getElementById('encashment-days').value) || 0;

        // Get staff member's basic salary
        const staffId = document.getElementById('salary-staff').value;
        const staff = this.getStoredData('staff') || [];
        const selectedStaff = staff.find(s => s.id === staffId);
        const basicSalary = selectedStaff ? (parseFloat(selectedStaff.salary) || 0) : 0;

        // Calculate daily rate for bonus and encashment
        const dailyRate = workingDays > 0 ? basicSalary / workingDays : 0;

        // Calculate deductions using fixed rates from settings
        const settings = this.getStoredData('staffSettings') || {};
        const lateDeductionRate = settings.lateDetectionRs || 0;
        const leaveDeductionRate = settings.leaveDetectionRs || 0;
        const absentDeductionRate = settings.absentDetectionRs || 0;
        const halfDayDeductionRate = settings.halfDayDetectionRs || 0;

        // Calculate deductions using fixed rates
        const lateDeduction = lateDays * lateDeductionRate;
        const leaveDeduction = leaveDays * leaveDeductionRate;
        const absentDeduction = absentDays * absentDeductionRate;
        const halfLeaveDeduction = halfLeaveDays * halfDayDeductionRate;

        // Calculate bonus and encashment using daily rate
        const bonusSalary = bonusDays * dailyRate;
        const encashmentSalary = encashmentDays * dailyRate;

        // Calculate totals
        const totalAllowance = this.calculateTotalAllowances();
        const totalDeduction = absentDeduction + lateDeduction + leaveDeduction + halfLeaveDeduction;
        const grossSalary = basicSalary + totalAllowance;
        const grossPayable = grossSalary - totalDeduction;
        const netSalary = grossPayable + bonusSalary + encashmentSalary;

        // Update summary fields
        document.getElementById('basic-salary').value = basicSalary.toFixed(2);
        document.getElementById('total-allowance').value = totalAllowance.toFixed(2);
        document.getElementById('gross-salary').value = grossSalary.toFixed(2);
        document.getElementById('total-deduction').value = totalDeduction.toFixed(2);
        document.getElementById('gross-payable').value = grossPayable.toFixed(2);
        document.getElementById('net-salary').value = netSalary.toFixed(2);

        // Show deduction rates being used
        const deductionInfo = `Deduction Rates: Absent: Rs.${absentDeductionRate}, Late: Rs.${lateDeductionRate}, Leave: Rs.${leaveDeductionRate}, Half Day: Rs.${halfDayDeductionRate}`;
        console.log(deductionInfo);
        
        // Update deduction rate display if it exists
        this.updateDeductionRateDisplay(absentDeductionRate, lateDeductionRate, leaveDeductionRate, halfDayDeductionRate);

        this.showToast('Salary calculated successfully', 'success');
    }

    calculateTotalAllowances() {
        const allowanceInputs = document.querySelectorAll('.allowance-amount');
        let total = 0;
        allowanceInputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        return total;
    }

    onSalaryStaffChange() {
        const staffId = document.getElementById('salary-staff').value;
        if (staffId) {
            // Only show notifications if this is a different staff member
            const lastStaffId = this.lastSalaryStaffId;
            this.lastSalaryStaffId = staffId;
            
            this.loadStaffAttendanceDetails(staffId, lastStaffId !== staffId);
            
            // Show current deduction rates
            const settings = this.getStoredData('staffSettings') || {};
            const absentRate = settings.absentDetectionRs || 0;
            const lateRate = settings.lateDetectionRs || 0;
            const leaveRate = settings.leaveDetectionRs || 0;
            const halfDayRate = settings.halfDayDetectionRs || 0;
            
            this.updateDeductionRateDisplay(absentRate, lateRate, leaveRate, halfDayRate);
        }
    }

    loadStaffAttendanceDetails(staffId, showNotifications = true) {
        const attendance = this.getStoredData('attendance') || [];
        const salaryMonth = document.getElementById('salary-month').value;
        const salaryYear = document.getElementById('salary-year').value;
        
        if (!salaryMonth || !salaryYear) {
            this.showToast('Please select month and year first', 'warning');
            return;
        }
        
        // Filter attendance for the selected staff member and month
        const monthAttendance = attendance.filter(record => {
            const recordDate = new Date(record.date);
            return record.staffId === staffId && 
                   recordDate.getMonth() === parseInt(salaryMonth) - 1 && 
                   recordDate.getFullYear() === parseInt(salaryYear);
        });
        
        // Count different attendance types
        let presentDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        let lateDays = 0;
        let halfDayDays = 0;
        
        monthAttendance.forEach(record => {
            switch (record.status) {
                case 'present':
                    presentDays++;
                    break;
                case 'absent':
                    absentDays++;
                    break;
                case 'leave':
                    leaveDays++;
                    break;
                case 'late':
                    lateDays++;
                    break;
                case 'half-day':
                    halfDayDays++;
                    break;
            }
        });
        
        // Apply 4 late = 1 absent rule
        const additionalAbsentDays = Math.floor(lateDays / 4);
        absentDays += additionalAbsentDays;
        lateDays = lateDays % 4; // Remaining late days
        
        // Get working days for the month
        const workingDays = this.getWorkingDaysInMonth(parseInt(salaryMonth), parseInt(salaryYear));
        
        // Update attendance fields
        document.getElementById('working-days').value = workingDays;
        document.getElementById('present-days').value = presentDays;
        document.getElementById('absent-days').value = absentDays;
        document.getElementById('leave-days').value = leaveDays;
        document.getElementById('late-days').value = lateDays;
        document.getElementById('half-leave-days').value = halfDayDays;
        
        // Auto-calculate deductions
        this.calculateDeductionsFromSettings(showNotifications);
        
        // Only show toast if there are actual attendance records and notifications are enabled
        if (showNotifications && (presentDays > 0 || absentDays > 0 || leaveDays > 0 || lateDays > 0 || halfDayDays > 0)) {
        this.showToast('Attendance details loaded automatically', 'success');
        }
    }

    getWorkingDaysInMonth(month, year) {
        const settings = this.getStoredData('staffSettings') || {};
        const workingDays = settings.workingDays || 'Monday-Friday, 9 AM - 5 PM';
        
        const daysInMonth = new Date(year, month, 0).getDate();
        let workingDaysCount = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            if (this.isWorkingDay(date)) {
                workingDaysCount++;
            }
        }
        
        return workingDaysCount;
    }

    calculateDeductionsFromSettings(showNotifications = true) {
        const settings = this.getStoredData('staffSettings') || {};
        
        // Get attendance counts
        const presentDays = parseFloat(document.getElementById('present-days').value) || 0;
        const absentDays = parseFloat(document.getElementById('absent-days').value) || 0;
        const leaveDays = parseFloat(document.getElementById('leave-days').value) || 0;
        const lateDays = parseFloat(document.getElementById('late-days').value) || 0;
        const halfDayDays = parseFloat(document.getElementById('half-leave-days').value) || 0;
        
        // Get deduction rates from settings
        const lateDeductionRate = settings.lateDetectionRs || 0;
        const leaveDeductionRate = settings.leaveDetectionRs || 0;
        const absentDeductionRate = settings.absentDetectionRs || 0;
        const halfDayDeductionRate = settings.halfDayDetectionRs || 0;
        
        // Calculate deductions
        const lateDeduction = lateDays * lateDeductionRate;
        const leaveDeduction = leaveDays * leaveDeductionRate;
        const absentDeduction = absentDays * absentDeductionRate;
        const halfDayDeduction = halfDayDays * halfDayDeductionRate;
        
        // Update deduction display (you can add these fields to the salary form)
        const totalDeduction = lateDeduction + leaveDeduction + absentDeduction + halfDayDeduction;
        
                // Removed deduction notification - no longer showing when staff member is selected
    }



    setupAddAllowanceButton() {
        const addBtn = document.getElementById('add-allowance-btn');
        const container = document.getElementById('allowances-container');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addAllowanceRow();
            });
        }
        
        // Set up event delegation for remove buttons
        if (container) {
            container.addEventListener('click', (e) => {
                if (e.target.closest('.remove-allowance-btn')) {
                    const button = e.target.closest('.remove-allowance-btn');
                    const allowanceId = parseInt(button.dataset.id);
                    this.removeAllowanceRow(allowanceId);
                }
            });
        }
    }

    addAllowanceRow() {
        const container = document.getElementById('allowances-container');
        const allowanceId = Date.now();
        
        const allowanceHTML = `
            <div class="allowance-row" data-id="${allowanceId}">
                <div class="form-group">
                    <input type="text" class="allowance-name" placeholder="Allowance Name" value="Allowance ${container.children.length + 1}">
                </div>
                <div class="form-group">
                    <input type="number" class="allowance-amount" placeholder="Amount (PKR)" step="0.01" min="0" value="0">
                </div>
                <button type="button" class="btn btn-danger btn-sm remove-allowance-btn" data-id="${allowanceId}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', allowanceHTML);
    }

    removeAllowanceRow(id) {
        const row = document.querySelector(`.allowance-row[data-id="${id}"]`);
        if (row) {
            row.remove();
        }
    }



    showStaffSettingsModal() {
        const modal = document.getElementById('staff-settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Load existing settings
            this.loadStaffSettings();
        }
    }

    closeStaffSettingsModal() {
        const modal = document.getElementById('staff-settings-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }

    loadStaffSettings() {
        const settings = this.getStoredData('staffSettings') || {
            workingDays: 'Monday-Friday, 9 AM - 5 PM',
            lateDetectionRs: 0,
            staffTiming: '9:00 AM - 6:00 PM',
            specificStaffTime: '',
            overtimeRate: 0,
            holidayMark: 'paid',
            leaveDetectionRs: 0,
            absentDetectionRs: 0,
            halfDayDetectionRs: 0
        };
        
        // Populate form fields
        const workingDaysInput = document.getElementById('working-days-input');
        const lateDetectionRsInput = document.getElementById('late-detection-rs');
        const staffTimingInput = document.getElementById('staff-timing');
        const specificStaffTimeInput = document.getElementById('specific-staff-time');
        const overtimeRateInput = document.getElementById('overtime-rate');
        const holidayMarkInput = document.getElementById('holiday-mark');
        const leaveDetectionRsInput = document.getElementById('leave-detection-rs');
        const absentDetectionRsInput = document.getElementById('absent-detection-rs');
        const halfDayDetectionRsInput = document.getElementById('half-day-detection-rs');
        
        if (workingDaysInput) workingDaysInput.value = settings.workingDays || '';
        if (lateDetectionRsInput) lateDetectionRsInput.value = settings.lateDetectionRs || 0;
        if (staffTimingInput) staffTimingInput.value = settings.staffTiming || '';
        if (specificStaffTimeInput) specificStaffTimeInput.value = settings.specificStaffTime || '';
        if (overtimeRateInput) overtimeRateInput.value = settings.overtimeRate || 0;
        if (holidayMarkInput) holidayMarkInput.value = settings.holidayMark || 'paid';
        if (leaveDetectionRsInput) leaveDetectionRsInput.value = settings.leaveDetectionRs || 0;
        if (absentDetectionRsInput) absentDetectionRsInput.value = settings.absentDetectionRs || 0;
        if (halfDayDetectionRsInput) halfDayDetectionRsInput.value = settings.halfDayDetectionRs || 0;
    }

    handleStaffSettingsSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        const settings = {
            workingDays: formData.get('workingDays'),
            lateDetectionRs: parseFloat(formData.get('lateDetectionRs')) || 0,
            staffTiming: formData.get('staffTiming'),
            specificStaffTime: formData.get('specificStaffTime'),
            overtimeRate: parseFloat(formData.get('overtimeRate')) || 0,
            holidayMark: formData.get('holidayMark'),
            leaveDetectionRs: parseFloat(formData.get('leaveDetectionRs')) || 0,
            absentDetectionRs: parseFloat(formData.get('absentDetectionRs')) || 0,
            halfDayDetectionRs: parseFloat(formData.get('halfDayDetectionRs')) || 0,
            updatedAt: new Date().toISOString()
        };
        
        // Save settings
        this.setStoredData('staffSettings', settings);
        
        // Sync attendance system with new settings
        this.syncAttendanceWithStaffSettings(settings);
        
        // Close modal
        this.closeStaffSettingsModal();
        
        // Show success message
        this.showToast('Staff settings saved successfully. Attendance system updated.', 'success');
    }

    // Staff Settings Sync Functions
    getLateThresholdFromSettings() {
        const settings = this.getStoredData('staffSettings') || {};
        const staffTiming = settings.staffTiming || '9:00 AM - 6:00 PM';
        
        // Parse staff timing to get start time
        const timingMatch = staffTiming.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timingMatch) {
            let hours = parseInt(timingMatch[1]);
            const minutes = parseInt(timingMatch[2]);
            const period = timingMatch[3].toUpperCase();
            
            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) {
                hours += 12;
            } else if (period === 'AM' && hours === 12) {
                hours = 0;
            }
            
            // Add 30 minutes for late threshold (default grace period)
            const startTimeMinutes = hours * 60 + minutes;
            return startTimeMinutes + 30; // 30 minutes grace period
        }
        
        // Default fallback: 10:30 AM
        return 10 * 60 + 30;
    }

    formatThresholdTo12Hour(thresholdMinutes) {
        const hours = Math.floor(thresholdMinutes / 60);
        const minutes = thresholdMinutes % 60;
        
        if (hours > 12) {
            return `${hours - 12}:${minutes.toString().padStart(2, '0')} PM`;
        } else if (hours === 12) {
            return `12:${minutes.toString().padStart(2, '0')} PM`;
        } else if (hours === 0) {
            return `12:${minutes.toString().padStart(2, '0')} AM`;
        } else {
            return `${hours}:${minutes.toString().padStart(2, '0')} AM`;
        }
    }

    isWorkingDay(date) {
        const settings = this.getStoredData('staffSettings') || {};
        const workingDays = settings.workingDays || 'Monday-Friday, 9 AM - 5 PM';
        
        // Parse working days
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = dayNames[date.getDay()];
        
        // Check if current day is in working days
        if (workingDays.includes('Monday-Friday')) {
            return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(currentDay);
        } else if (workingDays.includes('Monday-Saturday')) {
            return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(currentDay);
        } else if (workingDays.includes('Sunday-Saturday')) {
            return true; // All days
        }
        
        // Check for specific days
        return workingDays.includes(currentDay);
    }

    syncAttendanceWithStaffSettings(settings) {
        // Update existing attendance records if needed
        const attendance = this.getStoredData('attendance') || [];
        let updated = false;
        
        attendance.forEach(record => {
            const recordDate = new Date(record.date);
            
            // Check if it's a working day
            if (!this.isWorkingDay(recordDate)) {
                // Mark as holiday if not a working day
                if (record.status === 'present' || record.status === 'late') {
                    record.status = 'holiday';
                    updated = true;
                }
            } else {
                // Recalculate late status based on new timing
                if (record.status === 'present' || record.status === 'late') {
                    const [hours, minutes] = record.time.split(':').map(Number);
                    const totalMinutes = hours * 60 + minutes;
                    const newThreshold = this.getLateThresholdFromSettings();
                    
                    const newStatus = totalMinutes > newThreshold ? 'late' : 'present';
                    if (record.status !== newStatus) {
                        record.status = newStatus;
                        updated = true;
                    }
                }
            }
        });
        
        if (updated) {
            this.setStoredData('attendance', attendance);
            this.showToast('Existing attendance records updated with new settings', 'info');
        }
    }

    displaySalary(salaries, currentPage = 1) {
        console.log('Displaying salaries:', salaries.length, 'records, page:', currentPage);
        const salaryList = document.getElementById('salary-list');
        if (!salaryList) {
            console.log('Salary list container not found');
            return;
        }

        const staff = this.getStoredData('staff') || [];
        const itemsPerPage = 10;
        const totalPages = Math.ceil(salaries.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentSalaries = salaries.slice(startIndex, endIndex);

        if (currentSalaries.length === 0) {
            salaryList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <i class="fas fa-money-bill-wave" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Salary Records Found</h3>
                    <p>No salary records match your current filters.</p>
                </div>
            `;
            return;
        }

        // Create single unified grid container with count and salaries (same as billing tab)
        const salaryHTML = `
            <div class="salary-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display at the top of the grid -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                        Total Salary Records: <span style="color: var(--primary-color);">${salaries.length}</span>
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        Showing ${startIndex + 1}-${Math.min(endIndex, salaries.length)} of ${salaries.length} salary records
                    </div>
                </div>
                
                <!-- Salary Rows -->
                ${currentSalaries.map((salary, index) => {
            const globalIndex = startIndex + index + 1;
            const staffMember = staff.find(s => s.id === salary.staffId);
            const staffName = staffMember ? staffMember.name : 'Unknown Staff';
            const staffRole = staffMember ? staffMember.role : 'N/A';
            
            console.log('Displaying salary:', salary);
            
            return `
                <div class="salary-row" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem; border-bottom: ${index < currentSalaries.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='var(--gray-100)'" onmouseout="this.style.backgroundColor='transparent'">
                    <!-- Entry Number & Icon -->
                    <div style="display: flex; align-items: center; gap: 1rem; min-width: 120px;">
                        <div style="width: 40px; height: 40px; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: var(--font-size-sm);">${globalIndex}</div>
                        <div style="width: 50px; height: 50px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 1.5rem;">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                    </div>
                    
                    <!-- Salary Details (Left Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-weight: 600; font-size: var(--font-size-sm);">${this.capitalizeWords(staffName)}</div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-briefcase" style="margin-right: 0.5rem;"></i>${this.capitalizeWords(staffRole)}
                        </div>
                    </div>
                    
                    <!-- Salary Details (Middle Block) -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px;">
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-calendar-alt" style="margin-right: 0.5rem;"></i>${this.formatMonthName(salary.month) || 'N/A'}
                        </div>
                        <div style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500;">
                            <i class="fas fa-money-bill-wave" style="margin-right: 0.5rem;"></i>${this.formatCurrency(salary.amount || 0)}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="background: ${salary.status === 'paid' ? 'var(--success-color)' : 'var(--warning-color)'}; color: var(--white); padding: 0.5rem 1rem; border-radius: var(--radius-lg); font-size: var(--font-size-sm); font-weight: 500; text-align: center; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-${salary.status === 'paid' ? 'check-circle' : 'clock'}"></i>
                                ${this.capitalizeWords(salary.status || 'pending')}
                            </span>
                            <button onclick="window.dentalApp.updateSalaryStatus('${salary.id}', 'paid')" style="width: 36px; height: 36px; padding: 0; background: var(--success-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Paid" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <button onclick="window.dentalApp.updateSalaryStatus('${salary.id}', 'pending')" style="width: 36px; height: 36px; padding: 0; background: var(--warning-color); color: var(--white); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Mark as Pending" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-clock"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Action Buttons (Right Block) -->
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button onclick="window.dentalApp.viewSalaryInvoice('${salary.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="View Invoice" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="window.dentalApp.editSalary('${salary.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Edit Salary" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.dentalApp.printSalary('${salary.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--warning-color); border: 1px solid var(--warning-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Print" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-print"></i>
                        </button>
                        <button onclick="window.dentalApp.showDeleteSalaryConfirmation('${salary.id}')" style="width: 40px; height: 40px; padding: 0; background: var(--white); color: var(--error-color); border: 1px solid var(--error-color); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease-in-out;" title="Delete" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
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
                    
                    ${currentPage > 1 ? `<button onclick="window.dentalApp.displaySalary(window.dentalApp.currentSalaries, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
                    
                    ${this.generateSmartPagination(currentPage, totalPages, 'salary')}
                    
                    ${currentPage < totalPages ? `<button onclick="window.dentalApp.displaySalary(window.dentalApp.currentSalaries, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
                </div>
            </div>
        `;

        salaryList.innerHTML = salaryHTML;
        
        // Store current page in data attribute for easy access
        salaryList.setAttribute('data-current-page', currentPage);
    }

    editStaff(staffId) {
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (!staffMember) {
            this.showToast('Staff member not found', 'error');
            return;
        }

        // Set edit mode flags
        this.isEditingStaff = true;
        this.editingStaffId = staffId;

        // Open the staff modal in edit mode
        const modal = document.getElementById('staff-modal');
        const modalTitle = document.getElementById('staff-modal-title');
        const form = document.getElementById('staff-form');
        
        if (!modal || !modalTitle || !form) {
            this.showToast('Staff modal elements not found', 'error');
            return;
        }
        
        // Update modal title and button text
        modalTitle.textContent = 'Edit Staff Member';
        const submitButton = document.getElementById('staff-submit-btn');
        if (submitButton) {
            submitButton.textContent = 'Update Staff';
        }
        
        // Populate form with existing data
        const nameInput = document.getElementById('staff-name');
        const emailInput = document.getElementById('staff-email');
        const phoneInput = document.getElementById('staff-phone');
        const genderInput = document.getElementById('staff-gender');
        const roleInput = document.getElementById('staff-role');
        const qualificationInput = document.getElementById('staff-qualification');
        const experienceInput = document.getElementById('staff-experience');
        const jobTermInput = document.getElementById('staff-job-term');
        const joinDateInput = document.getElementById('staff-join-date');
        const statusInput = document.getElementById('staff-status');
        const dobInput = document.getElementById('staff-dob');
        const ageInput = document.getElementById('staff-age');
        const addressInput = document.getElementById('staff-address');
        const salaryInput = document.getElementById('staff-salary');
        const workingDaysInput = document.getElementById('staff-working-days');
        
        if (nameInput) nameInput.value = staffMember.name || '';
        if (emailInput) emailInput.value = staffMember.email || '';
        if (phoneInput) phoneInput.value = staffMember.phone || '';
        if (genderInput) genderInput.value = staffMember.gender || '';
        if (roleInput) roleInput.value = staffMember.role || '';
        if (qualificationInput) qualificationInput.value = staffMember.qualification || '';
        if (experienceInput) experienceInput.value = staffMember.experience || '';
        if (jobTermInput) jobTermInput.value = staffMember.jobTerm || '';
        if (joinDateInput) joinDateInput.value = staffMember.joinDate || '';
        if (statusInput) statusInput.value = staffMember.status ? this.capitalizeWords(staffMember.status) : 'Active';
        if (dobInput) dobInput.value = staffMember.dob || '';
        if (ageInput) ageInput.value = staffMember.age || '';
        if (addressInput) addressInput.value = staffMember.address || '';
        if (salaryInput) salaryInput.value = staffMember.salary || '';
        if (workingDaysInput) workingDaysInput.value = staffMember.workingDays || '';
        
        // Show modal
        modal.classList.add('active');
    }

    deleteStaff(staffId) {
        if (confirm('Are you sure you want to delete this staff member?')) {
            const staff = this.getStoredData('staff') || [];
            const updatedStaff = staff.filter(s => s.id !== staffId);
            
            if (updatedStaff.length === staff.length) {
                this.showToast('Staff member not found', 'error');
                return;
            }
            
            this.setStoredData('staff', updatedStaff);
            this.showToast('Staff member deleted successfully', 'success');
            
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
            
            // Calculate new page after deletion
            const staffPerPage = 10;
            const totalPages = Math.ceil(filteredStaff.length / staffPerPage);
            
            // If current page is beyond the new total pages, go to the last page
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            
            // Update current staff list
            this.currentStaff = filteredStaff;
            
            // Refresh the display with current page
            this.displayStaff(filteredStaff, currentPage);
        }
    }

    updateStaffStatus(staffId, newStatus) {
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (!staffMember) {
            this.showToast('Staff member not found', 'error');
            return;
        }
        
        // Don't update if status is already the same
        if (staffMember.status === newStatus) {
            this.showToast(`Staff member is already ${this.capitalizeWords(newStatus)}`, 'info');
            return;
        }
        
        staffMember.status = newStatus;
        staffMember.updatedAt = new Date().toISOString();
        
        this.setStoredData('staff', staff);
        this.showToast(`Staff member status changed to ${this.capitalizeWords(newStatus)}`, 'success');
        
        // Handle attendance based on new status
        this.handleStaffStatusChangeForAttendance(staffId, newStatus);
        
        // Get current active filter
        const activeFilterOption = document.querySelector('.dropdown-filter-option.active[data-type="staff"]');
        const currentFilter = activeFilterOption ? activeFilterOption.getAttribute('data-filter') : 'all';
        
        // Re-apply current filter to get updated list
        let filteredStaff = staff;
        
        switch (currentFilter) {
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
        
        // Get current page from data attribute
        const staffList = document.getElementById('staff-list');
        let currentPage = 1;
        if (staffList) {
            const storedPage = staffList.getAttribute('data-current-page');
            if (storedPage) {
                currentPage = parseInt(storedPage);
            }
        }
        
        // Calculate new page after status change
        const staffPerPage = 10;
        const totalPages = Math.ceil(filteredStaff.length / staffPerPage);
        
        // If current page is beyond the new total pages, go to the last page
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        // Update current staff list
        this.currentStaff = filteredStaff;
        
        // Refresh the display with current page
        this.displayStaff(filteredStaff, currentPage);
    }

    handleStaffStatusChangeForAttendance(staffId, newStatus) {
        const attendance = this.getStoredData('attendance') || [];
        const today = this.getPakistanDate();
        
        // Find today's attendance record for this staff member
        const todayRecord = attendance.find(record => 
            record.staffId === staffId && record.date === today
        );
        
        if (newStatus === 'leave') {
            // If staff is marked as leave, create or update attendance record
            if (todayRecord) {
                // Update existing record
                todayRecord.status = 'leave';
                todayRecord.updatedAt = new Date().toISOString();
            } else {
                // Create new attendance record for leave
                const newAttendanceRecord = {
                    id: this.generateId('attendance'),
                    staffId: staffId,
                    date: today,
                    status: 'leave',
                    time: this.getPakistanTime24Hour(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                attendance.push(newAttendanceRecord);
            }
            
            this.setStoredData('attendance', attendance);
            this.showToast('Staff marked as leave in attendance', 'success');
            
        } else if (newStatus === 'left') {
            // If staff is marked as left, remove today's attendance record if it exists
            if (todayRecord) {
                const updatedAttendance = attendance.filter(record => record.id !== todayRecord.id);
                this.setStoredData('attendance', updatedAttendance);
                this.showToast('Staff attendance record removed (staff left)', 'info');
            }
        }
        
        // Refresh attendance display if we're on the attendance tab
        const attendanceSection = document.getElementById('attendance-section');
        if (attendanceSection && attendanceSection.style.display !== 'none') {
            // Get current attendance page from data attribute
            const attendanceList = document.getElementById('attendance-list');
            let currentAttendancePage = 1;
            if (attendanceList) {
                const storedAttendancePage = attendanceList.getAttribute('data-current-page');
                if (storedAttendancePage) {
                    currentAttendancePage = parseInt(storedAttendancePage);
                }
            }
            
            // Calculate new page after status change
            const staff = this.getStoredData('staff') || [];
            const activeStaff = staff.filter(staffMember => staffMember.status !== 'left');
            const itemsPerPage = 10;
            const totalPages = Math.ceil(activeStaff.length / itemsPerPage);
            
            // If current page is beyond the new total pages, go to the last page
            if (currentAttendancePage > totalPages && totalPages > 0) {
                currentAttendancePage = totalPages;
            }
            
            this.displayAttendance(attendance, currentAttendancePage);
        }
    }

    viewStaffDetails(staffId) {
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (!staffMember) {
            this.showToast('Staff member not found', 'error');
            return;
        }

        // Create a modal to show staff details
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
                ">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-user-tie" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Staff Details</h2>
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
                        
                        <!-- Staff Information Card -->
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
                                    <i class="fas fa-user-tie" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Staff Information</h3>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Staff Name</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.name}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Phone</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.phone}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Email</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.email || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Status</span>
                                    <span style="
                                        color: var(--white); 
                                        font-weight: 600; 
                                        font-size: 0.75rem;
                                        background: ${staffMember.status === 'active' ? 'var(--success-color)' : staffMember.status === 'leave' ? 'var(--warning-color)' : 'var(--error-color)'}; 
                                        padding: 0.375rem 0.75rem; 
                                        border-radius: var(--radius-md);
                                        text-transform: uppercase;
                                        letter-spacing: 0.025em;
                                    ">${this.capitalizeWords(staffMember.status || 'N/A')}</span>
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
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Staff ID</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.id}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Gender</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.gender || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Age</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.age || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Address</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem; text-align: right; max-width: 50%;">${staffMember.address || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Professional Details Card -->
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
                                    <i class="fas fa-briefcase" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Professional Details</h3>
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Role</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.role || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Qualification</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.qualification || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Experience</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.experience || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Job Term</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.jobTerm || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Join Date</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember.joinDate ? this.formatDate(staffMember.joinDate) : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${staffMember.notes && staffMember.notes.trim() !== '' ? `
                        <!-- Notes Card -->
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
                                    <i class="fas fa-sticky-note" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--gray-800); font-size: 1.125rem; font-weight: 600;">Notes</h3>
                            </div>
                            
                            <div style="
                                background: var(--gray-50);
                                padding: 1rem;
                                border-radius: var(--radius-md);
                                color: var(--gray-700);
                                font-size: 0.875rem;
                                line-height: 1.5;
                            ">${staffMember.notes}</div>
                        </div>
                        ` : ''}
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

        // Close modal on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    printStaff(staffId) {
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (!staffMember) {
            this.showToast('Staff member not found', 'error');
            return;
        }

        // Create print window content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Staff Details - ${staffMember.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .section { margin-bottom: 20px; }
                    .section h3 { color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    .info-item { margin-bottom: 10px; }
                    .info-item strong { display: inline-block; width: 120px; }
                    .status { background: ${staffMember.status === 'active' ? '#10b981' : staffMember.status === 'leave' ? '#f59e0b' : '#ef4444'}; color: white; padding: 5px 10px; border-radius: 4px; display: inline-block; }
                    .notes { background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>DentalCare Pro - Staff Details</h1>
                    <p>Generated on ${this.formatDate(new Date())}</p>
                </div>
                
                <div class="section">
                    <h3>Personal Information</h3>
                    <div class="info-grid">
                        <div class="info-item"><strong>Name:</strong> ${staffMember.name || 'N/A'}</div>
                        <div class="info-item"><strong>Email:</strong> ${staffMember.email || 'N/A'}</div>
                        <div class="info-item"><strong>Phone:</strong> ${staffMember.phone || 'N/A'}</div>
                        <div class="info-item"><strong>Gender:</strong> ${staffMember.gender || 'N/A'}</div>
                        <div class="info-item"><strong>Date of Birth:</strong> ${staffMember.dob || 'N/A'}</div>
                        <div class="info-item"><strong>Age:</strong> ${staffMember.age || 'N/A'}</div>
                        <div class="info-item"><strong>Address:</strong> ${staffMember.address || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Professional Information</h3>
                    <div class="info-grid">
                        <div class="info-item"><strong>Role:</strong> ${staffMember.role || 'N/A'}</div>
                        <div class="info-item"><strong>Qualification:</strong> ${staffMember.qualification || 'N/A'}</div>
                        <div class="info-item"><strong>Experience:</strong> ${staffMember.experience || 'N/A'}</div>
                        <div class="info-item"><strong>Job Term:</strong> ${staffMember.jobTerm || 'N/A'}</div>
                        <div class="info-item"><strong>Join Date:</strong> ${staffMember.joinDate ? this.formatDate(staffMember.joinDate) : 'N/A'}</div>
                        <div class="info-item"><strong>Status:</strong> <span class="status">${this.capitalizeWords(staffMember.status || 'N/A')}</span></div>
                    </div>
                </div>
                
                ${staffMember.notes ? `
                    <div class="section">
                        <h3>Notes</h3>
                        <div class="notes">${staffMember.notes}</div>
                    </div>
                ` : ''}
            </body>
            </html>
        `;

        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    viewSalaryInvoice(salaryId) {
        const salaries = this.getStoredData('salaries') || [];
        const salary = salaries.find(s => s.id === salaryId);
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === salary?.staffId);
        
        if (salary) {
            // Create a modal to show salary details
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
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-money-bill-wave" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Salary Details</h2>
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
                            
                            <!-- Staff Information Card -->
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
                                    <h3 style="margin: 0; color: var(--primary-color); font-size: 1.25rem; font-weight: 600;">Staff Information</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Name</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember ? staffMember.name : 'Unknown'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Role</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember ? staffMember.role : 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Phone</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${staffMember ? staffMember.phone : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Salary Information Card -->
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
                                        background: var(--success-light);
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--success-color);
                                    ">
                                        <i class="fas fa-calendar-alt" style="font-size: 1rem;"></i>
                                    </div>
                                    <h3 style="margin: 0; color: var(--primary-color); font-size: 1.25rem; font-weight: 600;">Salary Information</h3>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Month</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${this.formatMonthName(salary.month) || 'N/A'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Status</span>
                                        <span style="background: ${salary.status === 'paid' ? 'var(--success-color)' : 'var(--warning-color)'}; color: var(--white); padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 500;">${salary.status || 'pending'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                        <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Payment Date</span>
                                        <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${salary.paymentDate ? this.formatDate(salary.paymentDate) : 'Not specified'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Financial Details Card -->
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
                                    background: var(--info-light);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: var(--info-color);
                                ">
                                    <i class="fas fa-calculator" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--primary-color); font-size: 1.25rem; font-weight: 600;">Financial Details</h3>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Base Amount</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">Rs. ${this.formatCurrency(salary.basicSalary || salary.amount || 0)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Total Allowance</span>
                                    <span style="color: var(--success-color); font-weight: 600; font-size: 0.875rem;">Rs. ${this.formatCurrency(salary.totalAllowance || 0)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Total Deduction</span>
                                    <span style="color: var(--error-color); font-weight: 600; font-size: 0.875rem;">Rs. ${this.formatCurrency(salary.totalDeduction || salary.deductions || 0)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--success-light); border-radius: var(--radius-md); border: 2px solid var(--success-color);">
                                    <span style="color: var(--success-color); font-weight: 600; font-size: 1rem;">Net Salary</span>
                                    <span style="color: var(--success-color); font-weight: 700; font-size: 1.125rem;">Rs. ${this.formatCurrency(salary.netSalary || salary.total || 0)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Attendance Summary Card -->
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
                                    background: var(--warning-light);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: var(--warning-color);
                                ">
                                    <i class="fas fa-calendar-check" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--primary-color); font-size: 1.25rem; font-weight: 600;">Attendance Summary</h3>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius-md);">
                                    <span style="color: var(--gray-600); font-weight: 500; font-size: 0.875rem;">Working Days</span>
                                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">${salary.workingDays || 0}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--success-light); border-radius: var(--radius-md);">
                                    <span style="color: var(--success-color); font-weight: 500; font-size: 0.875rem;">Present Days</span>
                                    <span style="color: var(--success-color); font-weight: 600; font-size: 0.875rem;">${salary.presentDays || 0}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--error-light); border-radius: var(--radius-md);">
                                    <span style="color: var(--error-color); font-weight: 500; font-size: 0.875rem;">Absent Days</span>
                                    <span style="color: var(--error-color); font-weight: 600; font-size: 0.875rem;">${salary.absentDays || 0}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--warning-light); border-radius: var(--radius-md);">
                                    <span style="color: var(--warning-color); font-weight: 500; font-size: 0.875rem;">Leave Days</span>
                                    <span style="color: var(--warning-color); font-weight: 600; font-size: 0.875rem;">${salary.leaveDays || 0}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--info-light); border-radius: var(--radius-md);">
                                    <span style="color: var(--info-color); font-weight: 500; font-size: 0.875rem;">Late Days</span>
                                    <span style="color: var(--info-color); font-weight: 600; font-size: 0.875rem;">${salary.lateDays || 0}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--purple-light); border-radius: var(--radius-md);">
                                    <span style="color: var(--purple-color); font-weight: 500; font-size: 0.875rem;">Half Days</span>
                                    <span style="color: var(--purple-color); font-weight: 600; font-size: 0.875rem;">${salary.halfLeaveDays || 0}</span>
                                </div>
                            </div>
                        </div>
                        
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
                                    background: var(--gray-light);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: var(--gray-color);
                                ">
                                    <i class="fas fa-sticky-note" style="font-size: 1rem;"></i>
                                </div>
                                <h3 style="margin: 0; color: var(--primary-color); font-size: 1.25rem; font-weight: 600;">Notes</h3>
                            </div>
                            
                            <div style="
                                background: var(--gray-50);
                                padding: 1rem;
                                border-radius: var(--radius-md);
                                border-left: 4px solid var(--primary-color);
                            ">
                                <p style="color: var(--gray-700); font-style: italic; margin: 0; line-height: 1.6;">${salary.notes || 'No notes available'}</p>
                            </div>
                        </div>
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
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        } else {
            this.showToast('Salary record not found', 'error');
        }

    }

    editSalary(salaryId) {
        const salaries = this.getStoredData('salaries') || [];
        const salary = salaries.find(s => s.id === salaryId);
        const staff = this.getStoredData('staff') || [];
        
        if (!salary) {
            this.showToast('Salary record not found', 'error');
            return;
        }
        
        // Store editing salary ID
        this.editingSalaryId = salaryId;
        this.isEditingSalary = true;
        
        // Show the salary modal
        this.showAddSalaryModal();
        
        // Populate form with existing data
        this.populateSalaryFormForEdit(salary);
        
        // Load staff attendance details for the selected month/year
        if (salary.staffId && salary.month && salary.year) {
            setTimeout(() => {
                this.loadStaffAttendanceDetails(salary.staffId, false); // false = don't show notifications
            }, 200);
        }
    }

    populateSalaryFormForEdit(salary) {
        // Populate basic fields
        const staffSelect = document.getElementById('salary-staff');
        const monthSelect = document.getElementById('salary-month');
        const yearSelect = document.getElementById('salary-year');
        const statusSelect = document.getElementById('salary-status');
        const notesTextarea = document.getElementById('salary-notes');
        
        if (staffSelect) staffSelect.value = salary.staffId || '';
        if (monthSelect) {
            // Ensure month is in the correct format (01, 02, etc.)
            const monthValue = salary.month ? String(salary.month).padStart(2, '0') : '';
            monthSelect.value = monthValue;
        }
        if (yearSelect) yearSelect.value = salary.year || '';
        if (statusSelect) statusSelect.value = salary.status || 'pending';
        if (notesTextarea) notesTextarea.value = salary.notes || '';
        
        // Populate attendance fields
        const workingDaysInput = document.getElementById('working-days');
        const presentDaysInput = document.getElementById('present-days');
        const absentDaysInput = document.getElementById('absent-days');
        const leaveDaysInput = document.getElementById('leave-days');
        const lateDaysInput = document.getElementById('late-days');
        const halfLeaveDaysInput = document.getElementById('half-leave-days');
        const bonusDaysInput = document.getElementById('bonus-days');
        const encashmentDaysInput = document.getElementById('encashment-days');
        
        if (workingDaysInput) workingDaysInput.value = salary.workingDays || 0;
        if (presentDaysInput) presentDaysInput.value = salary.presentDays || 0;
        if (absentDaysInput) absentDaysInput.value = salary.absentDays || 0;
        if (leaveDaysInput) leaveDaysInput.value = salary.leaveDays || 0;
        if (lateDaysInput) lateDaysInput.value = salary.lateDays || 0;
        if (halfLeaveDaysInput) halfLeaveDaysInput.value = salary.halfLeaveDays || 0;
        if (bonusDaysInput) bonusDaysInput.value = salary.bonusDays || 0;
        if (encashmentDaysInput) encashmentDaysInput.value = salary.encashmentDays || 0;
        
        // Populate financial fields
        const basicSalaryInput = document.getElementById('basic-salary');
        const totalAllowanceInput = document.getElementById('total-allowance');
        const grossSalaryInput = document.getElementById('gross-salary');
        const totalDeductionInput = document.getElementById('total-deduction');
        const grossPayableInput = document.getElementById('gross-payable');
        const netSalaryInput = document.getElementById('net-salary');
        const salaryFromSelect = document.getElementById('salary-from');
        
        if (basicSalaryInput) basicSalaryInput.value = salary.amount || 0;
        if (totalAllowanceInput) totalAllowanceInput.value = salary.totalAllowance || 0;
        if (grossSalaryInput) grossSalaryInput.value = salary.grossSalary || 0;
        if (totalDeductionInput) totalDeductionInput.value = salary.deductions || 0;
        if (grossPayableInput) grossPayableInput.value = salary.grossPayable || 0;
        if (netSalaryInput) netSalaryInput.value = salary.total || 0;
        if (salaryFromSelect) salaryFromSelect.value = salary.salaryFrom || 'Cash';
        
        // Populate allowances
        this.populateAllowancesForEdit(salary.allowances || []);
        
        // Set payment date to today for edit mode
        const today = new Date();
        const paymentDateInput = document.getElementById('salary-payment-date');
        if (paymentDateInput) {
            paymentDateInput.value = today.toISOString().split('T')[0];
        }
        
        // Update modal title
        const modalTitle = document.querySelector('#salary-modal .modal-header h3');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Salary Record';
        }
        
        // Update save button text
        const saveBtn = document.getElementById('salary-save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Salary';
        }
    }

    populateAllowancesForEdit(allowances) {
        const container = document.getElementById('allowances-container');
        if (!container) return;
        
        // Clear existing allowances
        container.innerHTML = '';
        
        // Add each allowance
        allowances.forEach((allowance, index) => {
            const allowanceId = Date.now() + index;
            const allowanceHTML = `
                <div class="allowance-row" data-id="${allowanceId}">
                    <div class="form-group">
                        <input type="text" class="allowance-name" placeholder="Allowance Name" value="${allowance.name || `Allowance ${index + 1}`}">
                    </div>
                    <div class="form-group">
                        <input type="number" class="allowance-amount" placeholder="Amount (PKR)" step="0.01" min="0" value="${allowance.amount || 0}">
                    </div>
                    <button type="button" class="remove-allowance-btn" data-id="${allowanceId}" style="
                        background: var(--error-color);
                        color: var(--white);
                        border: none;
                        border-radius: var(--radius-md);
                        padding: 0.5rem 1rem;
                        cursor: pointer;
                        font-size: 0.875rem;
                        transition: all 0.2s ease-in-out;
                    " onmouseover="this.style.background='var(--error-hover)'" onmouseout="this.style.background='var(--error-color)'">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', allowanceHTML);
        });
    }

    printSalary(salaryId) {
        const salaries = this.getStoredData('salaries') || [];
        const salary = salaries.find(s => s.id === salaryId);
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === salary?.staffId);
        
        if (salary) {
            // Create print window content
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Salary Invoice - ${staffMember ? staffMember.name : 'Unknown'}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                        .invoice-title { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
                        .invoice-subtitle { font-size: 16px; color: #666; }
                        .info-section { margin-bottom: 30px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                        .info-card { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; }
                        .info-title { font-weight: bold; color: #2563eb; margin-bottom: 10px; }
                        .financial-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                        .amount-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .total-row { border-top: 2px solid #333; padding-top: 10px; font-weight: bold; font-size: 18px; }
                        .attendance-summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                        .attendance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                        .attendance-item { text-align: center; }
                        .attendance-value { font-size: 20px; font-weight: bold; color: #2563eb; }
                        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 14px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="invoice-title">DentalCare Pro</div>
                        <div class="invoice-subtitle">Salary Invoice</div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-grid">
                            <div class="info-card">
                                <div class="info-title">Staff Information</div>
                                <p><strong>Name:</strong> ${staffMember ? staffMember.name : 'Unknown'}</p>
                                <p><strong>Role:</strong> ${staffMember ? staffMember.role : 'N/A'}</p>
                                <p><strong>Phone:</strong> ${staffMember ? staffMember.phone : 'N/A'}</p>
                            </div>
                            <div class="info-card">
                                <div class="info-title">Salary Information</div>
                                <p><strong>Month:</strong> ${salary.month || 'N/A'}</p>
                                <p><strong>Status:</strong> ${salary.status || 'pending'}</p>
                                <p><strong>Payment Date:</strong> ${salary.paymentDate || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="financial-details">
                        <h3 style="color: #2563eb; margin-bottom: 15px;">Financial Details</h3>
                        <div class="amount-row">
                            <span>Basic Salary:</span>
                            <span>${this.formatCurrency(salary.basicSalary || 0)}</span>
                        </div>
                        <div class="amount-row">
                            <span>Total Allowance:</span>
                            <span>${this.formatCurrency(salary.totalAllowance || 0)}</span>
                        </div>
                        <div class="amount-row">
                            <span>Total Deduction:</span>
                            <span>${this.formatCurrency(salary.totalDeduction || 0)}</span>
                        </div>
                        <div class="amount-row total-row">
                            <span>Net Salary:</span>
                            <span>${this.formatCurrency(salary.netSalary || salary.amount || 0)}</span>
                        </div>
                    </div>
                    
                    <div class="attendance-summary">
                        <h3 style="color: #2563eb; margin-bottom: 15px;">Attendance Summary</h3>
                        <div class="attendance-grid">
                            <div class="attendance-item">
                                <div class="attendance-value">${salary.workingDays || 0}</div>
                                <div>Working Days</div>
                            </div>
                            <div class="attendance-item">
                                <div class="attendance-value">${salary.presentDays || 0}</div>
                                <div>Present Days</div>
                            </div>
                            <div class="attendance-item">
                                <div class="attendance-value">${salary.absentDays || 0}</div>
                                <div>Absent Days</div>
                            </div>
                            <div class="attendance-item">
                                <div class="attendance-value">${salary.leaveDays || 0}</div>
                                <div>Leave Days</div>
                            </div>
                            <div class="attendance-item">
                                <div class="attendance-value">${salary.lateDays || 0}</div>
                                <div>Late Days</div>
                            </div>
                            <div class="attendance-item">
                                <div class="attendance-value">${salary.halfLeaveDays || 0}</div>
                                <div>Half Days</div>
                            </div>
                        </div>
                    </div>
                    
                    ${salary.notes ? `
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #2563eb; margin-bottom: 15px;">Notes</h3>
                        <p style="color: #666; line-height: 1.6;">${salary.notes}</p>
                    </div>
                    ` : ''}
                    
                    <div class="footer">
                        <p>Generated on ${this.formatDate(new Date())} at ${new Date().toLocaleTimeString()}</p>
                        <p>DentalCare Pro - Professional Dental Management System</p>
                    </div>
                </body>
                </html>
            `;
            
            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Wait for content to load then print
            printWindow.onload = function() {
                printWindow.print();
                printWindow.close();
            };
            
            this.showToast('Print window opened', 'success');
        } else {
            this.showToast('Salary record not found', 'error');
        }
    }

    deleteSalary(salaryId) {
        console.log('Delete salary called with ID:', salaryId);
        const salaries = this.getStoredData('salaries') || [];
        console.log('Current salaries before deletion:', salaries.length, salaries);
        
        const salary = salaries.find(s => s.id === salaryId);
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === salary?.staffId);
        
        if (!salary) {
            this.showToast('Salary record not found', 'error');
            return;
        }
        
        console.log('Found salary to delete:', salary);
        
        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete the salary record for ${staffMember ? staffMember.name : 'Unknown Staff'} (${this.formatMonthName(salary.month)} ${salary.year})? This action cannot be undone.`);
        
        if (confirmed) {
            // Remove salary from array
            const updatedSalaries = salaries.filter(s => s.id !== salaryId);
            console.log('Updated salaries after deletion:', updatedSalaries.length, updatedSalaries);
            
            this.setStoredData('salaries', updatedSalaries);
            
            // Verify the data was saved
            const savedSalaries = this.getStoredData('salaries') || [];
            console.log('Saved salaries after setStoredData:', savedSalaries.length, savedSalaries);
            
            this.showToast(`Salary record for ${staffMember ? staffMember.name : 'Unknown Staff'} deleted successfully`, 'success');
            
            // Get current active filter
            const activeFilterOption = document.querySelector('.dropdown-filter-option.active[data-type="salary"]');
            const currentFilter = activeFilterOption ? activeFilterOption.getAttribute('data-filter') : 'all';
            
            // Re-apply current filter to get updated list
            let filteredSalaries = updatedSalaries;
            
            switch (currentFilter) {
                case 'paid':
                    filteredSalaries = updatedSalaries.filter(s => s.status === 'paid');
                    break;
                case 'pending':
                    filteredSalaries = updatedSalaries.filter(s => s.status === 'pending' || s.status === undefined);
                    break;
                default:
                    filteredSalaries = updatedSalaries;
            }
            
            // Get current page from data attribute
            const salaryList = document.getElementById('salary-list');
            let currentPage = 1;
            if (salaryList) {
                currentPage = parseInt(salaryList.getAttribute('data-current-page')) || 1;
            }
            
            // Calculate new page after deletion
            const salariesPerPage = 10;
            const totalPages = Math.ceil(filteredSalaries.length / salariesPerPage);
            
            // If current page is beyond the new total pages, go to the last page
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }
            
            // Update current salaries list
            this.currentSalaries = filteredSalaries;
            
            // Re-display the list
            this.displaySalary(filteredSalaries, currentPage);
        }
    }

    updateSalaryStatus(salaryId, newStatus) {
        const salaries = this.getStoredData('salaries') || [];
        const salary = salaries.find(s => s.id === salaryId);
        
        if (!salary) {
            this.showToast('Salary record not found', 'error');
            return;
        }
        
        // Don't update if status is already the same
        if (salary.status === newStatus) {
            this.showToast(`Salary is already ${this.capitalizeWords(newStatus)}`, 'info');
            return;
        }
        
        salary.status = newStatus;
        salary.updatedAt = new Date().toISOString();
        
        // If marking as paid, set payment date to today
        if (newStatus === 'paid') {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            salary.paymentDate = `${year}-${month}-${day}`;
        }
        
        this.setStoredData('salaries', salaries);
        this.showToast(`Salary status changed to ${this.capitalizeWords(newStatus)}`, 'success');
        
        // Get current active filter
        const activeFilterOption = document.querySelector('.dropdown-filter-option.active[data-type="salary"]');
        const currentFilter = activeFilterOption ? activeFilterOption.getAttribute('data-filter') : 'all';
        
        // Re-apply current filter to get updated list
        let filteredSalaries = salaries;
        
        switch (currentFilter) {
            case 'paid':
                filteredSalaries = salaries.filter(s => s.status === 'paid');
                                break;
            case 'pending':
                filteredSalaries = salaries.filter(s => s.status === 'pending' || s.status === undefined);
                                break;
            default:
                filteredSalaries = salaries;
        }
        
        // Get current page from data attribute
        const salaryList = document.getElementById('salary-list');
        let currentPage = 1;
        if (salaryList) {
            const storedPage = salaryList.getAttribute('data-current-page');
            if (storedPage) {
                currentPage = parseInt(storedPage);
            }
        }
        
        // Update current salaries list
        this.currentSalaries = filteredSalaries;
        
        // Refresh the display with current page
        this.displaySalary(filteredSalaries, currentPage);
    }



    importStaff() {
        this.showToast('Import staff functionality coming soon', 'info');
    }

    importAttendance() {
        this.showToast('Import attendance functionality coming soon', 'info');
    }

    exportStaff() {
        const staff = this.getStoredData('staff') || [];
        
        if (staff.length === 0) {
            this.showToast('No staff to export', 'warning');
            return;
        }
        
        const headers = ['Name', 'Role', 'Phone', 'Email', 'Date of Birth', 'Age', 'Address', 'Join Date', 'Salary', 'Working Days', 'Qualification', 'Experience', 'Job Term', 'Status'];
        const data = staff.map(member => [
            member.name,
            member.role,
            member.phone,
            member.email || '',
            member.dob || '',
            member.age || '',
            member.address || '',
            member.joinDate ? this.formatDate(member.joinDate) : '',
            member.salary || '',
            member.workingDays || '',
            member.qualification || '',
            member.experience || '',
            member.jobTerm || '',
            member.status || 'active'
        ]);
        
        // Export to Excel
        const filename = `staff_export_${new Date().toISOString().split('T')[0]}`;
        const success = this.exportToExcel(data, headers, filename, 'Staff');
        
        if (success) {
            this.showToast(`${staff.length} staff members exported to Excel successfully`, 'success');
        }
    }

    importSalary() {
        this.showToast('Import salary functionality coming soon', 'info');
    }

    exportSalary() {
        const salaries = this.getStoredData('salaries') || [];
        
        if (salaries.length === 0) {
            this.showToast('No salary records to export', 'warning');
            return;
        }
        
        const staff = this.getStoredData('staff') || [];
        const headers = ['Staff Name', 'Month', 'Year', 'Basic Salary', 'Total Allowance', 'Gross Salary', 'Total Deduction', 'Gross Payable', 'Net Salary', 'Working Days', 'Present Days', 'Absent Days', 'Leave Days', 'Late Days', 'Half Day Days', 'Bonus Days', 'Encashment Days', 'Status', 'Payment Date', 'Notes'];
        const data = salaries.map(salary => {
            const staffMember = staff.find(s => s.id === salary.staffId);
            return [
                staffMember ? staffMember.name : 'Unknown',
                this.formatMonthName(salary.month),
                salary.year || '',
                salary.basicSalary || 0,
                salary.totalAllowance || 0,
                salary.grossSalary || 0,
                salary.totalDeduction || 0,
                salary.grossPayable || 0,
                salary.netSalary || salary.amount || 0,
                salary.workingDays || 0,
                salary.presentDays || 0,
                salary.absentDays || 0,
                salary.leaveDays || 0,
                salary.lateDays || 0,
                salary.halfLeaveDays || 0,
                salary.bonusDays || 0,
                salary.encashmentDays || 0,
                salary.status || 'pending',
                salary.paymentDate ? this.formatDate(salary.paymentDate) : '',
                salary.notes || ''
            ];
        });
        
        // Export to Excel
        const filename = `salary_export_${new Date().toISOString().split('T')[0]}`;
        const success = this.exportToExcel(data, headers, filename, 'Salary');
        
        if (success) {
            this.showToast(`${salaries.length} salary records exported to Excel successfully`, 'success');
        }
    }

    exportAttendance() {
        const attendance = this.getStoredData('attendance') || [];
        
        if (attendance.length === 0) {
            this.showToast('No attendance records to export', 'warning');
            return;
        }
        
        const staff = this.getStoredData('staff') || [];
        const headers = ['Staff Name', 'Staff Role', 'Date', 'Check-in Time', 'Check-out Time', 'Status', 'Working Hours', 'Notes'];
        const data = attendance.map(record => {
            const staffMember = staff.find(s => s.id === record.staffId);
            return [
                staffMember ? staffMember.name : 'Unknown',
                staffMember ? staffMember.role : '',
                record.date ? this.formatDate(record.date) : '',
                record.checkInTime || '',
                record.checkOutTime || '',
                record.status || '',
                record.workingHours || '',
                record.notes || ''
            ];
        });
        
        // Export to Excel
        const filename = `attendance_export_${new Date().toISOString().split('T')[0]}`;
        const success = this.exportToExcel(data, headers, filename, 'Attendance');
        
        if (success) {
            this.showToast(`${attendance.length} attendance records exported to Excel successfully`, 'success');
        }
    }

    showDeleteConfirmation(patientId) {
        const patients = this.getStoredData('patients') || [];
        const patient = patients.find(p => p.id === patientId);
        
        if (!patient) {
            this.showToast('Patient not found', 'error');
            return;
        }

        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%;">
                <div class="modal-header">
                    <h3>Confirm Delete</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1.5rem;">
                    <p style="margin-bottom: 1.5rem; color: #374151; line-height: 1.5;">
                        Are you sure you want to delete patient <strong>"${patient.name}"</strong>? 
                        This action cannot be undone.
                    </p>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-danger" onclick="window.dentalApp.confirmDeletePatient('${patientId}')">
                            Delete
                        </button>
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
    }

    showDeleteConfirmationModal() {
        if (this.selectedPatients.size === 0) {
            this.showToast('No patients selected for deletion', 'warning');
            return;
        }

        const patients = this.getStoredData('patients') || [];
        const selectedPatientNames = [];
        
        // Get names of selected patients
        this.selectedPatients.forEach(patientId => {
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                selectedPatientNames.push(patient.name);
            }
        });

        const patientCount = this.selectedPatients.size;
        const patientList = selectedPatientNames.map(name => '<div style="padding: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">• ' + name + '</div>').join('');
        const patientText = patientCount > 1 ? 'Patients' : 'Patient';

        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;';
        
        modal.innerHTML = '<div style="background: white; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); width: 100%; max-width: 600px; position: relative; border: 1px solid #e5e7eb; overflow: hidden;">' +
            '<div style="padding: 1.5rem 2rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: var(--white-color);">' +
                '<div style="display: flex; align-items: center; gap: 0.75rem;">' +
                    '<i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; color: var(--primary-color)"></i>' +
                    '<h2 style="margin: 0; font-size: 1.25rem; font-weight: 600; color(--gray-color);">Delete Selected Patients</h2>' +
                '</div>' +
                '<button onclick="this.closest(\'.modal\').remove()" style="background: var(--primary-color); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; transition: all 0.3s ease;" onmouseover="this.style.background=\'var(--primary-color)\'" onmouseout="this.style.background=\'var(--primary-color)\'">×</button>' +
            '</div>' +
            
            '<div style="padding: 2rem;">' +
                '<div style="text-align: center; margin-bottom: 1.5rem;">' +
                    '<i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>' +
                    '<h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.125rem;">Warning: This action cannot be undone!</h3>' +
                    '<p style="margin: 0; color: #6b7280; line-height: 1.6;">' +
                        'You are about to delete <strong>' + patientCount + ' selected patient(s)</strong> from the system.<br>' +
                        'This will permanently remove all selected patient data including medical records, appointments, and billing information.' +
                    '</p>' +
                '</div>' +
                
                '<div style="background: #f9fafb; padding: 1rem; border-radius: 8px;  margin-bottom: 1.5rem;">' +
                    '<p style="margin: 0; color: #374151; font-size: 0.875rem; font-weight: 500;">' +
                        '<strong>Patients to be deleted:</strong> ' + patientCount +
                    '</p>' +
                    '<div style="margin-top: 0.5rem; max-height: 200px; overflow-y: auto;">' +
                        patientList +
                    '</div>' +
                '</div>' +
            '</div>' +
            
            '<div style="padding: 1.5rem 2rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 1rem; background: #f9fafb;">' +
                '<button onclick="this.closest(\'.modal\').remove()" style="padding: 0.75rem 1.5rem; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.opacity=\'0.8\'" onmouseout="this.style.opacity=\'1\'">' +
                    'Cancel' +
                '</button>' +
                '<button onclick="window.dentalApp.deleteSelectedPatients(this.closest(\'.modal\'))" style="padding: 0.75rem 1.5rem; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.opacity=\'0.8\'" onmouseout="this.style.opacity=\'1\'">' +
                    '<i class="fas fa-trash-alt" style="margin-right: 0.5rem;"></i>' +
                    'Delete ' + patientCount + ' ' + patientText +
                '</button>' +
            '</div>' +
        '</div>';
        
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

    confirmDeletePatient(patientId) {
        console.log('=== CONFIRMING PATIENT DELETE ===');
        console.log('Patient ID to delete:', patientId);
        
        const patients = this.getStoredData('patients') || [];
        console.log('Total patients in storage:', patients.length);
        
        const patientIndex = patients.findIndex(p => p.id === patientId);
        console.log('Patient index found:', patientIndex);
        
        if (patientIndex !== -1) {
            const patient = patients[patientIndex];
            const patientName = patient.name;
            
            console.log('Patient to delete:', { id: patient.id, name: patient.name, status: patient.status });
            
            patients.splice(patientIndex, 1);
            this.setStoredData('patients', patients);
            
            // Close confirmation modal
            const modal = document.querySelector('.modal.active');
            if (modal) {
                modal.remove();
            }
            
            this.showToast(`Patient "${patientName}" deleted successfully`, 'success');
            console.log('Patient deleted successfully:', patientName);
            
            // Refresh the display with current filter
            // Get current active filter option to re-apply the filter
            const activeFilterOption = document.querySelector('[data-type="patient"].dropdown-filter-option.active');
            let currentFilter = 'all'; // default to all
            
            if (activeFilterOption) {
                currentFilter = activeFilterOption.getAttribute('data-filter');
            }
            
            // Re-apply the current filter to refresh the display while maintaining current page
            this.filterPatients(currentFilter, false, true);
        } else {
            console.error('Patient not found with ID:', patientId);
            console.log('Available patient IDs:', patients.map(p => p.id));
            this.showToast('Patient not found for deletion', 'error');
        }
    }

    // Appointment Delete Confirmation
    showDeleteAppointmentConfirmation(appointmentId) {
        const appointments = this.getStoredData('appointments') || [];
        const patients = this.getStoredData('patients') || [];
        const appointment = appointments.find(a => a.id === appointmentId);
        
        if (!appointment) {
            this.showToast('Appointment not found', 'error');
            return;
        }

        const patient = patients.find(p => p.id === appointment.patientId);
        const patientName = patient ? patient.name : 'Unknown Patient';

        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%;">
                <div class="modal-header">
                    <h3>Confirm Delete</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1.5rem;">
                    <p style="margin-bottom: 1.5rem; color: #374151; line-height: 1.5;">
                        Are you sure you want to delete appointment for <strong>"${patientName}"</strong> on <strong>${this.formatDate(appointment.date)}</strong>? 
                        This action cannot be undone.
                    </p>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-danger" onclick="window.dentalApp.confirmDeleteAppointment('${appointmentId}')">
                            Delete
                        </button>
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
    }

    confirmDeleteAppointment(appointmentId) {
        const appointments = this.getStoredData('appointments') || [];
        const patients = this.getStoredData('patients') || [];
        const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            const appointment = appointments[appointmentIndex];
            const patient = patients.find(p => p.id === appointment.patientId);
            const patientName = patient ? patient.name : 'Unknown Patient';
            
            appointments.splice(appointmentIndex, 1);
            this.setStoredData('appointments', appointments);
            
            // Close confirmation modal
            const modal = document.querySelector('.modal.active');
            if (modal) {
                modal.remove();
            }
            
            this.showToast(`Appointment for "${patientName}" deleted successfully`, 'success');
            
            // Refresh the display with current filter
            const activeFilterOption = document.querySelector('[data-type="appointment"].dropdown-filter-option.active');
            let currentFilter = 'all';
            
            if (activeFilterOption) {
                currentFilter = activeFilterOption.getAttribute('data-filter');
            }
            
            this.filterAppointments(currentFilter);
        }
    }

    // Invoice Delete Confirmation
    showDeleteInvoiceConfirmation(invoiceId) {
        const invoices = this.getStoredData('invoices') || [];
        const patients = this.getStoredData('patients') || [];
        const invoice = invoices.find(i => i.id === invoiceId);
        
        if (!invoice) {
            this.showToast('Invoice not found', 'error');
            return;
        }

        const patient = patients.find(p => p.id === invoice.patientId);
        const patientName = patient ? patient.name : 'Unknown Patient';

        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%;">
                <div class="modal-header">
                    <h3>Confirm Delete</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1.5rem;">
                    <p style="margin-bottom: 1.5rem; color: #374151; line-height: 1.5;">
                        Are you sure you want to delete invoice for <strong>"${patientName}"</strong> (${this.formatCurrency(invoice.total)})? 
                        This action cannot be undone.
                    </p>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-danger" onclick="window.dentalApp.confirmDeleteInvoice('${invoiceId}')">
                            Delete
                        </button>
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
    }

    confirmDeleteInvoice(invoiceId) {
        const invoices = this.getStoredData('invoices') || [];
        const patients = this.getStoredData('patients') || [];
        const invoiceIndex = invoices.findIndex(i => i.id === invoiceId);
        
        if (invoiceIndex !== -1) {
            const invoice = invoices[invoiceIndex];
            const patient = patients.find(p => p.id === invoice.patientId);
            const patientName = patient ? patient.name : 'Unknown Patient';
            
            invoices.splice(invoiceIndex, 1);
            this.setStoredData('invoices', invoices);
            
            // Close confirmation modal
            const modal = document.querySelector('.modal.active');
            if (modal) {
                modal.remove();
            }
            
            this.showToast(`Invoice for "${patientName}" deleted successfully`, 'success');
            
            // Refresh the display with current filter
            const activeFilterOption = document.querySelector('[data-type="billing"].dropdown-filter-option.active');
            let currentFilter = 'all';
            
            if (activeFilterOption) {
                currentFilter = activeFilterOption.getAttribute('data-filter');
            }
            
            this.filterBilling(currentFilter);
        }
    }

    // Staff Delete Confirmation
    showDeleteStaffConfirmation(staffId) {
        const staff = this.getStoredData('staff') || [];
        const staffMember = staff.find(s => s.id === staffId);
        
        if (!staffMember) {
            this.showToast('Staff member not found', 'error');
            return;
        }

        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%;">
                <div class="modal-header">
                    <h3>Confirm Delete</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1.5rem;">
                    <p style="margin-bottom: 1.5rem; color: #374151; line-height: 1.5;">
                        Are you sure you want to delete staff member <strong>"${staffMember.name}"</strong> (${staffMember.role})? 
                        This action cannot be undone.
                    </p>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-danger" onclick="window.dentalApp.confirmDeleteStaff('${staffId}')">
                            Delete
                        </button>
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
    }

    confirmDeleteStaff(staffId) {
        const staff = this.getStoredData('staff') || [];
        const staffIndex = staff.findIndex(s => s.id === staffId);
        
        if (staffIndex !== -1) {
            const staffMember = staff[staffIndex];
            staff.splice(staffIndex, 1);
            this.setStoredData('staff', staff);
            
            // Close confirmation modal
            const modal = document.querySelector('.modal.active');
            if (modal) {
                modal.remove();
            }
            
            this.showToast(`Staff member "${staffMember.name}" deleted successfully`, 'success');
            
            // Refresh the display with current filter
            const activeFilterOption = document.querySelector('[data-type="staff"].dropdown-filter-option.active');
            let currentFilter = 'all';
            
            if (activeFilterOption) {
                currentFilter = activeFilterOption.getAttribute('data-filter');
            }
            
            this.filterStaff(currentFilter);
        }
    }

    // Salary Delete Confirmation
    showDeleteSalaryConfirmation(salaryId) {
        const salaries = this.getStoredData('salaries') || [];
        const staff = this.getStoredData('staff') || [];
        const salary = salaries.find(s => s.id === salaryId);
        
        if (!salary) {
            this.showToast('Salary record not found', 'error');
            return;
        }

        const staffMember = staff.find(s => s.id === salary.staffId);
        const staffName = staffMember ? staffMember.name : 'Unknown Staff';

        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%;">
                <div class="modal-header">
                    <h3>Confirm Delete</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1.5rem;">
                    <p style="margin-bottom: 1.5rem; color: #374151; line-height: 1.5;">
                        Are you sure you want to delete salary record for <strong>"${staffName}"</strong> (${this.formatMonthName(salary.month)} ${salary.year})? 
                        This action cannot be undone.
                    </p>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-danger" onclick="window.dentalApp.confirmDeleteSalary('${salaryId}')">
                            Delete
                        </button>
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
    }

    confirmDeleteSalary(salaryId) {
        const salaries = this.getStoredData('salaries') || [];
        const staff = this.getStoredData('staff') || [];
        const salaryIndex = salaries.findIndex(s => s.id === salaryId);
        
        if (salaryIndex !== -1) {
            const salary = salaries[salaryIndex];
            const staffMember = staff.find(s => s.id === salary.staffId);
            const staffName = staffMember ? staffMember.name : 'Unknown Staff';
            
            salaries.splice(salaryIndex, 1);
            this.setStoredData('salaries', salaries);
            
            // Close confirmation modal
            const modal = document.querySelector('.modal.active');
            if (modal) {
                modal.remove();
            }
            
            this.showToast(`Salary record for "${staffName}" deleted successfully`, 'success');
            
            // Refresh the display with current filter
            const activeFilterOption = document.querySelector('[data-type="salary"].dropdown-filter-option.active');
            let currentFilter = 'all';
            
            if (activeFilterOption) {
                currentFilter = activeFilterOption.getAttribute('data-filter');
            }
            
            this.filterSalary(currentFilter);
        }
    }

    // Attendance Delete Confirmation
    showDeleteAttendanceConfirmation(attendanceId) {
        const attendance = this.getStoredData('attendance') || [];
        const staff = this.getStoredData('staff') || [];
        const attendanceRecord = attendance.find(a => a.id === attendanceId);
        
        if (!attendanceRecord) {
            this.showToast('Attendance record not found', 'error');
            return;
        }

        const staffMember = staff.find(s => s.id === attendanceRecord.staffId);
        const staffName = staffMember ? staffMember.name : 'Unknown Staff';

        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%;">
                <div class="modal-header">
                    <h3>Confirm Delete</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 1.5rem;">
                    <p style="margin-bottom: 1.5rem; color: #374151; line-height: 1.5;">
                        Are you sure you want to delete attendance record for <strong>"${staffName}"</strong> on <strong>${this.formatDate(attendanceRecord.date)}</strong>? 
                        This action cannot be undone.
                    </p>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-danger" onclick="window.dentalApp.confirmDeleteAttendance('${attendanceId}')">
                            Delete
                        </button>
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
    }

    confirmDeleteAttendance(attendanceId) {
        const attendance = this.getStoredData('attendance') || [];
        const staff = this.getStoredData('staff') || [];
        const attendanceIndex = attendance.findIndex(a => a.id === attendanceId);
        
        if (attendanceIndex !== -1) {
            const attendanceRecord = attendance[attendanceIndex];
            const staffMember = staff.find(s => s.id === attendanceRecord.staffId);
            const staffName = staffMember ? staffMember.name : 'Unknown Staff';
            
            attendance.splice(attendanceIndex, 1);
            this.setStoredData('attendance', attendance);
            
            // Close confirmation modal
            const modal = document.querySelector('.modal.active');
            if (modal) {
                modal.remove();
            }
            
            this.showToast(`Attendance record for "${staffName}" deleted successfully`, 'success');
            
            // Refresh the display with current filter
            const activeFilterOption = document.querySelector('[data-type="attendance"].dropdown-filter-option.active');
            let currentFilter = 'all';
            
            if (activeFilterOption) {
                currentFilter = activeFilterOption.getAttribute('data-filter');
            }
            
            this.filterAttendance(currentFilter);
        }
    }



    showCalendar(inputElement, selectedDate = null) {
        const currentDate = selectedDate ? new Date(selectedDate) : new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Remove any existing calendar
        const existingCalendar = document.querySelector('.calendar-dropdown');
        if (existingCalendar) {
            existingCalendar.remove();
        }
        
        // Ensure the input element is positioned relative for proper calendar positioning
        if (getComputedStyle(inputElement).position === 'static') {
            inputElement.style.position = 'relative';
        }
        
        // Create calendar dropdown
        const calendarDropdown = document.createElement('div');
        calendarDropdown.className = 'calendar-dropdown';
        
        // Position the calendar relative to the input field
        const inputRect = inputElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const calendarHeight = 350; // Approximate calendar height
        
        // Check if there's enough space below the input
        const spaceBelow = viewportHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        
        let topPosition, leftPosition;
        
        if (spaceBelow >= calendarHeight || spaceBelow > spaceAbove) {
            // Position below the input
            topPosition = inputRect.bottom + window.scrollY + 5;
        } else {
            // Position above the input
            topPosition = inputRect.top + window.scrollY - calendarHeight - 5;
        }
        
        // Ensure left position doesn't go off-screen
        leftPosition = Math.max(10, Math.min(inputRect.left + window.scrollX, window.innerWidth - 300));
        
        calendarDropdown.style.cssText = `
            position: absolute;
            top: ${topPosition}px;
            left: ${leftPosition}px;
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            min-width: 280px;
            max-width: 320px;
        `;
        
        const generateCalendarHTML = (month, year) => {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            let calendarHTML = `
                <div class="calendar-container" style="
                    padding: 1rem;
                    min-width: 280px;
                ">
                    <div class="calendar-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                    ">
                        <button class="prev-month" style="
                            background: none;
                            border: none;
                            font-size: 1rem;
                            cursor: pointer;
                            color: var(--gray-600);
                            padding: 0.25rem;
                            border-radius: var(--radius-md);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='var(--gray-100)'" onmouseout="this.style.background='transparent'">&lt;</button>
                        
                        <div class="month-year" style="
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            font-weight: 600;
                            color: var(--gray-800);
                            font-size: 1rem;
                        ">
                            <div class="month-dropdown" style="position: relative; cursor: pointer;">
                                <span class="month" style="display: flex; align-items: center; gap: 0.25rem;">
                                    ${new Date(year, month).toLocaleDateString('en-US', { month: 'long' })}
                                    <span style="color: var(--gray-500); font-size: 0.875rem;">?</span>
                                </span>
                                <div class="month-options" style="
                                    position: absolute;
                                    top: 100%;
                                    left: 0;
                                    background: var(--white);
                                    border: 1px solid var(--gray-200);
                                    border-radius: var(--radius-md);
                                    box-shadow: var(--shadow-lg);
                                    z-index: 1002;
                                    min-width: 100px;
                                    display: none;
                                    max-height: 150px;
                                    overflow-y: auto;
                                    scrollbar-width: none;
                                    -ms-overflow-style: none;
                                ">
                                    ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((monthName, index) => `
                                        <div class="month-option" data-month="${index}" style="
                                            padding: 0.375rem 0.5rem;
                                            cursor: pointer;
                                            transition: all 0.2s ease;
                                            font-size: 0.875rem;
                                            ${index === month ? 'background: var(--primary-color); color: var(--white);' : 'color: var(--gray-700);'}
                                        ">
                                            ${monthName}
                                        </div>
                                    `).join('')}
                                </div>
                </div>
                
                            <div class="year-dropdown" style="position: relative; cursor: pointer;">
                                <span class="year" style="display: flex; align-items: center; gap: 0.25rem;">
                                    ${year}
                                    <span style="color: var(--gray-500); font-size: 0.875rem;">?</span>
                                </span>
                                <div class="year-options" style="
                                    position: absolute;
                                    top: 100%;
                                    right: 0;
                                    background: var(--white);
                                    border: 1px solid var(--gray-200);
                                    border-radius: var(--radius-md);
                                    box-shadow: var(--shadow-lg);
                                    z-index: 1002;
                                    min-width: 70px;
                                    display: none;
                                    max-height: 150px;
                                    overflow-y: auto;
                                    scrollbar-width: none;
                                    -ms-overflow-style: none;
                                ">
                                    ${(() => {
                                        const currentYear = new Date().getFullYear();
                                        const years = [];
                                        
                                        // Add years from 1990 to current year - 1 (past years)
                                        for (let i = 1900; i < currentYear; i++) {
                                            years.push(i);
                                        }
                                        
                                        // Add current year in the middle
                                        years.push(currentYear);
                                        
                                        // Add years from current year + 1 to 2050 (future years)
                                        for (let i = currentYear + 1; i <= 2050; i++) {
                                            years.push(i);
                                        }
                                        
                                        return years.map(yearOption => `
                                            <div class="year-option" data-year="${yearOption}" style="
                                                padding: 0.375rem 0.5rem;
                                                cursor: pointer;
                                                transition: all 0.2s ease;
                                                font-size: 0.875rem;
                                                ${yearOption === year ? 'background: var(--primary-color); color: var(--white);' : 'color: var(--gray-700);'}
                                            ">
                                                ${yearOption}
                                            </div>
                                        `).join('');
                                    })()}
                    </div>
                    </div>
                    </div>
                        
                        <button class="next-month" style="
                            background: none;
                            border: none;
                            font-size: 1rem;
                            cursor: pointer;
                            color: var(--gray-600);
                            padding: 0.25rem;
                            border-radius: var(--radius-md);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='var(--gray-100)'" onmouseout="this.style.background='transparent'">&gt;</button>
                </div>
                
                    <div class="calendar-weekdays" style="
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 0.25rem;
                        margin-bottom: 0.75rem;
                    ">
                        <div style="text-align: center; font-weight: 600; color: var(--gray-600); font-size: 0.875rem;">Sun</div>
                        <div style="text-align: center; font-weight: 600; color: var(--gray-600); font-size: 0.875rem;">Mon</div>
                        <div style="text-align: center; font-weight: 600; color: var(--gray-600); font-size: 0.875rem;">Tue</div>
                        <div style="text-align: center; font-weight: 600; color: var(--gray-600); font-size: 0.875rem;">Wed</div>
                        <div style="text-align: center; font-weight: 600; color: var(--gray-600); font-size: 0.875rem;">Thu</div>
                        <div style="text-align: center; font-weight: 600; color: var(--gray-600); font-size: 0.875rem;">Fri</div>
                        <div style="text-align: center; font-weight: 600; color: var(--gray-600); font-size: 0.875rem;">Sat</div>
                    </div>
                    
                    <div class="calendar-days" style="
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 0.125rem;
                    ">
            `;
            
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const isCurrentMonth = date.getMonth() === month;
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && date.toDateString() === new Date(selectedDate).toDateString();
                
                let dayStyle = `
                    text-align: center;
                    padding: 0.5rem 0.25rem;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.75rem;
                    font-weight: 500;
                `;
                
                if (isSelected) {
                    dayStyle += `
                        background: var(--primary-color);
                        color: var(--white);
                        font-weight: 600;
                    `;
                } else if (isToday) {
                    dayStyle += `
                        background: var(--primary-light);
                        color: var(--primary-color);
                        font-weight: 600;
                    `;
                } else if (isCurrentMonth) {
                    dayStyle += `
                        color: var(--gray-800);
                    `;
                } else {
                    dayStyle += `
                        color: var(--gray-400);
                    `;
                }
                
                calendarHTML += `
                    <div class="calendar-day" data-date="${date.toISOString().split('T')[0]}" style="${dayStyle}">
                        ${date.getDate()}
                    </div>
                `;
            }
                
            calendarHTML += `
                </div>
                </div>
            `;
            
            return calendarHTML;
        };
        
        calendarDropdown.innerHTML = generateCalendarHTML(currentMonth, currentYear);
        
        // Append to body for proper positioning
        document.body.appendChild(calendarDropdown);
        
        // Ensure the calendar is visible and properly positioned
        setTimeout(() => {
            const calendarRect = calendarDropdown.getBoundingClientRect();
            
            // Check if calendar is off-screen and adjust if needed
            if (calendarRect.right > window.innerWidth) {
                calendarDropdown.style.left = `${window.innerWidth - calendarRect.width - 10}px`;
            }
            
            if (calendarRect.bottom > window.innerHeight) {
                calendarDropdown.style.top = `${inputRect.top + window.scrollY - calendarRect.height - 5}px`;
            }
        }, 10);
        
        // Add click outside handler to close calendar
        const closeCalendar = (e) => {
            if (!calendarDropdown.contains(e.target) && e.target !== inputElement) {
                calendarDropdown.remove();
                document.removeEventListener('click', closeCalendar);
            }
        };
        
        // Delay adding the click outside handler to avoid immediate closure
        setTimeout(() => {
            document.addEventListener('click', closeCalendar);
        }, 100);
        
        // Add global styles for dropdowns
        const globalStyles = document.createElement('style');
        globalStyles.textContent = `
            .calendar-dropdown .month-options,
            .calendar-dropdown .year-options {
                position: absolute !important;
                top: 100% !important;
                left: 0 !important;
                background: var(--white) !important;
                border: 1px solid var(--gray-200) !important;
                border-radius: var(--radius-md) !important;
                box-shadow: var(--shadow-lg) !important;
                z-index: 1002 !important;
                max-height: 200px !important;
                overflow-y: auto !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }
            
            .calendar-dropdown .month-options::-webkit-scrollbar,
            .calendar-dropdown .year-options::-webkit-scrollbar {
                display: none !important;
            }
            
            .calendar-dropdown .month-option,
            .calendar-dropdown .year-option {
                padding: 0.5rem 0.75rem !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                border: none !important;
                background: transparent !important;
                width: 100% !important;
                text-align: left !important;
                font-size: 0.875rem !important;
            }
            
            .calendar-dropdown .month-option:hover,
            .calendar-dropdown .year-option:hover {
                background: var(--gray-100) !important;
            }
            
            .calendar-dropdown .month-option.active,
            .calendar-dropdown .year-option.active {
                background: var(--primary-color) !important;
                color: var(--white) !important;
            }
        `;
        document.head.appendChild(globalStyles);
        
        // Event listeners
        const prevBtn = calendarDropdown.querySelector('.prev-month');
        const nextBtn = calendarDropdown.querySelector('.next-month');
        const days = calendarDropdown.querySelectorAll('.calendar-day');
        
        // Add hover effects and click handlers for calendar days
        days.forEach(day => {
            day.addEventListener('mouseover', function() {
                if (!this.classList.contains('selected')) {
                    this.style.background = this.classList.contains('other-month') ? 'var(--gray-100)' : 'var(--primary-light)';
                    this.style.color = this.classList.contains('other-month') ? 'var(--gray-600)' : 'var(--primary-color)';
                }
            });
            
            day.addEventListener('mouseout', function() {
                if (!this.classList.contains('selected')) {
                    this.style.background = this.classList.contains('today') ? 'var(--primary-light)' : 'transparent';
                    this.style.color = this.classList.contains('today') ? 'var(--primary-color)' : 
                                     this.classList.contains('other-month') ? 'var(--gray-400)' : 'var(--gray-800)';
                }
            });
            
            // Add click handler to select date
            day.addEventListener('click', function() {
                const selectedDate = this.getAttribute('data-date');
                if (selectedDate) {
                    inputElement.value = selectedDate;
                    calendarDropdown.remove();
                    document.removeEventListener('click', closeCalendar);
                    
                    // Trigger change event for age calculation if it's DOB
                    if (inputElement.id === 'patient-dob') {
                        const ageInput = document.getElementById('patient-age');
                        if (ageInput) {
                            const age = this.calculateAge(selectedDate);
                            ageInput.value = age;
                        }
                    }
                }
            });
        });
        
        let currentMonthIndex = currentMonth;
        let currentYearValue = currentYear;
        
        prevBtn.addEventListener('click', () => {
            currentMonthIndex--;
            if (currentMonthIndex < 0) {
                currentMonthIndex = 11;
                currentYearValue--;
            }
            
            // Update month/year display
            const monthDisplay = calendarDropdown.querySelector('.month');
            const yearDisplay = calendarDropdown.querySelector('.year');
            if (monthDisplay) {
                monthDisplay.textContent = new Date(currentYearValue, currentMonthIndex).toLocaleDateString('en-US', { month: 'long' });
            }
            if (yearDisplay) {
                yearDisplay.textContent = currentYearValue;
            }
            
            // Update only the calendar days
            const calendarDaysContainer = calendarDropdown.querySelector('.calendar-days');
            if (calendarDaysContainer) {
                calendarDaysContainer.innerHTML = this.generateCalendarDaysOnly(currentMonthIndex, currentYearValue);
                this.setupCalendarDayEventListeners(calendarDropdown, inputElement);
            }
        });
        
        nextBtn.addEventListener('click', () => {
            currentMonthIndex++;
            if (currentMonthIndex > 11) {
                currentMonthIndex = 0;
                currentYearValue++;
            }
            
            // Update month/year display
            const monthDisplay = calendarDropdown.querySelector('.month');
            const yearDisplay = calendarDropdown.querySelector('.year');
            if (monthDisplay) {
                monthDisplay.textContent = new Date(currentYearValue, currentMonthIndex).toLocaleDateString('en-US', { month: 'long' });
            }
            if (yearDisplay) {
                yearDisplay.textContent = currentYearValue;
            }
            
            // Update only the calendar days
            const calendarDaysContainer = calendarDropdown.querySelector('.calendar-days');
            if (calendarDaysContainer) {
                calendarDaysContainer.innerHTML = this.generateCalendarDaysOnly(currentMonthIndex, currentYearValue);
                this.setupCalendarDayEventListeners(calendarDropdown, inputElement);
            }
        });
        
        this.setupCalendarEventListeners(calendarDropdown, inputElement);
        this.setupCalendarDropdowns(calendarDropdown, currentMonthIndex, currentYearValue, generateCalendarHTML, inputElement);
        
        // Close dropdown when clicking anywhere
        const closeDropdown = (e) => {
            if (!inputElement.contains(e.target)) {
                calendarDropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        };
        
        // Delay adding the event listener to prevent immediate closure
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 100);
        
        // Close calendar when form modal is closed
        const closeCalendarOnFormClose = () => {
            const modal = document.getElementById('patient-modal');
            if (modal && !modal.classList.contains('active')) {
                calendarDropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        };
        
        // Monitor form modal state
        const observer = new MutationObserver(closeCalendarOnFormClose);
        const modal = document.getElementById('patient-modal');
        if (modal) {
            observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
        }
    }
    
    setupCalendarEventListeners(calendarElement, inputElement) {
        const days = calendarElement.querySelectorAll('.calendar-day');
        days.forEach(day => {
            day.addEventListener('click', () => {
                const selectedDate = day.getAttribute('data-date');
                inputElement.value = selectedDate;
                calendarElement.remove();
                
                // Trigger change event for age calculation
                if (inputElement.id === 'patient-dob') {
                    const ageInput = document.getElementById('patient-age');
                    if (ageInput) {
                        const age = this.calculateAge(selectedDate);
                        ageInput.value = age;
                    }
                }
            });
        });
    }
    
    setupCalendarDropdowns(calendarElement, currentMonth, currentYear, generateCalendarHTML, inputElement) {
        const monthDropdown = calendarElement.querySelector('.month-dropdown');
        const yearDropdown = calendarElement.querySelector('.year-dropdown');
        const monthOptions = calendarElement.querySelector('.month-options');
        const yearOptions = calendarElement.querySelector('.year-options');
        
        let currentMonthIndex = currentMonth;
        let currentYearValue = currentYear;
        
        // Month dropdown functionality
        monthDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Close year dropdown if open
            yearOptions.style.display = 'none';
            
            // Toggle month dropdown
            if (monthOptions.style.display === 'block') {
                monthOptions.style.display = 'none';
            } else {
                monthOptions.style.display = 'block';
                
                // Ensure proper positioning
                monthOptions.style.position = 'absolute';
                monthOptions.style.top = '100%';
                monthOptions.style.left = '0';
                monthOptions.style.zIndex = '1002';
            }
        });
        
        // Year dropdown functionality
        yearDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Close month dropdown if open
            monthOptions.style.display = 'none';
            
            // Toggle year dropdown
            if (yearOptions.style.display === 'block') {
                yearOptions.style.display = 'none';
            } else {
                yearOptions.style.display = 'block';
                
                // Ensure proper positioning
                yearOptions.style.position = 'absolute';
                yearOptions.style.top = '100%';
                yearOptions.style.left = '0';
                yearOptions.style.zIndex = '1002';
            }
        });
        
        // Month option selection
        monthOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('month-option')) {
                e.stopPropagation();
                const selectedMonth = parseInt(e.target.getAttribute('data-month'));
                currentMonthIndex = selectedMonth;
                monthOptions.style.display = 'none';
                
                // Update the month display and regenerate calendar content
                const monthDisplay = calendarElement.querySelector('.month');
                if (monthDisplay) {
                    monthDisplay.textContent = new Date(currentYearValue, currentMonthIndex).toLocaleDateString('en-US', { month: 'long' });
                }
                
                // Update only the calendar days, not the entire container
                const calendarDaysContainer = calendarElement.querySelector('.calendar-days');
                if (calendarDaysContainer) {
                    calendarDaysContainer.innerHTML = this.generateCalendarDaysOnly(currentMonthIndex, currentYearValue);
                    this.setupCalendarDayEventListeners(calendarElement, inputElement);
                } else {
                    // Fallback: regenerate the entire calendar if structure is different
                    calendarElement.querySelector('.calendar-container').innerHTML = generateCalendarHTML(currentMonthIndex, currentYearValue);
                    this.setupCalendarEventListeners(calendarElement, inputElement);
                }
            }
        });
        
        // Year option selection
        yearOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('year-option')) {
                e.stopPropagation();
                const selectedYear = parseInt(e.target.getAttribute('data-year'));
                currentYearValue = selectedYear;
                yearOptions.style.display = 'none';
                
                // Update the year display and regenerate calendar content
                const yearDisplay = calendarElement.querySelector('.year');
                if (yearDisplay) {
                    yearDisplay.textContent = currentYearValue;
                }
                
                // Update only the calendar days, not the entire container
                const calendarDaysContainer = calendarElement.querySelector('.calendar-days');
                if (calendarDaysContainer) {
                    calendarDaysContainer.innerHTML = this.generateCalendarDaysOnly(currentMonthIndex, currentYearValue);
                    this.setupCalendarDayEventListeners(calendarElement, inputElement);
                } else {
                    // Fallback: regenerate the entire calendar if structure is different
                    calendarElement.querySelector('.calendar-container').innerHTML = generateCalendarHTML(currentMonthIndex, currentYearValue);
                    this.setupCalendarEventListeners(calendarElement, inputElement);
                }
            }
        });
        
        // Close dropdowns when clicking outside
        const closeDropdowns = (e) => {
            if (!monthDropdown.contains(e.target) && !yearDropdown.contains(e.target)) {
                monthOptions.style.display = 'none';
                yearOptions.style.display = 'none';
            }
        };
        
        // Find the modal containing the input element
        const modal = inputElement.closest('.modal');
        
        if (modal) {
            // Add event listener to modal
            modal.addEventListener('click', closeDropdowns);
            
            // Remove event listener when modal is closed
            modal.addEventListener('remove', () => {
                modal.removeEventListener('click', closeDropdowns);
            });
        }
    }

    // Generate only the calendar days HTML (without the container structure)
    generateCalendarDaysOnly(month, year) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let calendarHTML = '';
        
        // Generate calendar days in the same format as the original function
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = false; // Will be set based on input value
            
            let dayStyle = `
                text-align: center;
                padding: 0.5rem 0.25rem;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.75rem;
                font-weight: 500;
            `;
            
            if (isSelected) {
                dayStyle += `
                    background: var(--primary-color);
                    color: var(--white);
                    font-weight: 600;
                `;
            } else if (isToday) {
                dayStyle += `
                    background: var(--primary-light);
                    color: var(--primary-color);
                    font-weight: 600;
                `;
            } else if (isCurrentMonth) {
                dayStyle += `
                    color: var(--gray-800);
                `;
            } else {
                dayStyle += `
                    color: var(--gray-400);
                `;
            }
            
            calendarHTML += `
                <div class="calendar-day" data-date="${date.toISOString().split('T')[0]}" style="${dayStyle}">
                    ${date.getDate()}
                </div>
            `;
        }
        
        return calendarHTML;
    }

    // Setup event listeners for calendar days only
    setupCalendarDayEventListeners(calendarElement, inputElement) {
        const days = calendarElement.querySelectorAll('.calendar-day');
        const self = this; // Store reference to the class instance
        
        days.forEach(day => {
            day.addEventListener('mouseover', function() {
                if (!this.classList.contains('selected')) {
                    this.style.background = this.classList.contains('other-month') ? 'var(--gray-100)' : 'var(--primary-light)';
                    this.style.color = this.classList.contains('other-month') ? 'var(--gray-600)' : 'var(--primary-color)';
                }
            });
            
            day.addEventListener('mouseout', function() {
                if (!this.classList.contains('selected')) {
                    this.style.background = this.classList.contains('today') ? 'var(--primary-light)' : 'transparent';
                    this.style.color = this.classList.contains('today') ? 'var(--primary-color)' : 
                                     this.classList.contains('other-month') ? 'var(--gray-400)' : 'var(--gray-800)';
                }
            });
            
            // Add click handler to select date
            day.addEventListener('click', function() {
                const selectedDate = this.getAttribute('data-date');
                if (selectedDate) {
                    inputElement.value = selectedDate;
                    const calendarDropdown = calendarElement.closest('.calendar-dropdown');
                    if (calendarDropdown) {
                        calendarDropdown.remove();
                    }
                    
                    // Trigger change event for age calculation if it's DOB
                    if (inputElement.id === 'patient-dob') {
                        const ageInput = document.getElementById('patient-age');
                        if (ageInput) {
                            const age = self.calculateAge(selectedDate);
                            ageInput.value = age;
                        }
                    }
                }
            });
        });
    }

    // Test function to verify billing actions are working
    testBillingActions() {
        console.log('Testing billing actions...');
        console.log('window.dentalApp exists:', !!window.dentalApp);
        console.log('viewInvoiceDetails method exists:', typeof this.viewInvoiceDetails === 'function');
        console.log('editInvoice method exists:', typeof this.editInvoice === 'function');
        console.log('printInvoice method exists:', typeof this.printInvoice === 'function');
        console.log('deleteInvoice method exists:', typeof this.deleteInvoice === 'function');
        console.log('updateInvoiceStatus method exists:', typeof this.updateInvoiceStatus === 'function');
        
        // Test with a sample invoice ID
        const invoices = this.getStoredData('invoices') || [];
        if (invoices.length > 0) {
            const testInvoiceId = invoices[0].id;
            console.log('Testing with invoice ID:', testInvoiceId);
            console.log('Sample invoice:', invoices[0]);
        } else {
            console.log('No invoices found for testing');
        }
    }

    // Enhanced Date Picker Methods
    initializeEnhancedDatePickers() {
        this.initializeAppointmentDateWithExistingCalendar();
        this.initializeCustomCalendarDropdowns();
    }

    initializeAppointmentDateWithExistingCalendar() {
        // Initialize appointment date
        this.initializeDateWithExistingCalendar('appointment-date');
        
        // Initialize billing dates
        this.initializeDateWithExistingCalendar('billing-date');
        this.initializeDateWithExistingCalendar('billing-due-date');
        
        // Initialize staff dates
        this.initializeDateWithExistingCalendar('staff-dob');
        this.initializeDateWithExistingCalendar('staff-join-date');
        
        // Initialize attendance date filter
        
        
        // Initialize salary fields
        this.initializeDateWithExistingCalendar('salary-payment-date');
        this.initializeDateWithExistingCalendar('salary-year');
    }

    initializeDateWithExistingCalendar(inputId) {
        const dateInput = document.getElementById(inputId);
        if (!dateInput) return;

        // Auto-set today's date for salary payment date
        if (inputId === 'salary-payment-date' && !dateInput.value) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
        }
        
        // Auto-set current year for salary year field
        if (inputId === 'salary-year' && !dateInput.value) {
            const currentYear = new Date().getFullYear();
            dateInput.value = currentYear;
        }

        // Remove any existing handlers first
        const dateIcon = dateInput.parentNode.querySelector('.date-icon');
        if (dateIcon) {
            // Clone and replace the icon to remove all event listeners
            const newIcon = dateIcon.cloneNode(true);
            dateIcon.parentNode.replaceChild(newIcon, dateIcon);
            
            // Add new click handler
            newIcon.style.pointerEvents = 'auto';
            newIcon.style.cursor = 'pointer';
            newIcon.setAttribute('data-click-handler-added', 'true');
            newIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showCalendar(dateInput, dateInput.value);
            });
        }
        
        // Also add click handler to the input itself for better UX
        dateInput.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showCalendar(dateInput, dateInput.value);
        });
        
        // Mark as initialized to prevent custom calendar from overriding
        dateInput.setAttribute('data-calendar-initialized', 'true');
        dateInput.setAttribute('data-uses-existing-calendar', 'true');
    }

    initializeCustomCalendarDropdowns() {
        // Add custom calendar functionality to all date inputs
        const dateInputs = document.querySelectorAll('input[type="date"]');
        
        dateInputs.forEach(input => {
            // Check if this input already has enhanced styling (appointment or patient date picker)
            const isEnhanced = input.closest('.enhanced-date-picker');
            
            // Skip if already processed
            if (input.hasAttribute('data-calendar-initialized')) {
                return;
            }
            
            // Skip date inputs that use existing calendar
            if (input.id === 'appointment-date' || 
                input.id === 'billing-date' || 
                input.id === 'billing-due-date' || 
                input.id === 'staff-dob' || 
                input.id === 'staff-join-date' || 
 
                input.id === 'salary-payment-date' || 
                input.id === 'salary-year' || 
                input.hasAttribute('data-uses-existing-calendar')) {
                input.setAttribute('data-calendar-initialized', 'true');
                return;
            }
            
            if (!isEnhanced) {
                // Only add custom calendar button for non-enhanced date inputs
                const calendarBtn = document.createElement('button');
                calendarBtn.type = 'button';
                calendarBtn.className = 'date-picker-btn';
                calendarBtn.innerHTML = '<i class="fas fa-calendar-alt"></i>';
                calendarBtn.title = 'Open Calendar';
                
                // Wrap input in enhanced container
                const wrapper = document.createElement('div');
                wrapper.className = 'date-input-enhanced';
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
                wrapper.appendChild(calendarBtn);
                
                // Handle calendar button click
                calendarBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showCustomCalendar(input);
                });
            } else {
                // For enhanced date pickers, add click handler to the existing calendar icon
                // Skip appointment date as it uses existing calendar
                if (input.id === 'appointment-date') {
                    return;
                }
                
                const dateIcon = input.parentNode.querySelector('.date-icon');
                if (dateIcon && !dateIcon.hasAttribute('data-click-handler-added')) {
                    dateIcon.style.pointerEvents = 'auto';
                    dateIcon.style.cursor = 'pointer';
                    dateIcon.setAttribute('data-click-handler-added', 'true');
                    dateIcon.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showCustomCalendar(input);
                    });
                }
            }
            
            // Mark as initialized to prevent duplicate processing
            input.setAttribute('data-calendar-initialized', 'true');
        });
    }

    showCustomCalendar(inputElement) {
        // Remove existing calendar if any
        const existingCalendar = document.querySelector('.custom-calendar-dropdown');
        if (existingCalendar) {
            existingCalendar.remove();
        }

        const currentDate = inputElement.value ? new Date(inputElement.value) : new Date();
        const calendarHTML = this.generateCustomCalendarHTML(currentDate, inputElement);
        
        const calendarElement = document.createElement('div');
        calendarElement.className = 'custom-calendar-dropdown';
        calendarElement.innerHTML = calendarHTML;
        
        // Position calendar
        const inputRect = inputElement.getBoundingClientRect();
        calendarElement.style.position = 'absolute';
        calendarElement.style.top = `${inputRect.bottom + window.scrollY + 5}px`;
        calendarElement.style.left = `${inputRect.left + window.scrollX}px`;
        calendarElement.style.width = `${inputRect.width}px`;
        
        document.body.appendChild(calendarElement);
        
        // Add event listeners
        this.addCustomCalendarEventListeners(calendarElement, inputElement);
        
        // Close calendar when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeCalendar(e) {
                if (!calendarElement.contains(e.target) && !inputElement.contains(e.target)) {
                    calendarElement.remove();
                    document.removeEventListener('click', closeCalendar);
                }
            });
        }, 100);
    }

    generateCustomCalendarHTML(date, inputElement = null) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthName = date.toLocaleDateString('en-US', { month: 'long' });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let daysHTML = '';
        const today = new Date();
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === today.toDateString();
            const isSelected = inputElement && inputElement.value && currentDate.toDateString() === new Date(inputElement.value).toDateString();
            
            let dayClass = 'custom-calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (isToday) dayClass += ' today';
            if (isSelected) dayClass += ' selected';
            
            daysHTML += `
                <button class="${dayClass}" data-date="${this.formatDateForInput(currentDate)}">
                    ${currentDate.getDate()}
                </button>
            `;
        }
        
                        return `
                    <div class="custom-calendar-header">
                        <button class="custom-calendar-nav-btn" data-action="prev">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="custom-calendar-title">${monthName} ${year}</div>
                        <button class="custom-calendar-nav-btn" data-action="next">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="custom-calendar-weekdays">
                        <div class="custom-calendar-weekday">Su</div>
                        <div class="custom-calendar-weekday">Mo</div>
                        <div class="custom-calendar-weekday">Tu</div>
                        <div class="custom-calendar-weekday">We</div>
                        <div class="custom-calendar-weekday">Th</div>
                        <div class="custom-calendar-weekday">Fr</div>
                        <div class="custom-calendar-weekday">Sa</div>
                    </div>
                    <div class="custom-calendar-days">
                        ${daysHTML}
                    </div>
                    <div class="custom-calendar-footer">
                        <button class="custom-calendar-clear-btn">Clear</button>
                        <button class="custom-calendar-today-btn">Today</button>
                    </div>
                `;
    }

    addCustomCalendarEventListeners(calendarElement, inputElement) {
        // Navigation buttons
        const prevBtn = calendarElement.querySelector('[data-action="prev"]');
        const nextBtn = calendarElement.querySelector('[data-action="next"]');
        
        prevBtn.addEventListener('click', () => {
            const currentDate = new Date(inputElement.value || new Date());
            currentDate.setMonth(currentDate.getMonth() - 1);
            this.updateCustomCalendar(calendarElement, currentDate, inputElement);
        });
        
        nextBtn.addEventListener('click', () => {
            const currentDate = new Date(inputElement.value || new Date());
            currentDate.setMonth(currentDate.getMonth() + 1);
            this.updateCustomCalendar(calendarElement, currentDate, inputElement);
        });
        
        // Day selection
        calendarElement.querySelectorAll('.custom-calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                const selectedDate = day.getAttribute('data-date');
                inputElement.value = selectedDate;
                calendarElement.remove();
                
                // Trigger change event
                inputElement.dispatchEvent(new Event('change'));
                
                // Handle age calculation for DOB
                if (inputElement.id === 'patient-dob') {
                    const ageInput = document.getElementById('patient-age');
                    if (ageInput) {
                        const age = this.calculateAge(selectedDate);
                        ageInput.value = age;
                    }
                }
            });
        });
        
        // Today button
        const todayBtn = calendarElement.querySelector('.custom-calendar-today-btn');
        todayBtn.addEventListener('click', () => {
            const today = this.formatDateForInput(new Date());
            inputElement.value = today;
            calendarElement.remove();
            inputElement.dispatchEvent(new Event('change'));
        });
        
        // Clear button
        const clearBtn = calendarElement.querySelector('.custom-calendar-clear-btn');
        clearBtn.addEventListener('click', () => {
            inputElement.value = '';
            calendarElement.remove();
            inputElement.dispatchEvent(new Event('change'));
        });
    }

    updateCustomCalendar(calendarElement, date, inputElement) {
        const newCalendarHTML = this.generateCustomCalendarHTML(date, inputElement);
        calendarElement.innerHTML = newCalendarHTML;
        this.addCustomCalendarEventListeners(calendarElement, inputElement);
    }

    getSuggestedDate(dateType) {
        const today = new Date();
        
        switch (dateType) {
            case 'today':
                return this.formatDateForInput(today);
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                return this.formatDateForInput(tomorrow);
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return this.formatDateForInput(yesterday);
            case 'next-week':
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                return this.formatDateForInput(nextWeek);
            case 'next-month':
                const nextMonth = new Date(today);
                nextMonth.setMonth(today.getMonth() + 1);
                return this.formatDateForInput(nextMonth);
            case 'last-week':
                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                return this.formatDateForInput(lastWeek);
            case 'last-month':
                const lastMonth = new Date(today);
                lastMonth.setMonth(today.getMonth() - 1);
                return this.formatDateForInput(lastMonth);
            default:
                return this.formatDateForInput(today);
        }
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Inventory Management Methods
    initializeInventory() {
        console.log('Initializing inventory...');
        this.setupInventoryEventListeners();
        this.loadInventoryData();
        this.updateInventoryStats();
        
        // Force display update
        setTimeout(() => {
            const inventory = this.getStoredData('inventory') || [];
            console.log('Forcing inventory display with:', inventory);
            this.currentInventory = inventory;
            this.displayInventory(inventory, 1);
            this.updateInventoryStats();
        }, 200);
    }

    setupInventoryEventListeners() {
        // Add New Item button
        const addNewItemBtn = document.getElementById('add-new-item-btn');
        if (addNewItemBtn) {
            addNewItemBtn.addEventListener('click', () => {
                this.showAddInventoryModal();
            });
        }

        // Inventory modal close button
        const inventoryModalClose = document.getElementById('inventory-modal-close');
        if (inventoryModalClose) {
            inventoryModalClose.addEventListener('click', () => {
                this.closeInventoryModal();
            });
        }

        // Inventory form submit
        const inventoryForm = document.getElementById('inventory-form');
        if (inventoryForm) {
            inventoryForm.addEventListener('submit', (e) => {
                this.handleInventoryFormSubmit(e);
            });
        }

        // Inventory form cancel button
        const inventoryCancelBtn = document.getElementById('inventory-cancel-btn');
        if (inventoryCancelBtn) {
            inventoryCancelBtn.addEventListener('click', () => {
                this.closeInventoryModal();
            });
        }

        // Auto-calculate total value
        const quantityInput = document.getElementById('item-quantity');
        const priceInput = document.getElementById('item-price');
        const totalValueInput = document.getElementById('item-total-value');

        if (quantityInput && priceInput && totalValueInput) {
            const calculateTotal = () => {
                const quantity = parseFloat(quantityInput.value) || 0;
                const price = parseFloat(priceInput.value) || 0;
                const total = quantity * price;
                totalValueInput.value = total.toFixed(2);
            };

            quantityInput.addEventListener('input', calculateTotal);
            priceInput.addEventListener('input', calculateTotal);
        }

        // Inventory search
        const inventorySearch = document.getElementById('inventory-search');
        if (inventorySearch) {
            inventorySearch.addEventListener('input', (e) => {
                this.searchInventory(e.target.value);
            });
        }

        // Tab switching
        const overviewBtns = document.querySelectorAll('.inventory-overview .overview-btn');
        overviewBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchInventoryTab(btn.dataset.tab));
        });

        // Usage section event listeners
        this.setupUsageEventListeners();
    }

    showAddInventoryModal() {
        const modal = document.getElementById('inventory-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Reset form
            this.resetInventoryForm();
            
            // Set default status
            const statusSelect = document.getElementById('item-status');
            if (statusSelect) {
                statusSelect.value = 'In Stock';
            }
        }
    }

    closeInventoryModal() {
        const modal = document.getElementById('inventory-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }

    resetInventoryForm() {
        const form = document.getElementById('inventory-form');
        if (form) {
            form.reset();
            
            // Reset total value
            const totalValueInput = document.getElementById('item-total-value');
            if (totalValueInput) {
                totalValueInput.value = '0.00';
            }
        }
    }

    handleInventoryFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const inventoryData = {
            id: this.isEditingInventory ? this.editingInventoryId : this.generateId('inventory'),
            name: formData.get('name'),
            category: formData.get('category'),
            description: formData.get('description'),
            unit: formData.get('unit'),
            quantity: parseFloat(formData.get('quantity')) || 0,
            price: parseFloat(formData.get('price')) || 0,
            totalValue: parseFloat(formData.get('totalValue')) || 0,
            minStock: parseFloat(formData.get('minStock')) || 0,
            supplier: formData.get('supplier'),
            location: formData.get('location'),
            expiryDate: formData.get('expiryDate'),
            status: formData.get('status') || 'In Stock',
            notes: formData.get('notes'),
            createdAt: this.isEditingInventory ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Ensure numeric values are properly set
        inventoryData.quantity = Number(inventoryData.quantity) || 0;
        inventoryData.price = Number(inventoryData.price) || 0;
        inventoryData.totalValue = Number(inventoryData.totalValue) || 0;
        inventoryData.minStock = Number(inventoryData.minStock) || 0;

        // Validate required fields
        if (!inventoryData.name || !inventoryData.category || !inventoryData.quantity || !inventoryData.price) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Save inventory item
        const inventory = this.getStoredData('inventory') || [];
        
        if (this.isEditingInventory) {
            // Update existing item
            const index = inventory.findIndex(item => item.id === this.editingInventoryId);
            if (index !== -1) {
                inventoryData.createdAt = inventory[index].createdAt;
                inventory[index] = inventoryData;
            }
        } else {
            // Add new item
            inventory.push(inventoryData);
        }
        
        this.setStoredData('inventory', inventory);
        
        // Debug: Check if data is saved
        console.log('Data saved to localStorage:', this.getStoredData('inventory'));

        // Show success message
        const action = this.isEditingInventory ? 'updated' : 'added';
        this.showToast(`Inventory item ${action} successfully`, 'success');

        // Close modal
        this.closeInventoryModal();

        // Reset edit mode
        this.isEditingInventory = false;
        this.editingInventoryId = null;

        // Update inventory display
        this.currentInventory = inventory;
        this.displayInventory(inventory, 1);
        this.updateInventoryStats();
        
        // Debug: Log the inventory data
        console.log('Inventory saved:', inventory);
        console.log('Current inventory:', this.currentInventory);
        
        // Force refresh the display
        setTimeout(() => {
            console.log('Forcing refresh after save...');
            const savedInventory = this.getStoredData('inventory') || [];
            console.log('Retrieved from storage:', savedInventory);
            this.currentInventory = savedInventory;
            this.displayInventory(savedInventory, 1);
            this.updateInventoryStats();
        }, 500);
    }

    loadInventoryData() {
        console.log('Loading inventory data...');
        const inventory = this.getStoredData('inventory') || [];
        console.log('Loaded inventory from storage:', inventory);
        this.currentInventory = inventory;
        this.displayInventory(inventory, 1);
    }

    displayInventory(inventory, currentPage = 1) {
        const inventoryList = document.getElementById('inventory-list');
        if (!inventoryList) {
            console.error('Inventory list element not found');
            return;
        }

        console.log('Displaying inventory:', inventory);
        console.log('Inventory length:', inventory.length);

        if (inventory.length === 0) {
            inventoryList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-boxes"></i>
                    <h3>No Inventory Items</h3>
                    <p>Start by adding your first inventory item.</p>
                </div>
            `;
            return;
        }

        const itemsPerPage = 10;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToShow = inventory.slice(startIndex, endIndex);

        console.log('Items to show:', itemsToShow);

        inventoryList.innerHTML = `
            <div class="inventory-summary">
                <div class="inventory-summary-left">
                    <span class="summary-label">Total Items:</span>
                    <span class="summary-count">${inventory.length}</span>
                </div>
                <div class="inventory-summary-right">
                    Showing ${startIndex + 1}-${endIndex} of ${inventory.length} items
                </div>
            </div>
            <div class="inventory-table">
                <div class="inventory-table-header">
                    <div class="table-cell">S.NO</div>
                    <div class="table-cell">NAME</div>
                    <div class="table-cell">CATEGORY</div>
                    <div class="table-cell">VENDOR</div>
                    <div class="table-cell">QUANTITY</div>
                    <div class="table-cell">UNIT</div>
                    <div class="table-cell">PRICE PER UNIT</div>
                    <div class="table-cell">ACTIONS</div>
                </div>
                ${itemsToShow.map((item, index) => `
                    <div class="inventory-table-row">
                        <div class="table-cell">
                            <span class="serial-number">${startIndex + index + 1}</span>
                        </div>
                        <div class="table-cell">
                            <span class="item-name">${item.name}</span>
                        </div>
                        <div class="table-cell">
                            <span class="item-category">${item.category || 'N/A'}</span>
                        </div>
                        <div class="table-cell">
                            <span class="item-vendor">${item.supplier || 'N/A'}</span>
                        </div>
                        <div class="table-cell">
                            <span class="item-quantity">${item.quantity || 0}</span>
                        </div>
                        <div class="table-cell">
                            <span class="item-unit">${item.unit || 'units'}</span>
                        </div>
                                                    <div class="table-cell">
                                <span class="item-price">Rs. ${Math.round(item.price || 0).toLocaleString()}</span>
                            </div>
                        <div class="table-cell">
                            <div class="table-actions">
                                <button class="action-btn view" onclick="window.dentalApp.viewInventoryItem('${item.id}')" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn edit" onclick="window.dentalApp.editInventoryItem('${item.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="window.dentalApp.deleteInventoryItem('${item.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${this.generateInventoryPagination(inventory, currentPage)}
        `;
        
        console.log('Inventory list HTML updated');
    }

    updateInventoryStats() {
        const inventory = this.getStoredData('inventory') || [];
        
        // Update total items
        const totalItemsElement = document.getElementById('total-items');
        if (totalItemsElement) {
            totalItemsElement.textContent = inventory.length;
        }

        // Update low stock items
        const lowStockItems = inventory.filter(item => 
            (item.quantity || 0) <= (item.minStock || 0) && (item.quantity || 0) > 0
        );
        const lowStockElement = document.getElementById('low-stock-items');
        if (lowStockElement) {
            lowStockElement.textContent = lowStockItems.length;
        }

        // Update out of stock items
        const outOfStockItems = inventory.filter(item => (item.quantity || 0) === 0);
        const outOfStockElement = document.getElementById('out-of-stock-items');
        if (outOfStockElement) {
            outOfStockElement.textContent = outOfStockItems.length;
        }

        // Update total inventory value
        const totalValue = inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0);
        const totalValueElement = document.getElementById('inventory-value');
        if (totalValueElement) {
            totalValueElement.textContent = `Rs. ${Math.round(totalValue).toLocaleString()}`;
        }
    }

    searchInventory(query) {
        const inventory = this.getStoredData('inventory') || [];
        const filteredInventory = inventory.filter(item => 
            (item.name || '').toLowerCase().includes(query.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(query.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(query.toLowerCase())
        );
        this.displayInventory(filteredInventory, 1);
    }

    editInventoryItem(itemId) {
        const inventory = this.getStoredData('inventory') || [];
        const item = inventory.find(i => i.id === itemId);
        
        if (!item) {
            this.showToast('Inventory item not found', 'error');
            return;
        }

        this.isEditingInventory = true;
        this.editingInventoryId = itemId;
        
        this.showAddInventoryModal();
        this.populateInventoryFormForEdit(item);
    }

    viewInventoryItem(itemId) {
        const inventory = this.getStoredData('inventory') || [];
        const item = inventory.find(i => i.id === itemId);
        
        if (!item) {
            this.showToast('Inventory item not found', 'error');
            return;
        }

        // Show item details in a simple alert for now
        const details = `
Item Details:
Name: ${item.name}
Category: ${item.category}
Description: ${item.description || 'N/A'}
Quantity: ${item.quantity || 0} ${item.unit || 'units'}
Price: Rs. ${Math.round(item.price || 0).toLocaleString()}
Total Value: Rs. ${Math.round(item.totalValue || 0).toLocaleString()}
Supplier: ${item.supplier || 'N/A'}
Location: ${item.location || 'N/A'}
Status: ${item.status || 'In Stock'}
        `;
        
        alert(details);
    }

    populateInventoryFormForEdit(item) {
        const form = document.getElementById('inventory-form');
        if (!form) return;

        // Populate form fields
        const fields = ['name', 'category', 'description', 'unit', 'quantity', 'price', 'totalValue', 'minStock', 'supplier', 'location', 'expiryDate', 'status', 'notes'];
        fields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                input.value = item[field] || '';
            }
        });

        // Update modal title
        const modalTitle = document.getElementById('inventory-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Inventory Item';
        }
    }

    deleteInventoryItem(itemId) {
        if (confirm('Are you sure you want to delete this inventory item?')) {
            const inventory = this.getStoredData('inventory') || [];
            const updatedInventory = inventory.filter(item => item.id !== itemId);
            
            this.setStoredData('inventory', updatedInventory);
            this.currentInventory = updatedInventory;
            
            this.displayInventory(updatedInventory, 1);
            this.updateInventoryStats();
            
            this.showToast('Inventory item deleted successfully', 'success');
        }
    }

    refreshInventory() {
        console.log('Manual refresh triggered...');
        const inventory = this.getStoredData('inventory') || [];
        console.log('Current inventory from storage:', inventory);
        this.currentInventory = inventory;
        this.displayInventory(inventory, 1);
        this.updateInventoryStats();
        this.showToast('Inventory refreshed', 'info');
    }

    switchInventoryTab(tabName) {
        // Update tab buttons
        const overviewBtns = document.querySelectorAll('.inventory-overview .overview-btn');
        overviewBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Show/hide content sections
        const inventoryContainer = document.querySelector('.inventory-container');
        const usageSection = document.getElementById('usage-section');

        if (tabName === 'overview') {
            if (inventoryContainer) inventoryContainer.style.display = 'block';
            if (usageSection) usageSection.style.display = 'none';
        } else if (tabName === 'usage') {
            if (inventoryContainer) inventoryContainer.style.display = 'none';
            if (usageSection) usageSection.style.display = 'block';
            this.loadUsageData();
        }
    }

    setupUsageEventListeners() {
        // Add Usage Record button
        const addUsageBtn = document.getElementById('add-usage-btn');
        if (addUsageBtn) {
            addUsageBtn.addEventListener('click', () => this.showAddUsageModal());
        }

        // Usage modal close button
        const usageModalClose = document.getElementById('usage-modal-close');
        if (usageModalClose) {
            usageModalClose.addEventListener('click', () => this.closeUsageModal());
        }

        // Usage form submit
        const usageForm = document.getElementById('usage-form');
        if (usageForm) {
            usageForm.addEventListener('submit', (e) => this.handleUsageFormSubmit(e));
        }

        // Usage form cancel button
        const usageCancelBtn = document.getElementById('usage-cancel-btn');
        if (usageCancelBtn) {
            usageCancelBtn.addEventListener('click', () => this.closeUsageModal());
        }

        // Usage search
        const usageSearch = document.getElementById('usage-search');
        if (usageSearch) {
            usageSearch.addEventListener('input', (e) => this.searchUsage(e.target.value));
        }

        // Usage item filter
        const usageItemFilter = document.getElementById('usage-item-filter');
        if (usageItemFilter) {
            usageItemFilter.addEventListener('change', (e) => this.filterUsageByItem(e.target.value));
        }
    }

    showAddUsageModal() {
        const modal = document.getElementById('usage-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Reset form
            this.resetUsageForm();
            
            // Populate item dropdown
            this.populateUsageItemDropdown();
            
            // Set default date to today
            const dateInput = document.getElementById('usage-date');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }
        }
    }

    closeUsageModal() {
        const modal = document.getElementById('usage-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }

    resetUsageForm() {
        const form = document.getElementById('usage-form');
        if (form) {
            form.reset();
        }
    }

    populateUsageItemDropdown() {
        const itemSelect = document.getElementById('usage-item');
        const filterSelect = document.getElementById('usage-item-filter');
        
        if (!itemSelect || !filterSelect) return;

        const inventory = this.getStoredData('inventory') || [];
        
        // Clear existing options
        itemSelect.innerHTML = '<option value="">Select Item</option>';
        filterSelect.innerHTML = '<option value="">All Items</option>';
        
        // Add inventory items
        inventory.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.quantity || 0} available)`;
            itemSelect.appendChild(option);
            
            const filterOption = document.createElement('option');
            filterOption.value = item.id;
            filterOption.textContent = item.name;
            filterSelect.appendChild(filterOption);
        });
    }

    handleUsageFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const usageData = {
            id: Date.now().toString(),
            itemId: formData.get('itemId'),
            quantity: parseInt(formData.get('quantity')),
            date: formData.get('date'),
            reason: formData.get('reason'),
            notes: formData.get('notes'),
            timestamp: new Date().toISOString()
        };

        // Validate quantity
        const inventory = this.getStoredData('inventory') || [];
        const item = inventory.find(i => i.id === usageData.itemId);
        
        if (!item) {
            this.showToast('Item not found', 'error');
            return;
        }

        if (usageData.quantity > (item.quantity || 0)) {
            this.showToast('Usage quantity cannot exceed available stock', 'error');
            return;
        }

        // Save usage record
        const usageRecords = this.getStoredData('usage-records') || [];
        usageRecords.push(usageData);
        this.setStoredData('usage-records', usageRecords);

        // Update inventory quantity
        item.quantity = Math.max(0, (item.quantity || 0) - usageData.quantity);
        this.setStoredData('inventory', inventory);

        // Close modal and refresh
        this.closeUsageModal();
        this.loadUsageData();
        this.updateInventoryStats();
        this.displayInventory(inventory, 1);
        
        this.showToast('Usage record added successfully', 'success');
    }

    loadUsageData() {
        const usageRecords = this.getStoredData('usage-records') || [];
        this.displayUsageRecords(usageRecords);
        this.updateUsageStats(usageRecords);
    }

    displayUsageRecords(usageRecords) {
        const usageList = document.getElementById('usage-list');
        if (!usageList) return;

        const inventory = this.getStoredData('inventory') || [];

        if (usageRecords.length === 0) {
            usageList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No Usage Records</h3>
                    <p>No usage records found. Add your first usage record to start tracking.</p>
                </div>
            `;
            return;
        }

        // Sort by date (newest first)
        const sortedRecords = usageRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        usageList.innerHTML = sortedRecords.map(record => {
            const item = inventory.find(i => i.id === record.itemId);
            const itemName = item ? item.name : 'Unknown Item';
            const reasonText = record.reason ? record.reason.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified';
            
            return `
                <div class="usage-record">
                    <div class="usage-record-info">
                        <div class="usage-item-name">${itemName}</div>
                        <div class="usage-details">
                            <span class="usage-quantity">${record.quantity} used</span>
                            <span class="usage-reason">${reasonText}</span>
                            <span class="usage-date">${new Date(record.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateUsageStats(usageRecords) {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');

        const totalRecords = usageRecords.length;
        const todayRecords = usageRecords.filter(record => record.date === today).length;
        const monthlyRecords = usageRecords.filter(record => record.date.startsWith(currentMonth)).length;

        // Update stats display
        const totalElement = document.getElementById('total-usage-records');
        const todayElement = document.getElementById('today-usage');
        const monthlyElement = document.getElementById('monthly-usage');

        if (totalElement) totalElement.textContent = totalRecords;
        if (todayElement) todayElement.textContent = todayRecords;
        if (monthlyElement) monthlyElement.textContent = monthlyRecords;
    }

    searchUsage(query) {
        const usageRecords = this.getStoredData('usage-records') || [];
        const inventory = this.getStoredData('inventory') || [];
        
        const filteredRecords = usageRecords.filter(record => {
            const item = inventory.find(i => i.id === record.itemId);
            const itemName = item ? item.name.toLowerCase() : '';
            const reason = (record.reason || '').toLowerCase();
            const notes = (record.notes || '').toLowerCase();
            
            return itemName.includes(query.toLowerCase()) || 
                   reason.includes(query.toLowerCase()) || 
                   notes.includes(query.toLowerCase());
        });

        this.displayUsageRecords(filteredRecords);
    }

    filterUsageByItem(itemId) {
        const usageRecords = this.getStoredData('usage-records') || [];
        
        if (!itemId) {
            this.displayUsageRecords(usageRecords);
            return;
        }

        const filteredRecords = usageRecords.filter(record => record.itemId === itemId);
        this.displayUsageRecords(filteredRecords);
    }

    generateInventoryPagination(inventory, currentPage) {
        const itemsPerPage = 10;
        const totalPages = Math.ceil(inventory.length / itemsPerPage);
        
        if (totalPages <= 1) return '';
        
        let paginationHTML = '<div class="pagination-container">';
        
        // Page indicator
        paginationHTML += `<div class="pagination-info">
            Page ${currentPage} of ${totalPages}
        </div>`;
        
        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="window.dentalApp.displayInventory(window.dentalApp.currentInventory, ${currentPage - 1})">
                Previous
            </button>`;
        } else {
            paginationHTML += `<button class="pagination-btn disabled">
                Previous
            </button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `<button class="pagination-btn active">${i}</button>`;
            } else {
                paginationHTML += `<button class="pagination-btn" onclick="window.dentalApp.displayInventory(window.dentalApp.currentInventory, ${i})">${i}</button>`;
            }
        }
        
        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="window.dentalApp.displayInventory(window.dentalApp.currentInventory, ${currentPage + 1})">
                Next
            </button>`;
        } else {
            paginationHTML += `<button class="pagination-btn disabled">
                Next
            </button>`;
        }
        
        paginationHTML += '</div>';
        return paginationHTML;
    }

    // Debug function to check localStorage directly
    debugInventory() {
        console.log('=== INVENTORY DEBUG ===');
        console.log('localStorage inventory:', localStorage.getItem('inventory'));
        console.log('Parsed inventory:', JSON.parse(localStorage.getItem('inventory') || '[]'));
        console.log('getStoredData inventory:', this.getStoredData('inventory'));
        console.log('currentInventory:', this.currentInventory);
        console.log('======================');
    }

    // New function that always exports all patients regardless of filter
    exportAllPatients() {
        // Always export ALL patients regardless of current filter
        let patientsToExport = this.getStoredData('patients') || [];
        
        if (patientsToExport.length === 0) {
            this.showToast('No patients to export', 'warning');
            return;
        }
        
        // Always use 'all' for filename and message
        const filterName = 'all';
        
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
        
        // Export to Excel
        const filename = `patients_${filterName}_export_${new Date().toISOString().split('T')[0]}`;
        const success = this.exportToExcel(data, headers, filename, 'Patients');
        
        if (success) {
            this.showToast(`${patientsToExport.length} all patients exported to Excel successfully`, 'success');
        }
    }

    // Clean corrupted inventory data
    cleanInventoryData() {
        console.log('Cleaning inventory data...');
        const inventory = this.getStoredData('inventory') || [];
        const cleanedInventory = inventory.filter(item => {
            // Remove items with missing required fields
            if (!item.name || !item.category) {
                console.log('Removing item with missing name/category:', item);
                return false;
            }
            
            // Ensure numeric fields are numbers
            item.quantity = Number(item.quantity) || 0;
            item.price = Number(item.price) || 0;
            item.totalValue = Number(item.totalValue) || 0;
            item.minStock = Number(item.minStock) || 0;
            
            // Ensure string fields have default values
            item.status = item.status || 'In Stock';
            item.unit = item.unit || 'units';
            item.description = item.description || '';
            item.supplier = item.supplier || '';
            item.location = item.location || '';
            item.notes = item.notes || '';
            
            return true;
        });
        
        this.setStoredData('inventory', cleanedInventory);
        this.currentInventory = cleanedInventory;
        this.displayInventory(cleanedInventory, 1);
        this.updateInventoryStats();
        this.showToast('Inventory data cleaned', 'success');
        console.log('Cleaned inventory:', cleanedInventory);
    }

    updateExportButtonText(dataType, filterType) {
        // Update export button text based on current tab and filter
        const exportBtn = document.getElementById(`export-${dataType}-btn`);
        if (!exportBtn) return;

        // Define button text for each data type
        const buttonTexts = {
            'patient': 'Export Patients',
            'appointment': 'Export Appointments',
            'billing': 'Export Billing',
            'staff': 'Export Staff',
            'attendance': 'Export Attendance',
            'salary': 'Export Salary'
        };

        // Get the base text for this data type
        let buttonText = buttonTexts[dataType] || 'Export';
        
        // If we're on a specific filter, append it to the text
        if (filterType && filterType !== 'all') {
            buttonText = buttonText.replace('Export', `Export ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`);
        }

        // Update the button text
        exportBtn.innerHTML = `<i class="fas fa-upload"></i> ${buttonText}`;
        
        // Also update the title attribute for tooltip
        exportBtn.title = buttonText;
        
        console.log('Updated export button text for', dataType, 'to:', buttonText);
    }



    // Comprehensive patient tab error handler
    handlePatientTabError(error, context) {
        console.error(`Patient tab error in ${context}:`, error);
        this.showToast(`Error in patient tab: ${error.message}`, 'error');
        
        // Try to recover by refreshing the display
        try {
            const patients = this.getStoredData('patients') || [];
            this.currentPatients = patients;
            this.displayPatients(patients, 1);
        } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
            this.showToast('Unable to recover from error', 'error');
        }
    }

    // Debug function to check patient data integrity
    debugPatientData() {
        console.log('=== DEBUGGING PATIENT DATA ===');
        const patients = this.getStoredData('patients') || [];
        console.log('Total patients:', patients.length);
        
        // Check for duplicate IDs
        const ids = patients.map(p => p.id);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
            console.error('DUPLICATE PATIENT IDs FOUND:', duplicateIds);
        }
        
        // Check for missing IDs
        const missingIds = patients.filter(p => !p.id);
        if (missingIds.length > 0) {
            console.error('PATIENTS WITH MISSING IDs:', missingIds);
        }
        
        // Log all patients with their IDs
        console.log('All patients:', patients.map(p => ({ id: p.id, name: p.name, status: p.status })));
        
        return { patients, duplicateIds, missingIds };
    }

    // Fix patient data integrity issues
    fixPatientDataIntegrity() {
        console.log('=== FIXING PATIENT DATA INTEGRITY ===');
        const patients = this.getStoredData('patients') || [];
        let fixed = false;
        
        // Fix missing IDs
        patients.forEach((patient, index) => {
            if (!patient.id) {
                patient.id = this.generateId('patient');
                console.log(`Fixed missing ID for patient ${patient.name}: ${patient.id}`);
                fixed = true;
            }
        });
        
        // Fix duplicate IDs
        const ids = patients.map(p => p.id);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
            duplicateIds.forEach(duplicateId => {
                const duplicates = patients.filter(p => p.id === duplicateId);
                duplicates.forEach((patient, index) => {
                    if (index > 0) { // Keep first one, fix others
                        patient.id = this.generateId('patient');
                        console.log(`Fixed duplicate ID for patient ${patient.name}: ${patient.id}`);
                        fixed = true;
                    }
                });
            });
        }
        
        if (fixed) {
            this.setStoredData('patients', patients);
            console.log('Patient data integrity fixed and saved');
            this.showToast('Patient data integrity issues fixed', 'success');
        } else {
            console.log('No patient data integrity issues found');
        }
        
        return fixed;
    }

    // Clean up corrupted patient data
    cleanupCorruptedPatients() {
        console.log('=== CLEANING UP CORRUPTED PATIENT DATA ===');
        const patients = this.getStoredData('patients') || [];
        const originalCount = patients.length;
        
        // Filter out corrupted patients
        const cleanPatients = patients.filter(patient => {
            return patient && 
                   typeof patient === 'object' && 
                   patient.id && 
                   patient.name && 
                   typeof patient.name === 'string' &&
                   patient.name.trim() !== '';
        });
        
        const removedCount = originalCount - cleanPatients.length;
        
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} corrupted patients`);
            this.setStoredData('patients', cleanPatients);
            this.showToast(`Cleaned up ${removedCount} corrupted patient records`, 'success');
        } else {
            console.log('No corrupted patients found');
        }
        
        return { originalCount, cleanCount: cleanPatients.length, removedCount };
    }













    // Ensure patient data consistency and fix ID sync issues
    ensurePatientDataSync() {
        console.log('=== ENSURING PATIENT DATA SYNC ===');
        
        const patients = this.getStoredData('patients') || [];
        let issuesFixed = 0;
        
        // Check for missing IDs and generate them
        patients.forEach((patient, index) => {
            if (!patient.id) {
                patient.id = this.generateId('patient');
                issuesFixed++;
                console.log(`Generated ID for patient: ${patient.name} -> ${patient.id}`);
            }
        });
        
        // Check for duplicate IDs and fix them
        const idMap = new Map();
        patients.forEach((patient, index) => {
            if (idMap.has(patient.id)) {
                const newId = this.generateId('patient');
                patient.id = newId;
                issuesFixed++;
                console.log(`Fixed duplicate ID for patient: ${patient.name} -> ${newId}`);
            } else {
                idMap.set(patient.id, patient);
            }
        });
        
        // Check for missing names and remove invalid entries
        const validPatients = patients.filter(patient => {
            if (!patient.name || typeof patient.name !== 'string' || patient.name.trim() === '') {
                console.log(`Removing patient with invalid name:`, patient);
                return false;
            }
            return true;
        });
        
        const removedCount = patients.length - validPatients.length;
        if (removedCount > 0) {
            issuesFixed += removedCount;
            console.log(`Removed ${removedCount} invalid patient entries`);
        }
        
        // Save the cleaned data
        if (issuesFixed > 0) {
            this.setStoredData('patients', validPatients);
            console.log(`Fixed ${issuesFixed} data consistency issues`);
            this.showToast(`Fixed ${issuesFixed} data consistency issues`, 'success');
        } else {
            console.log('No data consistency issues found');
        }
        
        return { issuesFixed, totalPatients: validPatients.length };
    }



    // Verify patient data consistency between storage and display
    verifyPatientDataConsistency() {
        console.log('=== VERIFYING PATIENT DATA CONSISTENCY ===');
        
        const patients = this.getStoredData('patients') || [];
        const displayedPatients = this.currentPatients || [];
        
        console.log('Patients in storage:', patients.length);
        console.log('Patients currently displayed:', displayedPatients.length);
        
        // Check for mismatches
        const mismatches = [];
        
        displayedPatients.forEach((displayedPatient, index) => {
            const storedPatient = patients.find(p => p.id === displayedPatient.id);
            if (!storedPatient) {
                mismatches.push({
                    type: 'missing_in_storage',
                    displayed: displayedPatient,
                    index
                });
            } else if (storedPatient.name !== displayedPatient.name) {
                mismatches.push({
                    type: 'name_mismatch',
                    stored: storedPatient,
                    displayed: displayedPatient,
                    index
                });
            }
        });
        
        if (mismatches.length > 0) {
            console.error('DATA CONSISTENCY ISSUES FOUND:', mismatches);
            this.showToast(`${mismatches.length} data consistency issues found`, 'warning');
        } else {
            console.log('All patient data is consistent');
        }
        
        return mismatches;
    }

    // Verify patient data across all pages
    verifyPatientDataAcrossPages() {
        console.log('=== VERIFYING PATIENT DATA ACROSS ALL PAGES ===');
        
        const allPatients = this.getStoredData('patients') || [];
        const patientsPerPage = 10;
        const totalPages = Math.ceil(allPatients.length / patientsPerPage);
        
        console.log(`Total patients: ${allPatients.length}, Total pages: ${totalPages}`);
        
        let issuesFound = 0;
        
        // Check each page
        for (let page = 1; page <= totalPages; page++) {
            const startIndex = (page - 1) * patientsPerPage;
            const endIndex = Math.min(startIndex + patientsPerPage, allPatients.length);
            const pagePatients = allPatients.slice(startIndex, endIndex);
            
            console.log(`Page ${page}: Patients ${startIndex + 1}-${endIndex}`);
            
            // Check each patient on this page
            pagePatients.forEach((patient, index) => {
                if (!patient.id || !patient.name) {
                    console.error(`Page ${page}, Patient ${index + 1}: Missing ID or name`, patient);
                    issuesFound++;
                } else {
                    console.log(`Page ${page}, Patient ${index + 1}: ${patient.name} (ID: ${patient.id})`);
                }
            });
        }
        
        if (issuesFound > 0) {
            console.error(`Found ${issuesFound} data issues across all pages`);
            this.showToast(`${issuesFound} data issues found across pages`, 'warning');
        } else {
            console.log('All patient data is consistent across all pages');
        }
        
        return { totalPages, issuesFound };
    }



    // Debug function to find why patient names are mixed up
    debugPatientNameMismatch() {
        console.log('=== DEBUGGING PATIENT NAME MISMATCH ===');
        
        const allPatients = this.getStoredData('patients') || [];
        console.log('Total patients in storage:', allPatients.length);
        
        // Look for patients with similar names or potential duplicates
        const muzammilPatients = allPatients.filter(p => 
            p.name && p.name.toLowerCase().includes('muzammil')
        );
        const kainatPatients = allPatients.filter(p => 
            p.name && p.name.toLowerCase().includes('kainat')
        );
        
        console.log('Patients with "Muzammil":', muzammilPatients);
        console.log('Patients with "Kainat":', kainatPatients);
        
        // Check for duplicate IDs
        const ids = allPatients.map(p => p.id);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicateIds.length > 0) {
            console.error('DUPLICATE IDs FOUND:', duplicateIds);
            duplicateIds.forEach(duplicateId => {
                const duplicates = allPatients.filter(p => p.id === duplicateId);
                console.error(`Patients with ID ${duplicateId}:`, duplicates);
            });
        }
        
        // Check for patients with missing or null names
        const patientsWithMissingNames = allPatients.filter(p => !p.name || p.name === '');
        if (patientsWithMissingNames.length > 0) {
            console.error('Patients with missing names:', patientsWithMissingNames);
        }
        
        // Check current page patients
        if (this.currentPatients) {
            console.log('Current page patients:', this.currentPatients.map(p => ({ id: p.id, name: p.name, status: p.status })));
        }
        
        return { muzammilPatients, kainatPatients, duplicateIds, patientsWithMissingNames };
    }

    // Change entries per page and refresh display
    changeEntriesPerPage(newEntriesPerPage) {
        console.log('=== CHANGING ENTRIES PER PAGE ===');
        console.log('New entries per page:', newEntriesPerPage);
        
        // Convert to number or 'all'
        if (newEntriesPerPage === 'all') {
            this.patientsPerPage = 'all';
        } else {
            this.patientsPerPage = parseInt(newEntriesPerPage) || 10;
        }
        
        // Save preference to localStorage
        localStorage.setItem('dentalApp_patientsPerPage', this.patientsPerPage);
        
        console.log('Updated patientsPerPage to:', this.patientsPerPage);
        
        // Refresh the display with new page size
        if (this.currentPatients) {
            this.displayPatients(this.currentPatients, 1); // Always go to page 1 when changing page size
        }
        
        this.showToast(`Now showing ${this.patientsPerPage === 'all' ? 'all' : this.patientsPerPage} patients per page`, 'success');
    }

    // Load saved entries per page preference
    loadEntriesPerPagePreference() {
        const saved = localStorage.getItem('dentalApp_patientsPerPage');
        if (saved) {
            if (saved === 'all') {
                this.patientsPerPage = 'all';
            } else {
                this.patientsPerPage = parseInt(saved) || 10;
            }
        } else {
            this.patientsPerPage = 10; // Default
        }
        console.log('Loaded entries per page preference:', this.patientsPerPage);
    }

    // NEW FUNCTION: Refresh the current patient list to ensure consistency
    refreshCurrentPatientList() {
        console.log('=== REFRESHING CURRENT PATIENT LIST ===');
        
        try {
            // Get fresh data from storage
            const allPatients = this.getStoredData('patients') || [];
            
            // Update currentPatients array with fresh data
            if (this.currentPatients && this.currentPatients.length > 0) {
                this.currentPatients = this.currentPatients.map(currentPatient => {
                    const freshPatient = allPatients.find(p => p.id === currentPatient.id);
                    return freshPatient || currentPatient;
                });
                
                console.log('Current patients list refreshed with fresh data');
                
                // Re-display the current page to show updated statuses
                const currentPage = parseInt(document.getElementById('patients-list')?.getAttribute('data-current-page') || '1');
                this.displayPatients(this.currentPatients, currentPage);
            }
        } catch (error) {
            console.error('Error refreshing current patient list:', error);
        }
    }

    // NEW FUNCTION: Toggle patient status between Active and Inactive
    togglePatientStatus(patientId) {
        try {
            // Validate patient ID
            if (!patientId || patientId === 'undefined' || patientId === 'null') {
                console.error('Invalid patient ID:', patientId);
                this.showToast('Invalid patient ID', 'error');
                return;
            }
            
            console.log('Toggling status for patient ID:', patientId);
            
            // Get current patients data
            const patients = this.getStoredData('patients') || [];
            console.log('Total patients in storage:', patients.length);
            
            // Find patient by exact ID match
            const patientIndex = patients.findIndex(p => p.id === patientId);
            console.log('Patient found at index:', patientIndex);
            
            if (patientIndex === -1) {
                console.error('Patient not found with ID:', patientId);
                console.log('Available patient IDs:', patients.map(p => p.id));
                this.showToast('Patient not found', 'error');
                return;
            }
            
            const patient = patients[patientIndex];
            console.log('Patient found:', patient.name, 'Current status:', patient.status);
            
            const currentStatus = patient.status || 'Active';
            const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
            
            // Update patient status
            patients[patientIndex].status = newStatus;
            patients[patientIndex].updatedAt = new Date().toISOString();
            
            // Save updated data
            this.setStoredData('patients', patients);
            
            // Show success message
            this.showToast(`Patient ${patient.name} status changed to ${newStatus}`, 'success');
            
            // Get current active filter to re-apply the filter
            const activeFilterOption = document.querySelector('[data-type="patient"].dropdown-filter-option.active');
            let currentFilter = 'all'; // default to all
            
            if (activeFilterOption) {
                currentFilter = activeFilterOption.getAttribute('data-filter');
            }
            
            console.log('Current active filter:', currentFilter);
            
            // Re-apply the current filter to refresh the display while maintaining current page
            this.filterPatients(currentFilter, false, true);
            
        } catch (error) {
            console.error('Error toggling patient status:', error);
            this.showToast('Error updating patient status', 'error');
        }
    }

    // Initialize import functionality
    initializeImport() {
        const importBtn = document.getElementById('import-btn');
        const fileInput = document.getElementById('import-file-input');

        if (importBtn && fileInput) {
            // Handle import button click - accept all file types
            importBtn.addEventListener('click', () => {
                // Set accept attribute to accept all supported formats
                fileInput.setAttribute('accept', '.csv,.json,.xlsx,.xls');
                fileInput.click();
            });

            // Handle file selection
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.processImportFile(file);
                }
            });
        }
    }



    // Process imported file
    async processImportFile(file) {
        try {
            const format = this.getFileFormat(file.name);
            let importedData = [];

            switch (format) {
                case 'csv':
                    importedData = await this.parseCSV(file);
                    break;
                case 'json':
                    importedData = await this.parseJSON(file);
                    break;
                case 'excel':
                    importedData = await this.parseExcel(file);
                    break;
                default:
                    throw new Error('Unsupported file format');
            }

            if (importedData && importedData.length > 0) {
                this.importPatients(importedData);
            } else {
                this.showToast('No valid data found in the file', 'warning');
            }
        } catch (error) {
            console.error('Error processing import file:', error);
            this.showToast(`Import failed: ${error.message}`, 'error');
        }
    }

    // Get file format from filename
    getFileFormat(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        if (extension === 'csv') return 'csv';
        if (extension === 'json') return 'json';
        if (['xlsx', 'xls'].includes(extension)) return 'excel';
        return 'unknown';
    }

    // Parse CSV file
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                    const data = [];

                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                            const row = {};
                            headers.forEach((header, index) => {
                                row[header] = values[index] || '';
                            });
                            data.push(row);
                        }
                    }
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid CSV format'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read CSV file'));
            reader.readAsText(file);
        });
    }

    // Parse JSON file
    async parseJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(Array.isArray(data) ? data : [data]);
                } catch (error) {
                    reject(new Error('Invalid JSON format'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read JSON file'));
            reader.readAsText(file);
        });
    }

    // Parse Excel file using SheetJS
    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        
                        // Convert to JSON with header row
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        if (jsonData.length < 2) {
                            reject(new Error('Excel file must contain at least a header row and one data row'));
                            return;
                        }
                        
                        // Convert to array of objects using first row as headers
                        const headers = jsonData[0];
                        const dataRows = jsonData.slice(1);
                        
                        const result = dataRows.map(row => {
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = row[index] || '';
                            });
                            return obj;
                        });
                        
                        resolve(result);
                    } catch (error) {
                        reject(new Error('Invalid Excel format'));
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read Excel file'));
                reader.readAsArrayBuffer(file);
            } catch (error) {
                reject(new Error('Failed to process Excel file'));
            }
        });
    }

    // Import patients with unique ID generation
    importPatients(importedData) {
        try {
            console.log('Importing patients data:', importedData);
            
            const existingPatients = this.getStoredData('patients') || [];
            const newPatients = [];
            let importedCount = 0;
            let skippedCount = 0;
            let validationErrors = [];

            importedData.forEach((row, index) => {
                console.log(`Processing row ${index + 1}:`, row);
                
                // Normalize column names to handle variations
                const normalizedRow = this.normalizeColumnNames(row);
                console.log(`Normalized row ${index + 1}:`, normalizedRow);
                
                // Validate required fields
                if (!normalizedRow.name || !normalizedRow.phone) {
                    const errorMsg = `Row ${index + 1}: Missing required fields (name: "${normalizedRow.name}", phone: "${normalizedRow.phone}")`;
                    console.warn(errorMsg);
                    validationErrors.push(errorMsg);
                    skippedCount++;
                    return;
                }

                // Check for duplicates based on phone number
                const isDuplicate = existingPatients.some(p => p.phone === normalizedRow.phone);
                if (isDuplicate) {
                    console.warn(`Skipping duplicate: ${normalizedRow.name} (phone: ${normalizedRow.phone})`);
                    skippedCount++;
                    return;
                }

                // Generate unique ID
                const uniqueId = this.generateUniquePatientId();
                
                // Create new patient object with proper structure
                const newPatient = {
                    id: uniqueId,
                    name: normalizedRow.name.trim(),
                    phone: normalizedRow.phone.trim(),
                    email: normalizedRow.email || '',
                    dob: normalizedRow.dob || normalizedRow.dateOfBirth || '',
                    age: normalizedRow.age || (normalizedRow.dob ? this.calculateAge(normalizedRow.dob) : ''),
                    gender: normalizedRow.gender || 'Other',
                    addDate: normalizedRow.addDate || normalizedRow.addedDate || new Date().toISOString().split('T')[0],
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                newPatients.push(newPatient);
                importedCount++;
            });

            if (newPatients.length > 0) {
                // Add new patients to existing data
                const updatedPatients = [...existingPatients, ...newPatients];
                this.setStoredData('patients', updatedPatients);
                
                // Update current patients list
                this.currentPatients = updatedPatients;
                
                // Show success message
                this.showToast(`Successfully imported ${importedCount} patients${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`, 'success');
                
                // Refresh the display while maintaining current page
                this.displayPatients(updatedPatients, this.currentPatientPage);
            } else {
                // Show more detailed warning with validation errors
                let warningMsg = 'No new patients were imported.';
                if (validationErrors.length > 0) {
                    warningMsg += ` Issues found: ${validationErrors.slice(0, 3).join('; ')}`;
                    if (validationErrors.length > 3) {
                        warningMsg += ` and ${validationErrors.length - 3} more...`;
                    }
                }
                this.showToast(warningMsg, 'warning');
            }

        } catch (error) {
            console.error('Error importing patients:', error);
            this.showToast(`Import failed: ${error.message}`, 'error');
        }
    }

    // Generate unique patient ID
    generateUniquePatientId() {
        const existingPatients = this.getStoredData('patients') || [];
        let newId;
        let attempts = 0;
        
        do {
            newId = 'P' + Date.now() + Math.random().toString(36).substr(2, 5);
            attempts++;
            if (attempts > 100) {
                throw new Error('Unable to generate unique ID after 100 attempts');
            }
        } while (existingPatients.some(p => p.id === newId));
        
        return newId;
    }

    // Normalize column names to handle variations in import files
    normalizeColumnNames(row) {
        const normalized = {};
        
        // Handle various possible column name variations
        const columnMappings = {
            // Name variations
            'name': ['name', 'Name', 'NAME', 'Patient Name', 'patient name', 'PATIENT NAME', 'Full Name', 'full name', 'FULL NAME'],
            'phone': ['phone', 'Phone', 'PHONE', 'Phone Number', 'phone number', 'PHONE NUMBER', 'Mobile', 'mobile', 'MOBILE', 'Contact', 'contact', 'CONTACT'],
            'email': ['email', 'Email', 'EMAIL', 'Email Address', 'email address', 'EMAIL ADDRESS', 'E-mail', 'e-mail'],
            'dob': ['dob', 'DOB', 'Date of Birth', 'date of birth', 'DATE OF BIRTH', 'Birth Date', 'birth date', 'BIRTH DATE', 'Birthday', 'birthday', 'BIRTHDAY'],
            'age': ['age', 'Age', 'AGE'],
            'gender': ['gender', 'Gender', 'GENDER', 'Sex', 'sex', 'SEX'],
            'address': ['address', 'Address', 'ADDRESS', 'Location', 'location', 'LOCATION', 'Home Address', 'home address', 'HOME ADDRESS'],
            'status': ['status', 'Status', 'STATUS', 'Patient Status', 'patient status', 'PATIENT STATUS'],
            'addDate': ['addDate', 'add date', 'ADD DATE', 'Added Date', 'added date', 'ADDED DATE', 'Registration Date', 'registration date', 'REGISTRATION DATE', 'Join Date', 'join date', 'JOIN DATE']
        };

        // Process each column mapping
        Object.keys(columnMappings).forEach(targetKey => {
            const possibleNames = columnMappings[targetKey];
            
            // Find the first matching column name in the row
            for (const possibleName of possibleNames) {
                if (row.hasOwnProperty(possibleName) && row[possibleName] !== undefined && row[possibleName] !== '') {
                    normalized[targetKey] = row[possibleName];
                    break;
                }
            }
        });

        return normalized;
    }

    // Refresh patient data
    refreshPatientData() {
        try {
            console.log('=== REFRESHING PATIENT DATA ===');
            
            // Show loading state
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('.fa-sync-alt');
                if (icon) {
                    icon.style.animation = 'spin 1s linear infinite';
                }
            }
            
            // Get fresh data from storage
            const allPatients = this.getStoredData('patients') || [];
            console.log('Total patients found in storage:', allPatients.length);
            
            // Update current patients array
            this.currentPatients = [...allPatients];
            
            // Clear any existing selection
            this.selectedPatients.clear();
            
            // Re-display patients with fresh data while maintaining current page
            this.displayPatients(allPatients, this.currentPatientPage);
            
            // Update bulk actions visibility
            this.updateBulkActionsVisibility();
            
            // Show success message
            this.showToast(`Patient data refreshed successfully. Total patients: ${allPatients.length}`, 'success');
            
            console.log('Patient data refresh completed successfully');
            
        } catch (error) {
            console.error('Error refreshing patient data:', error);
            this.showToast('Error refreshing patient data', 'error');
        } finally {
            // Stop loading animation
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('.fa-sync-alt');
                if (icon) {
                    icon.style.animation = 'none';
                }
            }
        }
    }
}

// Global functions for backward compatibility
function showSection(sectionName) {
    if (window.dentalApp) {
        window.dentalApp.showSection(sectionName);
    }
}

function showToast(message, type, duration) {
    if (window.dentalApp) {
        window.dentalApp.showToast(message, type, duration);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dentalApp = new DentalClinicApp();
    console.log('Dental Clinic App initialized');
    
    // Initialize enhanced date pickers
    setTimeout(() => {
        if (window.dentalApp && typeof window.dentalApp.initializeEnhancedDatePickers === 'function') {
            window.dentalApp.initializeEnhancedDatePickers();
        }
    }, 100);
    
    // Initialize inventory functionality
    setTimeout(() => {
        if (window.dentalApp && typeof window.dentalApp.initializeInventory === 'function') {
            window.dentalApp.initializeInventory();
        }
    }, 100);
    
    // Initialize import functionality
    setTimeout(() => {
        if (window.dentalApp && typeof window.dentalApp.initializeImport === 'function') {
            window.dentalApp.initializeImport();
        }
    }, 100);
    
    // Force inventory initialization when inventory section is shown
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-section="inventory"]')) {
            setTimeout(() => {
                if (window.dentalApp && typeof window.dentalApp.initializeInventory === 'function') {
                    console.log('Inventory menu clicked, forcing initialization...');
                    window.dentalApp.initializeInventory();
                }
            }, 200);
        }
    });
});

// Add CSS for toast slide out animation and refresh spin
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(style);



