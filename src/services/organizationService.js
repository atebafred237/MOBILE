import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const safePayload = {
    organisationType: organizationData.organisationType || 'company',
    organisationName: organizationData.organisationName?.trim() || '',
    organisationEmail: organizationData.organisationEmail?.trim() || '',
    phone: organizationData.phone?.trim() || '',
    location: organizationData.location?.trim() || '',
    adminFirstName: organizationData.adminFirstName?.trim() || '',
    adminLastName: organizationData.adminLastName?.trim() || '',
    adminEmail: organizationData.adminEmail?.trim() || '',
  };

  await new Promise(resolve => setTimeout(resolve, 1200));

  return {
    success: true,
    message: 'Organization created successfully.',
    organization: {
      id: `org_${Date.now()}`,
      organisationType: safePayload.organisationType,
      organisationName: safePayload.organisationName,
      organisationEmail: safePayload.organisationEmail,
      phone: safePayload.phone,
      location: safePayload.location,
      createdAt: new Date().toISOString(),
    },
    admin: {
      id: `admin_${Date.now()}`,
      firstName: safePayload.adminFirstName,
      lastName: safePayload.adminLastName,
      email: safePayload.adminEmail,
    },
  };
};

export const getOrganizationSetupChecklist = () => [
  { id: 'organization', label: 'Organisation', status: 'Completed' },
  { id: 'departments', label: 'Departments', status: 'Not completed', action: 'Add department' },
  { id: 'employees', label: 'Employees', status: 'Not completed', action: 'Add employees' },
  { id: 'devices', label: 'Devices & Kiosks', status: 'Not completed', action: 'Register device' },
  { id: 'attendance', label: 'Attendance settings', status: 'Not completed', action: 'Configure' },
];
