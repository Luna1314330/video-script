'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { mockScriptHistory, type ScriptHistory } from '@/lib/admin-data'

const ITEMS_PER_PAGE = 10

// 手机号脱敏
function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export default function ScriptsPage() {
  const [mounted, setMounted] = useState(false)
  const [scripts, setScripts] = useState<ScriptHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedScript, setSelectedScript] = useState<ScriptHistory | null>(null)

  useEffect(() => {
    setMounted(true)
    // 使用 Mock 数据，后续替换为真实数据库查询
    setScripts(mockScriptHistory)
  }, [])

  const filteredScripts = useMemo(() => {
    return scripts.filter((script) => {
      const matchesSearch =
        searchQuery === '' ||
        script.userPhone.includes(searchQuery) ||
        script.industry.includes(searchQuery) ||
        script.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.topic.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [scripts, searchQuery])

  const totalPages = Math.ceil(filteredScripts.length / ITEMS_PER_PAGE)
  const paginatedScripts = filteredScripts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">脚本历史</h1>
        <p className="text-sm text-muted-foreground">查看用户生成的脚本记录</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">生成记录</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户、行业、产品..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">用户</TableHead>
                <TableHead>行业</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>选题</TableHead>
                <TableHead className="w-[160px]">生成时间</TableHead>
                <TableHead className="w-[80px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedScripts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                paginatedScripts.map((script) => (
                  <TableRow key={script.id}>
                    <TableCell className="font-medium">{maskPhone(script.userPhone)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{script.industry}</Badge>
                    </TableCell>
                    <TableCell>{script.productName}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={script.topic}>
                      {script.topic}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {script.createdAt}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedScript(script)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                共 {filteredScripts.length} 条记录，第 {currentPage}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={!!selectedScript} onOpenChange={() => setSelectedScript(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>脚本详情</DialogTitle>
            <DialogDescription>生成于 {selectedScript?.createdAt}</DialogDescription>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">用户</p>
                  <p className="font-medium">{maskPhone(selectedScript.userPhone)}</p>
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
                  <p className="text-sm text-muted-foreground">拍摄场景</p>
                  <p className="font-medium">{selectedScript.shootScene || '-'}</p>
                </div>
              </div>
              
              {selectedScript.productDesc && (
                <div>
                  <p className="text-sm text-muted-foreground">产品描述</p>
                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm">
                    {selectedScript.productDesc}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">选题</p>
                <p className="mt-1 p-3 bg-muted rounded-lg">
                  {selectedScript.topic}
                </p>
              </div>

              {selectedScript.generatedScript && (
                <div>
                  <p className="text-sm text-muted-foreground">生成的脚本</p>
                  <pre className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                    {selectedScript.generatedScript}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
