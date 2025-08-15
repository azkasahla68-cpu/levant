// Utilities
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const products = [
  {id:'croissant', name:'Butter Croissant', price:18000, img:'assets/img/croissant.svg', desc:'Lembut, flaky, wangi butter.'},
  {id:'sourdough', name:'Sourdough Loaf', price:38000, img:'assets/img/sourdough.svg', desc:'Fermentasi alami, kulit renyah.'},
  {id:'macaron', name:'Box of Macarons', price:52000, img:'assets/img/macaron.svg', desc:'Warna-warni, ringan, manis.'},
  {id:'cupcake', name:'Velvet Cupcake', price:16000, img:'assets/img/cupcake.svg', desc:'Krim halus, moist cake.'},
  {id:'baguette', name:'Paris Baguette', price:22000, img:'assets/img/baguette.svg', desc:'French classic, crusty luar.'},
  {id:'tart', name:'Fruit Tart', price:45000, img:'assets/img/tart.svg', desc:'Creamy custard, buah segar.'},
  {id:'cookies', name:'Choco Cookies', price:12000, img:'assets/img/cookies.svg', desc:'Chewy dengan choco chips.'},
  {id:'brownie', name:'Fudge Brownie', price:17000, img:'assets/img/brownie.svg', desc:'Cokelat pekat, fudgy.'},
];

// Format Rupiah
const rupiah = n => "Rp" + n.toLocaleString('id-ID');

// Build grid
function buildGrid(){
  const grid = document.querySelector('.grid');
  grid.innerHTML = products.map(p => `
    <article class="card reveal">
      <div class="img"><img src="${p.img}" alt="${p.name}"></div>
      <h5>${p.name}</h5>
      <p>${p.desc}</p>
      <div class="card-bottom">
        <span class="price">${rupiah(p.price)}</span>
        <div class="qty">
          <button aria-label="minus" data-action="minus">-</button>
          <input type="number" min="1" value="1" aria-label="quantity">
          <button aria-label="plus" data-action="plus">+</button>
          <button class="btn primary" data-id="${p.id}">Tambah</button>
        </div>
      </div>
    </article>
  `).join('');
  
  // qty controls
  grid.querySelectorAll('.qty').forEach(q => {
    q.addEventListener('click', e => {
      const input = q.querySelector('input');
      if(e.target.dataset.action === 'minus') input.value = Math.max(1, parseInt(input.value||1)-1);
      if(e.target.dataset.action === 'plus') input.value = parseInt(input.value||1)+1;
    });
  });
  
  // add to cart
  grid.querySelectorAll('.btn.primary[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const qty = parseInt(btn.closest('.qty').querySelector('input').value || 1);
      addToCart(id, qty);
      openCart();
    });
  });
}

// Slider
let currentSlide = 0;
function showSlide(i){
  const slides = $$('.slide');
  const slider = $('#slider');
  const dots = $('#sliderDots');
  const total = slides.length;
  currentSlide = (i+total)%total;
  slider.style.transform = `translateX(-${currentSlide*100}%)`;
  [...dots.children].forEach((d,idx) => d.classList.toggle('active', idx===currentSlide));
}
function buildDots(){
  const dots = $('#sliderDots');
  const slides = $$('.slide');
  dots.innerHTML = slides.length ? slides.map((_,i)=>`<button ${i===0?'class="active"':''} aria-label="Slide ${i+1}"></button>`).join('') : '';
  dots.querySelectorAll('button').forEach((b,i)=> b.addEventListener('click', ()=>showSlide(i)));
}
$('#prevSlide').addEventListener('click', ()=>showSlide(currentSlide-1));
$('#nextSlide').addEventListener('click', ()=>showSlide(currentSlide+1));
setInterval(()=>showSlide(currentSlide+1), 6000);

// Reveal on scroll
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('show'); });
},{threshold:.2});
function mountReveal(){
  $$('.reveal').forEach(el => io.observe(el));
}

// Audio toggle
const audio = $('#bg-audio');
$('#musicToggle').addEventListener('click', async (e)=>{
  const pressed = e.currentTarget.getAttribute('aria-pressed') === 'true';
  if(pressed){
    audio.pause();
  }else{
    try{
      await audio.play();
    }catch(err){
      console.log('Autoplay blocked until user gesture.', err);
    }
  }
  e.currentTarget.setAttribute('aria-pressed', (!pressed)+'');  
});

// Cart logic
const CART_KEY = 'levants_cart_v1';
function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }
function setCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); renderCart(); }
function addToCart(id, qty=1){
  const cart = getCart();
  const p = products.find(x=>x.id===id);
  const ex = cart.find(x=>x.id===id);
  if(ex) ex.qty += qty;
  else cart.push({id, qty, price:p.price});
  setCart(cart);
}
function removeFromCart(id){
  setCart(getCart().filter(x=>x.id!==id));
}
function updateQty(id, qty){
  const cart = getCart().map(x => x.id===id ? {...x, qty:Math.max(1, qty)} : x);
  setCart(cart);
}
function renderCart(){
  const cartItems = $('#cartItems');
  const cart = getCart();
  const count = cart.reduce((a,b)=>a+b.qty,0);
  const total = cart.reduce((a,b)=>a+b.qty*b.price,0);
  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = rupiah(total);
  if(!cart.length){ cartItems.innerHTML = '<p>Keranjang kosong.</p>'; return; }
  cartItems.innerHTML = cart.map(item => {
    const p = products.find(x=>x.id===item.id);
    return `
    <div class="cart-item">
      <img src="${p.img}" alt="${p.name}">
      <div>
        <div class="title">${p.name}</div>
        <div class="price">${rupiah(p.price)}</div>
        <div class="qty" style="margin-top:6px">
          <button data-act="minus">-</button>
          <input type="number" min="1" value="${item.qty}" aria-label="quantity">
          <button data-act="plus">+</button>
        </div>
      </div>
      <button class="btn ghost" data-remove="${item.id}">Hapus</button>
    </div>`;
  }).join('');
  
  // attach events
  cartItems.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', ()=>removeFromCart(b.dataset.remove)));
  cartItems.querySelectorAll('.cart-item').forEach(el => {
    const title = el.querySelector('.title').textContent;
    const product = products.find(p=>p.name===title);
    const input = el.querySelector('input');
    el.querySelector('[data-act="minus"]').addEventListener('click', ()=>{ input.value=Math.max(1,parseInt(input.value)-1); updateQty(product.id, parseInt(input.value)); });
    el.querySelector('[data-act="plus"]').addEventListener('click', ()=>{ input.value=parseInt(input.value)+1; updateQty(product.id, parseInt(input.value)); });
    input.addEventListener('change', ()=>updateQty(product.id, parseInt(input.value||1)));
  });
}
function openCart(){ $('#cartDrawer').classList.add('open'); $('#cartDrawer').setAttribute('aria-hidden','false'); }
function closeCart(){ $('#cartDrawer').classList.remove('open'); $('#cartDrawer').setAttribute('aria-hidden','true'); }
$('#openCart').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);

// Checkout
$('#checkoutBtn').addEventListener('click', ()=>{
  if(!getCart().length){ alert('Keranjang masih kosong.'); return; }
  $('#checkoutModal').classList.add('show');
  $('#checkoutModal').setAttribute('aria-hidden','false');
});
$('#closeCheckout').addEventListener('click', ()=>{
  $('#checkoutModal').classList.remove('show');
  $('#checkoutModal').setAttribute('aria-hidden','true');
});

$('#checkoutForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const order = {
    id: 'ORD-' + Math.random().toString(36).slice(2,8).toUpperCase(),
    items: getCart(),
    total: getCart().reduce((a,b)=>a+b.qty*b.price,0),
    customer: data,
    date: new Date().toISOString()
  };
  localStorage.setItem('levants_last_order', JSON.stringify(order));
  localStorage.removeItem(CART_KEY);
  renderCart();
  $('#checkoutModal').classList.remove('show');
  $('#checkoutModal').setAttribute('aria-hidden','true');
  closeCart();
  alert('Terima kasih! Pesanan kamu '+order.id+' sudah kami terima (demo).');
});

// Scroll top
window.addEventListener('scroll', ()=>{
  const st = $('#scrollTop');
  if(window.scrollY>400) st.classList.add('show'); else st.classList.remove('show');
});
$('#scrollTop').addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));

// Init
buildGrid();
buildDots();
mountReveal();
renderCart();
$('#year').textContent = new Date().getFullYear();
showSlide(0);
