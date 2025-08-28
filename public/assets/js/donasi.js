let turnstileWidget;
    
    window.onloadTurnstileCallback = function () {
      turnstileWidget = turnstile.render('.cf-turnstile', {
        sitekey: '0x4AAAAAAA6dZGHl6b5dKTOR',
        theme: 'dark',
      });
    };
    
    async function notifyBackend(result) {
      try {
        await fetch('/api/donasi/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: result.order_id,
            transaction_status: result.status_code === '200' ? 'settlement' : result.status_code === '201' ? 'pending' : 'failed',
            gross_amount: result.gross_amount,
            signature_key: result.signature_key || ''
          })
        });
      } catch (error) {
        console.error('Error notifying backend:', error);
      }
    }
    
    async function fetchDonationList() {
      try {
        const response = await fetch('/api/donasi/list');
        const data = await response.json();
        if (data.status && data.donations.length > 0) {
          const donationList = document.getElementById('donation-list');
          donationList.innerHTML = '';
          const sortedDonations = data.donations
            .filter(d => d.status === 'success')
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
          sortedDonations.forEach(donation => {
            const donationCard = document.createElement('div');
            donationCard.className = 'donation-card p-4 rounded-2xl';
            donationCard.innerHTML = `
              <div class="flex items-center space-x-4">
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-medium">${donation.name.charAt(0)}</span>
                </div>
                <div class="flex-1">
                  <h4 class="font-medium">${donation.name}</h4>
                  <p class="text-gray-400 text-sm">Rp ${Number(donation.amount).toLocaleString('id-ID')}</p>
                  <p class="text-gray-500 text-xs">${donation.comment || 'Tidak ada komentar'}</p>
                </div>
              </div>
            `;
            donationList.appendChild(donationCard);
          });
        }
      } catch (error) {
        console.error('Error fetching donation list:', error);
      }
    }
    
    document.addEventListener('DOMContentLoaded', () => {
      fetchDonationList();
      
      document.getElementById('donation-form').addEventListener('submit', async e => {
        e.preventDefault();
        const formData = {
          name: document.getElementById('name').value.trim(),
          email: document.getElementById('email').value.trim(),
          amount: Number(document.getElementById('amount').value),
          comment: document.getElementById('comment').value.trim(),
          turnstileToken: document.querySelector('.cf-turnstile input[name="cf-turnstile-response"]').value
        };
        
        if (!formData.turnstileToken) {
          alert('Silakan selesaikan verifikasi keamanan terlebih dahulu');
          return;
        }
        
        try {
          const response = await fetch('/api/donasi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const data = await response.json();
          if (data.status) {
            snap.pay(data.token, {
              onSuccess: async result => {
                await notifyBackend(result);
                alert('Terima kasih atas donasi Anda!');
                fetchDonationList();
              },
              onPending: async result => {
                await notifyBackend(result);
                alert('Pembayaran Anda sedang diproses. Silakan selesaikan dalam 24 jam.');
              },
              onError: async result => {
                await notifyBackend(result);
                alert('Pembayaran gagal. Silakan coba lagi.');
              },
              onClose: () => {
                console.log('Payment popup closed');
              }
            });
          } else {
            alert(data.error || 'Gagal membuat transaksi donasi');
          }
        } catch (error) {
          console.error('Error submitting donation:', error);
          alert('Terjadi kesalahan saat mengirim donasi. Silakan coba lagi.');
        }
      });
    });