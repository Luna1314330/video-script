import { NextRequest, NextResponse } from 'next/server'

// Mock 用户数据（实际项目中从数据库读取）
const mockUsers: Array<{
  id: string
  phone: string
  password: string
  created_at: string
}> = [
  {
    id: '1',
    phone: '13800138001',
    password: '123456', // 演示账号
    created_at: new Date().toISOString(),
  },
]

// 生成简单 token（实际项目使用 JWT）
function generateToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64')
}

// 注册
export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    if (phone.length !== 11) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
    }

    // 检查手机号是否已注册
    const exists = mockUsers.find((u) => u.phone === phone)
    if (exists) {
      return NextResponse.json({ error: '该手机号已注册' }, { status: 400 })
    }

    // 创建新用户
    const newUser = {
      id: String(mockUsers.length + 1),
      phone,
      password,
      created_at: new Date().toISOString(),
    }
    mockUsers.push(newUser)

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: { id: newUser.id, phone: newUser.phone },
    })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
