import http from '@/api'

export const clusterApi = {
  getClusterAgentSettings: () => http.get('/cluster/agent/settings'),
  updateClusterAgentSettings: (data: { enabled: boolean; controllerUrl: string; token?: string; intervalSeconds: number; requestTimeoutSeconds: number }) => http.put('/cluster/agent/settings', data),
  listClusterNodes: () => http.get('/cluster/nodes'),
  getClusterNode: (id: number | string) => http.get(`/cluster/nodes/${id}`),
  getClusterNodeMetrics: (id: number | string, since?: string) => http.get(`/cluster/nodes/${id}/metrics`, since ? { since } : undefined),
  createClusterNode: (data: { name: string; endpoint: string; group?: string; tags?: string }) => http.post('/cluster/nodes', data),
  updateClusterNode: (id: number | string, data: Record<string, any>) => http.put(`/cluster/nodes/${id}`, data),
  rotateClusterNodeToken: (id: number | string) => http.post(`/cluster/nodes/${id}/token/rotate`),
  deleteClusterNode: (id: number | string) => http.delete(`/cluster/nodes/${id}`),
  listClusterTasks: (id: number | string) => http.get(`/cluster/nodes/${id}/tasks`),
  enqueueClusterTask: (data: { nodeId: number; type: string; payload: Record<string, unknown>; idempotencyKey?: string; maxAttempts?: number }) => http.post('/cluster/tasks', data),
  dispatchWebsiteToCluster: (data: { websiteId: number; strategy: string; nodeIds?: number[]; tags?: string[]; includeContent?: boolean; idempotencyKey?: string }) => http.post('/cluster/website/dispatch', data)
}
