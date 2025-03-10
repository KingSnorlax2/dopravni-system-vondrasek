// Utility functions for managing app settings

export interface AppSettings {
  // Table display settings
  itemsPerPage: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  // Filter settings
  filterStav: string;
  filterSTK: string;
  dateFrom: string | null;
  dateTo: string | null;
  mileageFrom: string | null;
  mileageTo: string | null;
  // Application settings
  enableNotifications: boolean;
  stkWarningDays: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  itemsPerPage: 10,
  sortField: 'spz',
  sortOrder: 'desc',
  filterStav: 'vse',
  filterSTK: 'vse',
  dateFrom: null,
  dateTo: null,
  mileageFrom: null,
  mileageTo: null,
  enableNotifications: true,
  stkWarningDays: 30
};

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
} 