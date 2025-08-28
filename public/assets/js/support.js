const dynamicFields = {
        feature: `
                <div class="input-group">
                    <label for="featureName">Feature Name</label>
                    <input type="text" id="featureName" required placeholder="Name of the feature you're requesting" />
                </div>
                <div class="input-group">
                    <label for="description">Description</label>
                    <textarea id="description" required placeholder="Describe the feature you'd like to see..." rows="4"></textarea>
                </div>
            `,
        complaint: `
                <div class="input-group">
                    <label for="featureName">API Feature</label>
                    <input type="text" id="featureName" required placeholder="Which API feature has an issue?" />
                </div>
                <div class="input-group">
                    <label for="description">Issue Details</label>
                    <textarea id="description" required placeholder="Describe the issue you're experiencing..." rows="4"></textarea>
                </div>
            `,
        feedback: `
                <div class="input-group">
                    <label for="description">Feedback</label>
                    <textarea id="description" required placeholder="Share your feedback with us..." rows="4"></textarea>
                </div>
            `,
      }

      let turnstileWidget

      window.onloadTurnstileCallback = function () {
        turnstileWidget = turnstile.render('#turnstile-container', {
          sitekey: '0x4AAAAAAA6dZGHl6b5dKTOR',
          theme: 'dark',
        })
      }

      document
        .getElementById('requestType')
        .addEventListener('change', function (e) {
          const type = e.target.value
          document.getElementById('dynamicFields').innerHTML = type
            ? dynamicFields[type]
            : ''
        })

      document
        .getElementById('supportForm')
        .addEventListener('submit', async (e) => {
          e.preventDefault()

          const token = turnstile.getResponse(turnstileWidget)
          if (!token) {
            Swal.fire({
              text: 'Please complete verification',
              icon: 'info',
              showConfirmButton: false,
              timer: 1500,
            })
            return
          }

          try {
            Swal.fire({
              text: 'Sending...',
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => Swal.showLoading(),
            })

            const formData = {
              type: document.getElementById('requestType').value,
              name: document.getElementById('name').value,
              email: document.getElementById('email').value,
              whatsapp: document.getElementById('whatsapp').value || null,
              featureName: document.getElementById('featureName')?.value,
              description: document.getElementById('description')?.value,
              token,
            }

            const response = await fetch('/api/support', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            })

            const result = await response.json()

            if (result.success) {
              Swal.fire({
                text: 'Sent successfully!',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500,
              })
              e.target.reset()
              document.getElementById('dynamicFields').innerHTML = ''
              turnstile.reset(turnstileWidget)
            } else {
              throw new Error(result.error || 'Failed to send')
            }
          } catch (error) {
            Swal.fire({
              text: error.message,
              icon: 'error',
              showConfirmButton: false,
              timer: 1500,
            })
          }
        })