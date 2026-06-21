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

// 登录
export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json({ error: '请填写手机号和密码' }, { status: 400 })
    }

    // 查找用户
    const user = mockUsers.find((u) => u.phone === phone)
    if (!user) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    // 验证密码
    if (user.password !== password) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    // 生成 token
    const token = generateToken(user.id)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
      },
    })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
