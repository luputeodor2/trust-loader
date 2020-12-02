import "./../loader-config.js";
import {Spinner, prepareView} from "./services/UIService.js";
import WalletService from "./services/WalletService.js";
import SWAgent from "./services/SWAgent.js";

function NewController() {
    let username;
    let email;
    let password;
    let company;


    let wizard;
    let spinner;
    const walletService = new WalletService();

    this.hasInstallationUrl = function () {
        let windowUrl = new URL(window.location.href);
        return windowUrl.searchParams.get("appName") !== null;
    };

    this.init = function () {
        SWAgent.hasServiceWorkers((error, hasServiceWorker) => {
            if (hasServiceWorker) {
                SWAgent.unregisterAllServiceWorkers(() => {
                    window.location.reload();
                });
            } else {
                spinner = new Spinner(document.getElementsByTagName("body")[0]);
                wizard = new Stepper(document.getElementById("psk-wizard"));
            }
        });
    };

    this.showErrorOnField = function (fieldId) {
        document.getElementById(fieldId).style.border = "2px solid red";
    }

    this.removeErrorFromField = function (fieldId) {
        document.getElementById(fieldId).style.border = "1px solid #ced4da";
    }

    this.passwordsAreValid = function () {
        password = document.getElementById("password").value;
        let passwordConfirm = document.getElementById("confirm-password").value;

        let passwordIsValid = password.length >= APP_CONFIG.PASSWORD_MIN_LENGTH
        let confirmPasswordIsValid = passwordConfirm.length >= APP_CONFIG.PASSWORD_MIN_LENGTH

        if (typeof APP_CONFIG.PASSWORD_REGEX !== "undefined") {
            passwordIsValid = passwordIsValid && APP_CONFIG.PASSWORD_REGEX.test(password);
            confirmPasswordIsValid = confirmPasswordIsValid && APP_CONFIG.PASSWORD_REGEX.test(passwordConfirm);
        }

        password.length > 0 && !passwordIsValid ? this.showErrorOnField('password') : this.removeErrorFromField('password');
        passwordConfirm.length > 0 && !confirmPasswordIsValid ? this.showErrorOnField('confirm-password') : this.removeErrorFromField('confirm-password');

        return passwordIsValid && confirmPasswordIsValid && password === passwordConfirm;
    };

    this.credentialsAreValid = function () {
        username = document.getElementById("username").value;
        email = document.getElementById("email").value;

        let usernameIsValid = username.length >= APP_CONFIG.USERNAME_MIN_LENGTH && APP_CONFIG.USERNAME_REGEX.test(username);
        let emailIsValid = email.length > 4 && APP_CONFIG.EMAIL_REGEX.test(email);
        username.length > 0 && !usernameIsValid ? this.showErrorOnField('username') : this.removeErrorFromField('username');
        email.length > 0 && !emailIsValid ? this.showErrorOnField('email') : this.removeErrorFromField('email');

        return usernameIsValid && emailIsValid;
    };

    this.validateCredentials = function () {
        let btn = document.getElementById("register-btn");
        let credentialsAreValid = this.credentialsAreValid();
        let passwordsAreValid = this.passwordsAreValid();
        if (credentialsAreValid && passwordsAreValid) {
            btn.removeAttribute("disabled");
            return true;
        } else {
            btn.setAttribute("disabled", "disabled");
        }
        return false;
    };

    function createWallet() {
        spinner.attachToView();
        try {
            console.log("Creating wallet...");
            walletService.create(APP_CONFIG.environment.domain, [username, email, company, password], (err, wallet) => {
                if (err) {
                    document.getElementById("register-details-error").innerText = "An error occurred. Please try again.";
                    return console.error(err);
                }

                wallet.getKeySSI((err, keySSI) => {
                    console.log(`Wallet created. Seed: ${keySSI}`);
                    //document.getElementById("seed").value = keySSI;
                    spinner.removeFromView();
                    wizard.next();
                });
            });
        } catch (e) {
            document.getElementById("register-details-error").innerText = "Seed is not valid.";
        }
    }

    this.previous = function (event) {
        event.preventDefault();
        //document.getElementById("seed").value = "";
        document.getElementById("restore-seed-btn").setAttribute("disabled", "disabled");
        wizard.previous();
    };

    this.submitPassword = function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.credentialsAreValid() && this.passwordsAreValid()) {
            createWallet();
        }
    };
    this.goToLandingPage = function () {
        window.location.replace("./");
    };
}

let controller = new NewController();

document.addEventListener("DOMContentLoaded", function () {
    let LABELS = APP_CONFIG.LABELS_DICTIONARY;
    const page_labels = [
        {title: LABELS.APP_NAME},
        {"#step-register-details": LABELS.REGISTER_DETAILS},
        {"#step-complete": LABELS.COMPLETE},
        {"#set-up-username": LABELS.SET_UP_USERNAME},
        {"#set-up-username-help": LABELS.SET_UP_USERNAME_HELP},
        {"#username": LABELS.ENTER_USERNAME, attribute: "placeholder",},
        {"#set-up-email": LABELS.SET_UP_EMAIL},
        {"#set-up-email-help": LABELS.SET_UP_EMAIL_HELP},
        {"#email": LABELS.ENTER_EMAIL, attribute: "placeholder",},
        {"#set-up-password": LABELS.SET_UP_PASSWORD},
        {"#set-up-password-help": LABELS.SET_UP_PASSWORD_HELP},
        {"#password": LABELS.ENTER_PASSWORD, attribute: "placeholder",},
        {"#set-up-confirm-password": LABELS.SET_UP_CONFIRM_PASSWORD},
        {"#set-up-confirm-password-help": LABELS.SET_UP_CONFIRM_PASSWORD_HELP},
        {"#confirm-password": LABELS.ENTER_CONFIRM_PASSWORD, attribute: "placeholder",},
        {"#back-btn": LABELS.BACK_BUTTON_MESSAGE},
        {"#register-btn": LABELS.REGISTER_BUTTON_MESSAGE},
        {"#register-successfully": LABELS.REGISTER_SUCCESSFULLY},
        {"#seed_print": LABELS.SEED_PRINT},
        {"#open-wallet-btn": LABELS.OPEN_WALLET},
    ];
    if (controller.hasInstallationUrl()) {
        page_labels.push({"#more-information": APP_CONFIG.NEW_WALLET_MORE_INFORMATION});
    } else {
        document.querySelector("#more-information").remove();
    }
    prepareView(page_labels);
    controller.init();
});
window.controller = controller;
