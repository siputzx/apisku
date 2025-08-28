window.onload = function () {
        const isDarkMode = true

        const ui = SwaggerUIBundle({
          url: '/api/list/post',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
          deepLinking: true,
          displayOperationId: false,
          defaultModelsExpandDepth: 0,
          defaultModelExpandDepth: 0,
          displayRequestDuration: false,
          filter: false,
          operationsSorter: (a, b) => a.get('path').localeCompare(b.get('path')),
          tagsSorter: 'alpha',
          validatorUrl: null,
          onComplete: function () {
            Swal.fire({
              title: 'API Powered by Atlantic Server!',
              html: `
            <img src="https://raw.githubusercontent.com/siputzx/siputzx/main/BANNER%20ATLSERVER.png" 
                alt="Atlantic Server" 
                style="width: 100%; border-radius: 10px; margin-bottom: 10px;">
            <p>Hey Siputzx API users! Sekarang API ini didukung penuh oleh <b>Atlantic Server</b>, 
            memastikan performa cepat, uptime tinggi, dan keandalan maksimal! 🚀🔥 
            Yuk, pakai VPS Atlantic Server buat proyekmu!</p>
          `,
              background: isDarkMode ? '#1F2937' : '#FFFFFF',
              color: isDarkMode ? '#FFFFFF' : '#000000',
              confirmButtonText: 'Cek Atlantic Server',
              confirmButtonColor: '#0EA5E9',
              showCloseButton: true,
              customClass: {
                popup: 'font-sans',
                title: 'text-xl font-bold',
                confirmButton: 'px-6 py-2.5 text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors duration-200'
              }
            }).then(result => {
              if (result.isConfirmed) {
                window.open('https://atlantic-server.com/', '_blank')
              }
            })

            const topLayout = document.createElement('div')
            topLayout.className = 'top-layout'

            const searchContainer = document.createElement('div')
            searchContainer.className = 'custom-search-container'
            searchContainer.innerHTML = `
          <input type="text" id="custom-search-input" placeholder="Cari endpoint.">
          <div class="search-results-info" id="search-results-info"></div>
        `
            topLayout.appendChild(searchContainer)
            const schemeContainer = document.querySelector('.scheme-container')
            if (schemeContainer) {
              topLayout.appendChild(schemeContainer)
            }

            const infoElement = document.querySelector('.information-container')
            infoElement.after(topLayout)

            const searchInput = document.getElementById('custom-search-input')

            searchInput.addEventListener('input', function (e) {
              const searchTerm = e.target.value.toLowerCase()

              document.querySelectorAll('.opblock-tag').forEach(tag => {
                let hasVisibleOperation = false
                let tagOperationsCount = 0
                let tagVisibleCount = 0

                tag.nextElementSibling.querySelectorAll('.opblock').forEach(op => {
                  tagOperationsCount++

                  const path = op.querySelector('.opblock-summary-path')?.textContent?.toLowerCase() || ''
                  const method = op.querySelector('.opblock-summary-method')?.textContent?.toLowerCase() || ''
                  const summary = op.getAttribute('data-summary') || ''

                  const isVisible =
                    searchTerm === '' ||
                    path.includes(searchTerm) ||
                    method.includes(searchTerm) ||
                    summary.toLowerCase().includes(searchTerm)

                  op.style.display = isVisible ? 'block' : 'none'

                  if (isVisible) {
                    hasVisibleOperation = true
                    tagVisibleCount++
                  }
                })

                tag.style.display = hasVisibleOperation ? 'block' : 'none'
                tag.nextElementSibling.style.display = hasVisibleOperation ? 'block' : 'none'

                if (searchTerm && hasVisibleOperation) {
                  const tagText = tag.textContent.split('(')[0].trim()
                  tag.querySelector('span').textContent = `${tagText} (${tagVisibleCount}/${tagOperationsCount})`
                } else if (!searchTerm) {
                  const tagText = tag.textContent.split('(')[0].trim()
                  tag.querySelector('span').textContent = tagText
                }
              })
            })

            document.querySelectorAll('.opblock').forEach(op => {
              const summary = op.querySelector('.opblock-summary-description')?.textContent || ''
              op.setAttribute('data-summary', summary)
            })

            searchInput.focus()
            const removeVersionInfo = () => {
              const elements = document.querySelectorAll('pre.version')
              const visited = new Set()

              elements.forEach(el => {
                const parent = el.closest('span')
                if (parent && !visited.has(parent)) {
                  const versionCount = parent.querySelectorAll('pre.version').length
                  if (versionCount >= 2) {
                    parent.remove()
                  } else {
                    el.remove()
                  }
                  visited.add(parent)
                } else if (!parent) {
                  el.remove()
                }
              })
            }

            removeVersionInfo()
          }
        })

        window.ui = ui
      }