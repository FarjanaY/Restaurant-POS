import Coupon from '../models/Coupon.js';

export async function listCoupons(req, res, next) {
  try {
    res.json(await Coupon.find().sort('-createdAt'));
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: `Coupon code "${req.body.code}" already exists` });
    }
    next(err);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
