import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

const mockedAxios = vi.mocked(axios)

beforeEach(() => {
  mockedAxios.create.mockReturnThis()
  // Interceptor mocks
  ;(axios.interceptors?.request?.use ?? vi.fn()).mockImplementation?.((cb: any) => cb)
  ;(axios.interceptors?.response?.use ?? vi.fn()).mockImplementation?.((cb: any) => cb)
})

describe('services/api', () => {
  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    mockedAxios.create.mockReturnValue({
      post: vi.fn(),
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    } as any)
  })

  it('login calls POST /auth/login', async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue({ data: { access_token: 'tok', user: {}, token_type: 'bearer' } }),
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }
    mockedAxios.create.mockReturnValue(mockClient as any)

    const { login } = await import('./api')
    const result = await login('a@b.com', 'pw')

    expect(mockClient.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' })
    expect(result.access_token).toBe('tok')
  })

  it('register calls POST /auth/register', async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue({}),
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }
    mockedAxios.create.mockReturnValue(mockClient as any)

    const { register } = await import('./api')
    await register('Jane', 'a@b.com', 'pw')

    expect(mockClient.post).toHaveBeenCalledWith('/auth/register', { full_name: 'Jane', email: 'a@b.com', password: 'pw' })
  })

  it('getProfile calls GET /profile', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue({ data: { id: 'p1', skills: [] } }),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }
    mockedAxios.create.mockReturnValue(mockClient as any)

    const { getProfile } = await import('./api')
    const result = await getProfile()

    expect(mockClient.get).toHaveBeenCalledWith('/profile')
    expect(result.id).toBe('p1')
  })

  it('getJobs calls GET /jobs/search with params', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue({ data: { jobs: [] } }),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }
    mockedAxios.create.mockReturnValue(mockClient as any)

    const { getJobs } = await import('./api')
    await getJobs({ query: 'react', page: '1' })

    expect(mockClient.get).toHaveBeenCalledWith('/jobs/search', { params: { query: 'react', page: '1' } })
  })

  it('getApplications calls GET /applications', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }
    mockedAxios.create.mockReturnValue(mockClient as any)

    const { getApplications } = await import('./api')
    await getApplications()

    expect(mockClient.get).toHaveBeenCalledWith('/applications')
  })

  it('deleteApplication calls DELETE /applications/:id', async () => {
    const mockClient = {
      delete: vi.fn().mockResolvedValue({}),
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }
    mockedAxios.create.mockReturnValue(mockClient as any)

    const { deleteApplication } = await import('./api')
    await deleteApplication('app-1')

    expect(mockClient.delete).toHaveBeenCalledWith('/applications/app-1')
  })
})
