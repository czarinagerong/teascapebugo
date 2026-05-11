// =============================================================
//  TEASCAPE UNIT TESTS
//  How to run: node unitTest.js
// =============================================================

// ── FUNCTIONS EXTRACTED FROM PROJECT FILES ────────────────────

// --- AppContext.tsx ---
function computeCartCount(cart) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function computeCartSubtotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function addToCartLogic(prev, newItem) {
  const key = `${newItem.id}-${newItem.size || ''}-${newItem.flavor || ''}-${(newItem.addons || []).join(',')}`;
  const existing = prev.find(
    item => `${item.id}-${item.size || ''}-${item.flavor || ''}-${(item.addons || []).join(',')}` === key
  );
  if (existing) {
    return prev.map(item =>
      `${item.id}-${item.size || ''}-${item.flavor || ''}-${(item.addons || []).join(',')}` === key
        ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
        : item
    );
  }
  return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
}

function removeFromCartLogic(cart, id) {
  return cart.filter(item => item.id !== id);
}

function updateQuantityLogic(cart, id, quantity) {
  if (quantity < 1) return cart;
  return cart.map(item => item.id === id ? { ...item, quantity } : item);
}

function clearCartLogic() {
  return [];
}

// --- Checkout.tsx ---
function validateName(name) {
  if (!name.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Please enter your full name';
  if (!/^[a-zA-ZÀ-ÿ\s.'-]+$/.test(name.trim())) return 'Name must contain letters only';
  return null;
}

function validatePhone(phone) {
  if (!phone.trim()) return 'Phone number is required';
  if (!/^(09|\+639)\d{9}$/.test(phone.replace(/\s/g, ''))) return 'Enter a valid PH number (e.g. 09XX XXX XXXX)';
  return null;
}

function computeTotal(cartSubtotal, deliveryFeeAmt) {
  return cartSubtotal + deliveryFeeAmt;
}

function computeDeliveryFee(distKm) {
  if (distKm <= 5) return 40;
  return 40 + Math.ceil(distKm - 5) * 10;
}

// --- useStoreStatus.ts ---
function getBusinessHours(date) {
  const day = date.getDay();
  if (day === 0) return { open: 13 * 60, close: 19 * 60 };
  return { open: 7 * 60, close: 21 * 60 };
}

function isOrderingOpenAt(date) {
  const hours = getBusinessHours(date);
  if (!hours) return false;
  const nowMin = date.getHours() * 60 + date.getMinutes();
  return nowMin >= (hours.open - 30) && nowMin <= (hours.close - 60);
}

function generateTimeSlotsAt(now) {
  const hours = getBusinessHours(now);
  if (!hours) return [];
  const slots = [];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minMinutes = nowMinutes + 30;
  const startMinutes = Math.ceil(minMinutes / 15) * 15;
  for (let m = startMinutes; m <= hours.close - 45; m += 15) {
    if (m < hours.open) continue;
    const startH = Math.floor(m / 60);
    const startMin = m % 60;
    const startAmpm = startH >= 12 ? 'PM' : 'AM';
    const startH12 = startH > 12 ? startH - 12 : startH === 0 ? 12 : startH;
    const startTimeStr = `${startH12}:${startMin.toString().padStart(2, '0')} ${startAmpm}`;
    const endM = m + 15;
    const endH = Math.floor(endM / 60);
    const endMin = endM % 60;
    const endAmpm = endH >= 12 ? 'PM' : 'AM';
    const endH12 = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
    const endTimeStr = `${endH12}:${endMin.toString().padStart(2, '0')} ${endAmpm}`;
    slots.push(`${startTimeStr} - ${endTimeStr}`);
  }
  return slots;
}

// --- Cart.tsx ---
function handleMinusClickLogic(cart, id, name) {
  const item = cart.find(i => i.id === id);
  if (!item) return { action: 'none' };
  if (item.quantity === 1) return { action: 'confirm_remove', name };
  return { action: 'decrease', newQty: item.quantity - 1 };
}

// --- StaffLogin.tsx ---
function validateLoginInputs(username, password) {
  if (!username.trim() || !password.trim()) return 'Please enter your username and password.';
  return null;
}

function devLoginCheck(username, password, DEV_USER, DEV_PASS) {
  return username.trim() === DEV_USER && password === DEV_PASS;
}


// ── TEST RUNNER ───────────────────────────────────────────────

const results = [];
let idCounter = 1;

function test(fn, input, expected, actual) {
  const id = `UT-${String(idCounter++).padStart(2, '0')}`;
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ id, fn, input, expected, actual, status: pass ? 'PASS' : 'FAIL' });
}

// ── SAMPLE DATA ───────────────────────────────────────────────

const sampleCart = [
  { id: 'item1', name: 'Brown Sugar Milk Tea', size: 'Large', flavor: 'Original', addons: [], price: 85, quantity: 2 },
  { id: 'item2', name: 'Taro Milk Tea', size: 'Medium', flavor: 'Taro', addons: ['Pearls'], price: 75, quantity: 1 },
];


// ── APPCONTEXT.TSX TESTS ──────────────────────────────────────

test('computeCartCount',         'Cart: [{qty:2},{qty:1}]',            3,         computeCartCount(sampleCart));
test('computeCartCount',         'Empty cart []',                       0,         computeCartCount([]));
test('computeCartSubtotal',      'Cart: [P85x2, P75x1]',               245,       computeCartSubtotal(sampleCart));
test('computeCartSubtotal',      'Empty cart []',                       0,         computeCartSubtotal([]));
test('addToCart',                'Add new unique item to 2-item cart',  3,         addToCartLogic(sampleCart, { id: 'item3', name: 'Matcha Latte', size: 'Large', flavor: 'Original', addons: [], price: 90 }).length);
test('addToCart',                'Add duplicate item1 (same id/size)',  3,         addToCartLogic(sampleCart, { id: 'item1', name: 'Brown Sugar Milk Tea', size: 'Large', flavor: 'Original', addons: [], price: 85 }).find(i => i.id === 'item1').quantity);
test('removeFromCart',           'Remove item1 from 2-item cart',       1,         removeFromCartLogic(sampleCart, 'item1').length);
test('removeFromCart',           'item1 should not exist after remove', undefined,  removeFromCartLogic(sampleCart, 'item1').find(i => i.id === 'item1'));
test('updateQuantity',           'item1, set quantity to 5',            5,         updateQuantityLogic(sampleCart, 'item1', 5).find(i => i.id === 'item1').quantity);
test('updateQuantity',           'item1, quantity=0 (invalid input)',   sampleCart, updateQuantityLogic(sampleCart, 'item1', 0));
test('clearCart',                'Cart with 2 items',                   [],        clearCartLogic());

// ── CHECKOUT.TSX TESTS ────────────────────────────────────────

test('validateName',             'name="" (empty)',                     'Full name is required',                        validateName(''));
test('validateName',             'name="J" (too short)',                'Please enter your full name',                  validateName('J'));
test('validateName',             'name="Juan dela Cruz"',              null,                                            validateName('Juan dela Cruz'));
test('validateName',             'name="Juan123" (has numbers)',        'Name must contain letters only',               validateName('Juan123'));
test('validatePhone',            'phone="" (empty)',                    'Phone number is required',                     validatePhone(''));
test('validatePhone',            'phone="09123456789"',                null,                                            validatePhone('09123456789'));
test('validatePhone',            'phone="+639123456789"',              null,                                            validatePhone('+639123456789'));
test('validatePhone',            'phone="12345" (invalid)',             'Enter a valid PH number (e.g. 09XX XXX XXXX)', validatePhone('12345'));
test('computeTotal',             'subtotal=245, deliveryFee=40',        285,                                            computeTotal(245, 40));
test('computeTotal',             'subtotal=245, deliveryFee=0 (pickup)',245,                                            computeTotal(245, 0));
test('computeDeliveryFee',       'distance=3km (within 5km)',           40,                                             computeDeliveryFee(3));
test('computeDeliveryFee',       'distance=5km (exact boundary)',       40,                                             computeDeliveryFee(5));
test('computeDeliveryFee',       'distance=7km (beyond 5km)',           60,                                             computeDeliveryFee(7));

// ── USESTORESTATUS.TS TESTS ───────────────────────────────────

test('getBusinessHours',         'Monday (weekday)',                    { open: 420, close: 1260 },  getBusinessHours(new Date('2025-01-06T08:00:00')));
test('getBusinessHours',         'Sunday',                             { open: 780, close: 1140 },  getBusinessHours(new Date('2025-01-05T14:00:00')));
test('isOrderingOpen',           'Monday 8:00 AM',                     true,                        isOrderingOpenAt(new Date('2025-01-06T08:00:00')));
test('isOrderingOpen',           'Monday 10:00 PM',                    false,                       isOrderingOpenAt(new Date('2025-01-06T22:00:00')));
test('isOrderingOpen',           'Sunday 2:00 PM',                     true,                        isOrderingOpenAt(new Date('2025-01-05T14:00:00')));
test('isOrderingOpen',           'Sunday 6:00 AM',                     false,                       isOrderingOpenAt(new Date('2025-01-05T06:00:00')));
test('generateTimeSlots',        'Monday 7:00 AM (during store hours)', true,                        generateTimeSlotsAt(new Date('2025-01-06T07:00:00')).length > 0);
test('generateTimeSlots',        'Monday 9:00 PM (closing time)',       0,                           generateTimeSlotsAt(new Date('2025-01-06T21:00:00')).length);

// ── CART.TSX TESTS ────────────────────────────────────────────

test('handleMinusClick',         'item1 qty=2, click minus',           { action: 'decrease', newQty: 1 },        handleMinusClickLogic(sampleCart, 'item1', 'Brown Sugar Milk Tea'));
test('handleMinusClick',         'item qty=1, click minus',            { action: 'confirm_remove', name: 'Tea' }, handleMinusClickLogic([{ id: 'item3', name: 'Tea', size: '', flavor: '', addons: [], price: 60, quantity: 1 }], 'item3', 'Tea'));

// ── STAFFLOGIN.TSX TESTS ──────────────────────────────────────

test('validateLoginInputs',      'username="" password=""',            'Please enter your username and password.', validateLoginInputs('', ''));
test('validateLoginInputs',      'username="staff" password=""',       'Please enter your username and password.', validateLoginInputs('staff', ''));
test('validateLoginInputs',      'username="staff" password="teascape123"', null,                                 validateLoginInputs('staff', 'teascape123'));
test('devLoginCheck',            'correct username and password',       true,                                      devLoginCheck('staff', 'teascape123', 'staff', 'teascape123'));
test('devLoginCheck',            'correct username, wrong password',    false,                                     devLoginCheck('staff', 'wrongpass', 'staff', 'teascape123'));
test('devLoginCheck',            'wrong username, correct password',    false,                                     devLoginCheck('admin', 'teascape123', 'staff', 'teascape123'));


// ── PRINT RESULTS ─────────────────────────────────────────────

function pad(str, len) {
  const s = String(str === null ? 'null' : str === undefined ? 'undefined' : typeof str === 'object' ? JSON.stringify(str) : str);
  return s.length > len ? s.slice(0, len - 3) + '...' : s.padEnd(len);
}

const W = { id: 7, fn: 22, input: 36, expected: 42, actual: 42, status: 6 };
const divider = '-'.repeat(Object.values(W).reduce((a, b) => a + b, 0) + 17);

console.log('\n========================================');
console.log('   TEASCAPE BUGO — UNIT TEST RESULTS');
console.log('========================================\n');

console.log(
  pad('Test ID', W.id) + ' | ' +
  pad('Function', W.fn) + ' | ' +
  pad('Test Input', W.input) + ' | ' +
  pad('Expected Result', W.expected) + ' | ' +
  pad('Actual Result', W.actual) + ' | ' +
  'Status'
);
console.log(divider);

let passCount = 0, failCount = 0;

for (const r of results) {
  const status = r.status === 'PASS' ? 'PASS' : 'FAIL';
  console.log(
    pad(r.id, W.id) + ' | ' +
    pad(r.fn, W.fn) + ' | ' +
    pad(r.input, W.input) + ' | ' +
    pad(r.expected, W.expected) + ' | ' +
    pad(r.actual, W.actual) + ' | ' +
    status
  );
  r.status === 'PASS' ? passCount++ : failCount++;
}

console.log(divider);
console.log(`\nTotal: ${results.length} | Pass: ${passCount} | Fail: ${failCount}\n`);