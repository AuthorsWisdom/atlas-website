import { AuthProvider } from '@/components/AuthContext'
import AccountClient from './AccountClient'

export const dynamic = 'force-dynamic'

export default function AccountPage() {
  return (
    <AuthProvider>
      <AccountClient />
    </AuthProvider>
  )
}
