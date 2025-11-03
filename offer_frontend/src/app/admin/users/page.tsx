'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Shield, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Loader2
} from 'lucide-react'
import { apiService } from '@/services/api'
import { toast } from 'sonner'

const mockUsers = [
  {
    id: 1,
    name: 'Ramesh Kumar',
    email: 'ramesh@company.com',
    phone: '+91 9876543210',
    role: 'ZONE_USER',
    zoneId: 1,
    zoneName: 'North Zone',
    isActive: true,
    lastLogin: '2025-10-12 10:30 AM',
    createdAt: '2025-01-15',
    offersCount: 15,
    totalValue: 450000
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@company.com',
    phone: '+91 9876543211',
    role: 'ZONE_USER',
    zoneId: 2,
    zoneName: 'South Zone',
    isActive: true,
    lastLogin: '2025-10-12 09:15 AM',
    createdAt: '2025-01-15',
    offersCount: 12,
    totalValue: 380000
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit@company.com',
    phone: '+91 9876543212',
    role: 'ZONE_USER',
    zoneId: 3,
    zoneName: 'East Zone',
    isActive: true,
    lastLogin: '2025-10-11 04:45 PM',
    createdAt: '2025-01-15',
    offersCount: 18,
    totalValue: 520000
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    email: 'sneha@company.com',
    phone: '+91 9876543213',
    role: 'ZONE_USER',
    zoneId: 4,
    zoneName: 'West Zone',
    isActive: false,
    lastLogin: '2025-10-08 02:20 PM',
    createdAt: '2025-01-15',
    offersCount: 8,
    totalValue: 220000
  },
  {
    id: 5,
    name: 'Admin User',
    email: 'admin@company.com',
    phone: '+91 9876543214',
    role: 'ADMIN',
    zoneId: null,
    zoneName: 'All Zones',
    isActive: true,
    lastLogin: '2025-10-12 11:00 AM',
    createdAt: '2025-01-01',
    offersCount: 0,
    totalValue: 0
  }
]

const mockZones = [
  { id: 1, name: 'North Zone' },
  { id: 2, name: 'South Zone' },
  { id: 3, name: 'East Zone' },
  { id: 4, name: 'West Zone' }
]

const roles = ['ADMIN', 'ZONE_USER']

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('All Roles')
  const [selectedZone, setSelectedZone] = useState('All Zones')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ZONE_USER',
    zoneId: '',
    password: ''
  })

  // Fetch users and zones on mount
  useEffect(() => {
    fetchUsers()
    fetchZones()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await apiService.getAllUsers()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchZones = async () => {
    try {
      const response = await apiService.getZones()
      console.log('🔍 Zones response:', response)
      setZones(response.data || [])
      if (response.data && response.data.length > 0) {
        console.log('✅ Zones loaded successfully:', response.data.length, 'zones')
      } else {
        console.warn('⚠️ No zones data found in response')
      }
    } catch (error) {
      console.error('❌ Failed to fetch zones:', error)
      toast.error('Failed to load zones')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm)
    
    const matchesRole = selectedRole === 'All Roles' || user.role === selectedRole
    const matchesZone = selectedZone === 'All Zones' || user.zoneName === selectedZone

    return matchesSearch && matchesRole && matchesZone
  })

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const handleAddUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast.error('Please fill in all required fields')
        return
      }

      await apiService.createUser(newUser)
      toast.success('User created successfully')
      setNewUser({ name: '', email: '', phone: '', role: 'ZONE_USER', zoneId: '', password: '' })
      setShowAddDialog(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to create user:', error)
      toast.error(error.response?.data?.message || 'Failed to create user')
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser({
      ...user,
      zoneId: user.zoneId?.toString() || ''
    })
    setShowEditDialog(true)
  }

  const handleUpdateUser = async () => {
    try {
      await apiService.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        zoneId: editingUser.zoneId || null,
        isActive: editingUser.isActive
      })
      toast.success('User updated successfully')
      setShowEditDialog(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to update user:', error)
      toast.error(error.response?.data?.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await apiService.deleteUser(userId)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const toggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      await apiService.updateUser(userId, { isActive: !user.isActive })
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to toggle user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleBulkAction = async (action: string) => {
    try {
      const isActive = action === 'activate'
      await apiService.bulkUpdateUserStatus(selectedUsers, isActive)
      toast.success(`Successfully ${action}d ${selectedUsers.length} users`)
      setSelectedUsers([])
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to bulk update:', error)
      toast.error('Failed to update users')
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'ADMIN' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />
  }

  const getRoleColor = (role: string) => {
    return role === 'ADMIN' 
      ? 'text-purple-700 bg-purple-100' 
      : 'text-blue-700 bg-blue-100'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />
  }

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never'
    return new Date(lastLogin).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and access permissions</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Roles">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zone Filter */}
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Zones">All Zones</SelectItem>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedUsers.length} user(s) selected
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkAction('activate')}>
                  Activate Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                  Deactivate Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Zone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Performance</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Login</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-900">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{user.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-900">{user.zoneName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'ZONE_USER' ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {user.offersCount} offers
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatCurrency(user.totalValue)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatLastLogin(user.lastLogin)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                        user.isActive 
                          ? 'text-green-600 bg-green-50 border-green-200' 
                          : 'text-red-600 bg-red-50 border-red-200'
                      }`}>
                        {getStatusIcon(user.isActive)}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with appropriate role and zone assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="col-span-3"
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="col-span-3"
                placeholder="email@company.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                className="col-span-3"
                placeholder="+91 9876543210"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newUser.role === 'ZONE_USER' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zone" className="text-right">Zone</Label>
                <Select value={newUser.zoneId} onValueChange={(value) => setNewUser({...newUser, zoneId: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>{zone.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="col-span-3"
                placeholder="Temporary password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user details here.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">Role</Label>
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingUser.role === 'ZONE_USER' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-zone" className="text-right">Zone</Label>
                  <Select value={editingUser.zoneId} onValueChange={(value) => setEditingUser({...editingUser, zoneId: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>{zone.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
