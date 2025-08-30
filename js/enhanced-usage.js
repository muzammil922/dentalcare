// Enhanced Usage Functions for Dental Care Pro
// This file extends the existing usage functionality with additional features

// Extend the dentalApp object with enhanced usage functions
if (window.dentalApp) {
    // Add enhanced usage functions to the existing dentalApp object
    Object.assign(window.dentalApp, {
        
        // Print usage record function
        printUsageRecord(usageId) {
            const usageRecords = this.getStoredData('usage-records') || [];
            const inventory = this.getStoredData('inventory') || [];
            const record = usageRecords.find(r => r.id === usageId);
            
            if (!record) {
                this.showToast('Usage record not found', 'error');
                return;
            }
            
            const item = inventory.find(i => i.id === record.itemId);
            const itemName = item ? item.name : 'Unknown Item';
            
            // Create print content
            const printContent = `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0;">Dental Care Pro</h1>
                        <h2 style="color: #666; margin: 10px 0;">Usage Record</h2>
                        <p style="color: #999; margin: 0;">Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                        <div>
                            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Item Information</h3>
                            <p><strong>Item Name:</strong> ${itemName}</p>
                            <p><strong>Quantity Used:</strong> ${record.quantity} ${item ? (item.unit || 'units') : 'units'}</p>
                            <p><strong>Current Stock:</strong> ${item ? (item.quantity || 0) : 0} ${item ? (item.unit || 'units') : 'units'}</p>
                        </div>
                        <div>
                            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Usage Details</h3>
                            <p><strong>Date:</strong> ${new Date(record.date).toLocaleDateString()}</p>
                            <p><strong>Reason:</strong> ${record.reason ? record.reason.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}</p>
                            <p><strong>Notes:</strong> ${record.notes || 'None'}</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
                        <p>This is an official usage record from Dental Care Pro</p>
                    </div>
                </div>
            `;
            
            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
            
            this.showToast('Print window opened', 'info');
        },
        
        // View usage details function
        viewUsageDetails(usageId) {
            const usageRecords = this.getStoredData('usage-records') || [];
            const inventory = this.getStoredData('inventory') || [];
            const record = usageRecords.find(r => r.id === usageId);
            
            if (!record) {
                this.showToast('Usage record not found', 'error');
                return;
            }
            
            const item = inventory.find(i => i.id === record.itemId);
            const itemName = item ? item.name : 'Unknown Item';
            const currentStock = item ? (item.quantity || 0) : 0;
            
            // Determine stock status
            let stockStatus = '';
            let statusColor = '';
            let statusBgColor = '';
            
            if (currentStock === 0) {
                stockStatus = 'Out of Stock';
                statusColor = 'var(--white)';
                statusBgColor = 'var(--error-color)';
            } else if (currentStock <= 5) {
                stockStatus = 'Low Stock';
                statusColor = 'var(--white)';
                statusBgColor = 'var(--warning-color)';
            } else if (currentStock <= 10) {
                stockStatus = 'Medium Stock';
                statusColor = 'var(--white)';
                statusBgColor = 'var(--info-color)';
            } else {
                stockStatus = 'In Stock';
                statusColor = 'var(--white)';
                statusBgColor = 'var(--success-color)';
            }
            
            // Create modal content
            const modalContent = `
                <div class="modal" id="usage-details-modal" style="display: flex; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
                    <div class="modal-content" style="background-color: var(--white); margin: auto; padding: 0; border-radius: var(--radius-lg); width: 90%; max-width: 600px; box-shadow: var(--shadow-xl);">
                        <div class="modal-header" style="padding: 1.5rem; border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; color: var(--gray-800);">Usage Record Details</h3>
                            <span class="close" onclick="document.getElementById('usage-details-modal').remove()" style="color: var(--gray-500); font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                        </div>
                        <div style="padding: 1.5rem;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                                <div>
                                    <h4 style="color: var(--gray-700); margin-bottom: 1rem; border-bottom: 1px solid var(--gray-200); padding-bottom: 0.5rem;">Item Information</h4>
                                    <p style="margin: 0.5rem 0;"><strong>Item Name:</strong> ${this.escapeHtml ? this.escapeHtml(itemName) : itemName}</p>
                                    <p style="margin: 0.5rem 0;"><strong>Quantity Used:</strong> ${record.quantity} ${item ? (item.unit || 'units') : 'units'}</p>
                                    <p style="margin: 0.5rem 0;"><strong>Current Stock:</strong> ${currentStock} ${item ? (item.unit || 'units') : 'units'}</p>
                                    <p style="margin: 0.5rem 0;"><strong>Stock Status:</strong> 
                                        <span style="padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 500; color: ${statusColor}; background: ${statusBgColor};">
                                            ${stockStatus}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <h4 style="color: var(--gray-700); margin-bottom: 1rem; border-bottom: 1px solid var(--gray-200); padding-bottom: 0.5rem;">Usage Details</h4>
                                    <p style="margin: 0.5rem 0;"><strong>Date:</strong> ${new Date(record.date).toLocaleDateString()}</p>
                                    <p style="margin: 0.5rem 0;"><strong>Reason:</strong> ${record.reason ? record.reason.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}</p>
                                    <p style="margin: 0.5rem 0;"><strong>Record ID:</strong> ${record.id}</p>
                                    <p style="margin: 0.5rem 0;"><strong>Created:</strong> ${new Date(record.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            ${record.notes ? `
                                <div style="margin-bottom: 2rem;">
                                    <h4 style="color: var(--gray-700); margin-bottom: 1rem; border-bottom: 1px solid var(--gray-200); padding-bottom: 0.5rem;">Notes</h4>
                                    <p style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); margin: 0;">${this.escapeHtml ? this.escapeHtml(record.notes) : record.notes}</p>
                                </div>
                            ` : ''}
                            
                            <div style="display: flex; gap: 1rem; justify-content: flex-end; border-top: 1px solid var(--gray-200); padding-top: 1.5rem;">
                                <button onclick="window.dentalApp.printUsageRecord('${record.id}')" style="padding: 0.75rem 1.5rem; background: var(--success-color); color: var(--white); border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500; transition: all 0.2s ease;">
                                    <i class="fas fa-print" style="margin-right: 0.5rem;"></i>Print
                                </button>
                                <button onclick="window.dentalApp.editUsage('${record.id}')" style="padding: 0.75rem 1.5rem; background: var(--primary-color); color: var(--white); border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500; transition: all 0.2s ease;">
                                    <i class="fas fa-edit" style="margin-right: 0.5rem;"></i>Edit
                                </button>
                                <button onclick="document.getElementById('usage-details-modal').remove()" style="padding: 0.75rem 1.5rem; background: var(--gray-500); color: var(--white); border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500; transition: all 0.2s ease;">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalContent);
        },
        
        // Edit usage function
        editUsage(usageId) {
            const usageRecords = this.getStoredData('usage-records') || [];
            const record = usageRecords.find(r => r.id === usageId);
            
            if (!record) {
                this.showToast('Usage record not found', 'error');
                return;
            }
            
            // Populate the usage modal with existing data
            const modal = document.getElementById('usage-modal');
            const form = document.getElementById('usage-form');
            
            if (modal && form) {
                modal.style.display = 'flex';
                modal.classList.add('active');
                
                // Update modal title
                const title = document.querySelector('#usage-modal .modal-header h3');
                if (title) title.textContent = 'Edit Usage Record';
                
                // Populate form fields
                const itemSelect = document.getElementById('usage-item');
                const quantityInput = document.getElementById('usage-quantity');
                const dateInput = document.getElementById('usage-date');
                const reasonSelect = document.getElementById('usage-reason');
                const notesTextarea = document.getElementById('usage-notes');
                
                if (itemSelect) itemSelect.value = record.itemId;
                if (quantityInput) quantityInput.value = record.quantity;
                if (dateInput) dateInput.value = record.date;
                if (reasonSelect) reasonSelect.value = record.reason || '';
                if (notesTextarea) notesTextarea.value = record.notes || '';
                
                // Update form submit handler
                form.onsubmit = (e) => this.handleEditUsageSubmit(e, usageId);
                
                // Update submit button text
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Update Usage Record';
            }
        },
        
        // Handle edit usage submit
        handleEditUsageSubmit(e, usageId) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const updatedData = {
                itemId: formData.get('itemId'),
                quantity: parseInt(formData.get('quantity')),
                date: formData.get('date'),
                reason: formData.get('reason'),
                notes: formData.get('notes')
            };

            // Validate quantity
            const inventory = this.getStoredData('inventory') || [];
            const item = inventory.find(i => i.id === updatedData.itemId);
            
            if (!item) {
                this.showToast('Item not found', 'error');
                return;
            }

            // Get original usage record to calculate quantity difference
            const usageRecords = this.getStoredData('usage-records') || [];
            const originalRecord = usageRecords.find(r => r.id === usageId);
            
            if (!originalRecord) {
                this.showToast('Original usage record not found', 'error');
                return;
            }
            
            // Calculate new stock level (add back original quantity, subtract new quantity)
            const quantityDifference = originalRecord.quantity - updatedData.quantity;
            const newStockLevel = (item.quantity || 0) + quantityDifference;
            
            if (newStockLevel < 0) {
                this.showToast('Cannot reduce stock below zero', 'error');
                return;
            }

            // Update usage record
            const recordIndex = usageRecords.findIndex(r => r.id === usageId);
            if (recordIndex !== -1) {
                usageRecords[recordIndex] = {
                    ...usageRecords[recordIndex],
                    ...updatedData,
                    timestamp: new Date().toISOString()
                };
                this.setStoredData('usage-records', usageRecords);
            }

            // Update inventory quantity
            item.quantity = newStockLevel;
            this.setStoredData('inventory', inventory);

            // Close modal and refresh
            this.closeUsageModal();
            this.loadUsageData();
            this.updateInventoryStats();
            this.displayInventory(inventory, 1);
            
            this.showToast('Usage record updated successfully', 'success');
        }
    });
}

// Enhanced display function for usage records with stock status
function enhanceUsageDisplay() {
    if (!window.dentalApp) return;
    
    // Override the displayUsageRecords function to include stock status
    const originalDisplayUsageRecords = window.dentalApp.displayUsageRecords;
    
    window.dentalApp.displayUsageRecords = function(usageRecords, currentPage = 1) {
        const usageList = document.getElementById('usage-list');
        if (!usageList) return;

        const inventory = this.getStoredData('inventory') || [];
        
        // Initialize usage per page if not set
        if (!this.usagePerPage) {
            this.usagePerPage = 25;
        }
        
        // Update current page tracking
        this.currentUsagePage = currentPage;

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
        
        // Pagination
        const totalPages = Math.ceil(sortedRecords.length / this.usagePerPage);
        const startIndex = (currentPage - 1) * this.usagePerPage;
        const endIndex = Math.min(startIndex + this.usagePerPage, sortedRecords.length);
        const currentRecords = sortedRecords.slice(startIndex, endIndex);
        
        // Fix pagination edge cases
        if (totalPages === 0) {
            usageList.innerHTML = '<p class="text-center" style="color: var(--gray-500); padding: 2rem;">No usage records found</p>';
            return;
        }
        
        // Ensure currentPage is within valid range
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;

        // Create enhanced table layout
        const usageHTML = `
            <div class="usage-grid-container" style="background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 1.5rem; margin-bottom: 1rem;">
                <!-- Count Display -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem 0; border-bottom: 1px solid var(--gray-200); margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="color: var(--gray-700); font-weight: 600; font-size: 1rem;">
                            Total Usage Records: <span style="color: var(--primary-color);">${usageRecords.length}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="color: var(--gray-600); font-size: 0.875rem;">
                            Showing ${startIndex + 1}-${Math.min(endIndex, usageRecords.length)} of ${usageRecords.length} usage
                        </div>
                        
                        <button id="delete-all-usage-btn" onclick="window.dentalApp.showDeleteAllUsageConfirmation()" style="padding: 0.5rem 1rem; background: var(--error-color); color: var(--white); border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500; transition: all 0.2s ease; display: none;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                            <i class="fas fa-trash-alt" style="margin-right: 0.5rem;"></i>
                            Delete Selected
                        </button>
                    </div>
                </div>
                
                <!-- Table Header -->
                <div class="usage-table-header" style="display: grid; grid-template-columns: 50px 1fr 150px 120px 120px 150px; gap: 1rem; padding: 1rem; background: var(--gray-50); border-bottom: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-700); align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" id="select-all-usage" onchange="window.dentalApp.toggleSelectAllUsage(this.checked)" style="width: 14px; height: 14px; cursor: pointer;">
                        <span style="font-size: 0.875rem; color: var(--primary-color);">#</span>
                    </div>
                    <div style="font-size: 0.875rem; color: var(--primary-color);">ITEM & STATUS</div>
                    <div style="font-size: 0.875rem; color: var(--primary-color);">QUANTITY</div>
                    <div style="font-size: 0.875rem; color: var(--primary-color);">REASON</div>
                    <div style="font-size: 0.875rem; color: var(--primary-color);">DATE</div>
                    <div style="font-size: 0.875rem; color: var(--primary-color); text-align: center;">ACTIONS</div>
                </div>
                
                <!-- Usage Rows -->
                ${currentRecords.map((record, index) => {
                    const item = inventory.find(i => i.id === record.itemId);
                    const itemName = item ? item.name : 'Unknown Item';
                    const currentStock = item ? (item.quantity || 0) : 0;
                    const reasonText = record.reason ? record.reason.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified';
                    const globalIndex = startIndex + index;
                    
                    // Determine stock status
                    let stockStatus = '';
                    let statusColor = '';
                    let statusBgColor = '';
                    
                    if (currentStock === 0) {
                        stockStatus = 'Out of Stock';
                        statusColor = 'var(--white)';
                        statusBgColor = 'var(--error-color)';
                    } else if (currentStock <= 5) {
                        stockStatus = 'Low Stock';
                        statusColor = 'var(--white)';
                        statusBgColor = 'var(--warning-color)';
                    } else if (currentStock <= 10) {
                        stockStatus = 'Medium Stock';
                        statusColor = 'var(--white)';
                        statusBgColor = 'var(--info-color)';
                    } else {
                        stockStatus = 'In Stock';
                        statusColor = 'var(--white)';
                        statusBgColor = 'var(--success-color)';
                    }
                    
                    return `
                        <div class="usage-table-row" data-usage-id="${record.id || 'unknown'}" data-item-name="${itemName}" style="display: grid; grid-template-columns: 50px 1fr 150px 120px 120px 150px; gap: 1rem; padding: 1rem; border-bottom: ${index < currentRecords.length - 1 ? '1px solid var(--gray-200)' : 'none'}; transition: background-color 0.2s ease; align-items: center;" onmouseover="this.style.backgroundColor='var(--gray-50)'" onmouseout="this.style.backgroundColor='transparent'">
                            <!-- Checkbox and Serial Number -->
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="checkbox" class="usage-checkbox" data-usage-id="${record.id || 'unknown'}" onchange="window.dentalApp.toggleUsageSelection('${record.id || 'unknown'}')" style="width: 14px; height: 14px; cursor: pointer;">
                                <span style="font-weight: 600; color: var(--gray-600); font-size: 0.875rem;">${globalIndex + 1}</span>
                            </div>
                            
                            <!-- Item Name and Stock Status -->
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <div style="font-weight: 600; color: var(--gray-800); font-size: 0.9rem;">
                                    ${this.escapeHtml ? this.escapeHtml(itemName) : itemName}
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 500; color: ${statusColor}; background: ${statusBgColor};">
                                        ${stockStatus}
                                    </span>
                                    <span style="font-size: 0.75rem; color: var(--gray-600);">
                                        (${currentStock} available)
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Quantity Used -->
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-weight: 600; color: var(--primary-color); font-size: 0.9rem;">
                                    ${record.quantity}
                                </span>
                                <span style="font-size: 0.75rem; color: var(--gray-600);">
                                    ${item ? (item.unit || 'units') : 'units'}
                                </span>
                            </div>
                            
                            <!-- Reason -->
                            <div style="font-size: 0.875rem; color: var(--gray-700);">
                                ${reasonText}
                            </div>
                            
                            <!-- Date -->
                            <div style="font-size: 0.875rem; color: var(--gray-700);">
                                ${new Date(record.date).toLocaleDateString()}
                            </div>
                            
                            <!-- Action Buttons -->
                            <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                                <button onclick="window.dentalApp.viewUsageDetails('${record.id}')" style="width: 35px; height: 35px; padding: 0; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="View Details" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-eye" style="font-size: 0.8rem;"></i>
                                </button>
                                <button onclick="window.dentalApp.editUsage('${record.id}')" style="width: 35px; height: 35px; padding: 0; background: var(--info-light); color: var(--info-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Edit Usage" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-edit" style="font-size: 0.8rem;"></i>
                                </button>
                                <button onclick="window.dentalApp.printUsageRecord('${record.id}')" style="width: 35px; height: 35px; padding: 0; background: var(--success-light); color: var(--success-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Print Record" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-print" style="font-size: 0.8rem;"></i>
                                </button>
                                <button onclick="window.dentalApp.showDeleteUsageConfirmation('${record.id}')" style="width: 35px; height: 35px; padding: 0; background: var(--error-light); color: var(--error-color); border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.2s ease-in-out;" title="Delete" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-trash" style="font-size: 0.8rem;"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <!-- Pagination Controls -->
                ${this.usagePerPage !== 'all' ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 2rem; padding: 1rem; border-top: 1px solid var(--gray-200); flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <!-- Entries Per Page Selector -->
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--gray-600); font-size: 0.875rem;">
                                <span>Show</span>
                                <select id="usage-entries-per-page" style="padding: 0.25rem 0.5rem; border: 1px solid var(--gray-300); border-radius: var(--radius-md); background: var(--white); color: var(--gray-700); font-size: 0.875rem; cursor: pointer;" onchange="window.dentalApp.changeUsageEntriesPerPage(this.value)">
                                    <option value="10" ${this.usagePerPage === 10 ? 'selected' : ''}>10</option>
                                    <option value="20" ${this.usagePerPage === 20 ? 'selected' : ''}>20</option>
                                    <option value="25" ${this.usagePerPage === 25 ? 'selected' : ''}>25</option>
                                    <option value="50" ${this.usagePerPage === 50 ? 'selected' : ''}>50</option>
                                    <option value="100" ${this.usagePerPage === 100 ? 'selected' : ''}>100</option>
                                    <option value="all" ${this.usagePerPage === 'all' ? 'selected' : ''}>All</option>
                                </select>
                                <span>records per page</span>
                            </div>
                        </div>
                        
                        <!-- Pagination Buttons and Page Info -->
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            ${totalPages > 1 ? `
                                ${currentPage > 1 ? `<button onclick="window.dentalApp.displayUsageRecords(window.dentalApp.currentUsageRecords, ${currentPage - 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Previous</button>` : ''}
                                
                                ${this.generateSmartPagination ? this.generateSmartPagination(currentPage, totalPages, 'usage') : ''}
                                
                                ${currentPage < totalPages ? `<button onclick="window.dentalApp.displayUsageRecords(window.dentalApp.currentUsageRecords, ${currentPage + 1})" style="padding: 0.5rem 1rem; border: 1px solid var(--gray-300); background: var(--white); color: var(--gray-700); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s ease;">Next</button>` : ''}
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
        
        usageList.innerHTML = usageHTML;
        
        // Store current usage records for pagination
        this.currentUsageRecords = usageRecords;
        
        // Initialize usage selection tracking
        this.selectedUsageRecords = new Set();
        this.updateUsageBulkActionsVisibility();
    };
}

// Initialize enhanced usage functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for dentalApp to be initialized
    setTimeout(() => {
        if (window.dentalApp) {
            enhanceUsageDisplay();
            console.log('Enhanced usage functionality loaded');
        }
    }, 500);
});
