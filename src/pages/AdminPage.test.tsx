import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
import { useAuth } from '../context/AuthContext';
import { useNavigate, BrowserRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('AdminPage', () => {
    const mockNavigate = vi.fn();
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useAuth as any).mockReturnValue({
            user: { username: 'AdminUser', role: 'admin' },
            logout: mockLogout,
        });
    });

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<BrowserRouter>{ui}</BrowserRouter>);
    };

    describe('前端元素', () => {
        it('渲染管理後台標題與特色清單', () => {
            renderWithRouter(<AdminPage />);
            
            expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
            expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
            expect(screen.getByText('只有 admin 角色可以訪問')).toBeInTheDocument();
            expect(screen.getByText('user 角色會被重定向')).toBeInTheDocument();
            expect(screen.getByText('受路由守衛保護')).toBeInTheDocument();
        });

        it('渲染角色標籤與登出按鈕', () => {
            renderWithRouter(<AdminPage />);
            
            expect(screen.getByText('管理員')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('點擊返回連結導向 /dashboard', () => {
            renderWithRouter(<AdminPage />);
            
            const backLink = screen.getByText('← 返回');
            expect(backLink.getAttribute('href')).toBe('/dashboard');
        });

        it('點擊登出按鈕時呼叫 logout 並導向 /login', async () => {
            const user = userEvent.setup();
            renderWithRouter(<AdminPage />);
            
            const logoutButton = screen.getByRole('button', { name: '登出' });
            await user.click(logoutButton);
            
            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
