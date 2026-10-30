
import { demoService } from './demo-service'
import { createHttpService } from './http-service'
import type { CyberService } from './types'

export const cyberService: CyberService =
  createHttpService('/api')

export const isDemoMode = false

export { DEMO_SERVER_ID } from './demo-seed'
export type * from './types'
