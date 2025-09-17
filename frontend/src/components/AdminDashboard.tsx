import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

interface TableDefinition {
  name: string;
  displayName: string;
  readEndpoint: string;
  writeEndpoint?: string; // If different from readEndpoint
  fields: FieldDefinition[];
  primaryKey: string;
}

interface FieldDefinition {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'dropdown';
  required?: boolean;
  dropdownOptions?: { value: any; label: string }[];
  dropdownEndpoint?: string;
  dropdownValueField?: string;
  dropdownLabelField?: string;
}

const tableDefinitions: TableDefinition[] = [
  {
    name: 'users',
    displayName: 'Users',
    readEndpoint: 'users',
    primaryKey: 'Id',
    fields: [
      { name: 'Username', displayName: 'Username', type: 'text', required: true },
      { name: 'Email', displayName: 'Email', type: 'text', required: true },
      { name: 'IsActive', displayName: 'Active', type: 'boolean' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date', required: false },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date', required: false }
    ]
  },
  {
    name: 'roles',
    displayName: 'Roles',
    readEndpoint: 'roles',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'IsActive', displayName: 'Active', type: 'boolean' }
    ]
  },
  {
    name: 'organizations',
    displayName: 'Organizations',
    readEndpoint: 'organizations',
    writeEndpoint: 'admin/organizations',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'IsActive', displayName: 'Active', type: 'boolean' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'athletes',
    displayName: 'Athletes',
    readEndpoint: 'athletes',
    primaryKey: 'Id',
    fields: [
      { name: 'UnionId', displayName: 'Union ID', type: 'text', required: true },
      { name: 'FirstName', displayName: 'First Name', type: 'text', required: true },
      { name: 'LastName', displayName: 'Last Name', type: 'text', required: true },
      { name: 'DateOfBirth', displayName: 'Date of Birth', type: 'date', required: true },
      { name: 'Gender', displayName: 'Gender', type: 'dropdown', required: true, dropdownOptions: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' }
      ]},
      { name: 'SportId', displayName: 'Sport', type: 'dropdown', dropdownEndpoint: 'sports', dropdownValueField: 'Id', dropdownLabelField: 'Name' },
      { name: 'Sport', displayName: 'Sport Name (if no SportId)', type: 'text' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'sports',
    displayName: 'Sports',
    readEndpoint: 'sports',
    writeEndpoint: 'admin/sports',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'CategoryId', displayName: 'Category', type: 'dropdown', required: true, dropdownEndpoint: 'sport-categories', dropdownValueField: 'Id', dropdownLabelField: 'Name' },
      { name: 'IsActive', displayName: 'Active', type: 'boolean' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'sportcategories',
    displayName: 'Sport Categories',
    readEndpoint: 'sport-categories',
    writeEndpoint: 'admin/sport-categories',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'IsActive', displayName: 'Active', type: 'boolean' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'alerttypes',
    displayName: 'Alert Types',
    readEndpoint: 'alerttypes',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'Category', displayName: 'Category', type: 'text', required: true },
      { name: 'Severity', displayName: 'Severity', type: 'dropdown', required: true, dropdownOptions: [
        { value: 'Low', label: 'Low' },
        { value: 'Medium', label: 'Medium' },
        { value: 'High', label: 'High' },
        { value: 'Critical', label: 'Critical' }
      ]},
      { name: 'IsActive', displayName: 'Active', type: 'boolean' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'bloodtesttypes',
    displayName: 'Blood Test Types',
    readEndpoint: 'bloodtesttypes',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'Category', displayName: 'Category', type: 'text', required: true },
      { name: 'IsActive', displayName: 'Active', type: 'boolean' }
    ]
  },
  {
    name: 'genetictesttypes',
    displayName: 'Genetic Test Types',
    readEndpoint: 'genetictesttypes',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'Category', displayName: 'Category', type: 'text', required: true },
      { name: 'Methodology', displayName: 'Methodology', type: 'text', required: true },
      { name: 'Cost', displayName: 'Cost', type: 'number', required: true },
      { name: 'IsActive', displayName: 'Active', type: 'boolean' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'genes',
    displayName: 'Genes',
    readEndpoint: 'genes',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Symbol', displayName: 'Symbol', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'Category', displayName: 'Category', type: 'text', required: true },
      { name: 'Chromosome', displayName: 'Chromosome', type: 'text', required: true },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'metricconfigs',
    displayName: 'Metric Configurations',
    readEndpoint: 'metrics/config',
    primaryKey: 'Id',
    fields: [
      { name: 'MetricName', displayName: 'Metric Name', type: 'text', required: true },
      { name: 'Unit', displayName: 'Unit', type: 'text', required: true },
      { name: 'MinValue', displayName: 'Min Value', type: 'number' },
      { name: 'MaxValue', displayName: 'Max Value', type: 'number' },
      { name: 'AlertThreshold', displayName: 'Alert Threshold', type: 'number' }
    ]
  },
  {
    name: 'predictiverules',
    displayName: 'Predictive Rules',
    readEndpoint: 'rules/predictive',
    primaryKey: 'Id',
    fields: [
      { name: 'Name', displayName: 'Name', type: 'text', required: true },
      { name: 'Description', displayName: 'Description', type: 'text', required: true },
      { name: 'Conditions', displayName: 'Conditions', type: 'text', required: true },
      { name: 'Actions', displayName: 'Actions', type: 'text', required: true },
      { name: 'IsActive', displayName: 'Active', type: 'boolean' }
    ]
  },
  {
    name: 'biometricdaily',
    displayName: 'Biometric Daily',
    readEndpoint: 'biometric-daily',
    primaryKey: 'Id',
    fields: [
      { name: 'AthleteId', displayName: 'Athlete', type: 'dropdown', required: true, dropdownEndpoint: 'athletes', dropdownValueField: 'Id', dropdownLabelField: 'FirstName' },
      { name: 'Date', displayName: 'Date', type: 'date', required: true },
      { name: 'RestingHeartRate', displayName: 'Resting Heart Rate', type: 'number' },
      { name: 'HeartRateVariability', displayName: 'Heart Rate Variability', type: 'number' },
      { name: 'SleepQuality', displayName: 'Sleep Quality', type: 'number' },
      { name: 'RecoveryScore', displayName: 'Recovery Score', type: 'number' },
      { name: 'FatigueLevel', displayName: 'Fatigue Level', type: 'number' }
    ]
  },
  {
    name: 'bloodresults',
    displayName: 'Blood Results',
    readEndpoint: 'blood-results',
    primaryKey: 'Id',
    fields: [
      { name: 'AthleteId', displayName: 'Athlete', type: 'dropdown', required: true, dropdownEndpoint: 'athletes', dropdownValueField: 'Id', dropdownLabelField: 'FirstName' },
      { name: 'TestDate', displayName: 'Test Date', type: 'date', required: true },
      { name: 'LabName', displayName: 'Lab Name', type: 'text', required: true },
      { name: 'Notes', displayName: 'Notes', type: 'text', required: true },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'bodycompositions',
    displayName: 'Body Compositions',
    readEndpoint: 'body-composition',
    writeEndpoint: 'body-composition/admin',
    primaryKey: 'Id',
    fields: [
      { name: 'AthleteId', displayName: 'Athlete', type: 'dropdown', required: true, dropdownEndpoint: 'athletes', dropdownValueField: 'Id', dropdownLabelField: 'FirstName' },
      { name: 'MeasurementDate', displayName: 'Measurement Date', type: 'date', required: true },
      { name: 'Weight', displayName: 'Weight (kg)', type: 'number', required: true },
      { name: 'BodyFat', displayName: 'Body Fat (%)', type: 'number', required: true },
      { name: 'MuscleMass', displayName: 'Muscle Mass (kg)', type: 'number', required: true },
      { name: 'BoneDensity', displayName: 'Bone Density', type: 'number', required: true }
    ]
  },
  {
    name: 'genetictestresults',
    displayName: 'Genetic Test Results',
    readEndpoint: 'genetic-test-results',
    primaryKey: 'Id',
    fields: [
      { name: 'AthleteId', displayName: 'Athlete', type: 'dropdown', required: true, dropdownEndpoint: 'athletes', dropdownValueField: 'Id', dropdownLabelField: 'FirstName' },
      { name: 'TestTypeId', displayName: 'Test Type', type: 'dropdown', required: true, dropdownEndpoint: 'genetictesttypes', dropdownValueField: 'Id', dropdownLabelField: 'Name' },
      { name: 'TestDate', displayName: 'Test Date', type: 'date', required: true },
      { name: 'ResultSummary', displayName: 'Result Summary', type: 'text' },
      { name: 'Recommendations', displayName: 'Recommendations', type: 'text' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
  {
    name: 'geneticprofiles',
    displayName: 'Genetic Profiles',
    readEndpoint: 'geneticprofiles',
    primaryKey: 'Id',
    fields: [
      { name: 'AthleteId', displayName: 'Athlete', type: 'dropdown', required: true, dropdownEndpoint: 'athletes', dropdownValueField: 'Id', dropdownLabelField: 'FirstName' },
      { name: 'GeneId', displayName: 'Gene', type: 'dropdown', dropdownEndpoint: 'genes', dropdownValueField: 'Id', dropdownLabelField: 'Name' },
      { name: 'GeneticTestTypeId', displayName: 'Test Type', type: 'dropdown', dropdownEndpoint: 'genetictesttypes', dropdownValueField: 'Id', dropdownLabelField: 'Name' },
      { name: 'Genotype', displayName: 'Genotype', type: 'text' },
      { name: 'Phenotype', displayName: 'Phenotype', type: 'text' },
      { name: 'RiskLevel', displayName: 'Risk Level', type: 'text' },
      { name: 'CreatedAt', displayName: 'Created At', type: 'date' },
      { name: 'UpdatedAt', displayName: 'Updated At', type: 'date' }
    ]
  },
];

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [selectedTable, setSelectedTable] = useState<TableDefinition | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dropdownData, setDropdownData] = useState<Record<string, any[]>>({});

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5288/api';

  useEffect(() => {
    if (selectedTable) {
      loadTableData();
      loadDropdownData();
    }
  }, [selectedTable]);

  const loadTableData = async () => {
    if (!selectedTable || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/${selectedTable.readEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        let items: any[] = [];

        if (result.Code === 1 && result.Data) {
          if (Array.isArray(result.Data)) {
            items = result.Data;
          } else if (result.Data && result.Data['$values']) {
            items = result.Data['$values'];
          } else if (result.Data && result.Data.records) {
            // Handle paginated responses like body-composition
            items = result.Data.records;
          } else if (typeof result.Data === 'object') {
            // Check for table-specific property names
            if (selectedTable.name in result.Data) {
              const tableData = result.Data[selectedTable.name];
              items = Array.isArray(tableData) ? tableData : tableData?.$values || [];
            } else if (selectedTable.name + 's' in result.Data) {
              // Handle plural forms like 'athletes'
              const tableData = result.Data[selectedTable.name + 's'];
              items = Array.isArray(tableData) ? tableData : tableData?.$values || [];
            } else if ('values' in result.Data) {
              // Handle { values: [...] } structure
              items = Array.isArray(result.Data.values) ? result.Data.values : [];
            } else {
              // Fallback: if Data is an object but doesn't match expected patterns,
              // it might be a single item or different structure
              console.warn('Unexpected Data structure for', selectedTable.name, ':', result.Data);
              items = [];
            }
          }
        } else if (Array.isArray(result)) {
          items = result;
        } else {
          console.warn('Unexpected API response structure for', selectedTable.name, ':', result);
          items = [];
        }

        // Ensure items is always an array
        if (!Array.isArray(items)) {
          console.error('Parsed items is not an array for', selectedTable.name, ':', items);
          items = [];
        }

        setData(items);
      } else {
        setError(`Failed to load ${selectedTable.displayName}`);
      }
    } catch (err) {
      setError(`Error loading ${selectedTable.displayName}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    if (!selectedTable) return;

    const newDropdownData: Record<string, any[]> = {};

    for (const field of selectedTable.fields) {
      if (field.type === 'dropdown' && field.dropdownEndpoint) {
        try {
          const response = await fetch(`${API_BASE_URL}/${field.dropdownEndpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            let items: any[] = [];

            if (result.Code === 1 && result.Data) {
              if (Array.isArray(result.Data)) {
                items = result.Data;
              } else if (result.Data && result.Data['$values']) {
                items = result.Data['$values'];
              } else if (result.Data && result.Data.records) {
                // Handle paginated responses
                items = result.Data.records;
              } else if (typeof result.Data === 'object') {
                // Check for endpoint-specific property names
                if (field.dropdownEndpoint in result.Data) {
                  const endpointData = result.Data[field.dropdownEndpoint];
                  items = Array.isArray(endpointData) ? endpointData : endpointData?.$values || [];
                } else if ('values' in result.Data) {
                  // Handle { values: [...] } structure
                  items = Array.isArray(result.Data.values) ? result.Data.values : [];
                } else {
                  console.warn('Unexpected dropdown Data structure for', field.dropdownEndpoint, ':', result.Data);
                  items = [];
                }
              } else {
                console.warn('Unexpected dropdown Data structure for', field.dropdownEndpoint, ':', result.Data);
                items = [];
              }
            } else if (Array.isArray(result)) {
              items = result;
            } else {
              console.warn('Unexpected dropdown API response for', field.dropdownEndpoint, ':', result);
              items = [];
            }

            // Ensure items is always an array
            if (!Array.isArray(items)) {
              console.error('Parsed dropdown items is not an array for', field.dropdownEndpoint, ':', items);
              items = [];
            }

            newDropdownData[field.dropdownEndpoint] = items;
          }
        } catch (err) {
          console.error(`Error loading dropdown data for ${field.dropdownEndpoint}`, err);
        }
      }
    }

    setDropdownData(newDropdownData);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowForm(true);
  };

  const handleDelete = async (item: any) => {
    if (!selectedTable || !confirm(`Are you sure you want to delete this ${selectedTable.displayName.toLowerCase()}?`)) return;

    try {
      const writeEndpoint = selectedTable.writeEndpoint || selectedTable.readEndpoint;
      const response = await fetch(`${API_BASE_URL}/${writeEndpoint}/${item[selectedTable.primaryKey]}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadTableData();
      } else {
        setError(`Failed to delete ${selectedTable.displayName}`);
      }
    } catch (err) {
      setError(`Error deleting ${selectedTable.displayName}`);
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const writeEndpoint = selectedTable.writeEndpoint || selectedTable.readEndpoint;
      const url = editingItem
        ? `${API_BASE_URL}/${writeEndpoint}/${editingItem[selectedTable.primaryKey]}`
        : `${API_BASE_URL}/${writeEndpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({});
        setEditingItem(null);
        loadTableData();
      } else {
        const errorData = await response.json();
        setError(errorData.Info || `Failed to ${editingItem ? 'update' : 'create'} ${selectedTable.displayName}`);
      }
    } catch (err) {
      setError(`Error ${editingItem ? 'updating' : 'creating'} ${selectedTable.displayName}`);
      console.error(err);
    }
  };

  const renderField = (field: FieldDefinition, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        );

      case 'dropdown':
        if (field.dropdownOptions) {
          return (
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={field.required}
            >
              <option value="">Select {field.displayName}</option>
              {field.dropdownOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        } else if (field.dropdownEndpoint && dropdownData[field.dropdownEndpoint]) {
          const options = dropdownData[field.dropdownEndpoint];
          return (
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={field.required}
            >
              <option value="">Select {field.displayName}</option>
              {options.map(option => (
                <option key={option[field.dropdownValueField || 'Id']} value={option[field.dropdownValueField || 'Id']}>
                  {option[field.dropdownLabelField || 'Name']}
                </option>
              ))}
            </select>
          );
        }
        return <div>Loading options...</div>;

      default:
        return <div>Unsupported field type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTable?.name || ''}
                onChange={(e) => {
                  const table = tableDefinitions.find(t => t.name === e.target.value);
                  setSelectedTable(table || null);
                  setData([]);
                  setError(null);
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Table</option>
                {tableDefinitions.map(table => (
                  <option key={table.name} value={table.name}>
                    {table.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

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

          {selectedTable && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{selectedTable.displayName} Management</h2>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add New {selectedTable.displayName}
                </button>
              </div>

              {showForm && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingItem ? 'Edit' : 'Add New'} {selectedTable.displayName}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTable.fields.map(field => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.displayName}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderField(field, formData[field.name], (value) => {
                            setFormData(prev => ({ ...prev, [field.name]: value }));
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {editingItem ? 'Update' : 'Create'} {selectedTable.displayName}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setFormData({});
                          setEditingItem(null);
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedTable.fields.map(field => (
                          <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {field.displayName}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.length === 0 ? (
                        <tr>
                          <td colSpan={selectedTable.fields.length + 1} className="px-6 py-4 text-center text-gray-500">
                            No {selectedTable.displayName.toLowerCase()} found
                          </td>
                        </tr>
                      ) : (
                        (Array.isArray(data) ? data : []).map((item, index) => (
                          <tr key={item[selectedTable.primaryKey] || index}>
                            {selectedTable.fields.map(field => (
                              <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {field.type === 'boolean' ? (
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    item[field.name] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {item[field.name] ? 'Yes' : 'No'}
                                  </span>
                                ) : field.type === 'date' && item[field.name] ? (
                                  new Date(item[field.name]).toLocaleDateString()
                                ) : field.type === 'dropdown' && field.dropdownEndpoint && dropdownData[field.dropdownEndpoint] ? (
                                  dropdownData[field.dropdownEndpoint].find(option =>
                                    option[field.dropdownValueField || 'Id'] === item[field.name]
                                  )?.[field.dropdownLabelField || 'Name'] || item[field.name]
                                ) : (
                                  String(item[field.name] || '')
                                )}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!selectedTable && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Dashboard</h3>
              <p className="text-gray-600">Select a table from the dropdown above to start managing data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};