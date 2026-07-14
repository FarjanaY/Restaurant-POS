import Settings from '../models/Settings.js';
import { emitSettingsUpdated } from '../sockets/settings.js';

async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
}

export async function getSettings(req, res, next) {
  try {
    res.json(await getOrCreateSettings());
  } catch (err) {
    next(err);
  }
}

// Unauthenticated (login screen, before any token exists) — only the two
// fields needed for branding, never the rest of restaurantProfile/settings.
export async function getPublicBranding(req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    res.json({ name: settings.restaurantProfile.name, logoUrl: settings.restaurantProfile.logoUrl });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await getOrCreateSettings();
    if (req.body.tablesEnabled !== undefined) {
      settings.tablesEnabled = !!req.body.tablesEnabled;
    }
    if (req.body.listLayouts !== undefined) {
      const invalid = Object.entries(req.body.listLayouts).find(
        ([, value]) => !['table', 'card'].includes(value)
      );
      if (invalid) {
        return res.status(400).json({ message: `Invalid listLayouts.${invalid[0]} "${invalid[1]}"` });
      }
      settings.listLayouts = { ...settings.listLayouts.toObject(), ...req.body.listLayouts };
    }
    if (req.body.restaurantProfile !== undefined) {
      settings.restaurantProfile = { ...settings.restaurantProfile.toObject(), ...req.body.restaurantProfile };
    }
    if (req.body.generalSettings !== undefined) {
      settings.generalSettings = { ...settings.generalSettings.toObject(), ...req.body.generalSettings };
    }
    if (req.body.socialSettings !== undefined) {
      settings.socialSettings = { ...settings.socialSettings.toObject(), ...req.body.socialSettings };
    }
    await settings.save();
    emitSettingsUpdated();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}
