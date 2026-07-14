import DailyCost from '../models/DailyCost.js';

export async function listDailyCosts(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const filter = {};
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }
    res.json(await DailyCost.find(filter).sort('-date'));
  } catch (err) {
    next(err);
  }
}

export async function createDailyCost(req, res, next) {
  try {
    const { date, amount, notes } = req.body;
    const cost = await DailyCost.create({ date, amount, notes, staffId: req.user.sub });
    res.status(201).json(cost);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: `A cost entry for ${req.body.date} already exists` });
    }
    next(err);
  }
}

export async function updateDailyCost(req, res, next) {
  try {
    const { date, amount, notes } = req.body;
    const cost = await DailyCost.findByIdAndUpdate(
      req.params.id,
      { date, amount, notes },
      { new: true, runValidators: true }
    );
    if (!cost) return res.status(404).json({ message: 'Daily cost not found' });
    res.json(cost);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: `A cost entry for ${req.body.date} already exists` });
    }
    next(err);
  }
}

export async function deleteDailyCost(req, res, next) {
  try {
    const cost = await DailyCost.findByIdAndDelete(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Daily cost not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
