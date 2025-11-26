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
  Loader2,
  Zap,
  AlertCircle,
  Check
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

const roles = ['ADMIN', 'ZONE_MANAGER', 'ZONE_USER']

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('All Roles')
  const [selectedZone, setSelectedZone] = useState('All Zones')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [passwordChangeUser, setPasswordChangeUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user)
    setShowDeleteConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    try {
      await apiService.deleteUser(userToDelete.id)
      toast.success('User deleted successfully')
      setShowDeleteConfirmDialog(false)
      setUserToDelete(null)
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

  const handleOpenChangePassword = (user: any) => {
    setPasswordChangeUser(user)
    setNewPassword('')
    setConfirmPassword('')
    setShowChangePasswordDialog(true)
  }

  const handleChangePassword = async () => {
    try {
      if (!newPassword || !confirmPassword) {
        toast.error('Please fill in all password fields')
        return
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }

      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }

      await apiService.changeUserPassword(passwordChangeUser.id, newPassword)
      
      toast.success('Password changed successfully')
      setShowChangePasswordDialog(false)
      setPasswordChangeUser(null)
      setNewPassword('')
      setConfirmPassword('')
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to change password:', error)
      toast.error(error.response?.data?.message || 'Failed to change password')
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'ADMIN' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />
  }

  const getRoleColor = (role: string) => {
    if (role === 'ADMIN') return 'text-purple-700 bg-purple-100'
    if (role === 'ZONE_MANAGER') return 'text-indigo-700 bg-indigo-100'
    return 'text-blue-700 bg-blue-100'
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

      {/* Users Table - Professional Design */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Zone</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Last Login</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No users found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleColors: any = {
                    'ADMIN': 'text-purple-700 bg-purple-100',
                    'ZONE_MANAGER': 'text-indigo-700 bg-indigo-100',
                    'ZONE_USER': 'text-blue-700 bg-blue-100'
                  }
                  const roleColor = roleColors[user.role] || roleColors['ZONE_USER']

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors duration-200">
                      {/* User Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-700">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-600">{user.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${roleColor}`}>
                          {getRoleIcon(user.role)}
                          {user.role.replace('_', ' ')}
                        </div>
                      </td>

                      {/* Zone */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-700 font-medium">{user.zoneName || '—'}</span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600">{formatLastLogin(user.lastLogin)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                          user.isActive 
                            ? 'text-green-700 bg-green-50 border-green-200' 
                            : 'text-red-700 bg-red-50 border-red-200'
                        }`}>
                          {getStatusIcon(user.isActive)}
                          {user.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditUser(user)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4 text-slate-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenChangePassword(user)}>
                                <Zap className="h-4 w-4 mr-2" />
                                Change Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
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
            {(newUser.role === 'ZONE_USER' || newUser.role === 'ZONE_MANAGER') && (
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

      {/* Edit User Dialog - Premium Design */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px] border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 -mx-6 -mt-6 px-6 py-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl">Edit User</DialogTitle>
                <DialogDescription className="text-indigo-100 mt-1">
                  Update user information for <span className="font-semibold">{editingUser?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </div>

          {editingUser && (
            <div className="space-y-6 py-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-1 rounded-full bg-indigo-600" />
                  <p className="text-sm font-bold text-slate-900">Personal Information</p>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-900">
                    Full Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    placeholder="Enter full name"
                    className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-semibold text-slate-900">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      placeholder="user@company.com"
                      className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                    />
                    <Mail className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-sm font-semibold text-slate-900">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-phone"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                      placeholder="+91 9876543210"
                      className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                    />
                    <Phone className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Role & Zone Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-1 rounded-full bg-indigo-600" />
                  <p className="text-sm font-bold text-slate-900">Role & Assignment</p>
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-sm font-semibold text-slate-900">
                    User Role
                  </Label>
                  <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value})}>
                    <SelectTrigger className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            {role === 'ADMIN' && <Shield className="h-4 w-4" />}
                            {role === 'ZONE_MANAGER' && <MapPin className="h-4 w-4" />}
                            {role === 'ZONE_USER' && <User className="h-4 w-4" />}
                            {role.replace('_', ' ')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zone Field - Conditional */}
                {(editingUser.role === 'ZONE_USER' || editingUser.role === 'ZONE_MANAGER') && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-zone" className="text-sm font-semibold text-slate-900">
                      Assigned Zone
                    </Label>
                    <Select value={editingUser.zoneId} onValueChange={(value) => setEditingUser({...editingUser, zoneId: value})}>
                      <SelectTrigger className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {zone.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* User Summary Card */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-indigo-900">Summary</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-indigo-600 font-semibold">Role</p>
                    <p className="text-indigo-900 font-bold">{editingUser.role.replace('_', ' ')}</p>
                  </div>
                  {(editingUser.role === 'ZONE_USER' || editingUser.role === 'ZONE_MANAGER') && (
                    <div>
                      <p className="text-indigo-600 font-semibold">Zone</p>
                      <p className="text-indigo-900 font-bold">{editingUser.zoneName || 'Not assigned'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              className="h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog - Premium Design */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 -mx-6 -mt-6 px-6 py-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl">Change Password</DialogTitle>
                <DialogDescription className="text-blue-100 mt-1">
                  Update password for <span className="font-semibold">{passwordChangeUser?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </div>

          {passwordChangeUser && (
            <div className="space-y-5 py-6">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-semibold text-slate-900">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {newPassword && (
                    <div className="absolute right-3 top-3">
                      {newPassword.length >= 6 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <p className={`text-xs ${newPassword.length >= 6 ? 'text-green-600' : 'text-slate-500'}`}>
                  {newPassword.length >= 6 ? '✓ Password is strong' : '• Minimum 6 characters required'}
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-900">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {confirmPassword && (
                    <div className="absolute right-3 top-3">
                      {confirmPassword === newPassword && newPassword ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <p className={`text-xs ${
                  confirmPassword && confirmPassword === newPassword && newPassword
                    ? 'text-green-600'
                    : confirmPassword && confirmPassword !== newPassword
                    ? 'text-red-600'
                    : 'text-slate-500'
                }`}>
                  {confirmPassword && confirmPassword === newPassword && newPassword
                    ? '✓ Passwords match'
                    : confirmPassword && confirmPassword !== newPassword
                    ? '✗ Passwords do not match'
                    : '• Re-enter your password'}
                </p>
              </div>

              {/* Password Requirements */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-700">Password Requirements:</p>
                <ul className="space-y-1.5">
                  <li className={`text-xs flex items-center gap-2 ${newPassword.length >= 6 ? 'text-green-600' : 'text-slate-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-green-500' : 'bg-slate-300'}`} />
                    At least 6 characters
                  </li>
                  <li className={`text-xs flex items-center gap-2 ${newPassword && confirmPassword && newPassword === confirmPassword ? 'text-green-600' : 'text-slate-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword && confirmPassword && newPassword === confirmPassword ? 'bg-green-500' : 'bg-slate-300'}`} />
                    Passwords must match
                  </li>
                </ul>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <Shield className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Your password will be securely encrypted. All existing sessions will be invalidated for security.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowChangePasswordDialog(false)}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
            >
              <Zap className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Premium Design */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-[450px] border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 -mx-6 -mt-6 px-6 py-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl">Delete User</DialogTitle>
                <DialogDescription className="text-red-100 mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </div>

          {userToDelete && (
            <div className="space-y-5 py-6">
              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-red-900">
                  Are you sure you want to delete this user?
                </p>
                <p className="text-sm text-red-700">
                  This will permanently remove <span className="font-bold">{userToDelete.name}</span> ({userToDelete.email}) from the system.
                </p>
              </div>

              {/* User Details Card */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Name:</span>
                  <span className="text-sm font-semibold text-slate-900">{userToDelete.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Email:</span>
                  <span className="text-sm font-semibold text-slate-900">{userToDelete.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Role:</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    userToDelete.role === 'ADMIN' 
                      ? 'text-purple-700 bg-purple-100'
                      : userToDelete.role === 'ZONE_MANAGER'
                      ? 'text-indigo-700 bg-indigo-100'
                      : 'text-blue-700 bg-blue-100'
                  }`}>
                    {userToDelete.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {userToDelete.offersCount > 0 
                    ? `This user has ${userToDelete.offersCount} associated offers. You may need to reassign or delete them first.`
                    : 'Make sure this user has no active offers or responsibilities.'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmDialog(false)}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="h-10 bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
