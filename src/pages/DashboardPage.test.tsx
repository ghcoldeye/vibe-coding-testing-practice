import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { useAuth } from '../context/AuthContext';
import { useNavigate, BrowserRouter } from 'react-router-dom';
import { productApi } from '../api/productApi';

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

vi.mock('../api/productApi', () => ({
    productApi: {
        getProducts: vi.fn(),
    },
}));

describe('DashboardPage', () => {
    const mockNavigate = vi.fn();
    const mockLogout = vi.fn();
    const mockGetProducts = productApi.getProducts as any;

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useAuth as any).mockReturnValue({
            user: { username: 'TestUser', role: 'user' },
            logout: mockLogout,
        });
        mockGetProducts.mockResolvedValue([]);
    });

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<BrowserRouter>{ui}</BrowserRouter>);
    };

    describe('前端元素', () => {
        it('渲染歡迎使用者與角色標籤', async () => {
            renderWithRouter(<DashboardPage />);
            
            await waitFor(() => {
                expect(screen.getByText('Welcome, TestUser 👋')).toBeInTheDocument();
            });
            expect(screen.getByText('一般用戶')).toBeInTheDocument();
        });

        it('管理員角色時顯示「管理後台」連結', async () => {
            (useAuth as any).mockReturnValue({
                user: { username: 'Admin', role: 'admin' },
                logout: mockLogout,
            });
            renderWithRouter(<DashboardPage />);
            
            await waitFor(() => {
                expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
            });
            expect(screen.getByText('管理員')).toBeInTheDocument();
        });

        it('一般用戶角色時不顯示「管理後台」連結', async () => {
            renderWithRouter(<DashboardPage />);
            
            await waitFor(() => {
                expect(screen.getByText('一般用戶')).toBeInTheDocument();
            });
            expect(screen.queryByText('🛠️ 管理後台')).not.toBeInTheDocument();
        });
    });

    describe('Mock API', () => {
        it('載入商品時顯示載入中狀態', async () => {
            mockGetProducts.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
            renderWithRouter(<DashboardPage />);
            
            expect(screen.getByText('載入商品中...')).toBeInTheDocument();
            
            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
        });

        it('成功載入商品後顯示商品卡片', async () => {
            mockGetProducts.mockResolvedValue([{ id: '1', name: '商品A', description: '描述', price: 100 }]);
            renderWithRouter(<DashboardPage />);
            
            await waitFor(() => {
                expect(screen.getByText('商品A')).toBeInTheDocument();
            });
            expect(screen.getByText('描述')).toBeInTheDocument();
            expect(screen.getByText('NT$ 100')).toBeInTheDocument();
            expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
        });

        it('API 回傳錯誤時顯示錯誤訊息', async () => {
            mockGetProducts.mockRejectedValue({
                response: { status: 500, data: { message: '無法載入商品資料' } }
            });
            renderWithRouter(<DashboardPage />);
            
            await waitFor(() => {
                expect(screen.getByText('無法載入商品資料')).toBeInTheDocument();
            });
            expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
        });

        it('API 回傳 401 時不顯示錯誤訊息', async () => {
            mockGetProducts.mockRejectedValue({
                response: { status: 401, data: { message: 'Unauthorized' } }
            });
            renderWithRouter(<DashboardPage />);
            
            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
            expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
            expect(screen.queryByText('無法載入商品資料')).not.toBeInTheDocument();
        });
    });

    describe('function 邏輯', () => {
        it('點擊登出按鈕時呼叫 logout 並導向 /login', async () => {
            const user = userEvent.setup();
            renderWithRouter(<DashboardPage />);
            
            await waitFor(() => {
                expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
            });
            
            const logoutButton = screen.getByRole('button', { name: '登出' });
            await user.click(logoutButton);
            
            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
