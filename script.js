
// UK-ready config
const FORM_ENDPOINT = ''; // optional Formspree endpoint
const RECEIVER_EMAIL = 'orders@rajugariruchulu.example'; // change to your real email
const GBP = '£';

const MENU = [
  { id:'biryani', name:'Hyderabadi Chicken Biryani', price:12.95, desc:'Layered basmati rice, saffron & raita', img:'assets/img/biryani.jpg' },
  { id:'butter', name:'Butter Chicken', price:11.50, desc:'Creamy tomato gravy & tender chicken', img:'assets/img/butterchicken.jpg' },
  { id:'paneer', name:'Paneer Tikka', price:9.95, desc:'Smoky grilled paneer in spices', img:'assets/img/paneer.jpg' },
  { id:'dal', name:'Dal Tadka', price:6.50, desc:'Lentils tempered with garlic & cumin', img:'assets/img/dal.jpg' },
  { id:'naan', name:'Garlic Naan', price:2.25, desc:'Tandoori flatbread with garlic butter', img:'assets/img/naan.jpg' },
  { id:'gulab', name:'Gulab Jamun (2)', price:3.50, desc:'Syrup-soaked sweet dumplings', img:'assets/img/gulab.jpg' },
];

const money = n => GBP + n.toFixed(2);
const $ = s => document.querySelector(s);

// Render menu
function renderMenu(){
  const g = document.querySelector('#menuGrid');
  g.innerHTML = '';
  MENU.forEach(d => {
    const el = document.createElement('div');
    el.className = 'dish';
    el.innerHTML = `
      <img src="${d.img}" alt="${d.name}">
      <div style="flex:1">
        <div class="dish-title">${d.name}</div>
        <div class="dish-desc">${d.desc}</div>
        <div class="price" style="margin-top:6px">${money(d.price)}</div>
      </div>
      <div><button class="add" data-id="${d.id}">ADD</button></div>`;
    g.appendChild(el);
  });
}
renderMenu();

// Cart
const cart = {};
const list = document.querySelector('#cartList');
const subtotalEl = document.querySelector('#subtotal');

function renderCart(){
  list.innerHTML = '';
  const ids = Object.keys(cart);
  if(ids.length === 0){
    list.innerHTML = '<div class="muted">No items yet — add dishes from the menu.</div>';
  } else {
    ids.forEach(id => {
      const r = cart[id];
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:800">${r.item.name} <span class="muted" style="font-weight:400">x${r.qty}</span></div>
          <div class="muted">${money(r.item.price)} each</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:800">${money(r.item.price * r.qty)}</div>
          <div style="margin-top:6px">
            <button class="qty" data-dec="${id}">-</button>
            <button class="qty" data-inc="${id}">+</button>
          </div>
        </div>`;
      list.appendChild(row);
    });
  }
  const subtotal = ids.reduce((s,id)=> s + cart[id].item.price * cart[id].qty, 0);
  subtotalEl.textContent = money(subtotal);
}
renderCart();

document.querySelector('#menuGrid').addEventListener('click', e=>{
  const b = e.target.closest('button[data-id]'); if(!b) return;
  const id = b.getAttribute('data-id');
  const item = MENU.find(x=>x.id===id);
  if(!item) return;
  cart[id] = cart[id] || { item, qty:0 };
  cart[id].qty += 1;
  renderCart();
});
list.addEventListener('click', e=>{
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  if(inc){ const id = inc.getAttribute('data-inc'); cart[id].qty += 1; renderCart(); }
  if(dec){ const id = dec.getAttribute('data-dec'); cart[id].qty -= 1; if(cart[id].qty<=0) delete cart[id]; renderCart(); }
});

$('#clearCart').addEventListener('click', ()=>{
  if(confirm('Clear your cart?')){ Object.keys(cart).forEach(k=> delete cart[k]); renderCart(); }
});
$('#openCheckout').addEventListener('click', ()=>{
  if(Object.keys(cart).length===0){ alert('Your cart is empty.'); return; }
  $('#checkoutPanel').style.display='block';
  $('#customerName').focus();
  window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
});
$('#cancelCheckout').addEventListener('click', ()=> $('#checkoutPanel').style.display='none');

$('#placeOrder').addEventListener('click', async ()=>{
  const name = $('#customerName').value.trim();
  const phone = $('#customerPhone').value.trim();
  const method = $('#orderMethod').value;
  const address = $('#customerAddress').value.trim();
  const notes = $('#customerNotes').value.trim();
  if(!name || !phone){ alert('Please enter your name and phone.'); return; }

  const ids = Object.keys(cart);
  let subtotal = 0;
  const items = ids.map(id=>{
    const r = cart[id]; const total = r.item.price * r.qty; subtotal += total;
    return { id, name:r.item.name, qty:r.qty, price:r.item.price, total };
  });
  const orderText = [
    `Restaurant: Rajugari Ruchulu (United Kingdom)`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Method: ${method}`,
    address? `Address: ${address}` : '',
    `--- Order ---`,
    ...items.map(i=>`${i.name} x${i.qty} — ${money(i.total)}`),
    `---`,
    `Subtotal: ${money(subtotal)}`,
    notes? `Notes: ${notes}` : ''
  ].filter(Boolean).join('\n');

  if(FORM_ENDPOINT){
    try{
      const res = await fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify({name, phone, method, address, notes, items, subtotal, currency:'GBP'})});
      if(res.ok){
        alert('Order sent — thank you!');
        Object.keys(cart).forEach(k=> delete cart[k]); renderCart(); document.getElementById('checkoutForm').reset(); $('#checkoutPanel').style.display='none'; return;
      }
    }catch(e){/* fall through */}
  }
  const subject = encodeURIComponent('New Order — Rajugari Ruchulu (UK)');
  const body = encodeURIComponent(orderText);
  window.location.href = `mailto:${RECEIVER_EMAIL}?subject=${subject}&body=${body}`;
});

document.getElementById('year').textContent = new Date().getFullYear();
