import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Lock, LogIn } from 'lucide-react';
import './LoginWindow.css';
export function LoginWindow({ onLogin, title = 'Login', submitLabel = 'Log in', errorMessage, onClearError, }) {
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        onClearError?.();
        if (!password)
            return;
        setIsSubmitting(true);
        onLogin(password)
            .then(() => {
            setPassword('');
        })
            .catch(() => { })
            .finally(() => {
            setIsSubmitting(false);
        });
    }, [onLogin, password, onClearError]);
    return (_jsx("div", { className: "loginWindowOverlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "loginWindowTitle", children: _jsxs("div", { className: "loginWindow", children: [_jsxs("div", { className: "loginWindowHeader", children: [_jsx(Lock, { size: 20, className: "loginWindowHeaderIcon", "aria-hidden": true }), _jsx("h2", { id: "loginWindowTitle", className: "loginWindowTitle", children: title })] }), _jsxs("form", { onSubmit: handleSubmit, className: "loginWindowForm", children: [errorMessage && (_jsx("div", { className: "loginWindowError", role: "alert", children: errorMessage })), _jsxs("label", { className: "loginWindowLabel", children: [_jsx(Lock, { size: 16, className: "loginWindowLabelIcon", "aria-hidden": true }), _jsx("span", { children: "Password" }), _jsx("input", { type: "password", className: "loginWindowInput", value: password, onChange: (e) => {
                                        setPassword(e.target.value);
                                        onClearError?.();
                                    }, autoComplete: "current-password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: isSubmitting, autoFocus: true })] }), _jsxs("button", { type: "submit", className: "loginWindowSubmit", disabled: isSubmitting || !password, children: [_jsx(LogIn, { size: 16, "aria-hidden": true }), isSubmitting ? '...' : submitLabel] })] })] }) }));
}
