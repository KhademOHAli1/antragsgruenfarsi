/* Swiss Design Wizard - Clean, Minimal, Elegant */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Swiss Wizard loading...');
    
    // Wait for wizard to be fully rendered
    setTimeout(initSwissWizard, 100);
    
    function initSwissWizard() {
        const wizard = document.querySelector('.wizardWidget');
        const steps = document.querySelectorAll('.wizardWidget .steps li');
        const stepPanes = document.querySelectorAll('.step-pane');
        const content = document.querySelector('.wizardWidget + .content');
        
        if (!wizard || !steps.length || !stepPanes.length) {
            console.log('Wizard elements not found, retrying...');
            setTimeout(initSwissWizard, 200);
            return;
        }
        
        console.log('Initializing Swiss wizard with', steps.length, 'steps and', stepPanes.length, 'panes');
        
        // Core functionality
        setupStepVisibility();
        addProgressBar();
        enhanceNavigation();
        fixIcons();
        addAccessibility();
        
        console.log('Swiss wizard initialized successfully');
    }
    
    function setupStepVisibility() {
        // Hide all steps first
        stepPanes.forEach(pane => {
            pane.style.display = 'none';
            pane.classList.remove('active');
            pane.classList.add('inactive');
        });
        
        // Find and show the active step
        let activeIndex = 0;
        steps.forEach((step, index) => {
            if (step.classList.contains('active')) {
                activeIndex = index;
            }
        });
        
        showStep(activeIndex);
    }
    
    function showStep(index) {
        if (index < 0 || index >= stepPanes.length) return;
        
        console.log('Showing step', index + 1);
        
        // Update step headers
        steps.forEach((step, i) => {
            step.classList.remove('active');
            if (i < index) {
                step.classList.add('completed');
            } else if (i === index) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('completed');
            }
        });
        
        // Update step content
        stepPanes.forEach((pane, i) => {
            if (i === index) {
                pane.style.display = 'block';
                pane.classList.add('active');
                pane.classList.remove('inactive');
                pane.style.opacity = '1';
            } else {
                pane.classList.remove('active');
                pane.classList.add('inactive');
                pane.style.opacity = '0';
                pane.style.display = 'none';
            }
        });
        
        updateProgressBar();
        updateNavigationButtons(index);
    }
    
    function addProgressBar() {
        const wizard = document.querySelector('.wizardWidget');
        if (!wizard || wizard.querySelector('.wizard-progress')) return;
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'wizard-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'wizard-progress-bar';
        
        progressContainer.appendChild(progressBar);
        wizard.appendChild(progressContainer);
        
        updateProgressBar();
    }
    
    function updateProgressBar() {
        const progressBar = document.querySelector('.wizard-progress-bar');
        if (!progressBar) return;
        
        const activeIndex = getCurrentStepIndex();
        const progress = ((activeIndex + 1) / steps.length) * 100;
        progressBar.style.width = progress + '%';
    }
    
    function getCurrentStepIndex() {
        return Array.from(steps).findIndex(step => step.classList.contains('active'));
    }
    
    function enhanceNavigation() {
        // Add click handlers to step headers
        steps.forEach((step, index) => {
            step.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Allow navigation to completed steps or next step
                const currentIndex = getCurrentStepIndex();
                const canNavigate = index <= currentIndex + 1 || step.classList.contains('completed');
                
                if (canNavigate) {
                    if (index < currentIndex) {
                        // Going back - don't mark as completed
                        showStep(index);
                    } else if (index > currentIndex) {
                        // Going forward - mark current as completed
                        steps[currentIndex].classList.add('completed');
                        showStep(index);
                    } else {
                        // Same step - do nothing
                        return;
                    }
                }
            });
        });
        
        // Enhanced button navigation
        document.addEventListener('click', function(e) {
            const target = e.target.closest('.btn-next, .btn-primary, .btn-prev');
            if (!target) return;
            
            e.preventDefault();
            
            const currentIndex = getCurrentStepIndex();
            
            if (target.classList.contains('btn-next') || target.classList.contains('btn-primary')) {
                if (currentIndex < stepPanes.length - 1) {
                    steps[currentIndex].classList.add('completed');
                    showStep(currentIndex + 1);
                } else {
                    // On last step - submit form
                    console.log('Form submission would happen here');
                }
            } else if (target.classList.contains('btn-prev')) {
                if (currentIndex > 0) {
                    showStep(currentIndex - 1);
                }
            }
        });
    }
    
    function updateNavigationButtons(currentIndex) {
        const content = document.querySelector('.wizardWidget + .content');
        if (!content) return;
        
        const prevBtn = content.querySelector('.btn-prev');
        const nextBtn = content.querySelector('.btn-next, .btn-primary');
        
        // Update previous button
        if (prevBtn) {
            prevBtn.style.display = currentIndex > 0 ? 'inline-flex' : 'none';
        }
        
        // Update next button
        if (nextBtn) {
            if (currentIndex === stepPanes.length - 1) {
                // Last step
                if (!nextBtn.textContent.includes('تکمیل') && !nextBtn.textContent.includes('ثبت')) {
                    nextBtn.textContent = 'تکمیل نصب';
                }
                nextBtn.className = nextBtn.className.replace('btn-next', 'btn-primary');
            } else {
                // Not last step
                if (!nextBtn.textContent.includes('بعدی')) {
                    nextBtn.textContent = 'بعدی';
                }
                nextBtn.className = nextBtn.className.replace('btn-primary', 'btn-next');
            }
        }
    }
    
    function fixIcons() {
        // Replace icon fonts with CSS shapes or emoji
        const content = document.querySelector('.wizardWidget + .content');
        if (!content) return;
        
        // Fix calendar icons
        const calendarIcons = content.querySelectorAll('.glyphicon-calendar');
        calendarIcons.forEach(icon => {
            icon.textContent = '📅';
            icon.className = 'calendar-icon';
            icon.style.fontStyle = 'normal';
        });
        
        // Hide broken feedback icons
        const feedbackIcons = content.querySelectorAll('.glyphicon-remove, .glyphicon-ok, .form-control-feedback');
        feedbackIcons.forEach(icon => {
            icon.style.display = 'none';
        });
        
        // Fix chevron icons - handled by CSS
        const chevronIcons = content.querySelectorAll('.icon-chevron-left, .icon-chevron-right');
        chevronIcons.forEach(icon => {
            icon.style.display = 'inline-block';
            icon.style.width = '12px';
            icon.style.height = '12px';
        });
    }
    
    function addAccessibility() {
        // Add ARIA attributes
        steps.forEach((step, index) => {
            step.setAttribute('role', 'tab');
            step.setAttribute('aria-selected', step.classList.contains('active'));
            step.setAttribute('tabindex', step.classList.contains('active') ? '0' : '-1');
        });
        
        stepPanes.forEach((pane, index) => {
            pane.setAttribute('role', 'tabpanel');
            pane.setAttribute('aria-hidden', !pane.classList.contains('active'));
        });
        
        // Keyboard navigation
        const wizard = document.querySelector('.wizardWidget');
        if (wizard) {
            wizard.addEventListener('keydown', function(e) {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    const currentIndex = getCurrentStepIndex();
                    const direction = e.key === 'ArrowRight' ? 1 : -1;
                    const newIndex = currentIndex + direction;
                    
                    if (newIndex >= 0 && newIndex < steps.length) {
                        const canNavigate = newIndex <= currentIndex + 1 || steps[newIndex].classList.contains('completed');
                        if (canNavigate) {
                            if (newIndex > currentIndex) {
                                steps[currentIndex].classList.add('completed');
                            }
                            showStep(newIndex);
                            steps[newIndex].focus();
                        }
                    }
                    e.preventDefault();
                }
            });
        }
    }
    
    // Form validation enhancements
    function enhanceFormValidation() {
        const content = document.querySelector('.wizardWidget + .content');
        if (!content) return;
        
        const inputs = content.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                const container = this.closest('.has-feedback') || this.parentElement;
                
                // Remove previous states
                container.classList.remove('has-error', 'has-success');
                
                // Check validation
                const isValid = this.checkValidity() && this.value.trim();
                const isRequired = this.required;
                const hasValue = this.value.trim().length > 0;
                
                if (isRequired && !hasValue) {
                    container.classList.add('has-error');
                } else if (hasValue && isValid) {
                    container.classList.add('has-success');
                }
            });
            
            input.addEventListener('input', function() {
                // Real-time validation feedback
                const container = this.closest('.has-feedback') || this.parentElement;
                
                if (this.value.trim()) {
                    if (this.checkValidity()) {
                        container.classList.remove('has-error');
                        container.classList.add('has-success');
                    } else {
                        container.classList.remove('has-success');
                        container.classList.add('has-error');
                    }
                } else {
                    container.classList.remove('has-error', 'has-success');
                }
            });
        });
    }
    
    // Auto-save for better UX
    function addAutoSave() {
        const content = document.querySelector('.wizardWidget + .content');
        if (!content) return;
        
        const formInputs = content.querySelectorAll('input, textarea, select');
        
        formInputs.forEach(input => {
            input.addEventListener('change', function() {
                if (this.name || this.id) {
                    try {
                        localStorage.setItem('wizard_' + (this.name || this.id), this.value);
                    } catch (e) {
                        console.warn('Could not save to localStorage:', e);
                    }
                }
            });
        });
    }
    
    // Initialize enhancements
    setTimeout(() => {
        enhanceFormValidation();
        addAutoSave();
    }, 500);
});
