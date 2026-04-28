import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('LoginPage', () => {
    const mockNavigate = vi.fn();
    const mockLogin = vi.fn();
    const mockClearAuthExpiredMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useAuth as any).mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            authExpiredMessage: '',
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
        });
    });

    describe('前端元素', () => {
        it('渲染歡迎標題與文字', () => {
            render(<LoginPage />);

            expect(screen.getByText('歡迎回來')).toBeInTheDocument();
            expect(screen.getByText('請登入以繼續')).toBeInTheDocument();
            expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
            expect(screen.getByLabelText('密碼')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
        });
    });

    describe('驗證邏輯', () => {
        it('Email 格式錯誤時顯示錯誤訊息', async () => {
            const user = userEvent.setup();
            render(<LoginPage />);

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const loginButton = screen.getByRole('button', { name: '登入' });

            await user.type(emailInput, 'invalid-email');
            await user.type(passwordInput, 'Valid1234');
            await user.click(loginButton);

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼長度不足 8 碼時顯示錯誤訊息 ', async () => {
            const user = userEvent.setup();
            render(<LoginPage /
            
            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const loginButton = screen.getByRole('button', { name: '登入' });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'aB123');
            await user.click(loginButton);

            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼缺少英數混合時顯示錯誤訊息', async () => {
            const user = userEvent.setup();
            render(<LoginPage />);

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const loginButton = screen.getByRole('button', { name: '登入' });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, '12345678');
            await user.click(loginButton);

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });
    });

    describe('Mock API', () => {
        it('登入成功後顯示載入中並導向至 /dashboard', async () => {
            const user = userEvent.setup();
            mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<LoginPage />);

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const loginButton = screen.getByRole('button', { name: '登入' });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'Valid1234');

            const clickPromise = user.click(loginButton);

            expect(await screen.findByText('登入中...')).toBeInTheDocument();
            expect(loginButton).toBeDisabled();
            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();

            await clickPromise;

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });

        it('登入失敗時顯示 API 錯誤訊息', async () => {
            const user = userEvent.setup();
            mockLogin.mockRejectedValue({
                response: { data: { message: '帳號或密碼錯誤' } }
            });
            render(<LoginPage />);

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const loginButton = screen.getByRole('button', { name: '登入' });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'Valid1234');
            await user.click(loginButton);

            await waitFor(() => {
                expect(screen.getByText('帳號或密碼錯誤')).toBeInTheDocument();
            });
        });
    });

    describe('驗證狀態', () => {
        it('若使用者已登入，自動導向 /dashboard', () => {
            (useAuth as any).mockReturnValue({
                login: mockLogin,
                isAuthenticated: true,
                authExpiredMessage: '',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            });

            render(<LoginPage />);

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });

        it('若有過期訊息，顯示該錯誤並呼叫清除函式', () => {
            (useAuth as any).mockReturnValue({
                login: mockLogin,
                isAuthenticated: false,
                authExpiredMessage: '登入狀態已過期',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            });

            render(<LoginPage />);

            expect(screen.getByText('登入狀態已過期')).toBeInTheDocument();
            expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
        });
    });
});
