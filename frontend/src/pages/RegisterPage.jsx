import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { apiClient } from '../api/client.js';
import { fetchMenu } from '../features/menu/menuSlice.js';
import { categoryEmoji } from '../features/menu/categoryEmoji.js';
import {
  itemAdded,
  lineQuantityChanged,
  lineRemoved,
  lineModifiersChanged,
  lineModifierAdded,
  lineNotesChanged,
  orderTypeChanged,
  tableChanged,
  cartCleared,
  couponCleared,
  manualDiscountCleared,
  cartHydrated,
} from '../features/cart/cartSlice.js';
import {
  holdOrder,
  sendOrder,
  cancelOrder,
  applyCoupon,
  removeCoupon,
  applyManualDiscount,
  removeManualDiscount,
} from '../features/orders/ordersSlice.js';
import CartLineItem from '../features/cart/CartLineItem.jsx';
import ModifierPicker from '../features/menu/ModifierPicker.jsx';
import ItemDetailsModal from '../features/menu/ItemDetailsModal.jsx';
import AvailabilityBadge from '../features/menu/AvailabilityBadge.jsx';
import HeldOrdersPanel from '../features/orders/HeldOrdersPanel.jsx';
import PaymentPanel from '../features/orders/PaymentPanel.jsx';
import TopBar from '../components/TopBar.jsx';
import {
  IconSearch,
  IconPause,
  IconTrash,
  IconGrid,
  IconList,
  IconTag,
  IconTable,
  IconPlus,
} from '../components/icons.jsx';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { categories, items, status, error } = useSelector((state) => state.menu);
  const cart = useSelector((state) => state.cart);
  const cartLines = cart.lines;
  const holdStatus = useSelector((state) => state.orders.status);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [pickerItem, setPickerItem] = useState(null);
  const [pickerEditIndex, setPickerEditIndex] = useState(null); // null = adding a new line, number = editing that cart line's modifiers
  const [detailsItem, setDetailsItem] = useState(null);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [discountMode, setDiscountMode] = useState('coupon'); // coupon | discount — only one input shown at a time
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState(null);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [tablesEnabled, setTablesEnabled] = useState(false);
  const [tables, setTables] = useState([]);
  const [addItemQuery, setAddItemQuery] = useState('');
  const [showAddItemSuggestions, setShowAddItemSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchMenu());
  }, [dispatch]);

  // Tables is an optional feature (Settings → Table management) — only fetch
  // the floor plan when it's actually turned on, so takeaway-only venues never
  // pay for this request or see the picker.
  useEffect(() => {
    apiClient.get('/settings').then(({ data }) => {
      setTablesEnabled(data.tablesEnabled);
      if (data.tablesEnabled) {
        apiClient.get('/tables').then(({ data: tableData }) => setTables(tableData));
      }
    });
  }, []);

  // Ctrl+K / Cmd+K jumps to the search box, matching the shortcut hint shown next to it.
  useEffect(() => {
    function handleKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query) {
      return items.filter((item) => item.name.toLowerCase().includes(query));
    }
    if (activeCategoryId === 'all') {
      return items;
    }
    return items.filter((item) => item.categoryId === activeCategoryId);
  }, [items, search, activeCategoryId]);

  const addItemSuggestions = useMemo(() => {
    const query = addItemQuery.trim().toLowerCase();
    if (!query) return [];
    return items.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 6);
  }, [items, addItemQuery]);

  function handleItemTap(item) {
    if (item.available === false) return; // defense in depth — the Add button is already disabled for this case
    if (item.modifierGroupIds.length > 0) {
      setPickerItem(item);
      return;
    }
    dispatch(
      itemAdded({
        menuItemId: item._id,
        name: item.name,
        quantity: 1,
        unitPrice: item.basePrice,
        modifiers: [],
        notes: '',
      })
    );
  }

  function handleAddItemSuggestionPick(item) {
    handleItemTap(item);
    setAddItemQuery('');
    setShowAddItemSuggestions(false);
  }

  async function handleHold() {
    await dispatch(holdOrder(cart)).unwrap();
    dispatch(cartCleared());
  }

  async function handleCharge() {
    setSendError(null);
    try {
      const order = await dispatch(sendOrder(cart)).unwrap();
      setPaymentOrder(order);
    } catch (err) {
      setSendError(err);
    }
  }

  async function handleApplyCoupon() {
    setCouponError(null);
    setCouponBusy(true);
    try {
      const updated = await dispatch(applyCoupon({ cart, code: couponInput })).unwrap();
      dispatch(cartHydrated(updated));
      setCouponInput('');
    } catch (err) {
      setCouponError(err);
    } finally {
      setCouponBusy(false);
    }
  }

  async function handleRemoveCoupon() {
    setCouponError(null);
    setCouponBusy(true);
    try {
      const updated = await dispatch(removeCoupon(cart)).unwrap();
      if (updated) {
        dispatch(cartHydrated(updated));
      } else {
        dispatch(couponCleared());
      }
    } catch (err) {
      setCouponError(err);
    } finally {
      setCouponBusy(false);
    }
  }

  async function handleApplyDiscount() {
    setDiscountError(null);
    setDiscountBusy(true);
    try {
      const updated = await dispatch(
        applyManualDiscount({ cart, amount: Number(discountInput) })
      ).unwrap();
      dispatch(cartHydrated(updated));
      setDiscountInput('');
    } catch (err) {
      setDiscountError(err);
    } finally {
      setDiscountBusy(false);
    }
  }

  async function handleRemoveDiscount() {
    setDiscountError(null);
    setDiscountBusy(true);
    try {
      const updated = await dispatch(removeManualDiscount(cart)).unwrap();
      if (updated) {
        dispatch(cartHydrated(updated));
      } else {
        dispatch(manualDiscountCleared());
      }
    } catch (err) {
      setDiscountError(err);
    } finally {
      setDiscountBusy(false);
    }
  }

  async function handleCancel() {
    setSendError(null);
    setCancelling(true);
    try {
      if (cart.currentOrderId) {
        await dispatch(cancelOrder(cart.currentOrderId)).unwrap();
      }
      dispatch(cartCleared());
    } catch (err) {
      setSendError(err);
    } finally {
      setCancelling(false);
    }
  }

  if (status === 'loading' || status === 'idle') {
    return <div className="p-6 text-gray-500">Loading menu…</div>;
  }
  if (status === 'failed') {
    return <div className="p-6 text-red-600">Failed to load menu: {error}</div>;
  }

  // Gross running total only — the authoritative VAT split is computed server-side
  // once the order is sent (Step 7's computeOrderTotals), not duplicated here.
  const cartTotal = cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return (
    <div className="flex h-full flex-col">
      <TopBar>
        <div className="relative max-w-md">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-16 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400">
            Ctrl+K
          </span>
        </div>
      </TopBar>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {!search && (
            <div className="flex flex-wrap gap-2 pt-3">
              <button
                type="button"
                onClick={() => setActiveCategoryId('all')}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition ${
                  activeCategoryId === 'all'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                }`}
              >
                <IconGrid className="h-4 w-4" />
                All Items
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setActiveCategoryId(category._id)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition ${
                    activeCategoryId === category._id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                  }`}
                >
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <span>{categoryEmoji(category.name)}</span>
                  )}
                  {category.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {search
                ? `Results for "${search}"`
                : activeCategoryId === 'all'
                  ? 'All Items'
                  : categories.find((c) => c._id === activeCategoryId)?.name}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                }`}
              >
                <IconGrid className="h-4 w-4" />
                Grid View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List View"
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                }`}
              >
                <IconList className="h-4 w-4" />
                List View
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleItems.map((item) => (
                <div
                  key={item._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailsItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailsItem(item);
                    }
                  }}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-sm border border-gray-100 bg-white text-left shadow-sm transition hover:shadow-md"
                >
                  <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-indigo-50 to-purple-50 text-4xl">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                      />
                    ) : (
                      categoryEmoji(categories.find((c) => c._id === item.categoryId)?.name)
                    )}
                    <AvailabilityBadge item={item} />
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium text-gray-900">{item.name}</span>
                      <span className="ml-2 shrink-0 font-semibold text-gray-900">€{item.basePrice.toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      disabled={item.available === false}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemTap(item);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm bg-indigo-500 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <IconPlus className="h-4 w-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
              {visibleItems.length === 0 && (
                <p className="col-span-full text-sm text-gray-400">No items found.</p>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {visibleItems.map((item) => (
                <div
                  key={item._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailsItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailsItem(item);
                    }
                  }}
                  className="group flex w-full cursor-pointer items-center gap-4 rounded-sm border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:shadow-md"
                >
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-linear-to-br from-indigo-50 to-purple-50 text-2xl">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full rounded-sm object-cover" />
                    ) : (
                      categoryEmoji(categories.find((c) => c._id === item.categoryId)?.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <AvailabilityBadge item={item} inline />
                    </div>
                    {item.description && (
                      <div className="truncate text-xs text-gray-500">{item.description}</div>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">€{item.basePrice.toFixed(2)}</span>
                  <button
                    type="button"
                    disabled={item.available === false}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemTap(item);
                    }}
                    title="Add to order"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconPlus className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {visibleItems.length === 0 && <p className="text-sm text-gray-400">No items found.</p>}
            </div>
          )}
        </div>

        <div className="flex w-72 shrink-0 flex-col border-l border-gray-100 bg-white xl:w-96">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Current Order</h2>
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
              {['dine_in', 'takeaway'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => dispatch(orderTypeChanged(type))}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    cart.orderType === type ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type === 'dine_in' ? 'Dine In' : 'Takeaway'}
                </button>
              ))}
            </div>
          </div>

          {tablesEnabled && cart.orderType === 'dine_in' && (
            <div className="relative border-b border-gray-100 px-5 py-2.5">
              <IconTable className="pointer-events-none absolute left-7.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select
                value={cart.tableId || ''}
                onChange={(e) => dispatch(tableChanged(e.target.value || null))}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">No table assigned</option>
                {tables.map((table) => {
                  const occupiedByOther =
                    table.status === 'occupied' && table.currentOrder._id !== cart.currentOrderId;
                  return (
                    <option key={table._id} value={table._id} disabled={occupiedByOther}>
                      {table.name} (seats {table.capacity}){occupiedByOther ? ' — occupied' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="relative border-b border-gray-100 px-5 py-2.5">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={addItemQuery}
                onChange={(e) => {
                  setAddItemQuery(e.target.value);
                  setShowAddItemSuggestions(true);
                }}
                onFocus={() => setShowAddItemSuggestions(true)}
                onBlur={() => setShowAddItemSuggestions(false)}
                placeholder="Add item to order…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            {showAddItemSuggestions && addItemQuery.trim() && (
              <div className="absolute inset-x-5 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-sm border border-gray-100 bg-white py-1 shadow-lg">
                {addItemSuggestions.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">No matching items.</p>
                )}
                {addItemSuggestions.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleAddItemSuggestionPick(item)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-indigo-50"
                  >
                    <span className="truncate font-medium text-gray-900">{item.name}</span>
                    <span className="shrink-0 text-gray-500">€{item.basePrice.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-2">
            <button
              type="button"
              onClick={() => setShowHeldOrders(true)}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-600"
            >
              Recall Held Order
            </button>
            {cartLines.length > 0 && (
              <button
                type="button"
                onClick={() => dispatch(cartCleared())}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5">
            {cartLines.length === 0 && <p className="py-4 text-sm text-gray-400">No items yet.</p>}
            {cartLines.map((line, index) => (
              <CartLineItem
                key={index}
                line={line}
                menuItem={items.find((i) => i._id === line.menuItemId)}
                onQuantityChange={(quantity) => dispatch(lineQuantityChanged({ index, quantity }))}
                onRemove={() => dispatch(lineRemoved(index))}
                onEditModifiers={() => {
                  setPickerItem(items.find((i) => i._id === line.menuItemId));
                  setPickerEditIndex(index);
                }}
                onNotesChange={(notes) => dispatch(lineNotesChanged({ index, notes }))}
                onAddModifier={(modifier) => dispatch(lineModifierAdded({ index, modifier }))}
              />
            ))}
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex gap-1 rounded-full bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setDiscountMode('coupon')}
                className={`flex-1 rounded-full py-1 text-xs font-medium transition ${
                  discountMode === 'coupon' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Coupon{cart.couponCode ? ' ✓' : ''}
              </button>
              <button
                type="button"
                onClick={() => setDiscountMode('discount')}
                className={`flex-1 rounded-full py-1 text-xs font-medium transition ${
                  discountMode === 'discount' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Discount{cart.manualDiscount > 0 ? ' ✓' : ''}
              </button>
            </div>

            {discountMode === 'coupon' ? (
              cart.couponCode ? (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-indigo-600">
                    <IconTag className="h-4 w-4" />
                    {cart.couponCode} applied
                  </span>
                  <button
                    type="button"
                    disabled={couponBusy}
                    onClick={handleRemoveCoupon}
                    className="text-xs font-medium text-indigo-500 hover:text-red-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code…"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm uppercase placeholder:normal-case placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    disabled={!couponInput.trim() || couponBusy || cartLines.length === 0}
                    onClick={handleApplyCoupon}
                    className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    {couponBusy ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              )
            ) : cart.manualDiscount > 0 ? (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <IconTag className="h-4 w-4" />
                  €{cart.manualDiscount.toFixed(2)} discount applied
                </span>
                <button
                  type="button"
                  disabled={discountBusy}
                  onClick={handleRemoveDiscount}
                  className="text-xs font-medium text-emerald-700 hover:text-red-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="Discount amount (€)…"
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm placeholder:text-gray-400"
                />
                <button
                  type="button"
                  disabled={!discountInput.trim() || Number(discountInput) <= 0 || discountBusy || cartLines.length === 0}
                  onClick={handleApplyDiscount}
                  className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  {discountBusy ? 'Applying…' : 'Apply'}
                </button>
              </div>
            )}
            {(discountMode === 'coupon' ? couponError : discountError) && (
              <p className="mt-1 text-sm text-red-600">{discountMode === 'coupon' ? couponError : discountError}</p>
            )}

            <div className="mt-3 space-y-1">
              {cart.discount > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-indigo-500">
                    <span>Discount</span>
                    <span>−€{cart.discount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>€{(cartTotal - cart.discount).toFixed(2)}</span>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-gray-400">
              VAT-inclusive; the exact tax split is computed when the order is sent.
            </p>
            {sendError && <p className="mt-1 text-sm text-red-600">{sendError}</p>}

            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={handleCharge}
              className="mt-3 flex w-full items-center justify-between rounded-lg bg-indigo-500 px-4 py-3 font-medium text-white transition hover:bg-indigo-600 disabled:opacity-40"
            >
              <span>Pay</span>
              <span>€{(cartTotal - cart.discount).toFixed(2)} →</span>
            </button>
            <button
              type="button"
              disabled={cartLines.length === 0 || holdStatus === 'holding'}
              onClick={handleHold}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <IconPause className="h-4 w-4" />
              {holdStatus === 'holding' ? 'Holding…' : 'Hold Order'}
            </button>
            <button
              type="button"
              disabled={cartLines.length === 0 || cancelling}
              onClick={handleCancel}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              <IconTrash className="h-4 w-4" />
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          </div>
        </div>
      </div>

      {pickerItem && (
        <ModifierPicker
          item={pickerItem}
          initialModifiers={pickerEditIndex !== null ? cartLines[pickerEditIndex].modifiers : undefined}
          onCancel={() => {
            setPickerItem(null);
            setPickerEditIndex(null);
          }}
          onConfirm={(line) => {
            if (pickerEditIndex !== null) {
              dispatch(
                lineModifiersChanged({ index: pickerEditIndex, modifiers: line.modifiers, unitPrice: line.unitPrice })
              );
            } else {
              dispatch(itemAdded(line));
            }
            setPickerItem(null);
            setPickerEditIndex(null);
          }}
        />
      )}

      {detailsItem && (
        <ItemDetailsModal
          item={detailsItem}
          categoryName={categories.find((c) => c._id === detailsItem.categoryId)?.name}
          onClose={() => setDetailsItem(null)}
          onAdd={() => {
            handleItemTap(detailsItem);
            setDetailsItem(null);
          }}
        />
      )}

      {showHeldOrders && <HeldOrdersPanel onClose={() => setShowHeldOrders(false)} />}

      {paymentOrder && (
        <PaymentPanel
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onDone={() => {
            setPaymentOrder(null);
            dispatch(cartCleared());
          }}
        />
      )}
    </div>
  );
}
