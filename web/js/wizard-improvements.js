// Wizard UI Improvements and Fixes
document.addEventListener('DOMContentLoaded', function() {
    const wizard = document.querySelector('#SiteCreateWizard');
    if (!wizard) return;

    // Fix step visibility - only show the first step initially
    const stepPanes = document.querySelectorAll('.step-pane');
    const firstPanel = wizard.getAttribute('data-init-step') || '#panelFunctionality';
    
    stepPanes.forEach(pane => {
        pane.classList.remove('active');
        pane.classList.add('inactive');
    });
    
    // Show the first panel
    const firstPaneElement = document.querySelector(firstPanel);
    if (firstPaneElement) {
        firstPaneElement.classList.remove('inactive');
        firstPaneElement.classList.add('active');
    }
    
    // Add progress bar
    const wizardContainer = document.querySelector('.wizardWidget');
    if (wizardContainer && !wizardContainer.querySelector('.wizard-progress')) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'wizard-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'wizard-progress-bar';
        progressBar.style.width = '20%'; // Start at 20% for first step
        
        progressContainer.appendChild(progressBar);
        wizardContainer.appendChild(progressContainer);
    }
    
    // Update progress bar when step changes
    function updateProgress() {
        const steps = document.querySelectorAll('.wizardWidget .steps li');
        const activeStep = document.querySelector('.wizardWidget .steps li.active');
        const progressBar = document.querySelector('.wizard-progress-bar');
        
        if (steps.length > 0 && activeStep && progressBar) {
            const activeIndex = Array.from(steps).indexOf(activeStep);
            const progressPercent = ((activeIndex + 1) / steps.length) * 100;
            progressBar.style.width = progressPercent + '%';
        }
    }
    
    // Observe step changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('step-pane')) {
                    // Ensure only one step is active
                    if (target.classList.contains('active')) {
                        stepPanes.forEach(pane => {
                            if (pane !== target) {
                                pane.classList.remove('active');
                                pane.classList.add('inactive');
                            }
                        });
                        updateProgress();
                    }
                }
            }
        });
    });
    
    // Observe all step panes for class changes
    stepPanes.forEach(pane => {
        observer.observe(pane, { attributes: true, attributeFilter: ['class'] });
    });
    
    // Add smooth transitions
    stepPanes.forEach(pane => {
        pane.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
    
    // Improve form validation visual feedback
    const textInputs = document.querySelectorAll('.textform input, .textform textarea');
    textInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const parent = this.closest('.has-feedback') || this.parentElement;
            if (this.value.trim().length > 0) {
                parent.classList.add('has-content');
            } else {
                parent.classList.remove('has-content');
            }
        });
        
        input.addEventListener('input', function() {
            const parent = this.closest('.has-feedback') || this.parentElement;
            if (this.checkValidity()) {
                parent.classList.remove('has-error');
                parent.classList.add('has-success');
            } else {
                parent.classList.remove('has-success');
                parent.classList.add('has-error');
            }
        });
    });
    
    // Add step completion animations
    function markStepComplete(stepElement) {
        stepElement.classList.add('completed');
        stepElement.classList.remove('active');
        
        // Add checkmark animation
        const checkmark = document.createElement('span');
        checkmark.className = 'step-checkmark';
        checkmark.innerHTML = '✓';
        checkmark.style.cssText = `
            position: absolute;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            color: #27ae60;
            font-weight: bold;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        if (!stepElement.querySelector('.step-checkmark')) {
            stepElement.appendChild(checkmark);
            setTimeout(() => checkmark.style.opacity = '1', 100);
        }
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const nextBtn = document.querySelector('.navigation .btn-next');
            const prevBtn = document.querySelector('.navigation .btn-prev');
            
            if (e.key === 'ArrowRight' && nextBtn && !nextBtn.disabled) {
                nextBtn.click();
            } else if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) {
                prevBtn.click();
            }
        }
    });
    
    // Initialize progress
    updateProgress();
    
    console.log('Wizard UI improvements initialized');
});
