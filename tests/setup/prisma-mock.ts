import { getPrisma } from './pglite-setup'

type DelegateName = 'company' | 'statusLabel' | 'category' | 'location' | 'user' | 'asset' | 'license' | 'licenseSeat' | 'actionLog'

function delegate(name: DelegateName) {
  return new Proxy({}, {
    get: (_target, property: string) => async (...args: unknown[]) => {
      const prisma = await getPrisma()
      const model = prisma[name] as unknown as Record<string, (...values: unknown[]) => unknown>
      return model[property](...args)
    },
  })
}

const prismaMock = {
  company: delegate('company'),
  statusLabel: delegate('statusLabel'),
  category: delegate('category'),
  location: delegate('location'),
  user: delegate('user'),
  asset: delegate('asset'),
  license: delegate('license'),
  licenseSeat: delegate('licenseSeat'),
  actionLog: delegate('actionLog'),
  $transaction: async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
    const prisma = await getPrisma()
    return prisma.$transaction(callback as never)
  },
  $disconnect: async (): Promise<void> => undefined,
}

export default prismaMock
