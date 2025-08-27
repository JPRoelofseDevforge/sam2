import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { UserRolesAdmin } from './admin/UserRolesAdmin';

interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active: boolean;
  is_email_verified: boolean;
  role_id?: number;
  role_name?: string;
  created_date?: string;
  modified_date?: string;
}

interface Role {
  role_id: number;
  role_name: string;
  description: string;
}

type TabType = 'users' | 'roles' | 'permissions' | 'settings';

export const UserManagement: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // API Base URL configuration
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role_id: 0,
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);




  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchUsers();
        setShowCreateForm(false);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Error creating user');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        role_id: formData.role_id,
        is_active: formData.is_active
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_BASE_URL}/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Error updating user');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user');
      console.error(err);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number || '',
      role_id: user.role_id || 0,
      is_active: user.is_active
    });
    setShowCreateForm(false);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role_id: 0,
      is_active: true
    });
    setEditingUser(null);
    setError(null);
    setIsSubmitting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'role_id') {
      newValue = parseInt(value);
    }

    // Direct state update - no callbacks or side effects
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  // New simplified user creation wizard component
  const UserCreationWizard: React.FC = () => {
    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      role_id: 0,
      password: '',
      phone_number: ''
    });
    const [wizardErrors, setWizardErrors] = useState<{[key: string]: string}>({});
    const [isCreating, setIsCreating] = useState(false);

    const totalSteps = 3;

    const validateStep = (stepNumber: number): boolean => {
      const errors: {[key: string]: string} = {};

      if (stepNumber === 1) {
        if (!wizardData.first_name.trim()) errors.first_name = 'First name is required';
        if (!wizardData.last_name.trim()) errors.last_name = 'Last name is required';
        if (!wizardData.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizardData.email)) {
          errors.email = 'Please enter a valid email address';
        }
      } else if (stepNumber === 2) {
        if (!wizardData.role_id) errors.role_id = 'Please select a role';
      } else if (stepNumber === 3) {
        if (!wizardData.password) errors.password = 'Password is required';
        else if (wizardData.password.length < 8) errors.password = 'Password must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(wizardData.password)) {
          errors.password = 'Password must contain uppercase, lowercase, and number';
        }
      }

      setWizardErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const nextStep = () => {
      if (validateStep(step)) {
        setStep(step + 1);
      }
    };

    const prevStep = () => {
      setStep(step - 1);
    };

    const handleWizardSubmit = async () => {
      if (!validateStep(3)) return;

      setIsCreating(true);

      try {
        const userData = {
          ...wizardData,
          username: `${wizardData.first_name.toLowerCase()}.${wizardData.last_name.toLowerCase()}`,
          is_active: true
        };

        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });

        if (response.ok) {
          await fetchUsers();
          setShowCreateForm(false);
          resetForm();
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to create user');
        }
      } catch (err) {
        setError('Error creating user');
        console.error(err);
      } finally {
        setIsCreating(false);
      }
    };

    const updateWizardData = (field: string, value: any) => {
      setWizardData(prev => ({ ...prev, [field]: value }));

      // Auto-generate username
      if (field === 'first_name' || field === 'last_name') {
        const firstName = field === 'first_name' ? value : wizardData.first_name;
        const lastName = field === 'last_name' ? value : wizardData.last_name;
        if (firstName && lastName) {
          const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
          setWizardData(prev => ({ ...prev, username: username }));
        }
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber < step ? 'bg-green-500 text-white' :
                  stepNumber === step ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber < step ? '✓' : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    stepNumber < step ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Basic Info</span>
            <span>Role & Permissions</span>
            <span>Security</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Basic Information</h3>
                <p className="text-gray-600 mt-2">Let's start with the user's personal details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={wizardData.first_name}
                    onChange={(e) => updateWizardData('first_name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                      wizardErrors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                  {wizardErrors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{wizardErrors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={wizardData.last_name}
                    onChange={(e) => updateWizardData('last_name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                      wizardErrors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                  {wizardErrors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{wizardErrors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={wizardData.email}
                  onChange={(e) => updateWizardData('email', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    wizardErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="user@company.com"
                />
                {wizardErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{wizardErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={wizardData.phone_number}
                  onChange={(e) => updateWizardData('phone_number', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {wizardData.first_name && wizardData.last_name && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Username will be:</strong> {wizardData.first_name.toLowerCase()}.{wizardData.last_name.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Role & Permissions</h3>
                <p className="text-gray-600 mt-2">Choose the appropriate role for this user</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  User Role *
                </label>
                <div className="space-y-3">
                  {roles.map(role => (
                    <div
                      key={role.role_id}
                      onClick={() => updateWizardData('role_id', role.role_id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        wizardData.role_id === role.role_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={wizardData.role_id === role.role_id}
                          onChange={() => updateWizardData('role_id', role.role_id)}
                          className="mr-3"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{role.role_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {wizardErrors.role_id && (
                  <p className="mt-2 text-sm text-red-600">{wizardErrors.role_id}</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Security Settings</h3>
                <p className="text-gray-600 mt-2">Set up a secure password for the user</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={wizardData.password}
                  onChange={(e) => updateWizardData('password', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    wizardErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter a secure password"
                />
                {wizardErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{wizardErrors.password}</p>
                )}

                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center ${wizardData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{wizardData.password.length >= 8 ? '✓' : '○'}</span>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${/(?=.*[a-z])/.test(wizardData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/(?=.*[a-z])/.test(wizardData.password) ? '✓' : '○'}</span>
                      Lowercase letter
                    </div>
                    <div className={`flex items-center ${/(?=.*[A-Z])/.test(wizardData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/(?=.*[A-Z])/.test(wizardData.password) ? '✓' : '○'}</span>
                      Uppercase letter
                    </div>
                    <div className={`flex items-center ${/(?=.*\d)/.test(wizardData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{/(?=.*\d)/.test(wizardData.password) ? '✓' : '○'}</span>
                      Number
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {wizardData.first_name} {wizardData.last_name}</p>
                  <p><strong>Email:</strong> {wizardData.email}</p>
                  <p><strong>Username:</strong> {wizardData.first_name.toLowerCase()}.{wizardData.last_name.toLowerCase()}</p>
                  <p><strong>Role:</strong> {roles.find(r => r.role_id === wizardData.role_id)?.role_name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleWizardSubmit}
                disabled={isCreating}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating User...
                  </span>
                ) : (
                  'Create User'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Tab Components
  const UsersTab = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      {!showCreateForm && !editingUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <p className="text-gray-600 mt-1">Create and manage user accounts for your organization</p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingUser(null);
                resetForm();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New User
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && !editingUser && <UserCreationWizard />}

      {editingUser && (
        <div className="p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Edit User</h2>
            <div className="text-sm text-gray-600">
              <span className="text-blue-600">*</span> Required fields
            </div>
          </div>

          <form onSubmit={handleUpdateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-xs text-gray-500 ml-1">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-xs text-gray-500 ml-1">(optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active User
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                  isSubmitting
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update User'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                  resetForm();
                }}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.user_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role_name === 'SuperAdmin' || user.role_name === 'OrgAdmin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role_name || 'No Role'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => startEdit(user)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.user_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const RolesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <UserRolesAdmin />
      </div>
    </div>
  );

  const PermissionsTab = () => {
    const [permissions, setPermissions] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingPermission, setEditingPermission] = useState<any | null>(null);
    const [formData, setFormData] = useState({
      permission_name: '',
      description: '',
      resource: '',
      action: '',
      is_active: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // TODO: Implement permission creation/update API calls
      console.log('Permission form submitted:', formData);
      resetForm();
    };

    const resetForm = () => {
      setFormData({
        permission_name: '',
        description: '',
        resource: '',
        action: '',
        is_active: true
      });
      setEditingPermission(null);
      setShowForm(false);
    };

    const startEdit = (permission: any) => {
      setFormData({
        permission_name: permission.permission_name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        is_active: permission.is_active
      });
      setEditingPermission(permission);
      setShowForm(true);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Permissions Management</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Permission
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingPermission ? 'Edit Permission' : 'Add New Permission'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permission Name *
                  </label>
                  <input
                    type="text"
                    value={formData.permission_name}
                    onChange={(e) => setFormData({...formData, permission_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource *
                  </label>
                  <input
                    type="text"
                    value={formData.resource}
                    onChange={(e) => setFormData({...formData, resource: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action *
                  </label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({...formData, action: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Action</option>
                    <option value="create">Create</option>
                    <option value="read">Read</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="manage">Manage</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="perm_is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="perm_is_active" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPermission ? 'Update Permission' : 'Create Permission'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No permissions found. Create your first permission to get started.
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {permission.permission_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permission.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {permission.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {permission.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        permission.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {permission.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startEdit(permission)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const SettingsTab = () => {
    const [settings, setSettings] = useState({
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAge: 90
      },
      sessionManagement: {
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        rememberMeDuration: 7
      },
      securitySettings: {
        enableTwoFactor: false,
        enableAuditLog: true,
        passwordHistory: 5,
        accountLockout: true
      },
      userPreferences: {
        defaultRole: '',
        emailNotifications: true,
        autoLogout: true,
        language: 'en'
      }
    });

    const handleSettingChange = (category: string, field: string, value: any) => {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category as keyof typeof prev],
          [field]: value
        }
      }));
    };

    const handleSaveSettings = () => {
      // TODO: Implement API call to save settings
      console.log('Settings saved:', settings);
      alert('Settings saved successfully!');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">User Management Settings</h2>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>

        {/* Password Policy Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Password Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Password Length
              </label>
              <input
                type="number"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => handleSettingChange('passwordPolicy', 'minLength', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="6"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Max Age (days)
              </label>
              <input
                type="number"
                value={settings.passwordPolicy.maxAge}
                onChange={(e) => handleSettingChange('passwordPolicy', 'maxAge', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="30"
                max="365"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireUppercase"
                checked={settings.passwordPolicy.requireUppercase}
                onChange={(e) => handleSettingChange('passwordPolicy', 'requireUppercase', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireUppercase" className="ml-2 text-sm text-gray-700">
                Require Uppercase Letters
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireLowercase"
                checked={settings.passwordPolicy.requireLowercase}
                onChange={(e) => handleSettingChange('passwordPolicy', 'requireLowercase', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireLowercase" className="ml-2 text-sm text-gray-700">
                Require Lowercase Letters
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireNumbers"
                checked={settings.passwordPolicy.requireNumbers}
                onChange={(e) => handleSettingChange('passwordPolicy', 'requireNumbers', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireNumbers" className="ml-2 text-sm text-gray-700">
                Require Numbers
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireSpecialChars"
                checked={settings.passwordPolicy.requireSpecialChars}
                onChange={(e) => handleSettingChange('passwordPolicy', 'requireSpecialChars', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireSpecialChars" className="ml-2 text-sm text-gray-700">
                Require Special Characters
              </label>
            </div>
          </div>
        </div>

        {/* Session Management Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Session Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.sessionManagement.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionManagement', 'sessionTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="480"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.sessionManagement.maxLoginAttempts}
                onChange={(e) => handleSettingChange('sessionManagement', 'maxLoginAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="3"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Lockout Duration (minutes)
              </label>
              <input
                type="number"
                value={settings.sessionManagement.lockoutDuration}
                onChange={(e) => handleSettingChange('sessionManagement', 'lockoutDuration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="1440"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remember Me Duration (days)
              </label>
              <input
                type="number"
                value={settings.sessionManagement.rememberMeDuration}
                onChange={(e) => handleSettingChange('sessionManagement', 'rememberMeDuration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="30"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableTwoFactor"
                checked={settings.securitySettings.enableTwoFactor}
                onChange={(e) => handleSettingChange('securitySettings', 'enableTwoFactor', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableTwoFactor" className="ml-2 text-sm text-gray-700">
                Enable Two-Factor Authentication
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableAuditLog"
                checked={settings.securitySettings.enableAuditLog}
                onChange={(e) => handleSettingChange('securitySettings', 'enableAuditLog', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableAuditLog" className="ml-2 text-sm text-gray-700">
                Enable Audit Logging
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="accountLockout"
                checked={settings.securitySettings.accountLockout}
                onChange={(e) => handleSettingChange('securitySettings', 'accountLockout', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="accountLockout" className="ml-2 text-sm text-gray-700">
                Enable Account Lockout
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password History (remember last N passwords)
              </label>
              <input
                type="number"
                value={settings.securitySettings.passwordHistory}
                onChange={(e) => handleSettingChange('securitySettings', 'passwordHistory', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="10"
              />
            </div>
          </div>
        </div>

        {/* User Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">User Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default User Role
              </label>
              <select
                value={settings.userPreferences.defaultRole}
                onChange={(e) => handleSettingChange('userPreferences', 'defaultRole', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Default Role</option>
                {roles.map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Language
              </label>
              <select
                value={settings.userPreferences.language}
                onChange={(e) => handleSettingChange('userPreferences', 'language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.userPreferences.emailNotifications}
                onChange={(e) => handleSettingChange('userPreferences', 'emailNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                Enable Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoLogout"
                checked={settings.userPreferences.autoLogout}
                onChange={(e) => handleSettingChange('userPreferences', 'autoLogout', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoLogout" className="ml-2 text-sm text-gray-700">
                Enable Auto Logout on Inactivity
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Top Bar Navigation */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">User Management</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'roles'
                    ? 'bg-blue-600 text-white'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Roles
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'permissions'
                    ? 'bg-blue-600 text-white'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Permissions
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Settings
              </button>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-white/80 text-sm">
                <span>{users.length} users</span>
                <span>•</span>
                <span>{roles.length} roles</span>
              </div>
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingUser(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add User
              </button>
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button className="text-white hover:bg-white/20 p-2 rounded-md">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6">

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-900 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'permissions' && <PermissionsTab />}
        {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};