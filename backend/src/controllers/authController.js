import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// PIN-only login (no username step) so a cashier can punch in and go —
// matches the "fast user switching on shared terminals" requirement (PRD FR6.2).
export async function login(req, res, next) {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    const users = await User.find({ active: true });
    let matchedUser = null;
    for (const user of users) {
      if (await bcrypt.compare(pin, user.pinHash)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    const token = jwt.sign(
      { sub: matchedUser._id.toString(), role: matchedUser.role, name: matchedUser.name },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: { id: matchedUser._id, name: matchedUser.name, role: matchedUser.role },
    });
  } catch (err) {
    next(err);
  }
}
