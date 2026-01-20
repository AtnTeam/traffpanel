import { getSetting, setSetting, getAllSettings } from '../models/userSettingsModel.js';

// Setting keys
const SETTING_KEYS = {
  AUTO_REFRESH_ENABLED: 'auto_refresh_enabled',
  AUTO_REFRESH_INTERVAL: 'auto_refresh_interval',
  DATE_FROM: 'date_from',
  DATE_TO: 'date_to',
};

/**
 * Get all settings
 */
export const getSettings = async (req, res) => {
  try {
    const settings = await getAllSettings();
    
    // Return with default values if not set
    res.json({
      success: true,
      settings: {
        autoRefreshEnabled: settings[SETTING_KEYS.AUTO_REFRESH_ENABLED] === 'true',
        autoRefreshInterval: parseInt(settings[SETTING_KEYS.AUTO_REFRESH_INTERVAL] || '60', 10),
        dateFrom: settings[SETTING_KEYS.DATE_FROM] || '2026-01-14',
        dateTo: settings[SETTING_KEYS.DATE_TO] || '2026-01-15',
      }
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving settings'
    });
  }
};

/**
 * Update settings
 */
export const updateSettings = async (req, res) => {
  try {
    const { autoRefreshEnabled, autoRefreshInterval, dateFrom, dateTo } = req.body;
    
    // Update settings if provided
    if (autoRefreshEnabled !== undefined) {
      await setSetting(SETTING_KEYS.AUTO_REFRESH_ENABLED, autoRefreshEnabled.toString());
    }
    
    if (autoRefreshInterval !== undefined) {
      await setSetting(SETTING_KEYS.AUTO_REFRESH_INTERVAL, autoRefreshInterval.toString());
    }
    
    if (dateFrom !== undefined) {
      await setSetting(SETTING_KEYS.DATE_FROM, dateFrom);
    }
    
    if (dateTo !== undefined) {
      await setSetting(SETTING_KEYS.DATE_TO, dateTo);
    }
    
    // Return updated settings
    const settings = await getAllSettings();
    
    res.json({
      success: true,
      settings: {
        autoRefreshEnabled: settings[SETTING_KEYS.AUTO_REFRESH_ENABLED] === 'true',
        autoRefreshInterval: parseInt(settings[SETTING_KEYS.AUTO_REFRESH_INTERVAL] || '60', 10),
        dateFrom: settings[SETTING_KEYS.DATE_FROM] || '2026-01-14',
        dateTo: settings[SETTING_KEYS.DATE_TO] || '2026-01-15',
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating settings'
    });
  }
};

