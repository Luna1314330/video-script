import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '免责声明 | 脚本工坊',
  description: '脚本工坊免责声明与用户须知',
}

const sections = [
  {
    title: '一、服务内容',
    body: '脚本工坊（以下简称"本平台"）提供的脚本内容由人工智能技术自动生成，仅供用户参考使用。',
  },
  {
    title: '二、内容准确性',
    body: '本平台不对 AI 生成内容的准确性、完整性、适用性作任何保证。生成内容可能存在错误、遗漏或不符合实际情况的情形，用户应自行核实并承担相应风险。',
  },
  {
    title: '三、合规性责任',
    body: '用户在使用本平台生成的内容时，应自行判断并确保：',
    list: [
      '内容符合《中华人民共和国广告法》《互联网广告管理办法》等相关法律法规；',
      '内容不含有虚假宣传、夸大功效、违规承诺等违法信息；',
      '内容不侵犯他人的知识产权、肖像权、名誉权等合法权益；',
      '内容符合各发布平台（如抖音、小红书、视频号等）的社区规范。',
    ],
  },
  {
    title: '四、使用风险自担',
    body: '用户将本平台生成的内容用于商业或非商业用途，所产生的任何法律纠纷、行政处罚或经济损失，均由用户自行承担，本平台不承担任何连带责任。',
  },
  {
    title: '五、知识产权',
    body: 'AI 生成内容的知识产权归属存在不确定性。用户应知悉，生成内容可能与他人作品存在相似之处，建议在使用前进行原创性检查。因内容侵权引发的纠纷，由使用者自行承担责任。',
  },
  {
    title: '六、服务变更',
    body: '本平台保留随时修改、暂停或终止服务的权利，无需事先通知。因服务变更给用户造成的损失，本平台不承担责任。',
  },
  {
    title: '七、用户隐私',
    body: '本平台重视用户隐私保护。用户注册信息、使用记录等数据的收集和处理，按照《隐私政策》执行。我们不会将用户个人信息提供给第三方，法律法规另有规定的除外。',
  },
  {
    title: '八、付费与退款',
    list: [
      '本平台提供会员付费服务，费用一经支付，除法律法规规定的情形外，不予退款；',
      '会员权益以购买时的页面说明为准；',
      '因用户自身原因导致的账号异常、权益无法使用等情况，本平台不承担赔偿责任。',
    ],
  },
] as const

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:opacity-80">
            脚本工坊
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            ← 返回首页
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">脚本工坊 免责声明</h1>
        <p className="text-sm text-muted-foreground mb-8">请在使用本平台服务前仔细阅读以下内容</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-gray-900 mb-2">{section.title}</h2>
              {'body' in section && section.body && <p>{section.body}</p>}
              {'list' in section && section.list && (
                <ul className="mt-2 list-disc pl-5 space-y-1.5">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <footer className="pt-4 border-t border-gray-100 text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">杭州觅顺贸易有限公司</p>
            <p>
              联系邮箱：
              <a href="mailto:Mishunco@163.com" className="text-blue-600 hover:underline ml-1">
                Mishunco@163.com
              </a>
            </p>
            <p className="text-muted-foreground">生效日期：2026年6月23日</p>
          </footer>
        </div>
      </article>
    </main>
  )
}
