// Feedback Management Module
class FeedbackManager {
    constructor() {
        this.feedback = [];
        this.currentFeedback = null;
        this.isEditing = false;
        
        this.init();
    }

    init() {
        this.loadFeedback();
        this.setupEventListeners();
        this.renderFeedback();
        this.loadPatientOptions();
        this.updateFeedbackStats();
    }

    setupEventListeners() {
        // Add new feedback button
        const addFeedbackBtn = document.getElementById('add-new-feedback-btn');
        if (addFeedbackBtn) {
            addFeedbackBtn.addEventListener('click', () => {
                this.showForm();
            });
        }

        // Feedback form submission
        const feedbackForm = document.getElementById('feedback-form');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFeedback();
            });
        }

        // Modal close handlers
        const closeBtn = document.getElementById('feedback-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const cancelBtn = document.getElementById('feedback-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Modal backdrop click
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Filter handlers
        const ratingFilter = document.getElementById('rating-filter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', () => {
                this.filterFeedback();
            });
        }

        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.filterFeedback();
            });
        }

        // Star rating handlers
        this.setupStarRating();

        // Set default date to today
        const dateInput = document.getElementById('feedback-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    setupStarRating() {
        const starContainer = document.getElementById('star-rating');
        if (!starContainer) return;

        // Create star rating interface
        starContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.dataset.rating = i;
            star.innerHTML = '★';
            star.style.cssText = `
                font-size: 2rem;
                color: var(--gray-300);
                cursor: pointer;
                transition: color var(--transition-fast);
                margin-right: 0.25rem;
            `;
            
            star.addEventListener('click', () => {
                this.setRating(i);
            });
            
            star.addEventListener('mouseenter', () => {
                this.highlightStars(i);
            });
            
            starContainer.appendChild(star);
        }

        // Add hover reset
        starContainer.addEventListener('mouseleave', () => {
            const currentRating = parseInt(starContainer.dataset.rating) || 0;
            this.highlightStars(currentRating);
        });
    }

    setRating(rating) {
        const starContainer = document.getElementById('star-rating');
        if (starContainer) {
            starContainer.dataset.rating = rating;
            this.highlightStars(rating);
            
            // Update hidden input
            const ratingInput = document.getElementById('feedback-rating');
            if (ratingInput) {
                ratingInput.value = rating;
            }
        }
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = 'var(--warning-color)';
            } else {
                star.style.color = 'var(--gray-300)';
            }
        });
    }

    showForm(feedback = null) {
        this.currentFeedback = feedback;
        this.isEditing = !!feedback;
        
        const modal = document.getElementById('feedback-modal');
        const modalTitle = document.getElementById('feedback-modal-title');
        const form = document.getElementById('feedback-form');
        
        if (modal && modalTitle && form) {
            modalTitle.textContent = this.isEditing ? 'Edit Feedback' : 'Add New Feedback';
            
            form.reset();
            this.setRating(0); // Reset star rating
            
            if (this.isEditing && feedback) {
                this.fillForm(feedback);
            } else {
                // Set default date
                const dateInput = document.getElementById('feedback-date');
                if (dateInput) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
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

    fillForm(feedback) {
        const fields = {
            'feedback-patient': feedback.patientId,
            'feedback-date': feedback.date,
            'feedback-rating': feedback.rating,
            'feedback-comments': feedback.comments,
            'feedback-treatment': feedback.treatment
        };
        
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value !== undefined) {
                element.value = value;
            }
        });

        // Set star rating
        if (feedback.rating) {
            this.setRating(feedback.rating);
        }
    }

    closeModal() {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        this.currentFeedback = null;
        this.isEditing = false;
    }

    saveFeedback() {
        const form = document.getElementById('feedback-form');
        if (!form) return;

        const formData = new FormData(form);
        const feedbackData = {
            patientId: formData.get('patientId'),
            date: formData.get('date'),
            rating: parseInt(formData.get('rating')) || 0,
            comments: formData.get('comments')?.trim(),
            treatment: formData.get('treatment')?.trim()
        };

        // Validation
        if (!feedbackData.patientId || !feedbackData.date || !feedbackData.rating) {
            this.showError('Please fill in all required fields including rating');
            return;
        }

        if (feedbackData.rating < 1 || feedbackData.rating > 5) {
            this.showError('Please select a rating between 1 and 5 stars');
            return;
        }

        try {
            if (this.isEditing && this.currentFeedback) {
                feedbackData.id = this.currentFeedback.id;
                feedbackData.createdAt = this.currentFeedback.createdAt;
                feedbackData.updatedAt = new Date().toISOString();
                
                const index = this.feedback.findIndex(f => f.id === this.currentFeedback.id);
                if (index !== -1) {
                    this.feedback[index] = feedbackData;
                }
                
                this.showSuccess('Feedback updated successfully');
            } else {
                feedbackData.id = this.generateId();
                feedbackData.createdAt = new Date().toISOString();
                feedbackData.updatedAt = new Date().toISOString();
                
                this.feedback.push(feedbackData);
                this.showSuccess('Feedback added successfully');
            }

            this.saveToStorage();
            this.renderFeedback();
            this.updateFeedbackStats();
            this.updateDashboard();
            this.closeModal();
            
        } catch (error) {
            console.error('Error saving feedback:', error);
            this.showError('Failed to save feedback');
        }
    }

    deleteFeedback(feedbackId) {
        if (!confirm('Are you sure you want to delete this feedback?')) {
            return;
        }

        this.feedback = this.feedback.filter(f => f.id !== feedbackId);
        this.saveToStorage();
        this.renderFeedback();
        this.updateFeedbackStats();
        this.updateDashboard();
        this.showSuccess('Feedback deleted successfully');
    }

    filterFeedback() {
        const ratingFilter = document.getElementById('rating-filter')?.value || 'all';
        const dateFilter = document.getElementById('date-filter')?.value || 'all';
        
        let filtered = [...this.feedback];
        
        // Rating filter
        if (ratingFilter !== 'all') {
            const rating = parseInt(ratingFilter);
            filtered = filtered.filter(f => f.rating === rating);
        }
        
        // Date filter
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        switch (dateFilter) {
            case 'week':
                filtered = filtered.filter(f => new Date(f.date) >= startOfWeek);
                break;
            case 'month':
                filtered = filtered.filter(f => new Date(f.date) >= startOfMonth);
                break;
        }
        
        this.renderFeedback(filtered);
    }

    renderFeedback(feedbackToRender = null) {
        const feedbackList = document.getElementById('feedback-list');
        if (!feedbackList) return;

        const feedback = feedbackToRender || this.feedback;
        const patients = this.getPatients();

        if (feedback.length === 0) {
            feedbackList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No feedback found</h3>
                    <p>Patient feedback will appear here once submitted.</p>
                </div>
            `;
            return;
        }

        // Sort feedback by date (newest first)
        const sortedFeedback = feedback.sort((a, b) => new Date(b.date) - new Date(a.date));

        feedbackList.innerHTML = sortedFeedback.map(item => {
            const patient = patients.find(p => p.id === item.patientId);
            const ratingColor = this.getRatingColor(item.rating);
            
            return `
                <div class="feedback-card" style="background: var(--white); padding: 1.5rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--gray-200); border-left: 4px solid ${ratingColor};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                <h3 style="font-size: var(--font-size-lg); font-weight: 600; color: var(--gray-800); margin: 0;">
                                    ${patient ? this.escapeHtml(patient.name) : 'Unknown Patient'}
                                </h3>
                                <div class="rating-display" style="display: flex; align-items: center; gap: 0.25rem;">
                                    ${this.renderStars(item.rating)}
                                    <span style="margin-left: 0.5rem; font-weight: 600; color: ${ratingColor};">
                                        ${item.rating}/5
                                    </span>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; color: var(--gray-600); font-size: var(--font-size-sm); margin-bottom: 1rem;">
                                <div><i class="fas fa-calendar" style="margin-right: 0.5rem;"></i>${this.formatDate(item.date)}</div>
                                ${item.treatment ? `<div><i class="fas fa-tooth" style="margin-right: 0.5rem;"></i>${this.escapeHtml(item.treatment)}</div>` : ''}
                                ${patient?.phone ? `<div><i class="fas fa-phone" style="margin-right: 0.5rem;"></i>${this.escapeHtml(patient.phone)}</div>` : ''}
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm btn-secondary" onclick="window.feedbackManager.showForm(${this.escapeHtml(JSON.stringify(item))})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="window.feedbackManager.deleteFeedback('${item.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${item.comments ? `
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--gray-50); border-radius: var(--radius-lg); border-left: 3px solid ${ratingColor};">
                            <strong style="color: var(--gray-700); font-size: var(--font-size-sm);">Comments:</strong>
                            <p style="margin: 0.5rem 0 0 0; color: var(--gray-700); line-height: 1.6;">${this.escapeHtml(item.comments)}</p>
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200); font-size: var(--font-size-xs); color: var(--gray-500);">
                        Submitted: ${this.formatDate(item.createdAt)}
                        ${item.updatedAt !== item.createdAt ? ` • Updated: ${this.formatDate(item.updatedAt)}` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const filled = i <= rating;
            stars += `<span style="color: ${filled ? 'var(--warning-color)' : 'var(--gray-300)'}; font-size: 1.2rem;">★</span>`;
        }
        return stars;
    }

    updateFeedbackStats() {
        const stats = this.calculateStats();
        
        // Update stats cards
        const statsElements = {
            'total-feedback': stats.total,
            'average-rating': stats.averageRating.toFixed(1),
            'five-star-count': stats.fiveStarCount,
            'recent-feedback': stats.recentCount
        };
        
        Object.entries(statsElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update rating distribution chart (if element exists)
        this.updateRatingDistribution(stats.ratingDistribution);
    }

    updateRatingDistribution(distribution) {
        const chartContainer = document.getElementById('rating-distribution');
        if (!chartContainer) return;

        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        
        chartContainer.innerHTML = '';
        
        for (let rating = 5; rating >= 1; rating--) {
            const count = distribution[rating] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            const bar = document.createElement('div');
            bar.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 0.5rem;
                font-size: var(--font-size-sm);
            `;
            
            bar.innerHTML = `
                <span style="width: 60px; text-align: right; margin-right: 1rem;">
                    ${rating} ★
                </span>
                <div style="flex: 1; background: var(--gray-200); height: 20px; border-radius: 10px; overflow: hidden; margin-right: 1rem;">
                    <div style="width: ${percentage}%; height: 100%; background: ${this.getRatingColor(rating)}; transition: width 0.3s ease;"></div>
                </div>
                <span style="width: 40px; text-align: right; font-weight: 600;">
                    ${count}
                </span>
            `;
            
            chartContainer.appendChild(bar);
        }
    }

    calculateStats() {
        const total = this.feedback.length;
        const totalRating = this.feedback.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = total > 0 ? totalRating / total : 0;
        
        const ratingDistribution = {};
        for (let i = 1; i <= 5; i++) {
            ratingDistribution[i] = this.feedback.filter(item => item.rating === i).length;
        }
        
        const fiveStarCount = ratingDistribution[5];
        
        // Recent feedback (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount = this.feedback.filter(item => 
            new Date(item.date) >= thirtyDaysAgo
        ).length;
        
        return {
            total,
            averageRating,
            ratingDistribution,
            fiveStarCount,
            recentCount
        };
    }

    loadPatientOptions() {
        const patientSelect = document.getElementById('feedback-patient');
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

    loadFeedback() {
        try {
            const stored = localStorage.getItem('dentalClinic_feedback');
            this.feedback = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading feedback:', error);
            this.feedback = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('dentalClinic_feedback', JSON.stringify(this.feedback));
        } catch (error) {
            console.error('Error saving feedback:', error);
        }
    }

    updateDashboard() {
        const stats = this.calculateStats();
        
        const avgRatingElement = document.getElementById('avg-rating');
        if (avgRatingElement) {
            avgRatingElement.textContent = stats.averageRating.toFixed(1);
        }
    }

    getRatingColor(rating) {
        const colors = {
            5: 'var(--success-color)',
            4: '#22c55e',
            3: 'var(--warning-color)',
            2: '#f97316',
            1: 'var(--error-color)'
        };
        return colors[rating] || 'var(--gray-500)';
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

    // Generate feedback report
    generateReport() {
        const stats = this.calculateStats();
        const patients = this.getPatients();
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalFeedback: stats.total,
                averageRating: stats.averageRating,
                ratingDistribution: stats.ratingDistribution,
                fiveStarPercentage: stats.total > 0 ? (stats.fiveStarCount / stats.total * 100).toFixed(1) : 0
            },
            feedback: this.feedback.map(item => {
                const patient = patients.find(p => p.id === item.patientId);
                return {
                    ...item,
                    patientName: patient ? patient.name : 'Unknown Patient'
                };
            })
        };
        
        return report;
    }

    // Get feedback trends
    getFeedbackTrends(days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const trends = {};
        
        // Initialize all dates with 0
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            trends[dateStr] = { count: 0, totalRating: 0, averageRating: 0 };
        }
        
        // Fill with actual data
        this.feedback.forEach(item => {
            const dateStr = item.date;
            if (trends[dateStr]) {
                trends[dateStr].count++;
                trends[dateStr].totalRating += item.rating;
                trends[dateStr].averageRating = trends[dateStr].totalRating / trends[dateStr].count;
            }
        });
        
        return trends;
    }

    // Get patient satisfaction insights
    getPatientSatisfactionInsights() {
        const stats = this.calculateStats();
        const insights = [];
        
        // Overall satisfaction
        if (stats.averageRating >= 4.5) {
            insights.push({
                type: 'positive',
                message: `Excellent patient satisfaction with ${stats.averageRating.toFixed(1)}/5 average rating`
            });
        } else if (stats.averageRating >= 3.5) {
            insights.push({
                type: 'neutral',
                message: `Good patient satisfaction with room for improvement (${stats.averageRating.toFixed(1)}/5)`
            });
        } else {
            insights.push({
                type: 'negative',
                message: `Patient satisfaction needs attention (${stats.averageRating.toFixed(1)}/5)`
            });
        }
        
        // Five-star percentage
        const fiveStarPercentage = stats.total > 0 ? (stats.fiveStarCount / stats.total * 100) : 0;
        if (fiveStarPercentage >= 60) {
            insights.push({
                type: 'positive',
                message: `${fiveStarPercentage.toFixed(1)}% of patients gave 5-star ratings`
            });
        } else if (fiveStarPercentage >= 30) {
            insights.push({
                type: 'neutral',
                message: `${fiveStarPercentage.toFixed(1)}% five-star ratings - consider improvement strategies`
            });
        } else {
            insights.push({
                type: 'negative',
                message: `Only ${fiveStarPercentage.toFixed(1)}% five-star ratings - urgent attention needed`
            });
        }
        
        // Recent feedback trend
        const recentPercentage = stats.total > 0 ? (stats.recentCount / stats.total * 100) : 0;
        if (recentPercentage >= 50) {
            insights.push({
                type: 'positive',
                message: 'Strong recent feedback engagement from patients'
            });
        }
        
        return insights;
    }
}

