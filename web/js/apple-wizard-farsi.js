/**
 * Apple-Inspired Wizard with Farsi Support
 * Modern, accessible, and performant wizard implementation
 */

class AppleFarsiWizard {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Wizard container "${containerId}" not found`);
            return;
        }

        // Configuration
        this.options = {
            autoSave: true,
            validateOnStep: true,
            animationDuration: 250,
            showProgress: true,
            rtl: document.documentElement.lang === 'fa' || document.documentElement.dir === 'rtl',
            ...options
        };

        // State
        this.currentStep = 0;
        this.steps = [];
        this.stepData = {};
        this.validators = {};
        this.isTransitioning = false;

        // Initialize wizard
        this.init();
    }

    init() {
        this.createWizardStructure();
        this.setupSteps();
        this.setupEventListeners();
        this.setupAccessibility();
        this.loadSavedData();
        this.showStep(0);
        this.updateProgress();
        this.updateNavigation(); // Ensure navigation is properly initialized

        // Prevent browser's unsaved changes warning during wizard use
        this.setupNavigationHandling();

        // Announce wizard ready for screen readers
        this.announceToScreenReader('سحر نصب آماده است' + ' / Installation wizard ready');
    }

    setupNavigationHandling() {
        // Store original beforeunload handler if it exists
        this.originalBeforeUnload = window.onbeforeunload;
        
        // Override beforeunload during wizard completion
        this.isCompleting = false;
        
        // Add custom beforeunload only for incomplete wizard
        window.addEventListener('beforeunload', (e) => {
            if (!this.isCompleting && this.currentStep < this.steps.length - 1) {
                // Only warn if user has made progress and hasn't completed
                if (Object.keys(this.stepData).length > 0) {
                    e.preventDefault();
                    return e.returnValue = this.options.rtl ? 
                        'تغییرات شما ممکن است ذخیره نشود. آیا می‌خواهید خارج شوید؟' :
                        'Your changes may not be saved. Do you want to leave?';
                }
            }
        });
    }

    createWizardStructure() {
        this.container.className = 'apple-wizard-container';
        
        // Get existing form data
        const existingForm = this.container.querySelector('form');
        const formData = existingForm ? new FormData(existingForm) : null;

        this.container.innerHTML = `
            <div class="apple-wizard" role="main" aria-label="Installation Wizard">
                <!-- Header -->
                <header class="apple-wizard-header">
                    <h1 class="apple-wizard-title">
                        ${this.options.rtl ? 'نصب انتراگسگرین' : 'Antragsgrün Setup'}
                    </h1>
                    <p class="apple-wizard-subtitle">
                        ${this.options.rtl ? 
                            'ما شما را در مراحل نصب راهنمایی می‌کنیم تا بتوانید پلتفرم خود را با بهترین تنظیمات راه‌اندازی کنید' :
                            'We\'ll guide you through the setup process to configure your platform with the best settings'
                        }
                    </p>
                </header>

                <!-- Progress Indicator -->
                <div class="apple-progress-container" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    <div class="apple-progress-steps" aria-label="Installation steps">
                        <div class="apple-progress-line"></div>
                        <div class="apple-progress-line-active" style="width: 0%"></div>
                    </div>
                    <div class="apple-progress-labels"></div>
                </div>

                <!-- Step Content -->
                <main class="apple-step-content" role="main">
                    <!-- Steps will be populated here -->
                </main>

                <!-- Navigation -->
                <nav class="apple-wizard-navigation" role="navigation" aria-label="Wizard navigation">
                    <button type="button" class="apple-button apple-button-secondary" id="prevButton" disabled>
                        <span class="arrow-left" aria-hidden="true">${this.options.rtl ? '→' : '←'}</span>
                        <span>${this.options.rtl ? 'قبلی' : 'Previous'}</span>
                    </button>
                    <button type="button" class="apple-button apple-button-primary" id="nextButton">
                        <span>${this.options.rtl ? 'بعدی' : 'Next'}</span>
                        <span class="arrow-right" aria-hidden="true">${this.options.rtl ? '←' : '→'}</span>
                    </button>
                </nav>

                <!-- Hidden form to maintain compatibility -->
                <form id="wizardForm" method="post" style="display: none;">
                    <input type="hidden" name="_csrf" value="${this.getCSRFToken()}">
                </form>

                <!-- Screen reader announcements -->
                <div id="announcements" class="apple-sr-only" aria-live="polite" aria-atomic="true"></div>
            </div>
        `;

        // Store references
        this.progressSteps = this.container.querySelector('.apple-progress-steps');
        this.progressLine = this.container.querySelector('.apple-progress-line-active');
        this.progressLabels = this.container.querySelector('.apple-progress-labels');
        this.stepContent = this.container.querySelector('.apple-step-content');
        this.prevButton = this.container.querySelector('#prevButton');
        this.nextButton = this.container.querySelector('#nextButton');
        this.hiddenForm = this.container.querySelector('#wizardForm');
        this.announcements = this.container.querySelector('#announcements');

        // Restore form data if it existed
        if (formData) {
            this.restoreFormData(formData);
        }
    }

    setupSteps() {
        // Define wizard steps with Farsi-first content
        this.stepDefinitions = [
            {
                id: 'purpose',
                title: this.options.rtl ? 'هدف و کارکرد' : 'Purpose & Functionality',
                description: this.options.rtl ? 
                    'نوع سازمان خود و کارکردهای مورد نیاز را انتخاب کنید' :
                    'Select your organization type and required functionality',
                icon: '🎯',
                fields: ['functionality']
            },
            {
                id: 'motions',
                title: this.options.rtl ? 'پیشنهادات و موشن‌ها' : 'Motions & Proposals',
                description: this.options.rtl ? 
                    'نحوه ارائه و مدیریت پیشنهادات را تنظیم کنید' :
                    'Configure how proposals and motions are submitted and managed',
                icon: '📝',
                fields: ['motionType', 'motionDeadline', 'motionScreening']
            },
            {
                id: 'amendments',
                title: this.options.rtl ? 'اصلاحیه‌ها' : 'Amendments',
                description: this.options.rtl ? 
                    'قوانین و فرآیند اصلاحیه‌ها را مشخص کنید' :
                    'Define amendment rules and processes',
                icon: '✏️',
                fields: ['amendmentType', 'amendmentDeadline']
            },
            {
                id: 'special',
                title: this.options.rtl ? 'تنظیمات خاص' : 'Special Features',
                description: this.options.rtl ? 
                    'امکانات اضافی مانند نظرات و سخنرانی را فعال کنید' :
                    'Enable additional features like comments and speech lists',
                icon: '⚙️',
                fields: ['comments', 'speechLists']
            },
            {
                id: 'site',
                title: this.options.rtl ? 'اطلاعات سایت' : 'Site Information',
                description: this.options.rtl ? 
                    'نام سایت و اطلاعات پایه را وارد کنید' :
                    'Enter site name and basic information',
                icon: '🌐',
                fields: ['siteName', 'organization', 'contact']
            }
        ];

        // Create progress steps
        this.stepDefinitions.forEach((step, index) => {
            // Progress indicator
            const progressStep = document.createElement('div');
            progressStep.className = 'apple-progress-step';
            progressStep.setAttribute('data-step', index);
            progressStep.innerHTML = index + 1;
            progressStep.addEventListener('click', () => this.goToStep(index));
            this.progressSteps.appendChild(progressStep);

            // Progress label
            const progressLabel = document.createElement('div');
            progressLabel.className = 'apple-progress-label';
            progressLabel.innerHTML = step.title;
            this.progressLabels.appendChild(progressLabel);

            // Step content
            const stepElement = this.createStepContent(step, index);
            this.stepContent.appendChild(stepElement);
            this.steps.push(stepElement);
        });
    }

    createStepContent(stepDef, index) {
        const step = document.createElement('div');
        step.className = 'apple-step';
        step.setAttribute('data-step', index);
        step.setAttribute('role', 'tabpanel');
        step.setAttribute('aria-labelledby', `step-${index}-label`);

        let content = '';

        switch (stepDef.id) {
            case 'purpose':
                content = this.createPurposeStep();
                break;
            case 'motions':
                content = this.createMotionsStep();
                break;
            case 'amendments':
                content = this.createAmendmentsStep();
                break;
            case 'special':
                content = this.createSpecialStep();
                break;
            case 'site':
                content = this.createSiteStep();
                break;
        }

        step.innerHTML = `
            <div class="apple-step-header">
                <h2 class="apple-step-title" id="step-${index}-label">
                    <span class="apple-option-icon" aria-hidden="true">${stepDef.icon}</span>
                    ${stepDef.title}
                </h2>
                <p class="apple-step-description">${stepDef.description}</p>
            </div>
            <div class="apple-step-body">
                ${content}
            </div>
        `;

        return step;
    }

    createPurposeStep() {
        return `
            <div class="apple-options-grid">
                <div class="apple-option-card" data-value="motions" role="button" tabindex="0" aria-pressed="false">
                    <div class="apple-option-icon">📋</div>
                    <h3 class="apple-option-title">${this.options.rtl ? 'پیشنهادات و تصمیمات' : 'Motions & Resolutions'}</h3>
                    <p class="apple-option-description">
                        ${this.options.rtl ? 
                            'مناسب برای مجامع، انجمن‌ها و سازمان‌های تصمیم‌گیر' :
                            'Perfect for assemblies, associations, and decision-making organizations'
                        }
                    </p>
                </div>
                
                <div class="apple-option-card" data-value="manifesto" role="button" tabindex="0" aria-pressed="false">
                    <div class="apple-option-icon">📄</div>
                    <h3 class="apple-option-title">${this.options.rtl ? 'برنامه و اعلامیه' : 'Manifesto & Programs'}</h3>
                    <p class="apple-option-description">
                        ${this.options.rtl ? 
                            'برای احزاب سیاسی و گروه‌های دارای برنامه مشخص' :
                            'For political parties and groups with specific programs'
                        }
                    </p>
                </div>
                
                <div class="apple-option-card" data-value="applications" role="button" tabindex="0" aria-pressed="false">
                    <div class="apple-option-icon">👤</div>
                    <h3 class="apple-option-title">${this.options.rtl ? 'درخواست‌ها و کاندیداتوری' : 'Applications & Candidacy'}</h3>
                    <p class="apple-option-description">
                        ${this.options.rtl ? 
                            'مدیریت درخواست‌ها و کاندیداتوری در انتخابات' :
                            'Manage applications and candidacy in elections'
                        }
                    </p>
                </div>
                
                <div class="apple-option-card" data-value="agenda" role="button" tabindex="0" aria-pressed="false">
                    <div class="apple-option-icon">📅</div>
                    <h3 class="apple-option-title">${this.options.rtl ? 'دستور جلسه' : 'Meeting Agenda'}</h3>
                    <p class="apple-option-description">
                        ${this.options.rtl ? 
                            'سازماندهی جلسات و مدیریت دستور کار' :
                            'Organize meetings and manage agenda items'
                        }
                    </p>
                </div>
            </div>
        `;
    }

    createMotionsStep() {
        return `
            <div class="apple-form-group">
                <label class="apple-form-label" for="motionType">
                    ${this.options.rtl ? 'نوع پیشنهادات' : 'Type of Motions'}
                </label>
                <div class="apple-options-grid">
                    <div class="apple-option-card" data-value="single" role="button" tabindex="0" aria-pressed="false">
                        <div class="apple-option-icon">📄</div>
                        <h3 class="apple-option-title">${this.options.rtl ? 'تک موضوعی' : 'Single Topic'}</h3>
                        <p class="apple-option-description">
                            ${this.options.rtl ? 'هر پیشنهاد یک موضوع واحد' : 'Each motion covers one topic'}
                        </p>
                    </div>
                    <div class="apple-option-card" data-value="multiple" role="button" tabindex="0" aria-pressed="false">
                        <div class="apple-option-icon">📚</div>
                        <h3 class="apple-option-title">${this.options.rtl ? 'چند موضوعی' : 'Multiple Topics'}</h3>
                        <p class="apple-option-description">
                            ${this.options.rtl ? 'پیشنهادات شامل چندین بخش' : 'Motions can have multiple sections'}
                        </p>
                    </div>
                </div>
            </div>

            <div class="apple-form-group">
                <label class="apple-form-label" for="motionDeadline">
                    ${this.options.rtl ? 'مهلت ارسال پیشنهادات' : 'Motion Submission Deadline'}
                </label>
                <input type="datetime-local" id="motionDeadline" class="apple-form-input" 
                       placeholder="${this.options.rtl ? 'تاریخ و زمان مهلت را انتخاب کنید' : 'Select deadline date and time'}">
            </div>

            <div class="apple-form-group">
                <label class="apple-form-label">
                    ${this.options.rtl ? 'بررسی پیشنهادات' : 'Motion Screening'}
                </label>
                <div class="apple-options-grid">
                    <div class="apple-option-card" data-value="none" role="button" tabindex="0" aria-pressed="false">
                        <div class="apple-option-icon">🟢</div>
                        <h3 class="apple-option-title">${this.options.rtl ? 'بدون بررسی' : 'No Screening'}</h3>
                        <p class="apple-option-description">
                            ${this.options.rtl ? 'انتشار فوری پیشنهادات' : 'Immediate publication of motions'}
                        </p>
                    </div>
                    <div class="apple-option-card" data-value="admin" role="button" tabindex="0" aria-pressed="false">
                        <div class="apple-option-icon">👥</div>
                        <h3 class="apple-option-title">${this.options.rtl ? 'بررسی مدیریت' : 'Admin Review'}</h3>
                        <p class="apple-option-description">
                            ${this.options.rtl ? 'تایید مدیران قبل از انتشار' : 'Admin approval before publication'}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    createAmendmentsStep() {
        return `
            <div class="apple-form-group">
                <label class="apple-form-label">
                    ${this.options.rtl ? 'نوع اصلاحیه‌ها' : 'Amendment Type'}
                </label>
                <div class="apple-options-grid">
                    <div class="apple-option-card" data-value="global" role="button" tabindex="0" aria-pressed="false">
                        <div class="apple-option-icon">🌐</div>
                        <h3 class="apple-option-title">${this.options.rtl ? 'کلی' : 'Global Amendments'}</h3>
                        <p class="apple-option-description">
                            ${this.options.rtl ? 'اصلاحیه‌هایی که کل متن را در بر می‌گیرد' : 'Amendments that affect the entire text'}
                        </p>
                    </div>
                    <div class="apple-option-card" data-value="paragraph" role="button" tabindex="0" aria-pressed="false">
                        <div class="apple-option-icon">📝</div>
                        <h3 class="apple-option-title">${this.options.rtl ? 'پاراگرافی' : 'Paragraph-based'}</h3>
                        <p class="apple-option-description">
                            ${this.options.rtl ? 'اصلاحیه‌های مربوط به پاراگراف‌های خاص' : 'Amendments to specific paragraphs'}
                        </p>
                    </div>
                </div>
            </div>

            <div class="apple-form-group">
                <label class="apple-form-label" for="amendmentDeadline">
                    ${this.options.rtl ? 'مهلت ارسال اصلاحیه‌ها' : 'Amendment Submission Deadline'}
                </label>
                <input type="datetime-local" id="amendmentDeadline" class="apple-form-input"
                       placeholder="${this.options.rtl ? 'تاریخ و زمان مهلت را انتخاب کنید' : 'Select deadline date and time'}">
            </div>
        `;
    }

    createSpecialStep() {
        return `
            <div class="apple-options-grid">
                <div class="apple-option-card" data-value="comments" role="button" tabindex="0" aria-pressed="false">
                    <div class="apple-option-icon">💬</div>
                    <h3 class="apple-option-title">${this.options.rtl ? 'سیستم نظرات' : 'Comment System'}</h3>
                    <p class="apple-option-description">
                        ${this.options.rtl ? 'امکان ثبت نظر روی پیشنهادات' : 'Allow comments on proposals'}
                    </p>
                </div>
                
                <div class="apple-option-card" data-value="speechLists" role="button" tabindex="0" aria-pressed="false">
                    <div class="apple-option-icon">🎤</div>
                    <h3 class="apple-option-title">${this.options.rtl ? 'لیست سخنرانان' : 'Speech Lists'}</h3>
                    <p class="apple-option-description">
                        ${this.options.rtl ? 'مدیریت صف سخنرانان در جلسات' : 'Manage speaker queues in meetings'}
                    </p>
                </div>
                
                <div class="apple-option-card" data-value="voting" role="button" tabindex="0" aria-pressed="false">
                    <div class="apple-option-icon">🗳️</div>
                    <h3 class="apple-option-title">${this.options.rtl ? 'رای‌گیری آنلاین' : 'Online Voting'}</h3>
                    <p class="apple-option-description">
                        ${this.options.rtl ? 'برگزاری رای‌گیری الکترونیک' : 'Conduct electronic voting'}
                    </p>
                </div>
                
                <div class="apple-option-card" data-value="supporters" role="button" tabindex="0" aria-pressed="false">
                    <div class="apple-option-icon">👥</div>
                    <h3 class="apple-option-title">${this.options.rtl ? 'سیستم حمایت‌کنندگان' : 'Supporter System'}</h3>
                    <p class="apple-option-description">
                        ${this.options.rtl ? 'نیاز به حمایت‌کننده برای پیشنهادات' : 'Require supporters for proposals'}
                    </p>
                </div>
            </div>
        `;
    }

    createSiteStep() {
        return `
            <div class="apple-form-group">
                <label class="apple-form-label" for="siteName">
                    ${this.options.rtl ? 'نام سایت' : 'Site Name'} *
                </label>
                <input type="text" id="siteName" class="apple-form-input" required
                       placeholder="${this.options.rtl ? 'نام سازمان یا رویداد خود را وارد کنید' : 'Enter your organization or event name'}"
                       aria-describedby="siteNameHelp">
                <small id="siteNameHelp" class="apple-form-help">
                    ${this.options.rtl ? 'این نام در بالای صفحات نمایش داده می‌شود' : 'This name will be displayed at the top of pages'}
                </small>
            </div>

            <div class="apple-form-group">
                <label class="apple-form-label" for="organization">
                    ${this.options.rtl ? 'نام سازمان' : 'Organization Name'}
                </label>
                <input type="text" id="organization" class="apple-form-input"
                       placeholder="${this.options.rtl ? 'نام کامل سازمان' : 'Full organization name'}">
            </div>

            <div class="apple-form-group">
                <label class="apple-form-label" for="contactEmail">
                    ${this.options.rtl ? 'ایمیل تماس' : 'Contact Email'}
                </label>
                <input type="email" id="contactEmail" class="apple-form-input"
                       placeholder="${this.options.rtl ? 'admin@example.com' : 'admin@example.com'}">
            </div>

            <div class="apple-form-group">
                <label class="apple-form-label" for="language">
                    ${this.options.rtl ? 'زبان پیش‌فرض' : 'Default Language'}
                </label>
                <select id="language" class="apple-form-input">
                    <option value="fa" ${this.options.rtl ? 'selected' : ''}>فارسی (Persian)</option>
                    <option value="en" ${!this.options.rtl ? 'selected' : ''}>English</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="fr">Français (French)</option>
                </select>
            </div>
        `;
    }

    setupEventListeners() {
        // Navigation buttons
        this.prevButton.addEventListener('click', () => this.previousStep());
        this.nextButton.addEventListener('click', () => this.nextStep());

        // Option cards
        this.container.addEventListener('click', (e) => {
            const card = e.target.closest('.apple-option-card');
            if (card) {
                this.toggleOption(card);
            }
        });

        // Keyboard navigation for option cards
        this.container.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('apple-option-card')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleOption(e.target);
                }
            }
        });

        // Auto-save on input change
        if (this.options.autoSave) {
            this.container.addEventListener('input', (e) => {
                if (e.target.matches('input, select, textarea')) {
                    this.saveStepData();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                // For RTL, swap arrow key behavior
                if (this.options.rtl) {
                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        this.previousStep();
                    } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        this.nextStep();
                    }
                } else {
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        this.previousStep();
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        this.nextStep();
                    }
                }
            }
        });
    }

    setupAccessibility() {
        // Set ARIA attributes
        this.steps.forEach((step, index) => {
            step.setAttribute('aria-hidden', index !== this.currentStep);
        });

        // Keyboard trap in wizard
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
        });
    }

    toggleOption(card) {
        console.log('toggleOption called for card:', card.querySelector('.apple-option-title')?.textContent);
        const isMultiSelect = card.closest('.apple-options-grid').dataset.multiSelect === 'true';
        console.log('Is multi-select:', isMultiSelect);
        
        if (isMultiSelect) {
            // Multi-select: toggle individual cards
            card.classList.toggle('selected');
            card.setAttribute('aria-pressed', card.classList.contains('selected'));
        } else {
            // Single-select: deselect others in the same group
            const siblings = card.parentElement.querySelectorAll('.apple-option-card');
            siblings.forEach(sibling => {
                sibling.classList.remove('selected');
                sibling.setAttribute('aria-pressed', 'false');
            });
            card.classList.add('selected');
            card.setAttribute('aria-pressed', 'true');
        }

        // Announce selection change
        const isSelected = card.classList.contains('selected');
        const title = card.querySelector('.apple-option-title').textContent;
        const message = `${title} ${isSelected ? 
            (this.options.rtl ? 'انتخاب شد' : 'selected') : 
            (this.options.rtl ? 'انتخاب لغو شد' : 'deselected')
        }`;
        this.announceToScreenReader(message);

        // Save data and validate
        this.saveStepData();
        console.log('About to validate current step...');
        const isValid = this.validateCurrentStep();
        console.log('Validation result after toggle:', isValid);
        this.updateNavigation();
        
        // Log for debugging
        console.log('Option toggled:', title, 'isSelected:', isSelected, 'isValid:', isValid);
        console.log('Selected cards in current step:', 
            this.steps[this.currentStep].querySelectorAll('.apple-option-card.selected').length);
    }

    showStep(stepIndex) {
        if (this.isTransitioning || stepIndex < 0 || stepIndex >= this.steps.length) {
            return;
        }

        this.isTransitioning = true;

        // Hide current step
        if (this.currentStep >= 0) {
            const currentStepEl = this.steps[this.currentStep];
            currentStepEl.classList.remove('active');
            currentStepEl.setAttribute('aria-hidden', 'true');
        }

        // Show new step
        setTimeout(() => {
            this.currentStep = stepIndex;
            const newStepEl = this.steps[stepIndex];
            this.currentStepElement = newStepEl; // Set current step element for validation
            newStepEl.classList.add('active', 'apple-fade-in');
            newStepEl.setAttribute('aria-hidden', 'false');
            
            // Focus management
            const firstFocusable = newStepEl.querySelector('input, select, button, [tabindex="0"]');
            if (firstFocusable) {
                firstFocusable.focus();
            }

            this.updateProgress();
            this.updateNavigation();
            
            // Announce step change
            const stepTitle = this.stepDefinitions[stepIndex].title;
            this.announceToScreenReader(`${stepTitle} - ${this.options.rtl ? 'مرحله' : 'Step'} ${stepIndex + 1} ${this.options.rtl ? 'از' : 'of'} ${this.steps.length}`);
            
            this.isTransitioning = false;
        }, this.options.animationDuration / 2);
    }

    nextStep() {
        console.log('Next step clicked. Current step:', this.currentStep);
        const isValid = this.validateCurrentStep();
        console.log('Validation result:', isValid);
        
        if (isValid) {
            if (this.currentStep < this.steps.length - 1) {
                console.log('Moving to next step:', this.currentStep + 1);
                this.showStep(this.currentStep + 1);
            } else {
                console.log('Completing wizard');
                this.completeWizard();
            }
        } else {
            console.log('Validation failed, cannot proceed');
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    goToStep(stepIndex) {
        // Only allow going to previous steps or next step if current is valid
        if (stepIndex <= this.currentStep || (stepIndex === this.currentStep + 1 && this.validateCurrentStep())) {
            this.showStep(stepIndex);
        }
    }

    updateProgress() {
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;
        
        // For RTL, we need to position the progress line from the right
        if (this.options.rtl) {
            // Calculate the position from the right side
            const rightPosition = 100 - progress;
            this.progressLine.style.right = rightPosition + '%';
            this.progressLine.style.left = 'auto';
            this.progressLine.style.width = progress + '%';
        } else {
            this.progressLine.style.width = `${progress}%`;
            this.progressLine.style.left = '0';
            this.progressLine.style.right = 'auto';
        }
        
        // Update progress indicator ARIA
        const progressContainer = this.container.querySelector('.apple-progress-container');
        progressContainer.setAttribute('aria-valuenow', Math.round(progress));

        // Update step indicators
        const stepIndicators = this.progressSteps.querySelectorAll('.apple-progress-step');
        const stepLabels = this.progressLabels.querySelectorAll('.apple-progress-label');
        
        stepIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            stepLabels[index].classList.remove('active', 'completed');
            
            if (index < this.currentStep) {
                indicator.classList.add('completed');
                stepLabels[index].classList.add('completed');
            } else if (index === this.currentStep) {
                indicator.classList.add('active');
                stepLabels[index].classList.add('active');
            }
        });
    }

    updateNavigation() {
        // Ensure buttons exist before updating
        if (!this.prevButton || !this.nextButton) {
            console.warn('Navigation buttons not found');
            return;
        }
        
        // Previous button
        this.prevButton.disabled = this.currentStep === 0;
        
        // Next button
        const isLastStep = this.currentStep === this.steps.length - 1;
        const nextText = isLastStep ? 
            (this.options.rtl ? 'تکمیل نصب' : 'Complete Setup') : 
            (this.options.rtl ? 'بعدی' : 'Next');
        const nextIcon = isLastStep ? '✓' : (this.options.rtl ? '←' : '→');
        
        if (this.options.rtl) {
            this.nextButton.innerHTML = `
                <span>${nextText}</span>
                <span class="arrow-right" aria-hidden="true">${nextIcon}</span>
            `;
        } else {
            this.nextButton.innerHTML = `
                <span>${nextText}</span>
                <span class="arrow-right" aria-hidden="true">${nextIcon}</span>
            `;
        }
        
        const isValid = this.validateCurrentStep();
        this.nextButton.disabled = !isValid;
        console.log('Navigation updated. Next button disabled:', !isValid);
    }

    validateCurrentStep() {
        const currentStepEl = this.steps[this.currentStep];
        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let isValid = true;

        console.log('Validating step:', this.currentStep, 'Step ID:', this.stepDefinitions[this.currentStep].id);

        // Clear previous errors
        currentStepEl.querySelectorAll('.apple-alert-error').forEach(alert => alert.remove());

        // Validate required fields
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                this.showFieldError(field, this.options.rtl ? 'این فیلد الزامی است' : 'This field is required');
            }
        });

        // Step-specific validation
        switch (this.stepDefinitions[this.currentStep].id) {
            case 'purpose':
                const selectedOptions = currentStepEl.querySelectorAll('.apple-option-card.selected');
                console.log('Purpose step - selected options:', selectedOptions.length);
                if (selectedOptions.length === 0) {
                    isValid = false;
                    console.log('No options selected, showing error');
                    this.showStepError(currentStepEl, this.options.rtl ? 
                        'لطفاً یکی از گزینه‌ها را انتخاب کنید' : 
                        'Please select at least one option'
                    );
                } else {
                    console.log('Options selected:', Array.from(selectedOptions).map(el => el.dataset.value));
                }
                break;
            case 'site':
                const emailField = currentStepEl.querySelector('#contactEmail');
                if (emailField && emailField.value && !this.isValidEmail(emailField.value)) {
                    isValid = false;
                    this.showFieldError(emailField, this.options.rtl ? 
                        'فرمت ایمیل صحیح نیست' : 
                        'Invalid email format'
                    );
                }
                break;
        }

        console.log('Validation result:', isValid);
        return isValid;
    }

    showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'apple-alert apple-alert-error';
        errorDiv.innerHTML = `
            <div class="apple-alert-icon">⚠</div>
            <div>${message}</div>
        `;
        field.parentNode.appendChild(errorDiv);
        field.focus();
    }

    showStepError(stepEl, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'apple-alert apple-alert-error';
        errorDiv.innerHTML = `
            <div class="apple-alert-icon">⚠</div>
            <div>${message}</div>
        `;
        stepEl.querySelector('.apple-step-body').prepend(errorDiv);
    }

    saveStepData() {
        const currentStepEl = this.steps[this.currentStep];
        const stepId = this.stepDefinitions[this.currentStep].id;
        
        // Save form inputs
        const inputs = currentStepEl.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            this.stepData[input.id || input.name] = input.value;
        });

        // Save selected options
        const selectedOptions = currentStepEl.querySelectorAll('.apple-option-card.selected');
        const optionValues = Array.from(selectedOptions).map(card => card.dataset.value);
        this.stepData[`${stepId}_options`] = optionValues;

        // Auto-save to localStorage
        if (this.options.autoSave) {
            try {
                localStorage.setItem('appleWizardData', JSON.stringify(this.stepData));
            } catch (e) {
                console.warn('Could not save to localStorage:', e);
            }
        }
    }

    loadSavedData() {
        if (this.options.autoSave) {
            try {
                const saved = localStorage.getItem('appleWizardData');
                if (saved) {
                    this.stepData = JSON.parse(saved);
                    this.restoreStepData();
                }
            } catch (e) {
                console.warn('Could not load from localStorage:', e);
            }
        }
    }

    restoreStepData() {
        // Restore form inputs
        Object.keys(this.stepData).forEach(key => {
            const element = this.container.querySelector(`#${key}, [name="${key}"]`);
            if (element && !key.endsWith('_options')) {
                element.value = this.stepData[key];
            }
        });

        // Restore selected options
        Object.keys(this.stepData).filter(key => key.endsWith('_options')).forEach(key => {
            const values = this.stepData[key];
            if (Array.isArray(values)) {
                values.forEach(value => {
                    const option = this.container.querySelector(`.apple-option-card[data-value="${value}"]`);
                    if (option) {
                        option.classList.add('selected');
                        option.setAttribute('aria-pressed', 'true');
                    }
                });
            }
        });
    }

    restoreFormData(formData) {
        // Restore original form data
        for (let [key, value] of formData.entries()) {
            const element = this.container.querySelector(`[name="${key}"]`);
            if (element) {
                element.value = value;
                this.stepData[key] = value;
            }
        }
    }

    completeWizard() {
        console.log('Starting wizard completion...');
        console.log('Current step data:', this.stepData);
        
        // Mark as completing to disable beforeunload warning
        this.isCompleting = true;
        
        // Disable any existing beforeunload warning
        window.onbeforeunload = null;
        
        // Show loading state
        this.nextButton.innerHTML = `
            <div class="apple-loading">
                <div class="apple-spinner"></div>
                <span>${this.options.rtl ? 'در حال تکمیل...' : 'Completing...'}</span>
            </div>
        `;
        this.nextButton.disabled = true;

        // Map our step data to the expected SiteCreateForm structure
        const siteFormData = this.prepareSiteFormData();
        
        console.log('Submitting wizard data:', siteFormData);

        // Clear any saved wizard data since we're completing
        if (this.options.autoSave) {
            try {
                localStorage.removeItem('appleWizardData');
            } catch (e) {
                console.warn('Could not clear localStorage:', e);
            }
        }

        try {
            // Create a form element and submit it normally (non-AJAX)
            // This allows the browser to handle redirects naturally
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = window.location.href;
            form.style.display = 'none';

            // Add CSRF token
            const csrfToken = this.getCSRFToken();
            console.log('CSRF Token:', csrfToken ? 'Found' : 'Missing');
            
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_csrf';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            // Add create parameter
            const createInput = document.createElement('input');
            createInput.type = 'hidden';
            createInput.name = 'create';
            createInput.value = '1';
            form.appendChild(createInput);

            // Add all SiteCreateForm data
            Object.keys(siteFormData).forEach(key => {
                if (Array.isArray(siteFormData[key])) {
                    siteFormData[key].forEach(value => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = `SiteCreateForm[${key}][]`;
                        input.value = value;
                        form.appendChild(input);
                        console.log(`Added array field: SiteCreateForm[${key}][] = ${value}`);
                    });
                } else {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = `SiteCreateForm[${key}]`;
                    input.value = siteFormData[key];
                    form.appendChild(input);
                    console.log(`Added field: SiteCreateForm[${key}] = ${siteFormData[key]}`);
                }
            });

            // Show success message before submitting
            this.showSuccess();

            // Add form to document
            document.body.appendChild(form);
            
            console.log('Form created with', form.elements.length, 'elements');
            
            // Mark form as submitted to prevent multiple submissions
            form.setAttribute('data-submitted', 'true');
            
            // Add a timeout fallback in case form submission fails
            const timeoutId = setTimeout(() => {
                console.error('Form submission timeout - falling back to AJAX');
                this.fallbackToAjax(siteFormData);
            }, 8000); // Increased timeout to 8 seconds

            // Submit immediately
            console.log('Submitting form...');
            
            // Use a slight delay to ensure the success message is visible
            setTimeout(() => {
                form.submit();
                console.log('Form submitted successfully');
                
                // Clear timeout since form was submitted
                clearTimeout(timeoutId);
            }, 500);
            
        } catch (error) {
            console.error('Error creating form:', error);
            this.showError(this.options.rtl ? 
                'خطا در آماده‌سازی فرم. در حال تلاش مجدد...' :
                'Error preparing form. Retrying...'
            );
            
            // Fallback to AJAX if form creation fails
            setTimeout(() => {
                this.fallbackToAjax(siteFormData);
            }, 1000);
        }
    }

    fallbackToAjax(siteFormData) {
        console.log('Using AJAX fallback...');
        
        const formData = new FormData();
        formData.append('_csrf', this.getCSRFToken());
        formData.append('create', '1');
        
        Object.keys(siteFormData).forEach(key => {
            if (Array.isArray(siteFormData[key])) {
                siteFormData[key].forEach(value => {
                    formData.append(`SiteCreateForm[${key}][]`, value);
                });
            } else {
                formData.append(`SiteCreateForm[${key}]`, siteFormData[key]);
            }
        });

        fetch(window.location.href, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('AJAX Response status:', response.status);
            if (response.ok) {
                // Force redirect to the main page
                window.location.href = window.location.origin;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .catch(error => {
            console.error('AJAX fallback failed:', error);
            this.showError(this.options.rtl ? 
                'خطا در ثبت اطلاعات. لطفاً صفحه را رفرش کنید.' :
                'Error saving data. Please refresh the page.'
            );
            this.nextButton.disabled = false;
            this.updateNavigation();
        });
    }

    prepareSiteFormData() {
        // Map our wizard data to the expected SiteCreateForm structure
        const formData = {};
        
        // Required basic fields - use the correct field names from our form
        formData.title = this.stepData.siteName || this.stepData.organization || 'انتراگزگرون فارسی';
        formData.contact = this.stepData.contactEmail || 'admin@example.com';
        
        // Generate a unique subdomain to avoid conflicts
        const timestamp = Date.now().toString().slice(-6);
        formData.subdomain = `site${timestamp}`;
        
        formData.organization = this.stepData.organization || this.stepData.siteName || 'سازمان';
        formData.language = this.stepData.language || 'fa';
        formData.siteEmail = this.stepData.contactEmail || 'admin@example.com';
        
        // Default settings
        formData.openNow = '1';
        formData.prettyUrls = '1';
        formData.motionScreening = '1';
        formData.amendScreening = '1';
        formData.singleMotion = '0';
        formData.amendSinglePara = '0';
        formData.speechLogin = '0';
        formData.speechQuotas = '0';
        formData.applicationType = '1';
        formData.needsSupporters = '0';
        formData.minSupporters = '0';
        
        // Functionality array - build based on selections
        formData.functionality = [];
        
        // Always include basic motions
        formData.functionality.push('1'); // FUNCTIONALITY_MOTIONS
        
        // Purpose-based functionality
        if (this.stepData.purpose_options) {
            const purpose = this.stepData.purpose_options[0];
            switch (purpose) {
                case 'party':
                    formData.functionality.push('2'); // FUNCTIONALITY_MANIFESTO
                    formData.functionality.push('6'); // FUNCTIONALITY_STATUTE_AMENDMENTS
                    break;
                case 'association':
                    formData.functionality.push('3'); // FUNCTIONALITY_APPLICATIONS
                    formData.functionality.push('4'); // FUNCTIONALITY_AGENDA
                    break;
                case 'parliament':
                    formData.functionality.push('4'); // FUNCTIONALITY_AGENDA
                    formData.functionality.push('5'); // FUNCTIONALITY_SPEECH_LISTS
                    break;
            }
        }
        
        // Motion configuration
        if (this.stepData.motions_options) {
            const hasMotionsFromMembers = this.stepData.motions_options.includes('members');
            const hasMotionsFromBoard = this.stepData.motions_options.includes('board');
            
            if (hasMotionsFromMembers) {
                formData.motionsInitiatedBy = '2'; // MOTION_INITIATED_LOGGED_IN
            } else if (hasMotionsFromBoard) {
                formData.motionsInitiatedBy = '1'; // MOTION_INITIATED_ADMINS
            } else {
                formData.motionsInitiatedBy = '1'; // MOTION_INITIATED_ADMINS (default)
            }
        } else {
            formData.motionsInitiatedBy = '2'; // Default to logged in users
        }
        
        // Amendment configuration
        if (this.stepData.amendments_options) {
            const allowAmendments = this.stepData.amendments_options.includes('enable');
            const singleParagraph = this.stepData.amendments_options.includes('single');
            
            formData.hasAmendments = allowAmendments ? '1' : '0';
            formData.amendSinglePara = singleParagraph ? '1' : '0';
            formData.amendmentsInitiatedBy = allowAmendments ? '2' : '1'; // Logged in users if enabled
        } else {
            formData.hasAmendments = '1'; // Default enable
            formData.amendmentsInitiatedBy = '2';
        }
        
        // Special features
        if (this.stepData.special_options) {
            const hasComments = this.stepData.special_options.includes('comments');
            const hasVoting = this.stepData.special_options.includes('voting');
            const hasSpeech = this.stepData.special_options.includes('speechLists');
            const hasSupporters = this.stepData.special_options.includes('supporters');
            
            formData.hasComments = hasComments ? '1' : '0';
            formData.needsSupporters = hasSupporters ? '1' : '0';
            formData.minSupporters = hasSupporters ? '3' : '0';
            
            if (hasVoting) {
                formData.functionality.push('7'); // FUNCTIONALITY_VOTINGS
            }
            if (hasSpeech) {
                formData.functionality.push('5'); // FUNCTIONALITY_SPEECH_LISTS
                formData.speechLogin = '1';
            }
        } else {
            formData.hasComments = '0';
        }
        
        // Ensure functionality array has at least motions
        if (formData.functionality.length === 0) {
            formData.functionality = ['1'];
        }
        
        console.log('Prepared form data:', formData);
        return formData;
    }

    showSuccess() {
        const successDiv = document.createElement('div');
        successDiv.className = 'apple-alert apple-alert-success';
        successDiv.innerHTML = `
            <div class="apple-alert-icon">✓</div>
            <div>${this.options.rtl ? 
                'نصب با موفقیت تکمیل شد! در حال هدایت...' :
                'Setup completed successfully! Redirecting...'
            }</div>
        `;
        this.stepContent.appendChild(successDiv);
        this.announceToScreenReader(successDiv.textContent);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'apple-alert apple-alert-error';
        errorDiv.innerHTML = `
            <div class="apple-alert-icon">⚠</div>
            <div>${message}</div>
        `;
        this.stepContent.appendChild(errorDiv);
        this.announceToScreenReader(message);
    }

    // Utility functions
    getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    announceToScreenReader(message) {
        this.announcements.textContent = message;
        setTimeout(() => {
            this.announcements.textContent = '';
        }, 1000);
    }

    handleTabNavigation(e) {
        const focusableElements = this.container.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    // Public API
    destroy() {
        // Clean up event listeners and data
        if (this.options.autoSave) {
            try {
                localStorage.removeItem('appleWizardData');
            } catch (e) {
                console.warn('Could not clear localStorage:', e);
            }
        }
    }

    getCurrentStep() {
        return this.currentStep;
    }

    getStepData() {
        return this.stepData;
    }
}

// Auto-initialize wizard if container exists
document.addEventListener('DOMContentLoaded', function() {
    const wizardContainer = document.querySelector('#AppleFarsiWizard');
    if (wizardContainer) {
        // Initialize Apple Farsi Wizard
        window.appleFarsiWizard = new AppleFarsiWizard('AppleFarsiWizard', {
            rtl: document.documentElement.lang === 'fa' || document.documentElement.dir === 'rtl',
            autoSave: true,
            validateOnStep: true,
            config: window.wizardConfig || {}
        });
    } else {
        // Fallback for existing wizard container
        const fallbackContainer = document.querySelector('#SiteCreateWizard, .wizardWidget');
        if (fallbackContainer) {
            window.appleFarsiWizard = new AppleFarsiWizard(fallbackContainer.id || 'SiteCreateWizard', {
                rtl: document.documentElement.lang === 'fa',
                autoSave: true,
                validateOnStep: true
            });
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppleFarsiWizard;
}
