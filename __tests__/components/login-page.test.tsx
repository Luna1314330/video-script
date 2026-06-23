import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '@/app/(auth)/login/page'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/auth-client', () => ({
  saveAuthSession: vi.fn(),
}))

import { saveAuthSession } from '@/lib/auth-client'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/login')
  })

  it('渲染登录表单', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '立即注册' })).toHaveAttribute('href', '/register')
  })

  it('空表单提交显示校验错误', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findByText('请输入手机号')).toBeInTheDocument()
    expect(screen.getByText('请输入密码')).toBeInTheDocument()
  })

  it('手机号格式错误时显示提示', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('请输入手机号'), '123')
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456')
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findByText('请输入正确的手机号格式')).toBeInTheDocument()
  })

  it('登录成功保存 session 并跳转', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/login?redirect=/membership')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          token: 'access-token',
          refresh_token: 'refresh-token',
          user: { id: 'u1', phone: '13800138000', nickname: '用户' },
        }),
      }),
    )

    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456')
    await user.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(() => {
      expect(saveAuthSession).toHaveBeenCalledWith({
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u1', phone: '13800138000', nickname: '用户' },
      })
      expect(mockPush).toHaveBeenCalledWith('/membership')
    })

    vi.unstubAllGlobals()
  })

  it('账号被禁用时显示提示', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ code: 'BANNED', error: '该手机号已被禁用，请联系管理员' }),
      }),
    )

    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456')
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(
      await screen.findByText('该手机号已被禁用，请联系管理员'),
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it('凭据错误时显示服务端消息', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: '手机号或密码错误' }),
      }),
    )

    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456')
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findByText('手机号或密码错误')).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
