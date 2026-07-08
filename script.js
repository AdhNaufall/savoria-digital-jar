lucide.createIcons();

let memories = [];

// Utility: Format Date
function formatDate(isoString) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(isoString).toLocaleDateString('id-ID', options);
}

// Initialize Header Date
document.getElementById('currentDate').innerText = formatDate(new Date().toISOString());

// Load Data from PHP API
async function loadMemories() {
  try {
    const response = await fetch('api.php');
    if (response.ok) {
      const data = await response.json();
      memories = data;
      renderJar();
    } else {
      console.error('Gagal mengambil data dari database');
    }
  } catch (error) {
    console.error('Error koneksi ke database:', error);
    // Jika gagal terhubung (misal dibuka langsung dari file:// tanpa server PHP)
    // Tampilkan pesan error di konsol tapi biarkan aplikasi berjalan (kosong)
  }
}

// Validate Form
function checkFormValidity() {
  const w1 = document.getElementById('wish1').value.trim();
  const w2 = document.getElementById('wish2').value.trim();
  const w3 = document.getElementById('wish3').value.trim();
  
  const btn = document.getElementById('saveBtn');
  if (w1 || w2 || w3) {
    btn.removeAttribute('disabled');
  } else {
    btn.setAttribute('disabled', 'true');
  }
}

// Save New Memory via PHP API
async function handleSave() {
  const inputs = [
    document.getElementById('wish1'),
    document.getElementById('wish2'),
    document.getElementById('wish3')
  ];

  const wishes = [];
  inputs.forEach(input => {
    const val = input.value.trim();
    if (val) wishes.push(val);
  });

  if (wishes.length === 0) return;

  const today = new Date().toDateString();
  let currentDayMemory = memories.length > 0 ? memories[memories.length - 1] : null;

  // Group by today's date
  if (currentDayMemory && new Date(currentDayMemory.date).toDateString() === today) {
    currentDayMemory.wishes = [...currentDayMemory.wishes, ...wishes];
  } else {
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      wishes: wishes
    };
    memories.push(newEntry);
  }

  const btn = document.getElementById('saveBtn');
  const originalHtml = btn.innerHTML;
  
  btn.innerHTML = `<svg class="spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Menyimpan...</span>`;
  btn.style.pointerEvents = 'none';
  
  try {
    // Kirim data lengkap ke API PHP untuk disimpan di database.json
    const response = await fetch('api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(memories)
    });

    if (response.ok) {
      renderJar(wishes.length);
      
      // Clear form
      inputs.forEach(input => input.value = '');
      checkFormValidity();
      
      btn.innerHTML = `<i data-lucide="check"></i><span>Berhasil!</span>`;
      lucide.createIcons();
      
      // Trigger Confetti Effect
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#38b29b', '#45818e', '#fdf4d8', '#46c6ad']
        });
      }
      
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        lucide.createIcons();
        btn.style.pointerEvents = 'auto';
      }, 1200);
    } else {
      alert("Gagal menyimpan ke database! Pastikan aplikasi ini dijalankan lewat Server PHP (misal localhost/XAMPP)");
      btn.innerHTML = originalHtml;
      lucide.createIcons();
      btn.style.pointerEvents = 'auto';
    }
  } catch (error) {
    console.error('Error:', error);
    alert("Gagal koneksi ke server. Apakah XAMPP/PHP sudah berjalan?");
    btn.innerHTML = originalHtml;
    lucide.createIcons();
    btn.style.pointerEvents = 'auto';
  }
}

// Render Jar Visual
function renderJar(newWishesCount = 0) {
  const container = document.getElementById('jarContainer');
  container.innerHTML = '';
  
  let totalWishes = 0;
  memories.forEach(m => totalWishes += m.wishes.length);
  
  const visualWishesCount = Math.min(totalWishes, 80); 
  
  for(let i=0; i<visualWishesCount; i++) {
    const paper = document.createElement('div');
    
    const rot = Math.sin(i * 123) * 45;
    const translateY = Math.cos(i) * 5;
    const translateX = Math.sin(i * 42) * 6;
    
    paper.className = 'wish-paper';
    paper.style.setProperty('--r', `${rot}deg`);
    
    if (newWishesCount > 0 && i >= visualWishesCount - newWishesCount) {
      paper.classList.add('animate-drop');
    } else {
      paper.style.transform = `rotate(${rot}deg) translate(${translateX}px, ${translateY}px)`;
    }
    
    container.appendChild(paper);
  }
}

// Pick Random Memory
let isPicking = false;
function pickRandomWish() {
  if (memories.length === 0) {
    alert("Toplesnya masih kosong nih! Isi dulu yuk.");
    return;
  }
  if (isPicking) return;
  isPicking = true;
  
  const lid = document.getElementById('jarLid');
  const wrapper = document.getElementById('jarWrapper');
  
  lid.classList.add('lid-open');
  
  setTimeout(() => {
    const flyingPaper = document.createElement('div');
    flyingPaper.className = 'paper-fly';
    wrapper.appendChild(flyingPaper);
    
    setTimeout(() => {
      let allWishes = [];
      memories.forEach(m => {
        m.wishes.forEach(w => {
          allWishes.push({ date: m.date, text: w });
        });
      });
      
      const selected = allWishes[Math.floor(Math.random() * allWishes.length)];
      
      document.getElementById('modalWishDate').innerText = formatDate(selected.date);
      
      const listContainer = document.getElementById('modalWishList');
      listContainer.innerHTML = `
         <div class="modal-wish-card">
           <span class="star-icon serif-text">✨</span>
           <p class="serif-text" id="typewriterText"></p>
         </div>
      `;
      
      const modal = document.getElementById('wishModal');
      modal.classList.remove('hidden');
      
      flyingPaper.remove();
      isPicking = false;

      // Typewriter Effect
      const textElement = document.getElementById('typewriterText');
      const textToType = `"${selected.text}"`;
      textElement.innerHTML = '<span id="tw-content"></span><span id="tw-cursor" class="tw-cursor">|</span>';
      
      const contentEl = document.getElementById('tw-content');
      const cursorEl = document.getElementById('tw-cursor');
      
      let i = 0;
      function typeWriter() {
        if (i < textToType.length) {
          contentEl.innerHTML += textToType.charAt(i);
          i++;
          setTimeout(typeWriter, 35);
        } else {
          setTimeout(() => { 
            if(cursorEl) cursorEl.style.opacity = '0'; 
          }, 1500);
        }
      }
      
      setTimeout(typeWriter, 400);
    }, 800);
    
  }, 200);
}

function closeModal() {
  const modal = document.getElementById('wishModal');
  modal.classList.add('hidden');
  
  const lid = document.getElementById('jarLid');
  lid.classList.remove('lid-open');
}

function openHistoryModal() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  if (memories.length === 0) {
    historyList.innerHTML = '<p style="text-align:center; color:#a0aec0;">Belum ada kenangan yang tersimpan.</p>';
  } else {
    // Sort memories by date descending
    const sortedMemories = [...memories].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedMemories.forEach(m => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'history-item';
      
      const dateDiv = document.createElement('div');
      dateDiv.className = 'history-date';
      dateDiv.innerText = formatDate(m.date);
      itemDiv.appendChild(dateDiv);
      
      m.wishes.forEach(w => {
        const wishDiv = document.createElement('div');
        wishDiv.className = 'history-wish serif-text';
        wishDiv.innerText = `"${w}"`;
        itemDiv.appendChild(wishDiv);
      });
      
      historyList.appendChild(itemDiv);
    });
  }
  
  const modal = document.getElementById('historyModal');
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeHistoryModal() {
  const modal = document.getElementById('historyModal');
  modal.classList.add('hidden');
}

// Init
loadMemories();
