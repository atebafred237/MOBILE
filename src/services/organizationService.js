import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';

const DRAFT_KEY = 'presenza_organization_draft';
const CREATED_KEY = 'presenza_organization_created';

export const getOrganizationDraft = async () => {
  try {
    const storedDraft = await AsyncStorage.getItem(DRAFT_KEY);
    return storedDraft ? JSON.parse(storedDraft) : null;
  } catch (error) {
    console.warn('Could not read organization draft:', error);
    return null;
  }
};

export const saveOrganizationDraft = async (draft) => {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return draft;
  } catch (error) {
    console.warn('Could not save organization draft:', error);
    return draft;
  }
};

export const clearOrganizationDraft = async () => {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.warn('Could not clear organization draft:', error);
  }
};

export const getCreatedOrganization = async () => {
  try {
    const stored = await AsyncStorage.getItem(CREATED_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Could not read created organization:', error);
    return null;
  }
};

export const saveCreatedOrganization = async (organization) => {
  try {
    await AsyncStorage.setItem(CREATED_KEY, JSON.stringify(organization));
  } catch (error) {
    console.warn('Could not save created organization:', error);
  }
};

export const clearCreatedOrganization = async () => {
  try {
    await AsyncStorage.removeItem(CREATED_KEY);
  } catch (error) {
    console.warn('Could not clear created organization:', error);
  }
};

export const createOrganization = async (organizationData) => {
  const payload = {
    organization_name: (organizationData.organizationName || organizationData.organisationName || '').trim(),
    organization_type: (organizationData.organizationType || organizationData.organisationType || 'company').trim(),
    email: (organizationData.organizationEmail || organizationData.organisationEmail || '').trim(),
    phone: (organizationData.phone || '').trim(),
    location: (organizationData.location || '').trim(),
    admin_first_name: (organizationData.adminFirstName || '').trim(),
    admin_last_name: (organizationData.adminLastName || '').trim(),
    admin_email: (organizationData.adminEmail || '').trim(),
    admin_password: organizationData.adminPassword || '',
    admin_password_confirmation: organizationData.adminPasswordConfirmation || organizationData.adminPassword || '',
    working_days: organizationData.workingDays || [1, 2, 3, 4, 5],
    start_time: organizationData.startTime || '08:00',
    end_time: organizationData.endTime || '17:00',
    timezone: organizationData.timezone || 'UTC',
  };

  try {
    let body = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (organizationData.logoUri) {
      const filename = organizationData.logoUri.split('/').pop() || `organization-logo-${Date.now()}.jpg`;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (key === 'working_days') {
          value.forEach(day => formData.append('working_days[]', String(day)));
          return;
        }

        formData.append(key, String(value));
      });
      if (Platform.OS === 'web') {
        const imageBlob = await new Promise((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.onload = () => resolve(request.response);
          request.onerror = () => reject(new Error('Could not read the selected logo.'));
          request.responseType = 'blob';
          request.open('GET', organizationData.logoUri, true);
          request.send();
        });
        formData.append('logo', imageBlob, filename);
      } else {
        formData.append('logo', new File(organizationData.logoUri), filename);
      }
      body = formData;
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}/organizations/register`, {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || data?.error || 'Organization registration failed.';
      throw new Error(message);
    }

    const organization = data?.organization || {
      name: payload.organization_name,
      organization_type: payload.organization_type,
      email: payload.email,
      phone: payload.phone,
      location: payload.location,
    };

    const admin = data?.admin_user || {
      email: payload.admin_email,
      first_name: payload.admin_first_name,
      last_name: payload.admin_last_name,
    };

    await saveCreatedOrganization({
      ...organization,
      admin,
      createdAt: new Date().toISOString(),
    });
    await clearOrganizationDraft();

    return {
      success: true,
      message: data?.message || 'Organization created successfully.',
      organization,
      admin,
      raw: data,
    };
  } catch (error) {
    console.warn('Organization registration API error:', error);
    throw error;
  }
};

export const getOrganizationSetupChecklist = () => [
  { id: 'organization', label: 'Organisation', status: 'Completed' },
  { id: 'departments', label: 'Departments', status: 'Not completed', action: 'Add department' },
  { id: 'employees', label: 'Employees', status: 'Not completed', action: 'Add employees' },
  { id: 'devices', label: 'Devices & Kiosks', status: 'Not completed', action: 'Register device' },
  { id: 'attendance', label: 'Attendance settings', status: 'Not completed', action: 'Configure' },
];
