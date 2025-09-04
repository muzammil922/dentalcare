// Global function for refreshing patients data
function refreshPatientsData() {
    console.log('Refreshing patients data...');
    
    // Check if dentalApp is available
    if (!window.dentalApp) {
        console.error('dentalApp is not available');
        alert('Application is not ready. Please try again.');
        return;
    }
    
    // Show loading state
    const patientsList = document.getElementById('patients-list');
    if (patientsList) {
        patientsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                <i class="fas fa-sync-alt fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Refreshing patient data...</p>
            </div>
        `;
    }
    
    // Simulate a small delay to show the loading state
    setTimeout(() => {
        try {
            // Reload patients from storage
            const patients = window.dentalApp.getStoredData('patients') || [];
            window.dentalApp.currentPatients = patients;
            
            // Re-apply current filter if any
            const activeFilter = document.querySelector('.dropdown-filter-option.active[data-type="patient"]');
            if (activeFilter) {
                const filterType = activeFilter.getAttribute('data-filter');
                window.dentalApp.filterPatients(filterType, false);
            } else {
                window.dentalApp.displayPatients(patients);
            }
            
            // Show success message
            window.dentalApp.showToast('Patient data refreshed successfully', 'success');
            
            console.log('Patients data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing patients:', error);
            alert('Error refreshing patient data. Please try again.');
        }
    }, 500);
}

// Also add the function to the dentalApp object when it's available
function addRefreshPatientsToApp() {
    if (window.dentalApp) {
        window.dentalApp.refreshPatients = refreshPatientsData;
        console.log('Refresh patients function added to dentalApp');
    } else {
        // If dentalApp is not available yet, try again in a moment
        setTimeout(addRefreshPatientsToApp, 100);
    }
}

// Start the process
addRefreshPatientsToApp();
