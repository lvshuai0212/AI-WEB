import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 10000 })
export default api

export const getUsers = () => api.get('/users').then(r => r.data)
export const getUser = (id) => api.get(`/users/${id}`).then(r => r.data)
export const createUser = (data) => api.post('/users', data).then(r => r.data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then(r => r.data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

export const getKnowledge = () => api.get('/knowledge').then(r => r.data)
export const createKnowledge = (data) => api.post('/knowledge', data).then(r => r.data)
export const updateKnowledge = (id, data) => api.put(`/knowledge/${id}`, data).then(r => r.data)
export const deleteKnowledge = (id) => api.delete(`/knowledge/${id}`)

export const getCheckins = () => api.get('/checkins').then(r => r.data)
export const deleteCheckin = (id) => api.delete(`/checkins/${id}`)

export const getAdmins = () => api.get('/admins').then(r => r.data)
export const updateAdmin = (id, data) => api.put(`/admins/${id}`, data).then(r => r.data)

export const getBanners = () => api.get('/banners').then(r => r.data)
export const createBanner = (data) => api.post('/banners', data).then(r => r.data)
export const updateBanner = (id, data) => api.put(`/banners/${id}`, data).then(r => r.data)
export const deleteBanner = (id) => api.delete(`/banners/${id}`)

export const getNotices = () => api.get('/notices').then(r => r.data)
export const createNotice = (data) => api.post('/notices', data).then(r => r.data)
export const updateNotice = (id, data) => api.put(`/notices/${id}`, data).then(r => r.data)
export const deleteNotice = (id) => api.delete(`/notices/${id}`)

export const getDrugs = () => api.get('/drugs').then(r => r.data)
export const createDrug = (data) => api.post('/drugs', data).then(r => r.data)
export const updateDrug = (id, data) => api.put(`/drugs/${id}`, data).then(r => r.data)
export const deleteDrug = (id) => api.delete(`/drugs/${id}`)

export const getDrugOrders = () => api.get('/drugOrders').then(r => r.data)
export const updateDrugOrder = (id, data) => api.patch(`/drugOrders/${id}`, data).then(r => r.data)

export const AVATAR_OPTIONS = [
  { label: '默认Logo', value: '/image/logo.jpg' },
  { label: 'Logo 1', value: '/image/logo1.jpg' },
  { label: 'Logo 2', value: '/image/logo2.jpg' },
  { label: 'Logo 3', value: '/image/logo3.jpg' }
]

export const BANNER_IMAGES = [
  '/image/1.jpg', '/image/2.jpg', '/image/3.jpg', '/image/4.jpg', '/image/5.jpg',
  '/image/6.jpg', '/image/7.jpg', '/image/8.jpg', '/image/9.jpg'
]
