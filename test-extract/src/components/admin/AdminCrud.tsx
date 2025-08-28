import React, { useState, useEffect } from 'react';
import { useCrud } from '../../hooks';
import { FormField, SearchParams } from '../../types';
import { DataCard, Button, LoadingSpinner, StatusMessage, SkeletonTable } from '../ui';
import { validateForm } from '../../utils';

interface AdminCrudProps<T> {
  title: string;
  resource: string;
  fields: FormField[];
  displayFields: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  searchFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'select';
    options?: { value: string; label: string }[];
  }>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onItemClick?: (item: T) => void;
}

export function AdminCrud<T extends { id?: string | number }>({
  title,
  resource,
  fields,
  displayFields,
  searchFields = [],
  canCreate = true,
  canEdit = true,
  canDelete = true,
  onItemClick,
}: AdminCrudProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});

  const { getAll, create, update, remove } = useCrud<T>(resource);

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAll(searchParams);
      if (result) {
        setItems(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm(formData, fields);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (editingItem?.id) {
        result = await update(editingItem.id, formData as Partial<T>);
      } else {
        result = await create(formData as Partial<T>);
      }

      if (result) {
        await loadData();
        handleCloseForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (item: T) => {
    if (!item.id || !window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await remove(item.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleOpenForm = (item?: T) => {
    if (item) {
      setEditingItem(item);
      setFormData(item as Record<string, any>);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setFormData({});
    setFormErrors({});
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Search handlers
  const handleSearchChange = (key: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  if (loading && items.length === 0) {
    return <SkeletonTable />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {canCreate && (
          <Button onClick={() => handleOpenForm()}>
            Add New {title.slice(0, -1)}
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <StatusMessage
          type="error"
          message={error}
          action={{
            label: 'Try Again',
            onClick: loadData,
          }}
        />
      )}

      {/* Search Filters */}
      {searchFields.length > 0 && (
        <DataCard title="Filters" className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {searchFields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={searchParams[field.key] || ''}
                    onChange={(e) => handleSearchChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={searchParams[field.key] || ''}
                    onChange={(e) => handleSearchChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Search ${field.label.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
          </div>
        </DataCard>
      )}

      {/* Data Table */}
      <DataCard title={`${title} (${items.length})`}>
        {loading && items.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {displayFields.map(field => (
                  <th
                    key={String(field.key)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr
                  key={item.id || index}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onItemClick?.(item)}
                >
                  {displayFields.map(field => (
                    <td key={String(field.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {field.render
                        ? field.render(item[field.key], item)
                        : String(item[field.key] || '')
                      }
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {canEdit && (
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleOpenForm(item);
                        }}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No {title.toLowerCase()} found.</p>
              {canCreate && (
                <Button
                  className="mt-4"
                  onClick={() => handleOpenForm()}
                >
                  Add First {title.slice(0, -1)}
                </Button>
              )}
            </div>
          )}
        </div>
      </DataCard>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit' : 'Add New'} {title.slice(0, -1)}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {formErrors[field.name] && (
                    <p className="mt-1 text-sm text-red-600">{formErrors[field.name]}</p>
                  )}
                </div>
              ))}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                >
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
