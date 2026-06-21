"use client"

import { useState } from "react"

const menuItems = [
  { key: "info", label: "会员信息" },
  { key: "password", label: "修改密码" },
  { key: "scripts", label: "历史脚本" },
  { key: "orders", label: "订单中心" },
]

export default function ProfileClient() {
  const [activeMenu, setActiveMenu] = useState<string>("password")

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
              <div
                key={item.key}
                onClick={() => {
                  console.log("点击菜单:", item.label, "key:", item.key)
                  setActiveMenu(item.key)
                }}
                className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  activeMenu === item.key
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 p-8">
          {activeMenu === "info" && <MemberInfo />}
          {activeMenu === "password" && <ChangePassword />}
          {activeMenu === "scripts" && <ScriptHistory />}
          {activeMenu === "orders" && <OrderCenter />}
        </div>
      </div>
    </div>
  )
}

function MemberInfo() {
  const user = { phone: "138****8001", isVip: true }
  const membership = { type: "月度会员", startDate: "2024-03-15", expireDate: "2024-04-15" }

  return (
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
  )
}

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState({ old: "", new: "", confirm: "" })
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const newErrors = { old: "", new: "", confirm: "" }
    let valid = true
    if (!oldPassword) { newErrors.old = "请输入旧密码"; valid = false }
    if (!newPassword) { newErrors.new = "请输入新密码"; valid = false }
    else if (newPassword.length < 6 || newPassword.length > 12) { newErrors.new = "密码长度需为6-12位"; valid = false }
    if (!confirmPassword) { newErrors.confirm = "请再次输入密码"; valid = false }
    else if (confirmPassword !== newPassword) { newErrors.confirm = "两次密码输入不一致"; valid = false }
    setErrors(newErrors)
    return valid
  }

  const handleSubmit = () => {
    if (validate()) {
      setSuccess(true)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
      <h2 className="text-lg font-medium text-gray-900 mb-4">修改密码</h2>
      {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">密码修改成功！</div>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
          <input type="password" value={oldPassword} onChange={(e) => { setOldPassword(e.target.value); setErrors({ ...errors, old: "" }) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入旧密码" />
          {errors.old && <p className="mt-1 text-sm text-red-500">{errors.old}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
          <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setErrors({ ...errors, new: "" }) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入新密码（6-12位）" />
          {errors.new && <p className="mt-1 text-sm text-red-500">{errors.new}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
          <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirm: "" }) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请再次输入密码" />
          {errors.confirm && <p className="mt-1 text-sm text-red-500">{errors.confirm}</p>}
        </div>
        <button onClick={handleSubmit} className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800">确认修改</button>
      </div>
    </div>
  )
}

function ScriptHistory() {
  const scripts = [
    { 
      id: "1", 
      industry: "餐饮", 
      productName: "麻辣烫", 
      topic: "这碗麻辣烫，让我想起了成都的夜市", 
      description: "深夜美食的治愈感",
      scene: "美食探店",
      createdAt: "2024-03-20 14:30", 
      generatedScript: "【开场】镜头对准热气腾腾的麻辣烫..." 
    },
    { 
      id: "2", 
      industry: "服装", 
      productName: "连衣裙", 
      topic: "这件裙子，让我秒变气质女神", 
      description: "",
      scene: "",
      createdAt: "2024-03-19 10:20", 
      generatedScript: "【开场】走进房间..." 
    },
    { 
      id: "3", 
      industry: "美妆", 
      productName: "口红", 
      topic: "这支口红，让我爱上了镜中的自己", 
      description: "自信提升",
      scene: "",
      createdAt: "2024-03-18 16:45", 
      generatedScript: "【特写】手拿口红的画面..." 
    },
  ]
  const [selectedScript, setSelectedScript] = useState<typeof scripts[0] | null>(scripts[0] || null)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">历史脚本</h2>
      {scripts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">暂无脚本记录</div>
      ) : (
        <div className="space-y-3">
          {scripts.map((script) => (
            <div 
              key={script.id} 
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedScript(script)}
            >
              {/* 第一行：行业 | 产品 | 日期 */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">行业：{script.industry}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-900">产品：{script.productName}</span>
                </div>
                <span className="text-gray-400">日期：{script.createdAt}</span>
              </div>
              
              {/* 描述行：没有则不显示 */}
              {script.description && (
                <p className="mt-2 text-sm text-gray-600">描述：{script.description}</p>
              )}
              
              {/* 场景行：没有则不显示 */}
              {script.scene && (
                <p className="mt-1 text-sm text-gray-600">场景：{script.scene}</p>
              )}
              
              {/* 选题 */}
              <p className="mt-2 text-sm font-medium text-gray-800">选题：{script.topic}</p>
            </div>
          ))}
        </div>
      )}
      {selectedScript && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedScript(null)}>
          <div 
            className="bg-white rounded-lg w-full max-w-2xl h-[70vh] flex flex-col relative" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 - 右上角 */}
            <button 
              onClick={() => setSelectedScript(null)} 
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors z-10"
            >
              ✕
            </button>
            
            {/* 头部信息 */}
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900 pr-10">{selectedScript.topic}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedScript.industry} | {selectedScript.productName} | {selectedScript.createdAt}
              </p>
            </div>
            
            {/* 内容区域 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {selectedScript.generatedScript}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCenter() {
  const orders = [
    { id: "1", type: "月度会员", amount: 29, status: "completed", createdAt: "2024-03-15 10:00" },
    { id: "2", type: "月度会员", amount: 29, status: "pending", createdAt: "2024-02-15 10:00" },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">订单中心</h2>
      {orders.length === 0 ? (
        <div className="text-center text-gray-500 py-8">暂无订单记录</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm text-gray-900">{order.type}</span>
                  <span className="ml-4 text-sm text-gray-600">¥{order.amount}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${order.status === "completed" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                  {order.status === "completed" ? "已完成" : "待处理"}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">{order.createdAt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
