import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchApi, handleApiError } from '../../../lib/api'

const MODULES = [
  'leads', 'bookings', 'packages', 'employees', 'payments',
  'reports', 'settings', 'roles', 'hotels', 'vehicles',
  'suppliers', 'itineraries', 'cms', 'vendor-payouts',
  'expense-tracking', 'destinations', 'activities'
]

const PREDEFINED_ROLES = ['Super Admin', 'Admin', 'Sales', 'Marketing', 'Finance', 'Content', 'Custom']

type ModulePerms = { view: boolean; edit: boolean; add: boolean }
type PermissionsMap = Record<string, ModulePerms>

interface RoleData {
  id: number
  role_name: string
  description: string
  permissions: PermissionsMap
  is_predefined?: boolean
  notes?: string
  date: string
}

const emptyPerms = (): PermissionsMap =>
  Object.fromEntries(MODULES.map(m => [m, { view: false, edit: false, add: false }]))

const formatModule = (m: string) => m.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const countPerms = (perms: PermissionsMap) => {
  let v = 0, e = 0, a = 0
  Object.values(perms || {}).forEach(p => { if (p.view) v++; if (p.edit) e++; if (p.add) a++ })
  return { v, e, a }
}

const UserRoleAccess: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [roles, setRoles] = useState<RoleData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleData | null>(null)
  const [formData, setFormData] = useState({ roleName: '', description: '', permissions: emptyPerms(), notes: '' })

  useEffect(() => { fetchRoles() }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const data = await fetchApi('/api/user-role-access')
      setRoles(data.roles || [])
    } catch (error) {
      console.error('Error fetching roles:', handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  const togglePerm = (module: string, type: 'view' | 'edit' | 'add') => {
    setFormData(prev => {
      const perms = { ...prev.permissions }
      perms[module] = { ...perms[module], [type]: !perms[module][type] }
      // If enabling edit/add, auto-enable view
      if ((type === 'edit' || type === 'add') && perms[module][type]) {
        perms[module].view = true
      }
      // If disabling view, disable edit and add too
      if (type === 'view' && !perms[module].view) {
        perms[module].edit = false
        perms[module].add = false
      }
      return { ...prev, permissions: perms }
    })
  }

  const toggleAllForType = (type: 'view' | 'edit' | 'add') => {
    setFormData(prev => {
      const allOn = MODULES.every(m => prev.permissions[m]?.[type])
      const perms = { ...prev.permissions }
      MODULES.forEach(m => {
        perms[m] = { ...perms[m], [type]: !allOn }
        if (type !== 'view' && !allOn) perms[m].view = true
        if (type === 'view' && allOn) { perms[m].edit = false; perms[m].add = false }
      })
      return { ...prev, permissions: perms }
    })
  }

  const handleSave = async () => {
    if (!formData.roleName.trim()) return alert('Please enter a role name')
    if (!formData.description.trim()) return alert('Please enter a description')

    try {
      setSaving(true)
      const body = {
        ...(editingRole ? { id: editingRole.id } : {}),
        roleName: formData.roleName.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions,
        notes: formData.notes.trim()
      }
      await fetchApi('/api/user-role-access', { method: editingRole ? 'PUT' : 'POST', body: JSON.stringify(body) })
      await fetchRoles()
      closeForm()
    } catch (error) {
      alert(handleApiError(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await fetchApi(`/api/user-role-access?id=${id}`, { method: 'DELETE' })
      await fetchRoles()
    } catch (error) {
      alert(handleApiError(error))
    }
  }

  const handleEdit = (role: RoleData) => {
    setEditingRole(role)
    setFormData({
      roleName: role.role_name,
      description: role.description,
      permissions: role.permissions || emptyPerms(),
      notes: role.notes || ''
    })
    setShowForm(true)
  }

  const handleNewFromTemplate = (template: string) => {
    // Find existing predefined role to copy permissions
    const existing = roles.find(r => r.role_name === template)
    setEditingRole(null)
    setFormData({
      roleName: template === 'Custom' ? '' : template,
      description: existing?.description || '',
      permissions: existing?.permissions || emptyPerms(),
      notes: ''
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingRole(null)
    setFormData({ roleName: '', description: '', permissions: emptyPerms(), notes: '' })
  }

  const filtered = roles.filter(r =>
    r.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-2 text-gray-600 ml-3">Loading roles...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/settings')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-3 w-3" />
                <span className="text-xs">Back</span>
              </button>
              <h1 className="text-lg font-bold text-gray-900">User Role & Access</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input type="text" placeholder="Search roles..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 w-40 h-8" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Quick create from predefined templates */}
              <select
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700"
                value=""
                onChange={e => { if (e.target.value) handleNewFromTemplate(e.target.value) }}
              >
                <option value="">+ New from template</option>
                {PREDEFINED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <Button onClick={() => handleNewFromTemplate('Custom')} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm">
                <Plus className="w-3 h-3 mr-1" /> Add Role
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">View</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Edit</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Add</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">No roles found</td></tr>
                ) : filtered.map(role => {
                  const c = countPerms(role.permissions)
                  return (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <span className="text-sm font-medium text-gray-900">{role.role_name}</span>
                        {role.is_predefined && <Badge variant="secondary" className="ml-2 text-[10px]">Predefined</Badge>}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 max-w-[200px] truncate">{role.description}</td>
                      <td className="px-3 py-3 text-center"><Badge variant="default" className="bg-blue-100 text-blue-700 text-xs">{c.v}/{MODULES.length}</Badge></td>
                      <td className="px-3 py-3 text-center"><Badge variant="default" className="bg-amber-100 text-amber-700 text-xs">{c.e}/{MODULES.length}</Badge></td>
                      <td className="px-3 py-3 text-center"><Badge variant="default" className="bg-green-100 text-green-700 text-xs">{c.a}/{MODULES.length}</Badge></td>
                      <td className="px-3 py-3 text-sm text-gray-500">{role.date}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(role)} className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(role.id, role.role_name)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Slide-over Form */}
      {showForm && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 backdrop-blur-sm" onClick={closeForm} />
          <div className="absolute right-0 top-0 h-full w-[650px] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editingRole ? 'Edit Role' : 'Add Role'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <Input value={formData.roleName} onChange={e => setFormData({ ...formData, roleName: e.target.value })} placeholder="e.g., Sales, Marketing, Custom..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe this role's purpose" />
              </div>

              {/* Module Permission Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module Permissions</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Module</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600" onClick={() => toggleAllForType('view')}>View</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 cursor-pointer hover:text-amber-600" onClick={() => toggleAllForType('edit')}>Edit</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 cursor-pointer hover:text-green-600" onClick={() => toggleAllForType('add')}>Add</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {MODULES.map(m => (
                        <tr key={m} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 text-gray-700">{formatModule(m)}</td>
                          {(['view', 'edit', 'add'] as const).map(type => (
                            <td key={type} className="px-3 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={formData.permissions[m]?.[type] || false}
                                onChange={() => togglePerm(m, type)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-3 py-1.5 bg-gray-50 text-[11px] text-gray-400">Click column headers to toggle all</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t sticky bottom-0 bg-white">
              <Button onClick={closeForm} variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? 'Saving...' : editingRole ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserRoleAccess
