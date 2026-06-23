import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegisterPage from '@/app/(auth)/register/page'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('渲染注册表单', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('heading', { name: '注册' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请再次输入密码')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '立即登录' })).toHaveAttribute('href', '/login')
  })

  it('空表单提交显示校验错误', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(await screen.findByText('请输入手机号')).toBeInTheDocument()
    expect(screen.getByText('请输入密码')).toBeInTheDocument()
    expect(screen.getByText('请再次输入密码')).toBeInTheDocument()
  })

  it('两次密码不一致时显示错误', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('请输入密码（6-18位）'), '123456')
    await user.type(screen.getByPlaceholderText('请再次输入密码'), '654321')
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(await screen.findByText('两次密码输入不一致')).toBeInTheDocument()
  })

  it('注册成功提示并跳转登录页', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: '注册成功' }),
      }),
    )

    render(<RegisterPage />)

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('请输入密码（6-18位）'), '123456')
    await user.type(screen.getByPlaceholderText('请再次输入密码'), '123456')
    await user.click(screen.getByRole('button', { name: '注册' }))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('注册成功！')
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    vi.unstubAllGlobals()
  })

  it('手机号已注册时显示提示', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          code: 'ALREADY_REGISTERED',
          error: '该手机号已注册过，请直接登录',
        }),
      }),
    )

    render(<RegisterPage />)

    await user.type(screen.getByPlaceholderText('请输入手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('请输入密码（6-18位）'), '123456')
    await user.type(screen.getByPlaceholderText('请再次输入密码'), '123456')
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(
      await screen.findByText('该手机号已注册过，请直接登录'),
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
