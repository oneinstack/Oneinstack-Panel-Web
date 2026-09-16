import http from '@/api'

export const clusterApi = {
  getClusterAgentSettings: () => http.get('/cluster/agent/settings'),
  selectClusterRole: (role: 'controller' | 'node') => http.put('/cluster/role', { role }),
  resetClusterRole: () => http.post('/cluster/role/reset'),
  updateClusterAgentSettings: (data: { controllerUrl: string; token?: string; intervalSeconds: number; requestTimeoutSeconds: number }) => http.put('/cluster/agent/settings', data),
  listClusterNodes: () => http.get('/cluster/nodes'),
  getClusterNode: (id: number | string) => http.get(`/cluster/nodes/${id}`),
  getClusterNodeMetrics: (id: number | string, since?: string) => http.get(`/cluster/nodes/${id}/metrics`, since ? { since } : undefined),
  createClusterNode: (data: { name: string; endpoint: string; group?: string; tags?: string }) => http.post('/cluster/nodes', data),
  updateClusterNode: (id: number | string, data: Record<string, any>) => http.put(`/cluster/nodes/${id}`, data),
  rotateClusterNodeToken: (id: number | string) => http.post(`/cluster/nodes/${id}/token/rotate`),
  restartClusterNode: (id: number | string) => http.post(`/cluster/nodes/${id}/restart`),
  deleteClusterNode: (id: number | string) => http.delete(`/cluster/nodes/${id}`),
  listClusterTasks: (id: number | string) => http.get(`/cluster/nodes/${id}/tasks`),
  getClusterTask: (nodeId: number | string, taskId: number | string) => http.get(`/cluster/nodes/${nodeId}/tasks/${taskId}`),
  enqueueClusterTask: (data: { nodeId: number; type: string; payload: Record<string, unknown>; idempotencyKey?: string; maxAttempts?: number }) => http.post('/cluster/tasks', data),
  dispatchWebsiteToCluster: (data: { websiteId: number; strategy: string; nodeIds?: number[]; tags?: string[]; includeContent?: boolean; idempotencyKey?: string }) => http.post('/cluster/website/dispatch', data)
}
