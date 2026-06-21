"use client"

import { useState } from "react"

// 默认用户数据
const defaultUser = {
  phone: "138****8001",
  isVip: true,
  vipExpireDate: "2024-12-31",
}

// Mock 脚本历史数据
const mockScripts = [
  {
    id: "1",
    industry: "餐饮",
    productName: "麻辣烫",
    productDesc: "成都特色麻辣烫",
    shootScene: "餐厅实景",
    topic: "这碗麻辣烫，让我想起了成都的夜市",
    generatedScript: "【开场】镜头对准热气腾腾的麻辣烫...\n【旁白】说起成都，你首先想到的是什么？火锅、串串、还是今天我要推荐的这碗麻辣烫？",
    createdAt: "2024-03-20 14:30",
  },
  {
    id: "2",
    industry: "服装",
    productName: "连衣裙",
    productDesc: "2024春季新款",
    shootScene: "室内棚拍",
    topic: "这件裙子，让我秒变气质女神",
    generatedScript: "【开场】走进房间，镜头捕捉到衣架上的连衣裙...\n【旁白】每个女生的衣柜里，都需要一条能让自己自信的裙子。",
    createdAt: "2024-03-19 10:20",
  },
  {
    id: "3",
    industry: "美妆",
    productName: "口红",
    productDesc: "豆沙色号",
    shootScene: "化妆台",
    topic: "这支口红，让我爱上了镜中的自己",
    generatedScript: "【特写】手拿口红的画面...\n【旁白】口红外包装简约大方，拿到手里质感满分。",
    createdAt: "2024-03-18 16:45",
  },
]

// Mock 订单数据
const mockOrders = [
  {
    id: "1",
    type: "月度会员",
    amount: 29,
    status: "completed",
    createdAt: "2024-03-15 10:00",
  },
  {
    id: "2",
    type: "月度会员",
    amount: 29,
    status: "pending",
    createdAt: "2024-02-15 10:00",
  },
]

// Mock 会员信息
const defaultMembership = {
  type: "月度会员",
  startDate: "2024-03-15",
  expireDate: "2024-04-15",
  status: "active",
}

// 菜单项
const menuItems = [
  { key: "info", label: "会员信息" },
  { key: "password", label: "修改密码" },
  { key: "scripts", label: "历史脚本" },
  { key: "orders", label: "订单中心" },
]

export default function ProfilePage() {
  const [activeMenu, setActiveMenu] = useState<"info" | "password" | "scripts" | "orders">("info")
  const [user] = useState(defaultUser)
  const [membership] = useState(defaultMembership)

  // 修改密码状态
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordErrors, setPasswordErrors] = useState({ old: "", new: "", confirm: "" })
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // 密码验证
  const validatePasswordForm = () => {
    const errors = { old: "", new: "", confirm: "" }
    let valid = true

    if (!oldPassword) {
      errors.old = "请输入旧密码"
      valid = false
    }

    if (!newPassword) {
      errors.new = "请输入新密码"
      valid = false
    } else if (newPassword.length < 6 || newPassword.length > 12) {
      errors.new = "密码长度需为6-12位"
      valid = false
    }

    if (!confirmPassword) {
      errors.confirm = "请再次输入密码"
      valid = false
    } else if (confirmPassword !== newPassword) {
      errors.confirm = "两次密码输入不一致"
      valid = false
    }

    setPasswordErrors(errors)
    return valid
  }

  const handleChangePassword = () => {
    if (validatePasswordForm()) {
      // TODO: 调用 API 修改密码
      setPasswordSuccess(true)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 左侧菜单 */}
        <div className="w-64 bg-white min-h-screen shadow-sm">
          <div className="p-4 border-b">
            <h1 className="text-lg font-semibold text-gray-900">个人中心</h1>
          </div>
          <nav className="mt-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key as typeof activeMenu)}
                className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${
                  activeMenu === item.key
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 p-8">
          {/* 会员信息 */}
          {activeMenu === "info" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">会员信息</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">手机号</span>
                  <span className="text-gray-900">{user.phone}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">会员状态</span>
                  <span className={user.isVip ? "text-red-500 font-medium" : "text-gray-500"}>
                    {user.isVip ? "VIP会员" : "普通用户"}
                  </span>
                </div>
                {user.isVip && (
                  <>
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">会员类型</span>
                      <span className="text-gray-900">{membership.type}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">开通时间</span>
                      <span className="text-gray-900">{membership.startDate}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-600">到期时间</span>
                      <span className="text-gray-900">{membership.expireDate}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 修改密码 */}
          {activeMenu === "password" && (
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
              <h2 className="text-lg font-medium text-gray-900 mb-4">修改密码</h2>
              <div className="space-y-4">
                {passwordSuccess && (
                  <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                    密码修改成功！
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value)
                      setPasswordErrors((prev) => ({ ...prev, old: "" }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入旧密码"
                  />
                  {passwordErrors.old && (
                    <p className="mt-1 text-sm text-red-500">{passwordErrors.old}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setPasswordErrors((prev) => ({ ...prev, new: "" }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入新密码（6-12位）"
                  />
                  {passwordErrors.new && (
                    <p className="mt-1 text-sm text-red-500">{passwordErrors.new}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setPasswordErrors((prev) => ({ ...prev, confirm: "" }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请再次输入新密码"
                  />
                  {passwordErrors.confirm && (
                    <p className="mt-1 text-sm text-red-500">{passwordErrors.confirm}</p>
                  )}
                </div>

                <button
                  onClick={handleChangePassword}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  确认修改
                </button>
              </div>
            </div>
          )}

          {/* 历史脚本 */}
          {activeMenu === "scripts" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">历史脚本</h2>
              {mockScripts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无生成记录</p>
              ) : (
                <div className="space-y-4">
                  {mockScripts.map((script) => (
                    <div key={script.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2">
                            {script.industry}
                          </span>
                          <span className="text-gray-900 font-medium">{script.productName}</span>
                        </div>
                        <span className="text-sm text-gray-400">{script.createdAt}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">选题：{script.topic}</p>
                      {script.productDesc && (
                        <p className="text-gray-500 text-sm">产品描述：{script.productDesc}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 订单中心 */}
          {activeMenu === "orders" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">订单中心</h2>
              {mockOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无订单记录</p>
              ) : (
                <div className="space-y-3">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900 font-medium">{order.type}</span>
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.status === "completed" ? "已完成" : "待处理"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>订单号：{order.id}</span>
                        <span>下单时间：{order.createdAt}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <span className="text-lg font-medium text-red-500">¥{order.amount}</span>
                        {order.status === "pending" && (
                          <button className="text-sm text-gray-500 hover:text-gray-700">
                            取消订单
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
