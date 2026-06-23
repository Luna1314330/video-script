import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '隐私政策 | 脚本工坊',
  description: '脚本工坊隐私政策与用户个人信息保护说明',
}

type PolicySection = {
  title: string
  body?: string
  list?: string[]
  subsections?: { title?: string; list: string[] }[]
}

const sections: PolicySection[] = [
  {
    title: '一、我们收集的信息',
    list: [
      '注册信息：手机号码、昵称、密码',
      '使用记录：生成脚本的历史记录、操作日志',
      '设备信息：设备型号、操作系统版本、IP地址、浏览器类型',
      '交易信息：会员购买记录、订单信息',
    ],
  },
  {
    title: '二、信息使用目的',
    body: '我们收集的信息将用于以下目的：',
    list: [
      '提供、维护和改进本平台服务',
      '验证用户身份，保障账号安全',
      '处理会员订单和售后服务',
      '向用户发送服务通知和重要更新',
      '分析产品使用情况，优化用户体验',
    ],
    subsections: [
      {
        list: ['我们不会将您的个人信息用于与上述目的无关的其他用途。'],
      },
    ],
  },
  {
    title: '三、信息存储与保护',
    list: [
      '您的个人信息存储于中华人民共和国境内的服务器',
      '我们采用行业标准的安全技术措施保护您的信息，防止未经授权的访问、使用或泄露',
      '密码经过加密存储，我们无法查看您的原始密码',
      '我们会定期评估信息收集、存储和处理方面的做法，以防范未经授权的访问',
    ],
  },
  {
    title: '四、信息共享',
    body: '我们承诺：',
    list: [
      '不会将您的个人信息出售给任何第三方',
      '不会与任何第三方共享您的个人信息，除以下情况：',
    ],
    subsections: [
      {
        list: [
          '获得您的明确同意',
          '法律法规要求或政府主管部门依法要求',
          '为保护本平台及其用户的合法权益所必需',
        ],
      },
    ],
  },
  {
    title: '五、Cookie 使用',
    body: '本平台可能使用 Cookie 和类似技术来提升用户体验。您可以通过浏览器设置管理或删除 Cookie，但可能影响部分功能的正常使用。',
  },
  {
    title: '六、您的权利',
    body: '您对自己的个人信息享有以下权利：',
    list: [
      '查询权：您可以查看我们持有的您的个人信息',
      '更正权：当您发现信息有误时，可以要求我们更正',
      '删除权：在以下情况下，您可以要求删除个人信息：',
    ],
    subsections: [
      {
        list: [
          '我们处理信息的目的已实现',
          '您撤回同意',
          '我们违反法律法规或与您的约定',
        ],
      },
      {
        list: ['注销账号：您可以申请注销账号，注销后我们将删除您的个人信息'],
      },
      {
        list: ['如需行使上述权利，请通过下方联系方式与我们联系。'],
      },
    ],
  },
  {
    title: '七、未成年人保护',
    body: '本平台的服务面向成年人。如果您是未满18周岁的未成年人，请在监护人的指导下使用本平台，并在监护人同意的前提下提供个人信息。',
  },
  {
    title: '八、政策更新',
    body: '我们可能适时修订本《隐私政策》。当政策发生重大变更时，我们会通过平台公告、站内信或其他方式通知您。',
  },
  {
    title: '九、联系我们',
    body: '如您对本《隐私政策》有任何疑问、意见或建议，请通过以下方式联系我们：',
  },
]

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">脚本工坊 隐私政策</h1>
        <div className="text-sm text-muted-foreground mb-6 space-y-1">
          <p>生效日期：2026年6月23日</p>
          <p>更新日期：2026年6月23日</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 text-sm text-gray-700 leading-relaxed mb-8">
          <p>
            杭州觅顺贸易有限公司（以下简称&quot;我们&quot;）运营脚本工坊平台（以下简称&quot;本平台&quot;）。我们深知个人信息对您的重要性，并会尽全力保护您的隐私安全。
          </p>
          <p>请您在使用本平台服务前，仔细阅读并充分理解本《隐私政策》的全部内容。</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-gray-900 mb-2">{section.title}</h2>
              {section.body && <p>{section.body}</p>}
              {section.list && (
                <ul className={`list-disc pl-5 space-y-1.5 ${section.body ? 'mt-2' : ''}`}>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.subsections?.map((sub, index) => (
                <ul
                  key={`${section.title}-sub-${index}`}
                  className="mt-2 list-disc pl-5 space-y-1.5"
                >
                  {sub.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ))}
            </section>
          ))}

          <footer className="pt-4 border-t border-gray-100 text-gray-600 space-y-1">
            <p>
              <span className="text-gray-900">公司名称：</span>杭州觅顺贸易有限公司
            </p>
            <p>
              <span className="text-gray-900">联系邮箱：</span>
              <a href="mailto:Mishunco@163.com" className="text-blue-600 hover:underline">
                Mishunco@163.com
              </a>
            </p>
          </footer>
        </div>
      </article>
    </main>
  )
}
