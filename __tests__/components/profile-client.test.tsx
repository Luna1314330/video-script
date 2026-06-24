import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfileClient from '@/components/profile/ProfileClient'

vi.mock('@/components/GenerationQuotaDisplay', () => ({
  GenerationQuotaDisplay: () => <div data-testid="quota-display" />,
}))

vi.mock('@/components/ScriptCard', () => ({
  ScriptCard: () => null,
}))

vi.mock('@/lib/history/client', () => ({
  fetchScriptHistory: vi.fn().mockResolvedValue({
    items: [],
    pagination: { total: 0, totalPages: 1 },
  }),
  formatHistoryTime: vi.fn(),
  SCRIPT_HISTORY_PAGE_SIZE: 5,
}))

vi.mock('@/lib/profile/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/profile/client')>()
  return {
    ...actual,
    fetchCurrentUser: vi.fn(),
    changePassword: vi.fn(),
    fetchCustomerServiceWechat: vi.fn(),
  }
})

import { fetchCurrentUser } from '@/lib/profile/client'

const freeUser = {
  id: 'u1',
  phone: '13800138000',
  nickname: '测试用户',
  membership: {
    status: 'free' as const,
    plan_type: null,
  },
}

const memberUser = {
  ...freeUser,
  membership: {
    status: 'active' as const,
    plan_type: 'monthly',
    starts_at: '2024-01-01T00:00:00.000Z',
    expires_at: '2025-01-01T00:00:00.000Z',
  },
}

describe('ProfileClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchCurrentUser).mockResolvedValue(freeUser)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, membershipPurchaseEnabled: false }),
          { status: 200 },
        ),
      ),
    )
  })

  it('渲染个人中心基础菜单', async () => {
    render(<ProfileClient />)

    expect(screen.getByText('个人中心')).toBeInTheDocument()
    expect(screen.getAllByText('用户信息').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('历史脚本')).toBeInTheDocument()
    expect(screen.queryByText('订单信息')).not.toBeInTheDocument()
    expect(screen.getByText('修改密码')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← 返回首页' })).toHaveAttribute('href', '/')
  })

  it('普通用户不显示专属客服菜单', async () => {
    render(<ProfileClient />)

    await waitFor(() => {
      expect(fetchCurrentUser).toHaveBeenCalled()
    })

    expect(screen.queryByText('专属客服')).not.toBeInTheDocument()
  })

  it('有效会员显示专属客服菜单', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(memberUser)

    render(<ProfileClient />)

    expect(await screen.findByText('专属客服')).toBeInTheDocument()
  })

  it('默认展示用户信息并加载用户数据', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(memberUser)

    render(<ProfileClient />)

    expect(await screen.findByText('13800138000')).toBeInTheDocument()
    expect(screen.getByText('VIP会员')).toBeInTheDocument()
    expect(screen.getByText('月度会员')).toBeInTheDocument()
  })

  it('修改密码页校验必填项', async () => {
    const user = userEvent.setup()
    render(<ProfileClient />)

    await waitFor(() => {
      expect(fetchCurrentUser).toHaveBeenCalled()
    })

    await user.click(screen.getByText('修改密码'))
    await user.click(screen.getByRole('button', { name: '确认修改' }))

    expect(await screen.findByText('请输入旧密码')).toBeInTheDocument()
    expect(screen.getByText('请输入新密码')).toBeInTheDocument()
    expect(screen.getByText('请再次输入密码')).toBeInTheDocument()
  })

  it('修改密码页校验两次密码一致', async () => {
    const user = userEvent.setup()
    render(<ProfileClient />)

    await waitFor(() => {
      expect(fetchCurrentUser).toHaveBeenCalled()
    })

    await user.click(screen.getByText('修改密码'))
    await user.type(screen.getByPlaceholderText('请输入旧密码'), '123456')
    await user.type(screen.getByPlaceholderText('请输入新密码（6-12位）'), '654321')
    await user.type(screen.getByPlaceholderText('请再次输入密码'), '111111')
    await user.click(screen.getByRole('button', { name: '确认修改' }))

    expect(await screen.findByText('两次密码输入不一致')).toBeInTheDocument()
  })

  it('可切换到历史脚本页', async () => {
    const user = userEvent.setup()
    render(<ProfileClient />)

    await user.click(screen.getByText('历史脚本'))

    expect(await screen.findByText('暂无脚本记录')).toBeInTheDocument()
  })
})
