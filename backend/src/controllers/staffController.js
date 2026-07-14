import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const ROLES = ['admin', 'manager', 'cashier', 'kitchen'];

// Login (authController) matches a PIN by bcrypt-comparing it against every
// active user's hash in turn, so two active staff sharing a PIN would make
// login non-deterministic — this walks the same set to reject a collision
// before it can happen.
async function pinIsTaken(pin, excludeUserId) {
  const users = await User.find({ active: true, ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}) });
  for (const user of users) {
    if (await bcrypt.compare(pin, user.pinHash)) return true;
  }
  return false;
}

export async function listStaff(req, res, next) {
  try {
    res.json(await User.find().select('-pinHash').sort('name'));
  } catch (err) {
    next(err);
  }
}

export async function createStaff(req, res, next) {
  try {
    const { name, role, pin } = req.body;
    if (!name || !role || !pin) {
      return res.status(400).json({ message: 'name, role, and pin are required' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role "${role}"` });
    }
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be 4-6 digits' });
    }
    if (await pinIsTaken(pin)) {
      return res.status(409).json({ message: 'That PIN is already in use by another active staff member' });
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const user = await User.create({ name, role, pinHash, active: true });
    const { pinHash: _pinHash, ...safeUser } = user.toObject();
    res.status(201).json(safeUser);
  } catch (err) {
    next(err);
  }
}

export async function updateStaff(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Staff member not found' });

    const { name, role, active, pin } = req.body;

    if (role !== undefined) {
      if (!ROLES.includes(role)) return res.status(400).json({ message: `Invalid role "${role}"` });
      user.role = role;
    }
    if (name !== undefined) user.name = name;
    if (active !== undefined) user.active = !!active;

    if (pin !== undefined) {
      if (!/^\d{4,6}$/.test(pin)) {
        return res.status(400).json({ message: 'PIN must be 4-6 digits' });
      }
      if (await pinIsTaken(pin, user._id)) {
        return res.status(409).json({ message: 'That PIN is already in use by another active staff member' });
      }
      user.pinHash = await bcrypt.hash(pin, 10);
    }

    await user.save();
    const { pinHash: _pinHash, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
}

// Deactivates rather than deletes — orders/payments reference staffId, and a
// hard delete would orphan that history. Deactivated staff simply can't log in.
export async function deactivateStaff(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true }).select(
      '-pinHash'
    );
    if (!user) return res.status(404).json({ message: 'Staff member not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}
