'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Ban, Unlock, X } from 'lucide-react'

interface User {
  id: string
  phone: string
  nickname: string
  status: 'active' | 'banned'
  membershipType: 'monthly' | 'quarterly' | 'yearly' | 'none'
  createdAt: string
}

const mockUsers: User[] = [
  { id: '1', phone: '138****8001', nickname: '张三', status: 'active', membershipType: 'yearly', createdAt: '2024-01-15' },
  { id: '2', phone: '138****8002', nickname: '李四', status: 'active', membershipType: 'monthly', createdAt: '2024-02-20' },
  { id: '3', phone: '138****8003', nickname: '王五', status: 'banned', membershipType: 'none', createdAt: '2024-03-10' },
]

const membershipTypeMap = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
  none: '无',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    setUsers(mockUsers)
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.phone.includes(searchQuery) ||
        user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [users, searchQuery])

  const handleAddUser = () => {
    // 手机号验证：必须是11位数字
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!newPhone.trim()) {
      alert('请输入手机号')
      return
    }
    if (!phoneRegex.test(newPhone)) {
      alert('手机号格式不正确，请输入11位有效手机号')
      return
    }
    // 检查手机号是否已存在
    if (users.some(u => u.phone === newPhone)) {
      alert('该手机号已注册')
      return
    }
    const newUser: User = {
      id: String(users.length + 1),
      phone: newPhone,
      // 昵称为空时使用完整手机号
      nickname: newNickname.trim() || newPhone,
      status: 'active',
      membershipType: 'none',
      createdAt: new Date().toISOString().split('T')[0],
    }
    setUsers([newUser, ...users])
    setShowAddModal(false)
    setNewPhone('')
    setNewNickname('')
  }

  const handleToggleBan = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: u.status === 'active' ? 'banned' : 'active' } : u
    ))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">用户管理</h1>
        <p className="text-sm text-muted-foreground">管理平台注册用户</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">用户列表</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button 
                onClick={() => { console.log('添加用户按钮被点击'); setShowAddModal(true); }} 
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-md bg-primary px-3 h-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                添加用户
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索手机号/昵称"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">用户ID</th>
                  <th className="text-left py-3 px-2 font-medium">手机号</th>
                  <th className="text-left py-3 px-2 font-medium">昵称</th>
                  <th className="text-left py-3 px-2 font-medium">状态</th>
                  <th className="text-left py-3 px-2 font-medium">会员</th>
                  <th className="text-left py-3 px-2 font-medium">注册时间</th>
                  <th className="text-right py-3 px-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">{user.id}</td>
                      <td className="py-3 px-2">{user.phone}</td>
                      <td className="py-3 px-2">{user.nickname}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.status === 'active' ? '正常' : '已封禁'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {membershipTypeMap[user.membershipType]}
                      </td>
                      <td className="py-3 px-2">{user.createdAt}</td>
                      <td className="py-3 px-2 text-right">
                        <button 
                          className="inline-flex items-center justify-center rounded-md hover:bg-muted p-1.5"
                          onClick={() => setSelectedUser(user)}
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="inline-flex items-center justify-center rounded-md hover:bg-muted p-1.5"
                          onClick={() => handleToggleBan(user.id)}
                          title={user.status === 'active' ? '封禁用户' : '解除封禁'}
                        >
                          {user.status === 'active' ? (
                            <Ban className="h-4 w-4 text-red-500" />
                          ) : (
                            <Unlock className="h-4 w-4 text-green-500" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 添加用户弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">添加用户</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">手机号 *</label>
                <Input
                  placeholder="请输入手机号"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">昵称（选填）</label>
                <Input
                  placeholder="请输入昵称"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background hover:bg-muted h-9 px-4 text-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  取消
                </button>
                <button 
                  className="inline-flex items-center justify-center gap-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm"
                  onClick={handleAddUser}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 用户详情弹窗 */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">用户详情</h2>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">用户ID</span>
                <span>{selectedUser.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">手机号</span>
                <span>{selectedUser.phone}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">昵称</span>
                <span>{selectedUser.nickname}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">状态</span>
                <span>{selectedUser.status === 'active' ? '正常' : '已封禁'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">会员类型</span>
                <span>{membershipTypeMap[selectedUser.membershipType]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">注册时间</span>
                <span>{selectedUser.createdAt}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background hover:bg-muted h-9 px-4 text-sm"
                onClick={() => setSelectedUser(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
