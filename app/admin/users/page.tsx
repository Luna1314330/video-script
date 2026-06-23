'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AdminTablePagination } from '@/components/admin/AdminTablePagination'
import { paginateArray } from '@/lib/admin-pagination'
import { Plus, Search, Eye, Ban, Unlock, X } from 'lucide-react'

interface User {
  id: string
  phone: string
  nickname: string
  status: 'active' | 'banned'
  membershipType: 'monthly' | 'quarterly' | 'yearly' | 'none'
  createdAt: string
}

const membershipTypeMap: Record<string, string> = {
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
  const [newPassword, setNewPassword] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setUsers(data.data || [])
      } else {
        toast.error(data.message || '获取用户列表失败')
        setUsers([])
      }
    } catch {
      toast.error('获取用户列表失败')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (value: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('zh-CN', { hour12: false })
  }

  const openAddModal = () => {
    setPhoneError('')
    setNewPhone('')
    setNewNickname('')
    setNewPassword('')
    setShowAddModal(true)
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.phone.includes(searchQuery) ||
        user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [users, searchQuery])

  const { items: paginatedUsers, total, totalPages } = useMemo(
    () => paginateArray(filteredUsers, currentPage),
    [filteredUsers, currentPage],
  )

  const handleAddUser = async () => {
    setPhoneError('')
    // 手机号验证：必须是11位数字
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!newPhone.trim()) {
      setPhoneError('请输入手机号')
      return
    }
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('手机号格式不正确，请输入11位有效手机号')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newPhone,
          nickname: newNickname,
          password: newPassword || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || '用户添加成功')
        await fetchUsers()
        setShowAddModal(false)
        setNewPhone('')
        setNewNickname('')
        setNewPassword('')
      } else {
        setPhoneError(data.message || data.error || '添加失败')
      }
    } catch {
      setPhoneError('添加失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleBan = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
    
    const newStatus = user.status === 'active' ? 'banned' : 'active'
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(newStatus === 'banned' ? '用户已封禁' : '用户已解封')
        await fetchUsers()
      } else {
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      console.error('更新用户状态失败:', error)
    }
  }

  const handleViewDetail = (user: User) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  // 手机号脱敏
  const maskPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.slice(0, 3) + '****' + phone.slice(-4)
    }
    return phone
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <p className="text-gray-500 mt-1">管理系统用户，查看用户信息和会员状态</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>用户列表</CardTitle>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-1" />
              添加用户
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索框 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索手机号或昵称..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* 用户表格 */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '未找到匹配的用户' : '暂无用户数据'}
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">手机号</th>
                    <th className="text-left py-3 px-4 font-medium">昵称</th>
                    <th className="text-left py-3 px-4 font-medium">会员状态</th>
                    <th className="text-left py-3 px-4 font-medium">注册时间</th>
                    <th className="text-left py-3 px-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{maskPhone(user.phone)}</td>
                      <td className="py-3 px-4">{user.nickname || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.membershipType === 'none' 
                            ? 'bg-gray-100 text-gray-600' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {membershipTypeMap[user.membershipType]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetail(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleBan(user.id)}
                            className={user.status === 'banned' ? 'text-green-600' : 'text-orange-600'}
                          >
                            {user.status === 'banned' ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminTablePagination
              page={currentPage}
              totalPages={totalPages}
              total={total}
              onPageChange={setCurrentPage}
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* 添加用户弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">添加用户</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">手机号 *</label>
                <Input
                  placeholder="请输入手机号"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">昵称</label>
                <Input
                  placeholder="请输入昵称（选填）"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">初始密码</label>
                <Input
                  type="password"
                  placeholder="留空则默认 123456"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">用于用户登录，至少 6 位</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={submitting}>
                取消
              </Button>
              <Button onClick={handleAddUser} disabled={submitting}>
                {submitting ? '添加中...' : '确认添加'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 用户详情弹窗 */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">用户详情</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">手机号</span>
                <span>{selectedUser.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">昵称</span>
                <span>{selectedUser.nickname || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">会员类型</span>
                <span>{membershipTypeMap[selectedUser.membershipType]}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">账号状态</span>
                <span className={selectedUser.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                  {selectedUser.status === 'active' ? '正常' : '已封禁'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">注册时间</span>
                <span>{formatDate(selectedUser.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
