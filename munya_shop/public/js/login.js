frappe.ready(function () {

    class ModernSaaSLoginForm {

        constructor() {
            this.form = document.getElementById('loginForm');
            this.emailInput = document.getElementById('email');
            this.passwordInput = document.getElementById('password');
            this.passwordToggle = document.getElementById('passwordToggle');
            this.submitButton = document.querySelector('.submit-btn');
            this.successMessage = document.getElementById('successMessage');
            // this.socialButtons = document.querySelectorAll('.social-btn');

            this.init();
        }

        init() {
            this.bindEvents();
            this.setupPasswordToggle();
            // this.setupSocialButtons();
        }

        bindEvents() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            this.emailInput.addEventListener('blur', () => this.validateEmail());
            this.passwordInput.addEventListener('blur', () => this.validatePassword());

            this.emailInput.addEventListener('input', () => this.clearError('email'));
            this.passwordInput.addEventListener('input', () => this.clearError('password'));
        }

        setupPasswordToggle() {
            if (!this.passwordToggle) return;

            this.passwordToggle.addEventListener('click', () => {
                const isPassword = this.passwordInput.type === 'password';
                this.passwordInput.type = isPassword ? 'text' : 'password';

                this.passwordToggle.style.color = isPassword
                    ? 'rgba(28, 44, 95)'
                    : '#8792a2';
            });
        }

        // setupSocialButtons() {
        //     this.socialButtons.forEach(button => {
        //         button.addEventListener('click', () => {
        //             console.log(`Social login: ${button.textContent.trim()}`);
        //         });
        //     });
        // }

        validateEmail() {
            const email = this.emailInput.value.trim();
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email) return this.showError('email', 'Email is required'), false;
            if (!regex.test(email)) return this.showError('email', 'Invalid email'), false;

            this.clearError('email');
            return true;
        }

        validatePassword() {
            const password = this.passwordInput.value;

            if (!password) return this.showError('password', 'Password is required'), false;
            if (password.length < 6) return this.showError('password', 'Min 6 characters'), false;

            this.clearError('password');
            return true;
        }

        showError(field, message) {
            const input = document.getElementById(field);
            const group = input.closest('.input-group');
            const error = document.getElementById(`${field}Error`);

            if (group) group.classList.add('error');
            if (error) {
                error.textContent = message;
                error.classList.add('show');
            }
        }

        clearError(field) {
            const input = document.getElementById(field);
            const group = input.closest('.input-group');
            const error = document.getElementById(`${field}Error`);

            if (group) group.classList.remove('error');
            if (error) {
                error.classList.remove('show');
                setTimeout(() => (error.textContent = ''), 200);
            }
        }

        handleSubmit(e) {
            e.preventDefault();

            const emailOk = this.validateEmail();
            const passOk = this.validatePassword();

            if (!emailOk || !passOk) return;

            this.setLoading(true);

            const usr = this.emailInput.value.trim();
            const pwd = this.passwordInput.value;

            frappe.call({
                type: "POST",
                method: "munya_shop.www.login.custom_login",
                args: {
                    email: usr,
                    password: pwd
                },
                callback: (r) => {
                    console.log("LOGIN RESPONSE:", r);

                    if (r.message && r.message.status === "Success") {
                        console.log("LOGIN RESPONSE:", r);

                        this.showSuccess();

                        setTimeout(() => {
                            window.location.href = "/";
                        }, 800);

                    } else {
                        this.showError(
                            'password',
                            (r.message && r.message.message) || 'Invalid credentials'
                        );
                        this.setLoading(false);
                    }
                },

                error: () => {
                    this.showError('email', 'Server error. Try again later.');
                    this.setLoading(false);
                }
            });
        }

        setLoading(state) {
            this.submitButton.classList.toggle('loading', state);
            this.submitButton.disabled = state;

            // this.socialButtons.forEach(btn => {
            //     btn.style.pointerEvents = state ? 'none' : 'auto';
            //     btn.style.opacity = state ? '0.6' : '1';
            // });
        }

        showSuccess() {
            this.form.style.transform = 'scale(0.95)';
            this.form.style.opacity = '0';

            setTimeout(() => {
                this.form.style.display = 'none';

                document.querySelectorAll('.social-buttons, .signup-link, .divider')
                    .forEach(el => el && (el.style.display = 'none'));

                if (this.successMessage) {
                    this.successMessage.classList.add('show');
                }
            }, 300);
        }
    }

    // INIT inside frappe.ready
    new ModernSaaSLoginForm();
});