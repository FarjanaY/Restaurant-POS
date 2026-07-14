import ModifierGroup from '../models/ModifierGroup.js';

export async function listModifierGroups(req, res, next) {
  try {
    res.json(await ModifierGroup.find());
  } catch (err) {
    next(err);
  }
}

export async function createModifierGroup(req, res, next) {
  try {
    const group = await ModifierGroup.create(req.body);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

// Modifiers are embedded subdocuments — updates replace the whole group
// (including its `modifiers` array) rather than exposing per-modifier routes.
export async function updateModifierGroup(req, res, next) {
  try {
    const group = await ModifierGroup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!group) return res.status(404).json({ message: 'Modifier group not found' });
    res.json(group);
  } catch (err) {
    next(err);
  }
}

export async function deleteModifierGroup(req, res, next) {
  try {
    const group = await ModifierGroup.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ message: 'Modifier group not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
