'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Building2, Briefcase, Bot, LogOut, FileBarChart, Mail } from 'lucide-react'

const LINKS = [
  { href: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/leads',        label: 'Leads',           icon: Users },
  { href: '/clientes',     label: 'Clientes',        icon: Building2 },
  { href: '/oportunidades',label: 'Oportunidades',   icon: Briefcase },
  { href: '/assistente',   label: 'Assistente IA',   icon: Bot },
  { href: '/relatorios',   label: 'Relatórios',      icon: FileBarChart },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  const sair = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0">
      <div className="px-5 py-6 border-b border-gray-800">
        <span className="text-blue-400 font-bold text-sm leading-tight">
          Sales Intelligence<br />Copilot
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
              ${pathname === href || pathname.startsWith(href + '/')
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <button onClick={sair}
        className="flex items-center gap-3 px-6 py-4 text-gray-500 hover:text-red-400 transition text-sm border-t border-gray-800">
        <LogOut size={16} /> Sair
      </button>
    </aside>
  )
}

