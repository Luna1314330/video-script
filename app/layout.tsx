import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: '脚本工坊 | 短视频脚本生成',
  description: '从行业洞察到脚本输出，六步完成短视频内容策略与脚本创作',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#FBFAF7',
              color: '#1A1A1A',
              border: '1px solid #E5E5E0',
            },
          }}
        />
      </body>
    </html>
  )
}
