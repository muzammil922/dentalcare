// Billing Management Module
class BillingManager {
    constructor() {
        this.invoices = [];
        this.currentInvoice = null;
        this.isEditing = false;
        this.isSaving = false; // Add flag to prevent multiple saves
        this.initialized = false; // Add flag to prevent multiple initializations
        this.lastSaveTime = 0; // Add timestamp to prevent rapid saves
        this.taxRate = 0.08; // 8% tax rate
        
        this.treatmentPrices = {
            consultation: 50,
            cleaning: 80,
            filling: 150,
            extraction: 200,
            'root-canal': 800,
            crown: 1200,
            custom: 0
        };
        
        this.init();
    }

    init() {
        // Prevent multiple initializations
        if (this.initialized) {
            console.log('BillingManager already initialized, skipping...');
            return;
        }
        
        console.log('Initializing BillingManager...');
        this.loadInvoices();
        this.setupEventListeners();
        this.setupTreatmentListeners();
        this.setupBillingStatusDropdown();
        
        // Synchronize with main app
        this.syncWithMainApp();
        
        // Only render if main app is not handling the display
        if (!window.dentalApp) {
        this.renderInvoices();
        }
        
        this.loadPatientOptions();
        this.initialized = true;
        console.log('BillingManager initialized successfully');
    }

    syncWithMainApp() {
        if (window.dentalApp) {
            // Ensure billing manager has the latest data from main app
            const mainAppInvoices = window.dentalApp.getStoredData('invoices') || [];
            console.log('Syncing with main app - Main app has', mainAppInvoices.length, 'invoices');
            console.log('Billing manager has', this.invoices.length, 'invoices');
            
            if (mainAppInvoices.length !== this.invoices.length) {
                console.log('🔄 Syncing billing data with main app...');
                this.invoices = [...mainAppInvoices]; // Create a copy to avoid reference issues
                console.log('✅ Sync completed - Billing manager now has', this.invoices.length, 'invoices');
            } else {
                console.log('✅ Data already in sync');
            }
        }
    }

    forceSyncWithMainApp() {
        if (window.dentalApp) {
            console.log('🔄 Force syncing with main app...');
            const mainAppInvoices = window.dentalApp.getStoredData('invoices') || [];
            this.invoices = [...mainAppInvoices];
            console.log('✅ Force sync completed - Billing manager now has', this.invoices.length, 'invoices');
        }
    }

    loadBilling() {
        // Delegate to main app for consistent display
        if (window.dentalApp) {
            const invoices = this.getStoredData('invoices') || [];
            window.dentalApp.currentBilling = invoices;
            window.dentalApp.displayBilling(invoices, 1);
        } else {
            this.renderInvoices();
        }
    }

    setupEventListeners() {
        console.log('=== SETTING UP BILLING EVENT LISTENERS ===');
        
        // Add new invoice button
        const addBillingBtn = document.getElementById('add-new-billing-btn');
        if (addBillingBtn) {
            // Remove existing listeners to prevent duplicates
            addBillingBtn.replaceWith(addBillingBtn.cloneNode(true));
            const newAddBillingBtn = document.getElementById('add-new-billing-btn');
            newAddBillingBtn.addEventListener('click', () => {
                console.log('Add billing button clicked');
                this.showForm();
            });
        }

        // Billing form submission - Remove existing listeners first
        const billingForm = document.getElementById('billing-form');
        if (billingForm) {
            console.log('Setting up billing form submission listener');
            // Remove existing listeners to prevent duplicates
            const newForm = billingForm.cloneNode(true);
            billingForm.parentNode.replaceChild(newForm, billingForm);
            const newBillingForm = document.getElementById('billing-form');
            
            // Prevent form submission entirely
            newBillingForm.addEventListener('submit', (e) => {
                console.log('🔄 Form submission event triggered - PREVENTED');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            });
            
            // Use save button click instead
            const saveButton = newBillingForm.querySelector('button[type="submit"], .save-btn, #save-invoice-btn');
            if (saveButton) {
                console.log('Setting up save button click listener');
                saveButton.addEventListener('click', (e) => {
                    console.log('🔄 Save button clicked');
                    e.preventDefault();
                    e.stopPropagation();
                this.saveInvoice();
            });
            }
        }

        // Modal close handlers
        const closeBtn = document.getElementById('billing-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const cancelBtn = document.getElementById('billing-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Modal backdrop click
        const modal = document.getElementById('billing-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Add treatment button
        const addTreatmentBtn = document.getElementById('add-treatment');
        if (addTreatmentBtn && !addTreatmentBtn.hasAttribute('data-listener-added')) {
            addTreatmentBtn.setAttribute('data-listener-added', 'true');
            addTreatmentBtn.addEventListener('click', () => {
                this.addTreatmentRow();
            });
        }

        // Filter handler
        const billingFilter = document.getElementById('billing-filter');
        if (billingFilter) {
            billingFilter.addEventListener('change', () => {
                this.filterInvoices();
            });
        }

        // Set default date to today and auto-calculate due date
        const dateInput = document.getElementById('billing-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
            // Auto-set due date to 1 month later
            this.setDueDateFromInvoiceDate(dateInput.value);
        }

        // Add event listener for invoice date changes
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.setDueDateFromInvoiceDate(e.target.value);
            });
        }

        // Add event listener for payment method change
        const paymentMethodSelect = document.getElementById('billing-payment-method');
        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', () => {
                this.toggleReceiptNumberField();
            });
        }

        // Add event listener for patient selection
        const patientSelect = document.getElementById('billing-patient');
        if (patientSelect) {
            patientSelect.addEventListener('change', () => {
                this.loadPatientTreatments();
            });
        }

        // Setup initial treatment row listeners
        this.setupTreatmentListeners();
        
        console.log('✅ Billing event listeners setup completed');
    }

    setupTreatmentListeners() {
        const treatmentsList = document.getElementById('treatments-list');
        if (!treatmentsList) return;

        // Event delegation for treatment changes
        treatmentsList.addEventListener('change', (e) => {
            if (e.target.classList.contains('treatment-amount') || e.target.classList.contains('treatment-discount')) {
                this.calculateTotal();
            }
        });

        treatmentsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-treatment') || e.target.closest('.btn-remove-treatment')) {
                this.removeTreatmentRow(e.target.closest('.treatment-item'));
            }
        });
    }

    showForm(invoice = null) {
        this.currentInvoice = invoice;
        this.isEditing = !!invoice;
        
        const modal = document.getElementById('billing-modal');
        const modalTitle = document.getElementById('billing-modal-title');
        const form = document.getElementById('billing-form');
        const saveButtonText = document.getElementById('billing-save-text');
        
        if (modal && modalTitle && form) {
            modalTitle.textContent = this.isEditing ? 'Edit Invoice' : 'Create New Invoice';
            
            // Update button text based on editing mode
            if (saveButtonText) {
                saveButtonText.textContent = this.isEditing ? 'Update Invoice' : 'Generate Invoice';
            }
            
            form.reset();
            
            // Reset treatments to single row
            this.resetTreatmentRows();
            
            if (this.isEditing && invoice) {
                this.fillForm(invoice);
            } else {
                // Set default values for new invoice
                const dateInput = document.getElementById('billing-date');
                const dueDateInput = document.getElementById('billing-due-date');
                
                if (dateInput) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
                if (dueDateInput) {
                    dueDateInput.value = this.calculateDueDate(new Date().toISOString().split('T')[0]);
                }
                
                // IMPORTANT: Hide receipt number field by default for ALL new invoices
                // It should only show when editing an online invoice that was marked as paid
                const receiptNumberGroup = document.getElementById('receipt-number-group');
                if (receiptNumberGroup) {
                    receiptNumberGroup.style.display = 'none';
                    console.log('✅ Hidden receipt number field for new invoice creation');
                }
                
                // Also ensure payment method is set to cash by default
                const paymentMethodSelect = document.getElementById('billing-payment-method');
                if (paymentMethodSelect) {
                    paymentMethodSelect.value = 'cash';
                    console.log('✅ Set payment method to cash by default');
                }
            }
            
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            this.calculateTotal();
            
            setTimeout(() => {
                const firstInput = form.querySelector('select, input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
    }

    fillForm(invoice) {
        // Fill basic fields
        document.getElementById('billing-patient').value = invoice.patientId || '';
        document.getElementById('billing-date').value = invoice.date || '';
        document.getElementById('billing-due-date').value = invoice.dueDate || '';
        document.getElementById('billing-status').value = invoice.status || 'Pending';
        document.getElementById('billing-payment-method').value = invoice.paymentMethod || 'cash';
        document.getElementById('billing-receipt-number').value = invoice.receiptNumber || '';
        document.getElementById('billing-notes').value = invoice.notes || '';
        
        // Toggle receipt number field visibility based on payment method
        this.toggleReceiptNumberField();
        
        // Update status dropdown
        this.updateBillingStatusOptionActive();
        
        // Fill treatments
        if (invoice.treatments && invoice.treatments.length > 0) {
            this.resetTreatmentRows();
            
            invoice.treatments.forEach((treatment, index) => {
                if (index > 0) {
                    this.addTreatmentRow();
                }
                
                const treatmentItems = document.querySelectorAll('.treatment-item');
                const currentItem = treatmentItems[index];
                
                if (currentItem) {
                    const typeSelect = currentItem.querySelector('.treatment-type');
                    const amountInput = currentItem.querySelector('.treatment-amount');
                    const discountInput = currentItem.querySelector('.treatment-discount');
                    
                    if (typeSelect) typeSelect.value = treatment.type || 'consultation';
                    if (amountInput) amountInput.value = treatment.amount || 0;
                    if (discountInput) discountInput.value = treatment.discount || 0;
                }
            });
        }
        
        this.calculateTotal();
    }

    closeModal() {
        const modal = document.getElementById('billing-modal');
        if (modal) {
            modal.classList.remove('active');
                modal.style.display = 'none';
        }
        
        this.currentInvoice = null;
        this.isEditing = false;
    }

    saveInvoice() {
        console.log('=== SAVE INVOICE CALLED ===');
        console.log('isSaving flag:', this.isSaving);
        console.log('isEditing flag:', this.isEditing);
        console.log('currentInvoice:', this.currentInvoice);
        
        // Force sync with main app to ensure we have latest data
        this.forceSyncWithMainApp();
        
        // Prevent multiple simultaneous saves
        if (this.isSaving) {
            console.log('❌ Save operation already in progress, skipping...');
            return;
        }
        
        // Prevent rapid successive saves (within 2 seconds)
        const now = Date.now();
        if (now - this.lastSaveTime < 2000) {
            console.log('❌ Save operation too recent, skipping... (last save was', now - this.lastSaveTime, 'ms ago)');
            return;
        }
        
        this.isSaving = true;
        this.lastSaveTime = now;
        console.log('✅ Set isSaving to true, lastSaveTime:', now);
        
        const form = document.getElementById('billing-form');
        if (!form) {
            console.log('❌ Form not found');
            this.isSaving = false;
            return;
        }

        const formData = new FormData(form);
        const treatments = this.getTreatmentsFromForm();
        
        console.log('Form data:', {
            patientId: formData.get('patientId'),
            date: formData.get('date'),
            treatments: treatments.length
        });
        
        if (treatments.length === 0) {
            this.showError('Please add at least one treatment');
            this.isSaving = false;
            return;
        }

        const subtotal = treatments.reduce((sum, treatment) => sum + parseFloat(treatment.amount || 0), 0);
        
        // Calculate treatment-level discounts
        const totalDiscount = treatments.reduce((sum, treatment) => {
            const treatmentAmount = parseFloat(treatment.amount || 0);
            const treatmentDiscount = parseFloat(treatment.discount || 0);
            return sum + (treatmentAmount * treatmentDiscount / 100);
        }, 0);
        
        const total = subtotal - totalDiscount;

        const invoiceData = {
            invoiceNumber: this.generateInvoiceNumber(),
            patientId: formData.get('patientId'),
            date: formData.get('date'),
            dueDate: formData.get('dueDate') || this.calculateDueDate(formData.get('date')),
            status: formData.get('status') || 'Pending',
            paymentMethod: formData.get('paymentMethod') || 'cash',
            receiptNumber: formData.get('receiptNumber') || '',
            totalDiscount: totalDiscount,
            treatments: treatments,
            subtotal: subtotal,
            total: total,
            notes: formData.get('notes')?.trim()
        };

        console.log('Invoice data prepared:', invoiceData);

        // Validation
        if (!invoiceData.patientId || !invoiceData.date) {
            this.showError('Please fill in all required fields');
            this.isSaving = false;
            return;
        }

        // Handle receipt number validation based on context
        if (this.isEditing && this.currentInvoice && this.currentInvoice.status === 'paid' && invoiceData.paymentMethod === 'online') {
            // Editing a paid online invoice - receipt number is required
            if (!invoiceData.receiptNumber || !invoiceData.receiptNumber.trim()) {
                this.showError('Receipt number is required for online payments');
                this.isSaving = false;
                return;
            }
            // Keep status as paid and add paid date
            invoiceData.status = 'paid';
            invoiceData.paidDate = this.currentInvoice.paidDate || new Date().toISOString();
            console.log('✅ Editing paid online invoice - receipt number provided, keeping status as paid');
        } else if (invoiceData.paymentMethod === 'online' && !this.isEditing) {
            // Creating new online invoice - receipt number should not be required
            // Clear any receipt number that might have been entered
            invoiceData.receiptNumber = '';
            console.log('✅ Creating new online invoice - cleared receipt number');
        } else {
            // Cash payment or other cases - clear receipt number
            invoiceData.receiptNumber = '';
            console.log('✅ Cash payment or other case - cleared receipt number');
        }

        try {
            if (this.isEditing && this.currentInvoice) {
                console.log('🔄 Updating existing invoice');
                invoiceData.id = this.currentInvoice.id;
                invoiceData.invoiceNumber = this.currentInvoice.invoiceNumber;
                invoiceData.createdAt = this.currentInvoice.createdAt;
                invoiceData.updatedAt = new Date().toISOString();
                
                // Preserve existing status if it's already paid
                if (this.currentInvoice.status === 'paid') {
                    invoiceData.status = 'paid';
                    invoiceData.paidDate = this.currentInvoice.paidDate || new Date().toISOString();
                }
                
                const index = this.invoices.findIndex(i => i.id === this.currentInvoice.id);
                if (index !== -1) {
                    this.invoices[index] = invoiceData;
                }
                
                this.showSuccess('Invoice updated successfully');
            } else {
                console.log('🆕 Creating new invoice');
                invoiceData.id = window.dentalApp ? window.dentalApp.generateId('billing') : this.generateId();
                invoiceData.createdAt = new Date().toISOString();
                invoiceData.updatedAt = new Date().toISOString();
                
                console.log('Generated ID:', invoiceData.id);
                console.log('Current invoices count before:', this.invoices.length);
                
                // Add to billing manager's invoices array
                this.invoices.push(invoiceData);
                
                console.log('Current invoices count after:', this.invoices.length);
                console.log('All invoices:', this.invoices.map(inv => inv.id));
                
                this.showSuccess('Invoice created successfully');
            }

            // Save to storage
            this.saveToStorage();
            
            // Update main app's data
            if (window.dentalApp) {
                // Update main app's current billing data
                window.dentalApp.currentBilling = this.invoices; 
                
                // Get current active filter
                const activeFilter = document.querySelector('[data-type="billing"].dropdown-filter-option.active');
                let currentFilter = 'all';
                
                if (activeFilter) {
                    currentFilter = activeFilter.getAttribute('data-filter');
                }
                
                // Only re-apply filter if it's not 'all' to avoid unnecessary toast messages
                if (currentFilter !== 'all') {
                    window.dentalApp.filterBilling(currentFilter);
                } else {
                    // Just refresh the display without showing toast
                    window.dentalApp.displayBilling(this.invoices, 1);
                }
            } else {
            this.renderInvoices();
            }
            
            this.updateDashboard();
            this.closeModal();
            
        } catch (error) {
            console.error('❌ Error saving invoice:', error);
            this.showError('Failed to save invoice');
        } finally {
            console.log('✅ Reset isSaving to false');
            this.isSaving = false;
        }
    }

    getTreatmentsFromForm() {
        const treatmentItems = document.querySelectorAll('.treatment-item');
        const treatments = [];
        
        treatmentItems.forEach(item => {
            const typeSelect = item.querySelector('.treatment-type');
            const amountInput = item.querySelector('.treatment-amount');
            const discountInput = item.querySelector('.treatment-discount');
            
            if (typeSelect && amountInput && amountInput.value) {
                const type = typeSelect.value;
                const amount = parseFloat(amountInput.value) || 0;
                const discount = parseFloat(discountInput?.value || 0);
                
                if (amount > 0) {
                    treatments.push({
                        type: type,
                        amount: amount,
                        discount: discount,
                        description: this.getTreatmentDescription(type)
                    });
                }
            }
        });
        
        return treatments;
    }

    getTreatmentDescription(type) {
        const descriptions = {
            consultation: 'Dental Consultation',
            cleaning: 'Dental Cleaning',
            filling: 'Dental Filling',
            extraction: 'Tooth Extraction',
            'root-canal': 'Root Canal Treatment',
            crown: 'Dental Crown',
            custom: 'Custom Treatment'
        };
        return descriptions[type] || 'Treatment';
    }

    addTreatmentRow(treatment = null) {
        const treatmentsList = document.getElementById('treatments-list');
        if (!treatmentsList) return;

        // Count existing treatments to get the next number
        const existingTreatments = treatmentsList.querySelectorAll('.treatment-item');
        const treatmentNumber = existingTreatments.length + 1;

        const newRow = document.createElement('div');
        newRow.className = 'treatment-item professional-treatment';
        newRow.innerHTML = `
            <div class="treatment-header">
                <span class="treatment-number">#${treatmentNumber}</span>
                <span class="treatment-label">Service Details</span>
            </div>
            <div class="treatment-content">
                <div class="form-group">
                    <label>Service Type</label>
                    <select class="treatment-type" name="treatmentType">
                        <option value="">Select a service</option>
                        <option value="consultation">Initial Consultation</option>
                        <option value="cleaning">Dental Cleaning</option>
                        <option value="filling">Cavity Filling</option>
                        <option value="extraction">Tooth Extraction</option>
                        <option value="root-canal">Root Canal Treatment</option>
                        <option value="crown">Dental Crown</option>
                        <option value="whitening">Teeth Whitening</option>
                        <option value="braces">Orthodontic Consultation</option>
                        <option value="custom">Custom Service</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount (PKR)</label>
                    <div class="amount-input-group">
                        <!-- <span class="currency-symbol">Rs.</span> -->
                        <input type="number" class="treatment-amount" name="amount" step="0.01" min="0" placeholder="0">
                </div>
                </div>
                <div class="form-group">
                    <label>Discount (%)</label>
                    <input type="number" class="treatment-discount" name="discount" min="0" max="100" step="0.01" value="0" placeholder="0">
                </div>
                <button type="button" class="btn-remove-treatment" title="Remove Service">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // If treatment data is provided, populate the fields
        if (treatment) {
            const treatmentTypeSelect = newRow.querySelector('.treatment-type');
            const amountInput = newRow.querySelector('.treatment-amount');
            
            if (treatmentTypeSelect && treatment.type) {
                treatmentTypeSelect.value = treatment.type;
            }
            if (amountInput && treatment.amount) {
                amountInput.value = treatment.amount;
            }
        }
        
        treatmentsList.appendChild(newRow);
    }

    removeTreatmentRow(treatmentItem) {
        const treatmentsList = document.getElementById('treatments-list');
        if (treatmentsList && treatmentsList.children.length > 1) {
            treatmentItem.remove();
            
            // Update treatment numbers after removal
            const remainingTreatments = treatmentsList.querySelectorAll('.treatment-item');
            remainingTreatments.forEach((item, index) => {
                const numberSpan = item.querySelector('.treatment-number');
                if (numberSpan) {
                    numberSpan.textContent = `#${index + 1}`;
                }
            });
            
            this.calculateTotal();
        }
    }

    resetTreatmentRows() {
        const treatmentsList = document.getElementById('treatments-list');
        if (!treatmentsList) return;

        treatmentsList.innerHTML = `
            <div class="treatment-item professional-treatment">
                <div class="treatment-header">
                    <span class="treatment-number">#1</span>
                    <span class="treatment-label">Service Details</span>
                </div>
                <div class="treatment-content">
                    <div class="form-group">
                        <label>Service Type</label>
                        <select class="treatment-type" name="treatmentType">
                            <option value="">Select a service</option>
                            <option value="consultation">Initial Consultation</option>
                            <option value="cleaning">Dental Cleaning</option>
                            <option value="filling">Cavity Filling</option>
                            <option value="extraction">Tooth Extraction</option>
                            <option value="root-canal">Root Canal Treatment</option>
                            <option value="crown">Dental Crown</option>
                            <option value="whitening">Teeth Whitening</option>
                            <option value="braces">Orthodontic Consultation</option>
                            <option value="custom">Custom Service</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount (PKR)</label>
                        <div class="amount-input-group">
                            <!-- <span class="currency-symbol">Rs.</span> -->
                            <input type="number" class="treatment-amount" name="amount" step="0.01" min="0" placeholder="0">
                    </div>
                    </div>
                    <div class="form-group">
                        <label>Discount (%)</label>
                        <input type="number" class="treatment-discount" name="discount" min="0" max="100" step="0.01" value="0" placeholder="0">
                    </div>
                    <button type="button" class="btn-remove-treatment" title="Remove Service">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }



    setDueDateFromInvoiceDate(invoiceDate) {
        if (!invoiceDate) return;
        
        const dueDateInput = document.getElementById('billing-due-date');
        if (dueDateInput) {
            const dueDate = this.calculateDueDate(invoiceDate, 30); // 30 days = 1 month
            dueDateInput.value = dueDate;
        }
    }

    calculateTotal() {
        const treatments = this.getTreatmentsFromForm();
        const subtotal = treatments.reduce((sum, treatment) => sum + treatment.amount, 0);
        
        // Calculate treatment-level discounts
        const totalDiscount = treatments.reduce((sum, treatment) => {
            const treatmentAmount = parseFloat(treatment.amount || 0);
            const treatmentDiscount = parseFloat(treatment.discount || 0);
            return sum + (treatmentAmount * treatmentDiscount / 100);
        }, 0);
        
        const total = subtotal - totalDiscount;
        
        // Update display
        const subtotalElement = document.getElementById('billing-subtotal');
        const discountElement = document.getElementById('billing-discount-amount');
        const totalElement = document.getElementById('billing-total');
        
        if (subtotalElement) subtotalElement.textContent = this.formatCurrency(subtotal);
        if (discountElement) discountElement.textContent = this.formatCurrency(totalDiscount);
        if (totalElement) totalElement.textContent = this.formatCurrency(total);
    }

    toggleReceiptNumberField() {
        const paymentMethod = document.getElementById('billing-payment-method');
        const receiptNumberGroup = document.getElementById('receipt-number-group');
        
        if (!paymentMethod || !receiptNumberGroup) {
            console.log('❌ Payment method select or receipt number group not found');
            return;
        }
        
        const selectedMethod = paymentMethod.value;
        console.log('🔄 Payment method changed to:', selectedMethod);
        console.log('🔄 Current editing mode:', this.isEditing);
        console.log('🔄 Current invoice:', this.currentInvoice);
        
        // Only show receipt number field if:
        // 1. We're editing an existing invoice (not creating new)
        // 2. Payment method is online
        // 3. The invoice was marked as paid (to enter receipt number)
        if (this.isEditing && selectedMethod === 'online' && this.currentInvoice && this.currentInvoice.status === 'paid') {
            console.log('✅ Showing receipt number field for editing paid online invoice');
            receiptNumberGroup.style.display = 'block';
        } else {
            console.log('✅ Hiding receipt number field (new invoice or not paid online)');
            receiptNumberGroup.style.display = 'none';
            // Clear the receipt number field when hiding
            const receiptNumberInput = document.getElementById('billing-receipt-number');
            if (receiptNumberInput) {
                receiptNumberInput.value = '';
                console.log('✅ Cleared receipt number field');
            }
        }
    }

    loadPatientTreatments() {
        const patientId = document.getElementById('billing-patient').value;
        if (!patientId) {
            this.resetTreatmentRows();
            return;
        }

        // Get appointments for this patient
        const appointments = window.dentalApp?.getStoredData('appointments') || [];
        const patientAppointments = appointments.filter(apt => apt.patientId === patientId);
        
        if (patientAppointments.length === 0) {
            this.resetTreatmentRows();
            return;
        }

        // Get unique treatments from patient's appointments
        const treatments = [];
        patientAppointments.forEach(appointment => {
            if (appointment.treatment && appointment.treatment.trim()) {
                const existingTreatment = treatments.find(t => t.type === appointment.treatment);
                if (!existingTreatment) {
                    treatments.push({
                        type: appointment.treatment,
                        duration: appointment.duration || '30 min',
                        amount: this.getTreatmentAmount(appointment.treatment)
                    });
                }
            }
        });

        if (treatments.length === 0) {
            this.resetTreatmentRows();
            return;
        }

        // Clear existing treatments and add patient's treatments
        this.resetTreatmentRows();
        
        treatments.forEach((treatment, index) => {
            if (index === 0) {
                // Update the first treatment row
                const firstRow = document.querySelector('#treatments-list .treatment-item');
                if (firstRow) {
                    const treatmentTypeSelect = firstRow.querySelector('.treatment-type');
                    const amountInput = firstRow.querySelector('.treatment-amount');
                    
                    if (treatmentTypeSelect) {
                        treatmentTypeSelect.value = treatment.type;
                    }
                    if (amountInput) {
                        amountInput.value = treatment.amount;
                    }
                }
            } else {
                // Add additional treatment rows
                this.addTreatmentRow(treatment);
            }
        });

        this.calculateTotal();
    }

    getTreatmentAmount(treatmentType) {
        // Default amounts for different treatment types
        const treatmentAmounts = {
            'consultation': 1000,
            'cleaning': 2000,
            'filling': 3000,
            'extraction': 5000,
            'root-canal': 15000,
            'crown': 12000,
            'whitening': 8000,
            'braces': 50000,
            'custom': 2000
        };
        
        return treatmentAmounts[treatmentType] || 2000;
    }

    updateInvoiceStatus(invoiceId, status) {
        const invoice = this.invoices.find(i => i.id === invoiceId);
        if (invoice) {
            invoice.status = status;
            invoice.updatedAt = new Date().toISOString();
            
            if (status === 'paid') {
                invoice.paidDate = new Date().toISOString();
                
                // Auto-open form for online invoices when marked as paid
                if (invoice.paymentMethod === 'online') {
                    setTimeout(() => {
                        this.showForm(invoice);
                    }, 500);
                }
            }
            
            this.saveToStorage();
            
            // Use the main app's display function to ensure consistent styling and pagination
            if (window.dentalApp) {
                // Get current active filter
                const activeFilter = document.querySelector('[data-type="billing"].dropdown-filter-option.active');
                let currentFilter = 'all';
                
                if (activeFilter) {
                    currentFilter = activeFilter.getAttribute('data-filter');
                }
                
                // Re-apply current filter
                window.dentalApp.filterBilling(currentFilter);
            } else {
            this.renderInvoices();
            }
            
            this.updateDashboard();
            
            this.showSuccess(`Invoice marked as ${status}`);
        }
    }

    deleteInvoice(invoiceId) {
        if (!confirm('Are you sure you want to delete this invoice?')) {
            return;
        }

        this.invoices = this.invoices.filter(i => i.id !== invoiceId);
        this.saveToStorage();
        
        // Use the main app's display function to ensure consistent styling and pagination
        if (window.dentalApp) {
            // Get current active filter
            const activeFilter = document.querySelector('[data-type="billing"].dropdown-filter-option.active');
            let currentFilter = 'all';
            
            if (activeFilter) {
                currentFilter = activeFilter.getAttribute('data-filter');
            }
            
            // Re-apply current filter
            window.dentalApp.filterBilling(currentFilter);
        } else {
        this.renderInvoices();
        }
        
        this.updateDashboard();
        this.showSuccess('Invoice deleted successfully');
    }

    filterInvoices() {
        const filter = document.getElementById('billing-filter')?.value || 'all';
        
        // Use the main app's filter function to ensure consistent styling and pagination
        if (window.dentalApp) {
            window.dentalApp.filterBilling(filter);
        } else {
        let filtered = [...this.invoices];
        
        if (filter !== 'all') {
            filtered = filtered.filter(invoice => invoice.status === filter);
        }
        
        this.renderInvoices(filtered);
        }
    }

    renderInvoices(invoicesToRender = null) {
        const billingList = document.getElementById('billing-list');
        if (!billingList) return;

        const invoices = invoicesToRender || this.invoices;
        const patients = this.getPatients().filter(p => (p.status || '').toLowerCase() === 'active');

        if (invoices.length === 0) {
            billingList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-file-invoice-dollar" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No invoices found</h3>
                    <p>Create your first invoice to start billing patients.</p>
                </div>
            `;
            return;
        }

        // Sort invoices by date (newest first)
        const sortedInvoices = invoices.sort((a, b) => new Date(b.date) - new Date(a.date));

        billingList.innerHTML = sortedInvoices.map(invoice => {
            const patient = patients.find(p => p.id === invoice.patientId);
            
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
            
            const displayStatus = getDisplayStatus(invoice);
            const statusColor = this.getStatusColor(displayStatus);
            
            return `
                <div class="invoice-card" style="background: var(--white); padding: 1.5rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--gray-200); border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                <h3 style="font-size: var(--font-size-lg); font-weight: 600; color: var(--gray-800); margin: 0;">
                                    ${invoice.invoiceNumber}
                                </h3>
                                <span class="status-badge" style="padding: 0.25rem 0.75rem; border-radius: var(--radius-md); font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; background: ${statusColor}20; color: ${statusColor};">
                                    ${displayStatus}
                                </span>
                            </div>
                            
                            <div style="margin-bottom: 1rem;">
                                <strong style="color: var(--gray-700);">Patient:</strong> 
                                ${patient ? this.escapeHtml(patient.name) : 'Unknown Patient'}
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; color: var(--gray-600); font-size: var(--font-size-sm); margin-bottom: 1rem;">
                                <div><strong>Date:</strong> ${this.formatDate(invoice.date)}</div>
                                <div><strong>Due:</strong> ${this.formatDate(invoice.dueDate)}</div>
                                <div><strong>Subtotal:</strong> ${this.formatCurrency(invoice.subtotal)}</div>
                                <div><strong>Tax:</strong> ${this.formatCurrency(invoice.tax)}</div>
                            </div>
                            
                            <div style="font-size: var(--font-size-lg); font-weight: 700; color: var(--gray-800);">
                                <strong>Total: ${this.formatCurrency(invoice.total)}</strong>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${invoice.status === 'unpaid' ? `
                                <button class="btn btn-sm btn-primary" onclick="window.billingManager.updateInvoiceStatus('${invoice.id}', 'paid')" title="Mark as Paid">
                                    <i class="fas fa-check"></i> Paid
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-secondary" onclick="window.billingManager.showForm(${this.escapeHtml(JSON.stringify(invoice))})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="window.billingManager.printInvoice('${invoice.id}')" title="Print">
                                <i class="fas fa-print"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.billingManager.deleteInvoice('${invoice.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
                        <strong style="color: var(--gray-700); font-size: var(--font-size-sm);">Treatments:</strong>
                        <div style="margin-top: 0.5rem;">
                            ${invoice.treatments.map(treatment => `
                                <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: var(--font-size-sm);">
                                    <span>${this.escapeHtml(treatment.description)}</span>
                                    <span>${this.formatCurrency(treatment.amount)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    ${invoice.notes ? `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
                            <strong style="color: var(--gray-700); font-size: var(--font-size-sm);">Notes:</strong>
                            <p style="margin: 0.25rem 0 0 0; color: var(--gray-600); font-size: var(--font-size-sm);">${this.escapeHtml(invoice.notes)}</p>
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); font-size: var(--font-size-xs); color: var(--gray-500);">
                        Created: ${this.formatDate(invoice.createdAt)}
                        ${invoice.updatedAt !== invoice.createdAt ? ` • Updated: ${this.formatDate(invoice.updatedAt)}` : ''}
                        ${invoice.paidDate ? ` • Paid: ${this.formatDate(invoice.paidDate)}` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    printInvoice(invoiceId) {
        const invoice = this.invoices.find(i => i.id === invoiceId);
        if (!invoice) return;

        const patients = this.getPatients();
        const patient = patients.find(p => p.id === invoice.patientId);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoiceNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .invoice-details { margin-bottom: 30px; }
                    .patient-details { margin-bottom: 30px; }
                    .treatments-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .treatments-table th, .treatments-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    .treatments-table th { background-color: #f5f5f5; }
                    .totals { text-align: right; margin-bottom: 30px; }
                    .totals div { margin-bottom: 8px; }
                    .total-amount { font-size: 18px; font-weight: bold; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>DentalCare Pro</h1>
                    <h2>Invoice</h2>
                </div>
                
                <div class="invoice-details">
                    <strong>Invoice Number:</strong> ${invoice.invoiceNumber}<br>
                    <strong>Date:</strong> ${this.formatDate(invoice.date)}<br>
                    <strong>Due Date:</strong> ${this.formatDate(invoice.dueDate)}<br>
                    <strong>Status:</strong> ${(() => {
                        if (invoice.status === 'paid') return 'PAID';
                        if (invoice.status === 'unpaid') {
                            const dueDate = new Date(invoice.dueDate || invoice.date);
                            const today = new Date();
                            return dueDate < today ? 'OVERDUE' : 'UNPAID';
                        }
                        return (invoice.status || 'unpaid').toUpperCase();
                    })()}
                </div>
                
                <div class="patient-details">
                    <h3>Bill To:</h3>
                    <strong>${patient ? patient.name : 'Unknown Patient'}</strong><br>
                    ${patient?.phone ? `Phone: ${patient.phone}<br>` : ''}
                    ${patient?.email ? `Email: ${patient.email}<br>` : ''}
                    ${patient?.address ? `${patient.address}<br>` : ''}
                </div>
                
                <table class="treatments-table">
                    <thead>
                        <tr>
                            <th>Treatment</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.treatments.map(treatment => `
                            <tr>
                                <td>${treatment.description}</td>
                                <td>${this.formatCurrency(treatment.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <div><strong>Subtotal: ${this.formatCurrency(invoice.subtotal)}</strong></div>
                    <div><strong>Tax (8%): ${this.formatCurrency(invoice.tax)}</strong></div>
                    <div class="total-amount"><strong>Total: ${this.formatCurrency(invoice.total)}</strong></div>
                </div>
                
                ${invoice.notes ? `
                    <div>
                        <h3>Notes:</h3>
                        <p>${invoice.notes}</p>
                    </div>
                ` : ''}
                
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    loadPatientOptions() {
        const patientSelect = document.getElementById('billing-patient');
        if (!patientSelect) return;

        const patients = this.getPatients();
        
        patientSelect.innerHTML = '<option value="">Select Patient</option>' +
            patients.map(patient => {
                return `<option value="${patient.id}">${this.escapeHtml(patient.name)} - ${this.escapeHtml(patient.phone)}</option>`;
            }).join('');
    }

    getPatients() {
        try {
            // Use the same storage system as the main app
            if (window.dentalApp) {
                return (window.dentalApp.getStoredData('patients') || []).filter(p => (p.status || '').toLowerCase() === 'active');
            } else {
            const stored = localStorage.getItem('dentalClinic_patients');
            const arr = stored ? JSON.parse(stored) : [];
            return arr.filter(p => (p.status || '').toLowerCase() === 'active');
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            return [];
        }
    }

    loadInvoices() {
        try {
            // Use the same storage system as the main app
            if (window.dentalApp) {
                this.invoices = window.dentalApp.getStoredData('invoices') || [];
            } else {
            const stored = localStorage.getItem('dentalClinic_invoices');
            this.invoices = stored ? JSON.parse(stored) : [];
            }
            console.log('Loaded invoices:', this.invoices.length);
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.invoices = [];
        }
    }

    saveToStorage() {
        try {
            // Use the same storage system as the main app
            if (window.dentalApp) {
                window.dentalApp.setStoredData('invoices', this.invoices);
            } else {
            localStorage.setItem('dentalClinic_invoices', JSON.stringify(this.invoices));
            }
            console.log('Saved invoices to storage:', this.invoices.length);
        } catch (error) {
            console.error('Error saving invoices:', error);
        }
    }

    updateDashboard() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRevenue = this.invoices
            .filter(invoice => {
                const invoiceDate = new Date(invoice.date);
                return invoiceDate.getMonth() === currentMonth && 
                       invoiceDate.getFullYear() === currentYear &&
                       invoice.status === 'paid';
            })
            .reduce((total, invoice) => total + invoice.total, 0);
        
        const monthlyRevenueElement = document.getElementById('monthly-revenue');
        if (monthlyRevenueElement) {
            monthlyRevenueElement.textContent = this.formatCurrency(monthlyRevenue);
        }
    }

    getStatusColor(status) {
        const colors = {
            paid: 'var(--success-color)',
            unpaid: 'var(--warning-color)',
            overdue: 'var(--error-color)',
            cancelled: 'var(--gray-500)'
        };
        return colors[status] || 'var(--gray-500)';
    }

    // Utility methods
    generateId() {
        // Use the main app's ID generation for consistency
        if (window.dentalApp) {
            return window.dentalApp.generateId('billing');
        }
        
        // Fallback: generate sequential ID based on existing invoices
        const existingData = this.invoices || [];
        let maxNumber = 0;
        
        existingData.forEach(item => {
            const idMatch = item.id?.match(/^b-(\d+)$/);
            if (idMatch) {
                const num = parseInt(idMatch[1]);
                if (num > maxNumber) maxNumber = num;
            }
        });
        
        const nextNumber = maxNumber + 1;
        return `b-${String(nextNumber).padStart(2, '0')}`;
    }

    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const sequence = String(this.invoices.length + 1).padStart(4, '0');
        
        return `INV-${year}${month}${day}-${sequence}`;
    }

    calculateDueDate(invoiceDate, daysToAdd = 30) {
        const date = new Date(invoiceDate);
        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString().split('T')[0];
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

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
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

    // Get revenue statistics
    getRevenueStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const paidInvoices = this.invoices.filter(i => i.status === 'paid');
        
        return {
            totalRevenue: paidInvoices.reduce((sum, i) => sum + i.total, 0),
            monthlyRevenue: paidInvoices
                .filter(i => {
                    const date = new Date(i.date);
                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                })
                .reduce((sum, i) => sum + i.total, 0),
            unpaidAmount: this.invoices
                .filter(i => i.status === 'unpaid')
                .reduce((sum, i) => sum + i.total, 0),
            overdueAmount: this.invoices
                .filter(i => i.status === 'unpaid' && new Date(i.dueDate) < now)
                .reduce((sum, i) => sum + i.total, 0)
        };
    }

    // Billing Status Dropdown Methods
    setupBillingStatusDropdown() {
        const statusInput = document.getElementById('billing-status');
        const statusOptions = document.getElementById('billing-status-options');
        
        if (statusInput && statusOptions) {
            // Show dropdown on input click
            statusInput.addEventListener('click', (e) => {
                e.preventDefault();
                statusOptions.style.display = statusOptions.style.display === 'block' ? 'none' : 'block';
            });
            
            // Handle option selection
            statusOptions.addEventListener('click', (e) => {
                if (e.target.classList.contains('status-option')) {
                    const selectedValue = e.target.getAttribute('data-value');
                    statusInput.value = selectedValue;
                    statusOptions.style.display = 'none';
                    this.updateBillingStatusOptionActive();
                }
            });
            
            // Close dropdown on outside click
            document.addEventListener('click', (e) => {
                if (!statusInput.contains(e.target) && !statusOptions.contains(e.target)) {
                    statusOptions.style.display = 'none';
                }
            });
            
            // Close dropdown on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    statusOptions.style.display = 'none';
                }
            });
        }
    }

    updateBillingStatusOptionActive() {
        const statusInput = document.getElementById('billing-status');
        const statusOptions = document.getElementById('billing-status-options');
        
        if (statusInput && statusOptions) {
            const currentValue = statusInput.value;
            const options = statusOptions.querySelectorAll('.status-option');
            
            options.forEach(option => {
                option.classList.remove('active');
                if (option.getAttribute('data-value') === currentValue) {
                    option.classList.add('active');
                }
            });
        }
    }
}