'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Eye } from 'lucide-react'
import { AdminTablePagination } from '@/components/admin/AdminTablePagination'
import { paginateArray } from '@/lib/admin-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ScriptHistory {
  id: string
  userId: string
  phone: string
  industry: string
  productName: string
  productDesc: string
  shootScene: string
  topic: string
  generatedScript: string
  createdAt: string
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<ScriptHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedScript, setSelectedScript] = useState<ScriptHistory | null>(null)

  // Mock数据
  const mockScripts: ScriptHistory[] = [
    { id: '1', userId: '1', phone: '13800138001', industry: '餐饮', productName: '奶茶店', productDesc: '新品上市', shootScene: '店内', topic: '奶茶制作全过程', createdAt: '2024-01-15 10:30:00' },
    { id: '2', userId: '2', phone: '13800138002', industry: '服装', productName: '运动鞋', productDesc: '透气舒适', shootScene: '户外', topic: '运动穿搭推荐', createdAt: '2024-01-20 14:20:00' },
    { id: '3', userId: '1', phone: '13800138001', industry: '美妆', productName: '口红', productDesc: '滋润不干', shootScene: '室内', topic: '日常妆容教程', createdAt: '2024-01-25 09:15:00' },
  ]

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    try {
      setLoading(true)
      const keyword = searchQuery ? `?keyword=${encodeURIComponent(searchQuery)}` : ''
      const res = await fetch(`/api/admin/scripts${keyword}`)
      const data = await res.json()
      if (data.success) {
        setScripts(data.data)
      } else {
        setScripts(mockScripts)
      }
    } catch {
      setScripts(mockScripts)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = () => {
    setCurrentPage(1)
    fetchScripts()
  }

  const { items: paginatedScripts, total, totalPages } = useMemo(
    () => paginateArray(scripts, currentPage),
    [scripts, currentPage],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">脚本历史</h1>
        <p className="text-sm text-muted-foreground">查看用户生成的脚本记录</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">生成记录</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索行业/产品/选题/手机号"
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>行业</TableHead>
                <TableHead>产品</TableHead>
                <TableHead>选题</TableHead>
                <TableHead>生成时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : scripts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">暂无数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedScripts.map((script) => (
                  <TableRow key={script.id}>
                    <TableCell className="font-medium">{script.phone}</TableCell>
                    <TableCell>{script.industry}</TableCell>
                    <TableCell>{script.productName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {script.topic}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(script.createdAt).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedScript(script)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminTablePagination
            page={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={!!selectedScript} onOpenChange={() => setSelectedScript(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>脚本详情</DialogTitle>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">用户</p>
                  <p className="font-medium">{selectedScript.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">行业</p>
                  <p className="font-medium">{selectedScript.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">产品名称</p>
                  <p className="font-medium">{selectedScript.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">生成时间</p>
                  <p className="font-medium">
                    {new Date(selectedScript.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              {selectedScript.productDesc && (
                <div>
                  <p className="text-sm text-muted-foreground">产品描述</p>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedScript.productDesc}</p>
                </div>
              )}

              {selectedScript.shootScene && (
                <div>
                  <p className="text-sm text-muted-foreground">拍摄场景</p>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedScript.shootScene}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">用户选择的选题</p>
                <p className="mt-1 p-3 bg-muted rounded-md">{selectedScript.topic}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">生成的脚本</p>
                <pre className="mt-1 p-4 bg-muted rounded-md whitespace-pre-wrap text-sm font-mono">
                  {selectedScript.generatedScript || '暂无内容'}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
