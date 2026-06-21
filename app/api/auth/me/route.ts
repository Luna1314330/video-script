import { NextRequest, NextResponse } from 'next/server'

// Mock 用户数据
const mockUsers: Array<{
  id: string
  phone: string
  password: string
  created_at: string
}> = [
  {
    id: '1',
    phone: '13800138001',
    password: '123456',
    created_at: new Date().toISOString(),
  },
]

// 获取当前用户
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 解析 token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // 检查 token 是否过期
    if (decoded.exp < Date.now()) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 })
    }

    // 查找用户
    const user = mockUsers.find((u) => u.id === decoded.userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
      },
    })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
